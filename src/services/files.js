/**
 * تخزين الملفات المرفقة (CV، خطابات).
 * - IndexedDB: نسخة محلية سريعة (تعمل بلا إنترنت) — localStorage لا يتسع للملفات.
 * - Supabase Storage (bucket خاص `files`): نسخة سحابية للمالك فقط، تُجلب عند الطلب من جهاز آخر.
 * في السجلات نحفظ فقط البيانات الوصفية {id,name,type,size,kind}.
 */
const DB = 'cd-files';
const STORE = 'files';
export const MAX_FILE = 10 * 1024 * 1024; // 10MB

const openDb = () =>
  new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });

async function run(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => { db.close(); resolve(req.result); };
    t.onerror = () => { db.close(); reject(t.error); };
    t.onabort = () => { db.close(); reject(t.error); };
  });
}

// محوّل السحابة (يُضبط بعد تسجيل دخول المالك، وإلا null): { upload(id,blob), download(id), remove(id) }
let cloud = null;
export const setCloudFiles = (adapter) => { cloud = adapter; };

const QUEUE = 'cd:__fileQueue'; // ملفات لم تُرفع بعد (بلا إنترنت)
const readQueue = () => { try { return JSON.parse(localStorage.getItem(QUEUE)) ?? []; } catch { return []; } };
const writeQueue = (q) => { try { localStorage.setItem(QUEUE, JSON.stringify([...new Set(q)])); } catch { /* تجاهل */ } };

const localPut = (id, blob) => run('readwrite', (s) => s.put(blob, id));
const localGet = (id) => run('readonly', (s) => s.get(id));
const localDelete = (id) => run('readwrite', (s) => s.delete(id));

export async function putFile(id, blob) {
  await localPut(id, blob);
  if (!cloud) return;
  try { await cloud.upload(id, blob); } catch { writeQueue([...readQueue(), id]); }
}

export async function getFile(id) {
  const local = await localGet(id);
  if (local || !cloud) return local;
  try {
    const blob = await cloud.download(id);
    if (blob) await localPut(id, blob).catch(() => {});
    return blob;
  } catch {
    return undefined;
  }
}

export async function deleteFile(id) {
  await localDelete(id);
  writeQueue(readQueue().filter((x) => x !== id));
  if (cloud) await Promise.resolve(cloud.remove(id)).catch(() => {});
}

/** يُستدعى عند عودة الاتصال لرفع الملفات المتأخرة */
export async function retryUploads() {
  if (!cloud) return;
  const left = [];
  for (const id of readQueue()) {
    try {
      const blob = await localGet(id);
      if (blob) await cloud.upload(id, blob);
    } catch { left.push(id); }
  }
  writeQueue(left);
}

/** عند تسجيل الخروج: نحذف نسخ الملفات الخاصة من هذا الجهاز */
export function clearLocalFiles() {
  try { localStorage.removeItem(QUEUE); } catch { /* تجاهل */ }
  return new Promise((resolve) => {
    const r = indexedDB.deleteDatabase(DB);
    r.onsuccess = r.onerror = r.onblocked = () => resolve();
  });
}

export async function downloadFile(meta) {
  const blob = await getFile(meta.id);
  if (!blob) throw new Error('تعذّر جلب الملف (تحقق من الاتصال)');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = meta.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** جلسة تحرير: ما أُضيف يُحذف عند الإلغاء، وما أُزيل يُحذف عند الحفظ */
export const newSession = () => ({ added: new Set(), removed: new Set() });
export const commit = (s) => Promise.all([...s.removed].map((id) => deleteFile(id).catch(() => {})));
export const rollback = (s) => Promise.all([...s.added].map((id) => deleteFile(id).catch(() => {})));
