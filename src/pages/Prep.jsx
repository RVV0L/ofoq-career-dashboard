import { useState } from 'react';
import { KanbanSquare, MessagesSquare, FileText, BookMarked, Table2 } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { STAGES } from '@/lib/pipeline';
import { SectionHeader } from '@/components/ui/Controls';
import PipelineKanban from '@/components/prep/PipelineKanban';
import PipelineTable from '@/components/prep/PipelineTable';
import CompanyModal from '@/components/prep/CompanyModal';
import InterviewsTab from '@/components/prep/InterviewsTab';
import CvTab from '@/components/prep/CvTab';
import ReferenceTab from '@/components/prep/ReferenceTab';

const TABS = [
  { id: 'board', label: 'لوحة التقديمات', Icon: KanbanSquare },
  { id: 'interviews', label: 'سجل المقابلات', Icon: MessagesSquare },
  { id: 'cvs', label: 'نسخ CV', Icon: FileText },
  { id: 'reference', label: 'مراجع ومشاكل', Icon: BookMarked },
];

export default function Prep() {
  const { applications } = useData();
  const [tab, setTab] = useState('board');
  const [view, setView] = useState('kanban');
  const [card, setCard] = useState(null); // { app?, defaults? }

  return (
    <div className="space-y-6">
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 text-sm dark:bg-slate-800" role="tablist">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 font-medium transition ${tab === id ? 'bg-white shadow-sm dark:bg-slate-700' : 'text-slate-500'}`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {tab === 'board' && (
        <section className="space-y-3">
          <SectionHeader title="COOP Pipeline Tracker" onAdd={() => setCard({ defaults: { status: 'monitoring' } })} addLabel="إضافة شركة" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <ul className="flex flex-wrap gap-2 text-xs">
              {STAGES.map((st) => (
                <li key={st.value} className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
                  <span>{st.label}</span><b className="tabular-nums">{applications.filter((a) => a.status === st.value).length}</b>
                </li>
              ))}
            </ul>
            <div className="flex rounded-xl bg-slate-100 p-0.5 text-xs dark:bg-slate-800" role="group" aria-label="طريقة العرض">
              {[['kanban', 'لوحة', KanbanSquare], ['table', 'جدول', Table2]].map(([v, l, Icon]) => (
                <button key={v} onClick={() => setView(v)} aria-pressed={view === v}
                  className={`flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium ${view === v ? 'bg-white shadow-sm dark:bg-slate-700' : 'text-slate-500'}`}><Icon size={13} /> {l}</button>
              ))}
            </div>
          </div>
          {view === 'kanban' ? <PipelineKanban onOpen={(app) => setCard({ app })} /> : <PipelineTable onOpen={(app) => setCard({ app })} />}
          <p className="text-xs text-slate-400">اسحب الشركة بين الأعمدة (أو استخدم الأسهم)، واضغط على الاسم لفتح البطاقة التفصيلية. مواعيد الفتح والإغلاق تقديرية — عدّلها حسب إعلان كل شركة.</p>
          <p className="flex flex-wrap gap-2 text-[11px] text-slate-500">
            ألوان التذكير:
            <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">أخضر: أكثر من 14 يوماً</span>
            <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">أصفر: خلال 14 يوماً</span>
            <span className="badge bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">أحمر: خلال 3 أيام</span>
          </p>
        </section>
      )}
      {tab === 'interviews' && <InterviewsTab />}
      {tab === 'cvs' && <CvTab />}
      {tab === 'reference' && <ReferenceTab />}

      {card && <CompanyModal app={card.app} defaults={card.defaults} onClose={() => setCard(null)} />}
    </div>
  );
}
