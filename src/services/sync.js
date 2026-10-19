/**
 * محرك المزامنة (Local-first + Supabase)
 * -------------------------------------------------
 * - localStorage هو المصدر الفوري للقراءة والكتابة (يعمل بدون إنترنت).
 * - كل تعديل يُسجَّل بـ timestamp ويدخل "صندوق الصادر" (outbox) ثم يُرفع للسحابة.
 *   إذا فشل الرفع (لا إنترنت) يبقى في الصندوق ويُعاد تلقائياً عند عودة الاتصال.
 * - التحديثات القادمة من جهاز آخر تصل عبر Realtime وتُطبَّق على المخزن المحلي
 *   وتُبلَّغ للمكوّنات عبر subscribe().
 * - حل التعارض: آخر تعديل يفوز (Last-Write-Wins) على مستوى المجموعة (projects, courses...).
 * - الصلاحيات: المفاتيح الخاصة لا تُقرأ ولا تُخزَّن للزائر (viewer) إطلاقاً.
 *   الحماية الحقيقية في قاعدة البيانات (RLS)، وهذا الملف طبقة إضافية فقط.
 *
 * الملف لا يعتمد على React ولا على import.meta حتى يمكن اختباره في Node.
 */
export const PUBLIC_KEYS = ['projects', 'skills', 'certs'];
export const PRIVATE_KEYS = ['courses', 'sprints', 'applications', 'cheatSheet', 'bugLog', 'focusLog', 'cvs', 'interviews', 'settings'];
export const SYNC_KEYS = [...PUBLIC_KEYS, ...PRIVATE_KEYS];

const TABLE = 'app_data';
const PREFIX = 'cd:';
const META_KEY = PREFIX + '__meta';
const OUTBOX_KEY = PREFIX + '__outbox';

const parse = (raw) => {
  if (raw === null || raw === undefined) return undefined;
  try { return JSON.parse(raw); } catch { return undefined; }
};
const isOnline = () => (typeof navigator === 'undefined' ? true : navigator.onLine !== false);

export function createSync({ client = null, ls, now = Date.now, pullTimeoutMs = 6000 }) {
  let role = 'owner'; // owner | viewer
  let canPush = false; // لا نرفع قبل أول سحب ناجح حتى لا نكتب فوق بيانات السحابة
  let pulling = 0;
  let flushing = false;
  let failures = 0;
  let flushTimer = null;
  let retryTimer = null;
  let channel = null;
  let everSubscribed = false;
  let browserHooked = false;
  let lastNetworkOk = true;

  const meta = parse(ls.getItem(META_KEY)) ?? {}; // { key: { ts } }
  const outbox = new Set(parse(ls.getItem(OUTBOX_KEY)) ?? []);
  const listeners = new Map(); // key -> Set<fn>
  const statusListeners = new Set();

  const persist = () => {
    try {
      ls.setItem(META_KEY, JSON.stringify(meta));
      ls.setItem(OUTBOX_KEY, JSON.stringify([...outbox]));
    } catch { /* التخزين ممتلئ */ }
  };

  // ---------- الحالة ----------
  const getStatus = () => {
    let state;
    if (!client) state = 'local';
    else if (role === 'viewer') state = 'viewer';
    else if (!isOnline() || !lastNetworkOk) state = 'offline';
    else if (pulling > 0 || flushing) state = 'syncing';
    else if (outbox.size > 0) state = 'pending';
    else state = 'synced';
    return { state, pending: outbox.size };
  };
  let lastStatusKey = '';
  const emit = () => {
    const s = getStatus();
    const k = s.state + ':' + s.pending;
    if (k === lastStatusKey) return;
    lastStatusKey = k;
    statusListeners.forEach((fn) => fn(s));
  };

  // ---------- قراءة / كتابة ----------
  const isSynced = (key) => Boolean(client) && SYNC_KEYS.includes(key);

  function get(key) {
    // الزائر لا يرى المفاتيح الخاصة حتى لو كانت موجودة في المتصفح من استخدام سابق
    if (isSynced(key) && role === 'viewer' && !PUBLIC_KEYS.includes(key)) return undefined;
    return parse(ls.getItem(PREFIX + key));
  }

  function set(key, value) {
    const synced = isSynced(key);
    if (synced && role === 'viewer') return; // الزائر لا يكتب ولا يخزّن
    let raw;
    try { raw = JSON.stringify(value); } catch { return; }
    if (raw === undefined) return;
    if (ls.getItem(PREFIX + key) === raw) return; // لا تغيير فعلي => لا رفع
    try { ls.setItem(PREFIX + key, raw); } catch { /* ممتلئ */ }
    if (!synced) return;
    meta[key] = { ts: Math.max(now(), (meta[key]?.ts ?? 0) + 1) };
    outbox.add(key);
    persist();
    scheduleFlush();
    emit();
  }

  function remove(key) {
    try { ls.removeItem(PREFIX + key); } catch { /* تجاهل */ }
  }

  function subscribe(key, fn) {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key).add(fn);
    return () => listeners.get(key)?.delete(fn);
  }

  const onStatus = (fn) => {
    statusListeners.add(fn);
    return () => statusListeners.delete(fn);
  };

  // ---------- تطبيق تحديث قادم من السحابة ----------
  function applyRemote(row) {
    if (!row || !SYNC_KEYS.includes(row.key)) return false;
    if (role === 'viewer' && !PUBLIC_KEYS.includes(row.key)) return false;
    const remoteTs = Date.parse(row.updated_at);
    if (Number.isNaN(remoteTs)) return false;
    const m = meta[row.key];
    // نسختنا أحدث أو مساوية (وهذا يشمل صدى كتابتنا نحن): لا شيء نفعله
    if (m && remoteTs <= m.ts) return false;

    const raw = JSON.stringify(row.value);
    const current = ls.getItem(PREFIX + row.key);
    if (current === raw) {
      meta[row.key] = { ts: remoteTs };
      outbox.delete(row.key);
      persist();
      return false;
    }
    // بيانات محلية قديمة بلا meta (قبل تفعيل المزامنة) ستُستبدل: نحتفظ بنسخة احتياطية
    if (!m && current != null && !outbox.has(row.key)) {
      try { ls.setItem(PREFIX + '__backup:' + row.key, current); } catch { /* تجاهل */ }
    }
    try { ls.setItem(PREFIX + row.key, raw); } catch { /* ممتلئ */ }
    meta[row.key] = { ts: remoteTs };
    outbox.delete(row.key); // التعديل الأحدث في السحابة يفوز على تعديل محلي أقدم
    persist();
    listeners.get(row.key)?.forEach((fn) => fn(row.value));
    return true;
  }

  // ---------- السحب ----------
  async function pull() {
    if (!client) return false;
    pulling++;
    emit();
    try {
      let q = client.from(TABLE).select('key,value,updated_at');
      if (role === 'viewer') q = q.in('key', PUBLIC_KEYS);
      const { data, error } = await q;
      if (error) throw error;
      const seen = new Set();
      for (const row of data ?? []) {
        seen.add(row.key);
        applyRemote(row);
      }
      if (role === 'owner') {
        // أول ترقية: بيانات محلية موجودة ولا يقابلها صف في السحابة => نرفعها
        for (const key of SYNC_KEYS) {
          if (!seen.has(key) && !meta[key] && ls.getItem(PREFIX + key) != null) {
            meta[key] = { ts: now() };
            outbox.add(key);
          }
        }
        persist();
        canPush = true;
      }
      lastNetworkOk = true;
      return true;
    } catch {
      lastNetworkOk = false;
      return false;
    } finally {
      pulling--;
      emit();
    }
  }

  // ---------- الرفع ----------
  function scheduleFlush(delay = 600) {
    if (!client || role !== 'owner') return;
    clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, delay);
  }

  async function flush() {
    if (!client || role !== 'owner' || !canPush || flushing) return;
    if (!isOnline()) return emit();
    if (outbox.size === 0) return emit();
    flushing = true;
    emit();
    let failed = false;
    try {
      for (const key of [...outbox]) {
        const m = meta[key];
        const raw = ls.getItem(PREFIX + key);
        if (!m || raw == null) { outbox.delete(key); continue; }
        const { error } = await client
          .from(TABLE)
          .upsert({ key, value: JSON.parse(raw), updated_at: new Date(m.ts).toISOString() }, { onConflict: 'key' });
        if (error) throw error;
        if (meta[key]?.ts === m.ts) outbox.delete(key); // وإلا تغيّر أثناء الرفع فيبقى للدورة التالية
        persist();
      }
      failures = 0;
      lastNetworkOk = true;
    } catch {
      failed = true;
      failures++;
      lastNetworkOk = false;
      clearTimeout(retryTimer);
      retryTimer = setTimeout(flush, Math.min(60000, 2000 * 2 ** Math.min(failures, 5)));
    } finally {
      flushing = false;
      emit();
    }
    if (!failed && outbox.size > 0) scheduleFlush(50); // تعديلات جديدة أثناء الرفع
  }

  // ---------- Realtime ----------
  function unsubscribeRealtime() {
    if (channel && client) {
      try { client.removeChannel(channel); } catch { /* تجاهل */ }
    }
    channel = null;
  }

  function subscribeRealtime() {
    if (!client) return;
    unsubscribeRealtime();
    everSubscribed = false;
    channel = client
      .channel('app_data_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, (payload) => {
        if (payload.eventType === 'DELETE') return;
        applyRemote(payload.new);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // بعد أي انقطاع وعودة: نسحب ما فاتنا
          if (everSubscribed) pull().then(() => flush());
          everSubscribed = true;
        }
      });
  }

  function hookBrowser() {
    if (browserHooked || typeof window === 'undefined') return;
    browserHooked = true;
    window.addEventListener('online', () => { lastNetworkOk = true; pull().then(() => flush()); emit(); });
    window.addEventListener('offline', emit);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') pull().then(() => flush());
      else flush();
    });
  }

  // ---------- دورة الحياة ----------
  async function start(newRole) {
    role = newRole;
    canPush = false;
    emit();
    if (!client) return;
    let timer;
    const timeout = new Promise((r) => { timer = setTimeout(r, pullTimeoutMs); });
    await Promise.race([pull(), timeout]); // لا نحجب الواجهة إذا كان الاتصال سيئاً
    clearTimeout(timer);
    subscribeRealtime();
    hookBrowser();
    flush();
  }

  function stop() {
    clearTimeout(flushTimer);
    clearTimeout(retryTimer);
    unsubscribeRealtime();
    canPush = false;
  }

  /** عند تسجيل الخروج: نمسح كل نسخ البيانات المحلية (جهاز مشترك) */
  function clearLocal() {
    stop();
    for (const key of SYNC_KEYS) {
      try { ls.removeItem(PREFIX + key); ls.removeItem(PREFIX + '__backup:' + key); } catch { /* تجاهل */ }
      delete meta[key];
    }
    outbox.clear();
    try { ls.removeItem(META_KEY); ls.removeItem(OUTBOX_KEY); ls.removeItem(PREFIX + 'notified'); } catch { /* تجاهل */ }
  }

  return { get, set, remove, subscribe, onStatus, getStatus, start, stop, pull, flush, clearLocal, applyRemote, get role() { return role; } };
}
