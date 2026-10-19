import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/context/AuthContext';
import { googleEnabled } from '@/services/supabase';

export default function LoginModal() {
  const { loginOpen, closeLogin, isOwner, notice, signInWithPassword, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (isOwner && loginOpen) closeLogin(); }, [isOwner, loginOpen, closeLogin]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signInWithPassword(email, password);
    } catch (err) {
      setError(/invalid/i.test(err.message) ? 'البريد أو كلمة المرور غير صحيحة.' : 'تعذّر تسجيل الدخول: ' + err.message);
      setBusy(false);
    }
  };

  const google = async () => {
    setError('');
    try { await signInWithGoogle(); } catch (err) { setError('تعذّر الدخول عبر Google: ' + err.message); }
  };

  return (
    <Modal open={loginOpen} onClose={closeLogin} title="تسجيل دخول المالك">
      <form onSubmit={submit} className="space-y-3">
        {(notice || error) && (
          <p role="alert" className="rounded-lg bg-rose-50 p-2.5 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{notice || error}</p>
        )}
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600 dark:text-slate-300">البريد الإلكتروني</span>
          <input type="email" required autoComplete="username" dir="ltr" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-600 dark:text-slate-300">كلمة المرور</span>
          <input type="password" required autoComplete="current-password" dir="ltr" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button type="submit" disabled={busy} className="btn-primary w-full">{busy ? 'جارٍ الدخول…' : 'دخول'}</button>
        {googleEnabled && (
          <button type="button" onClick={google} className="btn-ghost w-full border border-slate-200 dark:border-slate-700">
            الدخول عبر <bdi dir="ltr">Google</bdi>
          </button>
        )}
        <p className="text-xs text-slate-500">لا يوجد تسجيل حسابات جديدة: الدخول لمالك الموقع فقط.</p>
      </form>
    </Modal>
  );
}
