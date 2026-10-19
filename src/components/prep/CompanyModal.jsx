import { useState } from 'react';
import { ExternalLink, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import FileAttach from '@/components/FileAttach';
import { useData } from '@/context/DataContext';
import { STAGES } from '@/lib/pipeline';
import { normalizeUrl } from '@/lib/utils';
import { commit, deleteFile, newSession, rollback } from '@/services/files';

const KINDS = [
  { value: 'cv', label: 'CV' },
  { value: 'cover', label: 'خطاب تقديم' },
  { value: 'other', label: 'أخرى' },
];

const Field = ({ label, half, hint, children }) => (
  <label className={`block text-sm ${half ? 'col-span-2 sm:col-span-1' : 'col-span-2'}`}>
    <span className="mb-1 block font-medium">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
  </label>
);

/** بطاقة الشركة التفصيلية: البوابة، مواعيد الفتح والإغلاق، الوظيفة، جهة الاتصال، ملاحظات، مرفقات */
export default function CompanyModal({ app, defaults, onClose }) {
  const { cvs, interviews, addItem, updateItem, removeItem } = useData();
  const isEdit = Boolean(app);
  const [f, setF] = useState(() => ({
    company: '', role: '', status: 'monitoring', outcome: '', portalUrl: '', opensAt: '', closesAt: '',
    date: '', cvId: '', contact: '', notes: '', files: [], ...defaults, ...app,
  }));
  const [session] = useState(newSession);
  const [err, setErr] = useState('');
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const cancel = () => { rollback(session); onClose(); };
  const portal = normalizeUrl(f.portalUrl);
  const talks = isEdit ? interviews.filter((i) => i.appId === app.id || i.company === app.company).length : 0;

  const save = (e) => {
    e.preventDefault();
    if (!f.company.trim()) return setErr('اسم الشركة مطلوب');
    if (f.portalUrl.trim() && !portal) return setErr('رابط البوابة غير صالح (يجب أن يبدأ بـ http أو https)');
    if (f.opensAt && f.closesAt && f.closesAt < f.opensAt) return setErr('موعد الإغلاق يجب أن يكون بعد موعد الفتح');
    const values = {
      ...f,
      company: f.company.trim(), role: f.role.trim(), portalUrl: f.portalUrl.trim(),
      contact: f.contact.trim(), notes: f.notes.trim(),
      outcome: f.status === 'decision' ? f.outcome : '',
      date: f.date || (f.status !== 'monitoring' && f.status !== 'ready' ? new Date().toISOString().slice(0, 10) : ''),
    };
    commit(session);
    if (isEdit) updateItem('applications', app.id, values); else addItem('applications', values);
    onClose();
  };

  const del = () => {
    if (!window.confirm(`حذف «${app.company}» وكل مرفقاته؟ لا يمكن التراجع.`)) return;
    (app.files ?? []).forEach((x) => deleteFile(x.id).catch(() => {}));
    rollback(session);
    removeItem('applications', app.id);
    onClose();
  };

  return (
    <Modal open size="lg" title={isEdit ? `بطاقة ${app.company}` : 'إضافة شركة مستهدفة'} onClose={cancel}>
      <form onSubmit={save} className="grid grid-cols-2 gap-3">
        <Field label="اسم الشركة *" half>
          <input className="input" value={f.company} onChange={(e) => set('company', e.target.value)} autoFocus />
        </Field>
        <Field label="الوظيفة المستهدفة" half>
          <input className="input" dir="ltr" value={f.role} onChange={(e) => set('role', e.target.value)} placeholder="Network Engineer Intern" />
        </Field>

        <Field label="المرحلة" half>
          <select className="input" value={f.status} onChange={(e) => set('status', e.target.value)}>
            {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </Field>
        {f.status === 'decision' ? (
          <Field label="النتيجة" half>
            <select className="input" value={f.outcome} onChange={(e) => set('outcome', e.target.value)}>
              <option value="">لم يُحسم</option><option value="accepted">قبول</option><option value="rejected">رفض</option>
            </select>
          </Field>
        ) : (
          <Field label="نسخة CV المُرسلة" half>
            <select className="input" value={f.cvId} onChange={(e) => set('cvId', e.target.value)}>
              <option value="">— لم تُحدد —</option>
              {cvs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        )}

        <Field label="رابط بوابة التقديم">
          <div className="flex gap-2">
            <input className="input" dir="ltr" value={f.portalUrl} onChange={(e) => set('portalUrl', e.target.value)} placeholder="https://careers.example.com" />
            {portal && (
              <a href={portal} target="_blank" rel="noreferrer noopener" className="btn-ghost shrink-0 border border-slate-200 dark:border-slate-700" aria-label="فتح البوابة">
                <ExternalLink size={16} /> فتح
              </a>
            )}
          </div>
        </Field>

        <Field label="تاريخ فتح التقديم" half hint="تقديري — عدّله حسب إعلان الشركة">
          <input type="datetime-local" className="input" value={f.opensAt} onChange={(e) => set('opensAt', e.target.value)} />
        </Field>
        <Field label="تاريخ إغلاق التقديم" half>
          <input type="datetime-local" className="input" value={f.closesAt} onChange={(e) => set('closesAt', e.target.value)} />
        </Field>

        {f.status !== 'monitoring' && f.status !== 'ready' && (
          <Field label="تاريخ التقديم" half>
            <input type="date" className="input" value={f.date} onChange={(e) => set('date', e.target.value)} />
          </Field>
        )}
        {(f.status === 'decision') && (
          <Field label="نسخة CV المُرسلة" half>
            <select className="input" value={f.cvId} onChange={(e) => set('cvId', e.target.value)}>
              <option value="">— لم تُحدد —</option>
              {cvs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        )}

        <Field label="جهة الاتصال" hint="الاسم / البريد / الجوال">
          <textarea className="input min-h-[64px]" value={f.contact} onChange={(e) => set('contact', e.target.value)} placeholder={'مثال: سارة — hr@example.com'} />
        </Field>
        <Field label="ملاحظات">
          <textarea className="input min-h-[90px]" value={f.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>

        <div className="col-span-2">
          <span className="mb-1 block text-sm font-medium">ملفات مرفقة (CV، خطاب التقديم)</span>
          <FileAttach files={f.files} onChange={(files) => set('files', files)} session={session} kinds={KINDS} />
        </div>

        {isEdit && talks > 0 && <p className="col-span-2 text-xs text-slate-500">لهذه الشركة {talks} مقابلة موثقة في «سجل المقابلات».</p>}
        {err && <p role="alert" className="col-span-2 text-sm text-rose-500">{err}</p>}

        <div className="col-span-2 flex items-center justify-between pt-2">
          <div>{isEdit && <button type="button" onClick={del} className="btn text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"><Trash2 size={16} /> حذف</button>}</div>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={cancel}>إلغاء</button>
            <button type="submit" className="btn-primary">{isEdit ? 'حفظ التعديل' : 'إضافة'}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
