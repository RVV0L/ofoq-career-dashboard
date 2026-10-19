import { useState } from 'react';
import { Search } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { bugFields, cheatFields } from '@/data/schemas';
import EntityModal from '@/components/ui/EntityModal';
import { EditButton, Empty, SectionHeader } from '@/components/ui/Controls';

const cfg = {
  cheatSheet: { collection: 'cheatSheet', entityName: 'مفهوم', fields: cheatFields },
  bugLog: { collection: 'bugLog', entityName: 'مشكلة', fields: bugFields },
};

/** Cheat Sheet + Bug Log (كما كانا) */
export default function ReferenceTab() {
  const { cheatSheet, bugLog } = useData();
  const [modal, setModal] = useState(null);
  const [q, setQ] = useState('');
  const open = (kind, extra = {}) => setModal({ kind, ...extra });
  const today = () => new Date().toISOString().slice(0, 10);
  const needle = q.trim().toLowerCase();
  const cheats = cheatSheet.filter((c) => !needle || `${c.title} ${c.body}`.toLowerCase().includes(needle));

  return (
    <div className="space-y-8">
      <section>
        <SectionHeader title="Technical Cheat Sheet" onAdd={() => open('cheatSheet')} addLabel="إضافة مفهوم" />
        <div className="relative mb-3">
          <Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث في المفاهيم..." className="input !ps-9" aria-label="بحث" />
        </div>
        {cheats.length === 0 && <div className="card"><Empty>{cheatSheet.length ? 'لا نتائج مطابقة.' : 'لا توجد مفاهيم بعد.'}</Empty></div>}
        <div className="grid gap-4 md:grid-cols-2">
          {cheats.map((c) => (
            <article key={c.id} className="card animate-fade-up">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{c.title}</h3>
                <EditButton onClick={() => open('cheatSheet', { item: c })} />
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{c.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Problem Solving & Bug Log" onAdd={() => open('bugLog', { defaults: { date: today() } })} addLabel="إضافة مشكلة" />
        {bugLog.length === 0 && <div className="card"><Empty>لا توجد مشاكل موثقة.</Empty></div>}
        <div className="space-y-4">
          {bugLog.map((b) => (
            <article key={b.id} className="card animate-fade-up">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{b.title}</h3>
                  {b.date && <p className="text-xs text-slate-400 tabular-nums">{b.date}</p>}
                </div>
                <EditButton onClick={() => open('bugLog', { item: b })} />
              </div>
              {b.problem && <p className="mt-3 text-sm"><b className="text-rose-600">المشكلة: </b><span className="whitespace-pre-wrap">{b.problem}</span></p>}
              {b.solution && <p className="mt-2 text-sm"><b className="text-emerald-600">الحل: </b><span className="whitespace-pre-wrap">{b.solution}</span></p>}
            </article>
          ))}
        </div>
      </section>

      {modal && <EntityModal state={modal} onClose={() => setModal(null)} {...cfg[modal.kind]} />}
    </div>
  );
}
