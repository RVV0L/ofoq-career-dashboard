import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { CV_FIELDS, labelOf } from '@/data/schemas';
import { isSubmitted, appLabel } from '@/lib/pipeline';
import { commit, deleteFile, newSession, rollback } from '@/services/files';
import Modal from '@/components/ui/Modal';
import FileAttach from '@/components/FileAttach';
import { Badge, EditButton, Empty, SectionHeader } from '@/components/ui/Controls';

const FIELD_TONE = {
  networks: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  web: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  general: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

function CvModal({ item, onClose }) {
  const { addItem, updateItem, removeItem, applications, updateItem: upd } = useData();
  const isEdit = Boolean(item);
  const [f, setF] = useState(() => ({ name: '', field: 'networks', notes: '', files: [], ...item }));
  const [session] = useState(newSession);
  const [err, setErr] = useState('');
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const cancel = () => { rollback(session); onClose(); };

  const save = (e) => {
    e.preventDefault();
    if (!f.name.trim()) return setErr('اسم النسخة مطلوب');
    const values = { name: f.name.trim(), field: f.field, notes: f.notes.trim(), files: f.files, updatedAt: new Date().toISOString().slice(0, 10) };
    commit(session);
    if (isEdit) updateItem('cvs', item.id, values); else addItem('cvs', values);
    onClose();
  };
  const del = () => {
    if (!window.confirm(`حذف «${item.name}»؟ ستُفصل عن الشركات المرتبطة بها.`)) return;
    (item.files ?? []).forEach((x) => deleteFile(x.id).catch(() => {}));
    rollback(session);
    applications.filter((a) => a.cvId === item.id).forEach((a) => upd('applications', a.id, { cvId: '' }));
    removeItem('cvs', item.id);
    onClose();
  };

  return (
    <Modal open title={isEdit ? 'تعديل نسخة CV' : 'إضافة نسخة CV'} onClose={cancel}>
      <form onSubmit={save} className="space-y-3 text-sm">
        <label className="block"><span className="mb-1 block font-medium">اسم النسخة *</span>
          <input className="input" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="CV — شبكات وأمن" autoFocus /></label>
        <label className="block"><span className="mb-1 block font-medium">المجال</span>
          <select className="input" value={f.field} onChange={(e) => set('field', e.target.value)}>{CV_FIELDS.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
        <label className="block"><span className="mb-1 block font-medium">ملاحظات (ما الذي تركّز عليه هذه النسخة؟)</span>
          <textarea className="input min-h-[64px]" value={f.notes} onChange={(e) => set('notes', e.target.value)} /></label>
        <div><span className="mb-1 block font-medium">ملف النسخة</span>
          <FileAttach files={f.files} onChange={(files) => set('files', files)} session={session} single /></div>
        {err && <p role="alert" className="text-rose-500">{err}</p>}
        <div className="flex items-center justify-between pt-2">
          <div>{isEdit && <button type="button" className="btn text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950" onClick={del}><Trash2 size={16} /> حذف</button>}</div>
          <div className="flex gap-2"><button type="button" className="btn-ghost" onClick={cancel}>إلغاء</button><button type="submit" className="btn-primary">{isEdit ? 'حفظ التعديل' : 'إضافة'}</button></div>
        </div>
      </form>
    </Modal>
  );
}

/** نسخ CV لكل مجال + تتبع أي نسخة أُرسلت لأي شركة */
export default function CvTab() {
  const { cvs, applications, updateItem } = useData();
  const [modal, setModal] = useState(null);
  const sentTo = (id) => applications.filter((a) => a.cvId === id);

  return (
    <div className="space-y-6">
      <section>
        <SectionHeader title="نسخ CV" onAdd={() => setModal({})} addLabel="إضافة نسخة" />
        {cvs.length === 0 && <div className="card"><Empty>لا توجد نسخ بعد. أضف نسخة لكل مجال (شبكات/أمن، ويب).</Empty></div>}
        <div className="grid gap-4 md:grid-cols-2">
          {cvs.map((c) => (
            <article key={c.id} className="card animate-fade-up">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{c.name}</h3>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <Badge tone={FIELD_TONE[c.field]}>{labelOf(CV_FIELDS, c.field)}</Badge>
                    {c.updatedAt && <span className="tabular-nums">آخر تحديث {c.updatedAt}</span>}
                  </div>
                </div>
                <EditButton onClick={() => setModal({ item: c })} />
              </div>
              {c.notes && <p className="mt-2 text-sm text-slate-500">{c.notes}</p>}
              <p className="mt-2 text-xs">{c.files?.length ? <span className="text-emerald-600">📎 <bdi dir="ltr">{c.files[0].name}</bdi></span> : <span className="text-amber-600">لم يُرفع ملف لهذه النسخة بعد</span>}</p>
              <div className="mt-3 border-t border-slate-100 pt-2 dark:border-slate-800">
                <p className="mb-1 text-xs text-slate-400">أُرسلت إلى:</p>
                {sentTo(c.id).length === 0 ? <span className="text-xs text-slate-400">— لا أحد بعد</span> : (
                  <div className="flex flex-wrap gap-1.5">{sentTo(c.id).map((a) => <span key={a.id} className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><bdi>{a.company}</bdi></span>)}</div>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="أي نسخة أُرسلت لأي شركة؟" />
        <div className="card overflow-x-auto">
          {applications.length === 0 ? <Empty>لا توجد شركات.</Empty> : (
            <table className="w-full min-w-[420px] text-sm">
              <thead className="text-slate-500"><tr>{['الشركة', 'المرحلة', 'نسخة CV'].map((h) => <th key={h} className="py-2 text-start font-medium">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {applications.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2.5 font-medium"><bdi>{a.company}</bdi></td>
                    <td className="text-xs text-slate-500">{appLabel(a)}{isSubmitted(a) && !a.cvId && <span className="ms-2 text-amber-600">(لم تُحدد النسخة)</span>}</td>
                    <td>
                      <select className="input !w-auto !py-1" aria-label={`نسخة CV لـ ${a.company}`} value={a.cvId ?? ''} onChange={(e) => updateItem('applications', a.id, { cvId: e.target.value })}>
                        <option value="">— لم تُحدد —</option>
                        {cvs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {modal && <CvModal item={modal.item} onClose={() => setModal(null)} />}
    </div>
  );
}
