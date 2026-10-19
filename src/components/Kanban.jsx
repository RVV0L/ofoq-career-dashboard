import { useState } from 'react';
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { SPRINT_COLUMNS, sprintFields } from '@/data/schemas';
import EntityModal from '@/components/ui/EntityModal';
import { EditButton } from '@/components/ui/Controls';

/** لوحة Kanban: سحب وإفلات (سطح المكتب) أو أزرار النقل (الجوال). */
export default function Kanban() {
  const { sprints, updateItem } = useData();
  const [modal, setModal] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  const order = SPRINT_COLUMNS.map((c) => c.value);
  const move = (item, step) => {
    const next = order[order.indexOf(item.column) + step];
    if (next) updateItem('sprints', item.id, { column: next });
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {SPRINT_COLUMNS.map((col) => {
          const items = sprints.filter((s) => s.column === col.value);
          return (
            <div
              key={col.value}
              onDragOver={(e) => { e.preventDefault(); setOverCol(col.value); }}
              onDragLeave={() => setOverCol(null)}
              onDrop={() => {
                if (dragId) updateItem('sprints', dragId, { column: col.value });
                setDragId(null);
                setOverCol(null);
              }}
              className={`rounded-xl border p-3 transition-colors ${
                overCol === col.value
                  ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-900/20'
                  : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50'
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="ltr-text text-sm font-semibold">
                  {col.label} <span className="text-slate-400">({items.length})</span>
                </span>
                <button
                  onClick={() => setModal({ defaults: { column: col.value } })}
                  aria-label={`إضافة مهمة إلى ${col.label}`}
                  className="btn-ghost !p-1.5"
                >
                  <Plus size={16} />
                </button>
              </div>

              <ul className="space-y-2">
                {items.map((s) => (
                  <li
                    key={s.id}
                    draggable
                    onDragStart={() => setDragId(s.id)}
                    onDragEnd={() => { setDragId(null); setOverCol(null); }}
                    className="cursor-grab rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm active:cursor-grabbing dark:border-slate-700 dark:bg-slate-800"
                  >
                    <p className={s.column === 'done' ? 'text-slate-400 line-through' : ''}>{s.title}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex gap-1">
                        {s.column !== 'todo' && (
                          <button onClick={() => move(s, -1)} aria-label="نقل للخلف" title="نقل للخلف" className="btn-ghost !p-1">
                            <ArrowRight size={14} />
                          </button>
                        )}
                        {s.column !== 'done' && (
                          <button onClick={() => move(s, 1)} aria-label="نقل للأمام" title="نقل للأمام" className="btn-ghost !p-1">
                            <ArrowLeft size={14} />
                          </button>
                        )}
                      </div>
                      <EditButton onClick={() => setModal({ item: s })} />
                    </div>
                  </li>
                ))}
                {items.length === 0 && <li className="py-3 text-center text-xs text-slate-400">لا توجد مهام</li>}
              </ul>
            </div>
          );
        })}
      </div>

      <EntityModal state={modal} onClose={() => setModal(null)} collection="sprints" entityName="مهمة" fields={sprintFields} />
    </>
  );
}
