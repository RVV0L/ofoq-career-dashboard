import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Paperclip, XCircle } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { STAGES, stageIndex } from '@/lib/pipeline';
import { TONE } from '@/data/schemas';
import ReminderChip from '@/components/ReminderChip';
import { fmtDateTime } from '@/lib/time';

/** Kanban التقديمات: اسحب الشركة بين المراحل (أو استخدم الأسهم على الجوال) */
export default function PipelineKanban({ onOpen }) {
  const { applications, cvs, updateItem } = useData();
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  const move = (a, status) => {
    if (a.status === status) return;
    updateItem('applications', a.id, {
      status,
      ...(stageIndex(status) >= 2 && !a.date ? { date: new Date().toISOString().slice(0, 10) } : {}),
      ...(status !== 'decision' ? { outcome: '' } : {}),
    });
  };
  const cvName = (id) => cvs.find((c) => c.id === id)?.name;

  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-2" data-testid="kanban">
      <div className="flex min-w-max gap-3">
        {STAGES.map((st, idx) => {
          const items = applications.filter((a) => a.status === st.value);
          return (
            <section
              key={st.value}
              aria-label={st.label}
              data-stage={st.value}
              onDragOver={(e) => { e.preventDefault(); setOverCol(st.value); }}
              onDragLeave={() => setOverCol((c) => (c === st.value ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                const a = applications.find((x) => x.id === (dragId ?? e.dataTransfer.getData('text/plain')));
                setOverCol(null); setDragId(null);
                if (a) move(a, st.value);
              }}
              className={`w-60 shrink-0 rounded-2xl border p-2.5 transition ${
                overCol === st.value ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-900/20' : 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40'
              }`}
            >
              <header className="mb-2 flex items-center justify-between px-1 text-sm font-semibold">
                <span>{st.label}</span>
                <span className={`badge ${TONE[st.value]}`}>{items.length}</span>
              </header>

              <ul className="min-h-[3rem] space-y-2">
                {items.map((a) => {
                  const cv = cvName(a.cvId);
                  return (
                    <li
                      key={a.id}
                      draggable
                      onDragStart={(e) => { setDragId(a.id); e.dataTransfer.setData('text/plain', a.id); e.dataTransfer.effectAllowed = 'move'; }}
                      onDragEnd={() => { setDragId(null); setOverCol(null); }}
                      className={`cursor-grab rounded-xl border border-slate-200 bg-white p-3 text-sm shadow-sm active:cursor-grabbing dark:border-slate-700 dark:bg-slate-900 ${dragId === a.id ? 'opacity-50' : ''}`}
                    >
                      <button type="button" onClick={() => onOpen(a)} className="block w-full text-start" aria-label={`فتح بطاقة ${a.company}`}>
                        <p className="font-semibold"><bdi>{a.company}</bdi></p>
                        {a.role && <p className="ltr-text truncate text-xs text-slate-500" dir="ltr">{a.role}</p>}
                      </button>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <ReminderChip app={a} />
                        {a.files?.length > 0 && <span className="badge gap-1 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><Paperclip size={11} />{a.files.length}</span>}
                      </div>
                      {a.closesAt && stageIndex(a.status) < 2 && (
                        <p className="mt-1.5 text-[11px] text-slate-400">الإغلاق: <bdi dir="ltr">{fmtDateTime(a.closesAt)}</bdi></p>
                      )}
                      {cv && <p className="mt-1 truncate text-[11px] text-slate-400">النسخة: <bdi>{cv}</bdi></p>}

                      {st.value === 'decision' && (
                        <div className="mt-2 flex items-center gap-1.5">
                          {a.outcome ? (
                            <span className={`badge gap-1 ${TONE[a.outcome]}`}>
                              {a.outcome === 'accepted' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                              {a.outcome === 'accepted' ? 'قبول' : 'رفض'}
                            </span>
                          ) : null}
                          <button type="button" className="btn-ghost !px-2 !py-0.5 !text-xs" onClick={() => updateItem('applications', a.id, { outcome: 'accepted' })}>قبول</button>
                          <button type="button" className="btn-ghost !px-2 !py-0.5 !text-xs" onClick={() => updateItem('applications', a.id, { outcome: 'rejected' })}>رفض</button>
                        </div>
                      )}

                      <div className="mt-2 flex justify-between border-t border-slate-100 pt-1.5 dark:border-slate-800">
                        <button type="button" className="btn-ghost !p-1 disabled:opacity-30" disabled={idx === 0} onClick={() => move(a, STAGES[idx - 1].value)} aria-label={`نقل ${a.company} إلى ${STAGES[idx - 1]?.label ?? ''}`}>
                          <ArrowRight size={14} />
                        </button>
                        <button type="button" className="btn-ghost !p-1 disabled:opacity-30" disabled={idx === STAGES.length - 1} onClick={() => move(a, STAGES[idx + 1].value)} aria-label={`نقل ${a.company} إلى ${STAGES[idx + 1]?.label ?? ''}`}>
                          <ArrowLeft size={14} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
