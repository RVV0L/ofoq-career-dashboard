import { Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

/**
 * يحمي الصفحات المعرّفة بـ privateOnly: true.
 * غير المالك لا يُركَّب عنده مكوّن الصفحة أصلاً (فلا تُستدعى بياناتها)،
 * ويرى بدلاً منها رسالة قفل مع زر تسجيل الدخول.
 * (الحماية الفعلية للبيانات في RLS؛ هذا المكوّن يمنع الواجهة والطلبات من جهة العميل.)
 */
export default function ProtectedRoute({ privateOnly = false, children }) {
  const { isOwner, openLogin, cloud } = useAuth();
  if (!privateOnly || isOwner) return children;
  return (
    <div className="card flex flex-col items-center gap-3 py-12 text-center" role="alert">
      <Lock size={28} className="text-slate-400" />
      <p className="font-bold">هذه الصفحة خاصة</p>
      <p className="text-sm text-slate-500">متاحة لمالك الموقع فقط.</p>
      {cloud && <button className="btn-primary" onClick={openLogin}>تسجيل الدخول</button>}
    </div>
  );
}
