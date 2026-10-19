import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { cloudEnabled, supabase } from '@/services/supabase';
import { sync } from '@/services/storage';
import { clearLocalFiles, retryUploads, setCloudFiles } from '@/services/files';

const AuthContext = createContext(null);
const OWNER_CACHE = 'cd:__ownerUid'; // لتعمل جلسة المالك بلا إنترنت (الحماية الحقيقية في السيرفر)

const cloudFiles = () => {
  const bucket = supabase.storage.from('files');
  return {
    upload: async (id, blob) => {
      const { error } = await bucket.upload(id, blob, { upsert: true, contentType: blob.type || 'application/octet-stream' });
      if (error) throw error;
    },
    download: async (id) => {
      const { data, error } = await bucket.download(id);
      if (error) throw error;
      return data;
    },
    remove: (id) => bucket.remove([id]),
  };
};

/**
 * الأدوار:
 *  owner  = أنت (يجتاز دالة is_owner() في قاعدة البيانات) -> كل الصفحات والبيانات
 *  viewer = أي زائر آخر -> البورتفوليو العام فقط (المهارات/المشاريع/الشهادات)
 * بدون Supabase (وضع محلي) المستخدم owner دائماً ولا يوجد تسجيل دخول.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(cloudEnabled ? undefined : null); // undefined = جارٍ التحميل
  const [role, setRole] = useState(cloudEnabled ? 'viewer' : 'owner');
  const [ready, setReady] = useState(!cloudEnabled);
  const [loginOpen, setLoginOpen] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!cloudEnabled) return;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => alive && setSession(data.session ?? null));
    const { data } = supabase.auth.onAuthStateChange((_evt, s) => setSession(s ?? null));
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, []);

  // نعيد تحديد الدور فقط عند تغيّر المستخدم (لا عند تجديد التوكن)
  const uid = session === undefined ? undefined : session?.user?.id ?? null;

  useEffect(() => {
    if (!cloudEnabled || uid === undefined) return;
    let alive = true;
    (async () => {
      setReady(false);
      let next = 'viewer';
      if (uid) {
        const { data, error } = await supabase.rpc('is_owner');
        if (data === true) {
          next = 'owner';
          try { localStorage.setItem(OWNER_CACHE, uid); } catch { /* تجاهل */ }
        } else if (error) {
          // تعذّر التحقق (لا إنترنت): نثق بآخر تحقق ناجح لهذا الحساب
          let cached = null;
          try { cached = localStorage.getItem(OWNER_CACHE); } catch { /* تجاهل */ }
          if (cached === uid) next = 'owner';
        } else {
          // حساب سجّل دخوله لكنه ليس المالك
          if (!alive) return;
          setNotice('هذا الحساب غير مصرّح له بالوصول للبيانات الخاصة.');
          setLoginOpen(true);
          await supabase.auth.signOut();
          return; // onAuthStateChange سيعيد الدورة كزائر
        }
      }
      setCloudFiles(next === 'owner' ? cloudFiles() : null);
      await sync.start(next);
      if (next === 'owner') retryUploads();
      if (!alive) return;
      setRole(next);
      setReady(true);
    })();
    return () => { alive = false; };
  }, [uid]);

  const signInWithPassword = useCallback(async (email, password) => {
    setNotice('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + window.location.pathname },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    setReady(false);
    // نمسح نسخ البيانات والملفات الخاصة من هذا الجهاز قبل الخروج
    // ملاحظة: ما لم يُرفع بعد يضيع؛ نحاول رفعه أولاً
    try { await sync.flush(); } catch { /* تجاهل */ }
    sync.clearLocal();
    await clearLocalFiles();
    try { localStorage.removeItem(OWNER_CACHE); } catch { /* تجاهل */ }
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      cloud: cloudEnabled,
      role,
      isOwner: role === 'owner',
      isViewer: role !== 'owner',
      email: session?.user?.email ?? null,
      notice,
      loginOpen,
      openLogin: () => setLoginOpen(true),
      closeLogin: () => { setLoginOpen(false); setNotice(''); },
      signInWithPassword,
      signInWithGoogle,
      signOut,
    }),
    [role, session, notice, loginOpen, signInWithPassword, signInWithGoogle, signOut]
  );

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500" role="status">
        جارٍ التحميل…
      </div>
    );
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
