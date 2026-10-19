import { useMemo, useState } from 'react';
import { Lightbulb, Plus, Search, Trash2 } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { INTERVIEW_TYPES, labelOf } from '@/data/schemas';
import { uid } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import { Badge, EditButton, Empty, SectionHeader } from '@/components/ui/Controls';

const tagsOf = (t) => (Array.isArray(t) ? t : []);

function InterviewModal({ item, onClose }) {
  const { applications, addItem, updateItem, removeItem } = useData();
  const isEdit = Boolean(item);
  const [f, setF] = useState(() => ({
    company: '', appId: '', date: new Date().toISOString().slice(0, 10), type: 'technical', notes: '',
    ...item,
    qa: (item?.qa ?? []).map((x) => ({ ...x, tags: tagsOf(x.tags).join(', ') })),
  }));
  const [err, setErr] = useState('');
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const setQa = (id, k, v) => setF((x) => ({ ...x, qa: x.qa.map((q) => (q.id === id ? { ...q, [k]: v } : q)) }));
  const addQa = () => setF((x) => ({ ...x, qa: [...x.qa, { id: uid(), q: '', a: '', improve: '', tags: '' }] }));

  const pickCompany = (v) => {
    const app = applications.find((a) => a.company.toLowerCase() === v.trim().toLowerCase());
    setF((x) => ({ ...x, company: v, appId: app?.id ?? '' }));
  };

  const save = (e) => {
    e.preventDefault();
    if (!f.company.trim()) return setErr('اسم الشركة مطلوب');
    const qa = f.qa
      .filter((q) => q.q.trim())
      .map((q) => ({ ...q, q: q.q.trim(), a: q.a.trim(), improve: q.improve.trim(), tags: q.tags.split(/[,،]/).map((t) => t.trim()).filter(Boolean) }));
    const values = { company: f.company.trim(), appId: f.appId, date: f.date, type: f.type, notes: f.notes.trim(), qa };
    if (isEdit) updateItem('interviews', item.id, values); else addItem('interviews', values);
    onClose();
  };

  return (
    <Modal open size="lg" title={isEdit ? 'تعديل مقابلة' : 'إضافة مقابلة'} onClose={onClose}>
      <form onSubmit={save} className="grid grid-cols-2 gap-3 text-sm">
        <label className="col-span-2 sm:col-span-1">
          <span className="mb-1 block font-medium">الشركة *</span>
          <input className="input" list="iv-companies" value={f.company} onChange={(e) => pickCompany(e.target.value)} autoFocus />
          <datalist id="iv-companies">{applications.map((a) => <option key={a.id} value={a.company} />)}</datalist>
        </label>
        <label className="col-span-1">
          <span className="mb-1 block font-medium">التاريخ</span>
          <input type="date" className="input" value={f.date} onChange={(e) => set('date', e.target.value)} />
        </label>
        <label className="col-span-1">
          <span className="mb-1 block font-medium">نوع المقابلة</span>
          <select className="input" value={f.type} onChange={(e) => set('type', e.target.value)}>
            {INTERVIEW_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label className="col-span-2">
          <span className="mb-1 block font-medium">انطباع عام / ملاحظات</span>
          <textarea className="input min-h-[60px]" value={f.notes} onChange={(e) => set('notes', e.target.value)} />
        </label>

        <div className="col-span-2 mt-1 flex items-center justify-between">
          <p className="font-semibold">الأسئلة التي سُئلت ({f.qa.length})</p>
          <button type="button" className="btn-primary !px-3 !py-1.5 !text-xs" onClick={addQa}><Plus size={14} /> إضافة سؤال</button>
        </div>
        {f.qa.length === 0 && <p className="col-span-2 rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400 dark:border-slate-700">أضف الأسئلة التي سُئلت عنها وإجاباتك — تتحول لاحقاً إلى قاعدة معرفة.</p>}
        {f.qa.map((q, i) => (
          <fieldset key={q.id} className="col-span-2 space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <legend className="px-1 text-xs text-slate-500">سؤال {i + 1}</legend>
            <textarea className="input min-h-[52px]" placeholder="السؤال" aria-label={`السؤال ${i + 1}`} value={q.q} onChange={(e) => setQa(q.id, 'q', e.target.value)} />
            <textarea className="input min-h-[64px]" placeholder="إجابتي" aria-label={`إجابتي ${i + 1}`} value={q.a} onChange={(e) => setQa(q.id, 'a', e.target.value)} />
            <textarea className="input min-h-[52px]" placeholder="وش أتحسن فيه؟ (ما كان ناقصاً أو يمكن قوله أفضل)" aria-label={`ما يتحسن ${i + 1}`} value={q.improve} onChange={(e) => setQa(q.id, 'improve', e.target.value)} />
            <div className="flex gap-2">
              <input className="input" dir="ltr" placeholder="tags: Networking, OSI" aria-label={`وسوم ${i + 1}`} value={q.tags} onChange={(e) => setQa(q.id, 'tags', e.target.value)} />
              <button type="button" className="btn !p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950" aria-label={`حذف السؤال ${i + 1}`} onClick={() => setF((x) => ({ ...x, qa: x.qa.filter((z) => z.id !== q.id) }))}><Trash2 size={16} /></button>
            </div>
          </fieldset>
        ))}

        {err && <p role="alert" className="col-span-2 text-rose-500">{err}</p>}
        <div className="col-span-2 flex items-center justify-between pt-2">
          <div>{isEdit && <button type="button" className="btn text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950" onClick={() => window.confirm('حذف هذه المقابلة؟') && (removeItem('interviews', item.id), onClose())}><Trash2 size={16} /> حذف</button>}</div>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn-primary">{isEdit ? 'حفظ التعديل' : 'إضافة'}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

/** سجل المقابلات + قاعدة معرفة قابلة للبحث من كل الأسئلة */
export default function InterviewsTab() {
  const { interviews } = useData();
  const [view, setView] = useState('log');
  const [modal, setModal] = useState(null);
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');
  const [onlyImprove, setOnlyImprove] = useState(false);

  const sorted = useMemo(() => [...interviews].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')), [interviews]);
  const kb = useMemo(
    () => sorted.flatMap((i) => (i.qa ?? []).map((x) => ({ ...x, tags: tagsOf(x.tags), company: i.company, date: i.date, interview: i }))),
    [sorted]
  );
  const allTags = useMemo(() => [...new Set(kb.flatMap((x) => x.tags))].sort(), [kb]);
  const needle = q.trim().toLowerCase();
  const hits = kb.filter((x) =>
    (!tag || x.tags.includes(tag)) &&
    (!onlyImprove || x.improve) &&
    (!needle || `${x.q} ${x.a} ${x.improve} ${x.tags.join(' ')} ${x.company}`.toLowerCase().includes(needle))
  );

  return (
    <div className="space-y-4">
      <SectionHeader title="Interview Log — سجل المقابلات" onAdd={() => setModal({})} addLabel="إضافة مقابلة" />

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 text-sm dark:bg-slate-800" role="tablist">
        {[['log', `المقابلات (${interviews.length})`], ['kb', `قاعدة المعرفة (${kb.length})`]].map(([id, l]) => (
          <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(id)}
            className={`flex-1 rounded-lg px-3 py-1.5 font-medium transition ${view === id ? 'bg-white shadow-sm dark:bg-slate-700' : 'text-slate-500'}`}>{l}</button>
        ))}
      </div>

      {view === 'log' ? (
        <>
          {sorted.length === 0 && <div className="card"><Empty>لا توجد مقابلات موثقة بعد.</Empty></div>}
          <div className="space-y-3">
            {sorted.map((i) => (
              <article key={i.id} className="card animate-fade-up">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold"><bdi>{i.company}</bdi></h3>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                      <span className="tabular-nums">{i.date}</span>
                      <Badge tone="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300">{labelOf(INTERVIEW_TYPES, i.type)}</Badge>
                      <span>{(i.qa ?? []).length} سؤال</span>
                    </p>
                  </div>
                  <EditButton onClick={() => setModal({ item: i })} />
                </div>
                {i.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{i.notes}</p>}
                {(i.qa ?? []).length > 0 && (
                  <details className="mt-3 text-sm">
                    <summary className="cursor-pointer text-slate-500">عرض الأسئلة وإجاباتي</summary>
                    <ul className="mt-2 space-y-3">
                      {i.qa.map((x) => <QaCard key={x.id} x={{ ...x, tags: tagsOf(x.tags) }} />)}
                    </ul>
                  </details>
                )}
              </article>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input !ps-9" placeholder="ابحث في الأسئلة والإجابات والوسوم…" aria-label="بحث في قاعدة المعرفة" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button onClick={() => setOnlyImprove((v) => !v)} aria-pressed={onlyImprove}
              className={`badge gap-1 ${onlyImprove ? 'bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
              <Lightbulb size={12} /> يحتاج تحسين
            </button>
            {allTags.map((t) => (
              <button key={t} onClick={() => setTag((c) => (c === t ? '' : t))} aria-pressed={tag === t}
                className={`badge ltr-text ${tag === t ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'}`}>{t}</button>
            ))}
          </div>
          {hits.length === 0 && <div className="card"><Empty>{kb.length ? 'لا نتائج مطابقة.' : 'أضف مقابلة بأسئلتها لتبني قاعدة معرفتك.'}</Empty></div>}
          <ul className="grid gap-3 md:grid-cols-2">
            {hits.map((x) => (
              <li key={x.id} className="card !p-4">
                <QaCard x={x} />
                <p className="mt-3 text-[11px] text-slate-400">من مقابلة <bdi>{x.company}</bdi> · <span className="tabular-nums">{x.date}</span></p>
              </li>
            ))}
          </ul>
        </>
      )}

      {modal && <InterviewModal item={modal.item} onClose={() => setModal(null)} />}
    </div>
  );
}

function QaCard({ x }) {
  return (
    <div className="space-y-1.5 text-sm">
      <p className="font-semibold">{x.q}</p>
      {x.a && <p className="whitespace-pre-wrap text-slate-600 dark:text-slate-300"><b className="text-emerald-600">إجابتي: </b>{x.a}</p>}
      {x.improve && (
        <p className="whitespace-pre-wrap rounded-lg bg-amber-50 p-2 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          <b className="inline-flex items-center gap-1"><Lightbulb size={13} /> أتحسن في: </b> {x.improve}
        </p>
      )}
      {x.tags?.length > 0 && <div className="flex flex-wrap gap-1">{x.tags.map((t) => <span key={t} className="badge ltr-text bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">{t}</span>)}</div>}
    </div>
  );
}
