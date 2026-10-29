import { useState } from 'react';
import {
  KanbanSquare,
  MessagesSquare,
  FileText,
  BookMarked,
  Table2,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
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
  const [card, setCard] = useState(null);

  return (
    <div className="space-y-6">
      <div
        className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-slate-100/90 p-1 text-sm dark:bg-slate-800/90"
        role="tablist"
        aria-label="أقسام التقديمات والتحضير"
      >
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex min-h-[40px] flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 font-medium transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
              tab === id
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Icon size={15} className="shrink-0" aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {tab === 'board' && (
        <section className="space-y-3.5">
          <SectionHeader
            title="COOP Pipeline Tracker — متابعة التقديمات"
            onAdd={() => setCard({ defaults: { status: 'monitoring' } })}
            addLabel="إضافة شركة"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <ul className="flex flex-wrap gap-1.5 text-xs" aria-label="ملخص أعداد الشركات في كل مرحلة">
              {STAGES.map((st) => (
                <li
                  key={st.value}
                  className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1"
                >
                  <span className="text-slate-600 dark:text-slate-300">{st.label}</span>
                  <b className="tabular-nums text-brand-600 dark:text-brand-400">
                    {applications.filter((a) => a.status === st.value).length}
                  </b>
                </li>
              ))}
            </ul>

            <div
              className="flex rounded-xl border border-[var(--border-subtle)] bg-slate-100 p-0.5 text-xs dark:bg-slate-800"
              role="group"
              aria-label="طريقة العرض"
            >
              {[
                ['kanban', 'لوحة', KanbanSquare],
                ['table', 'جدول', Table2],
              ].map(([v, l, Icon]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  className={`flex min-h-[34px] items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                    view === v
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon size={13} aria-hidden="true" />
                  <span>{l}</span>
                </button>
              ))}
            </div>
          </div>

          {view === 'kanban' ? (
            <PipelineKanban onOpen={(app) => setCard({ app })} />
          ) : (
            <PipelineTable onOpen={(app) => setCard({ app })} />
          )}

          <div className="flex flex-col justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 text-xs text-slate-500 sm:flex-row sm:items-center">
            <p>
              اسحب الشركة بين الأعمدة (أو استخدم الأسهم)، واضغط على الاسم لفتح البطاقة التفصيلية.
            </p>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="font-medium">دليل التذكير:</span>
              <span className="badge gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 size={11} aria-hidden="true" /> &gt; 14 يوماً
              </span>
              <span className="badge gap-1 bg-amber-100 text-amber-700 dark:bg-emerald-950 dark:text-amber-300">
                <Clock size={11} aria-hidden="true" /> ≤ 14 يوماً
              </span>
              <span className="badge gap-1 bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                <AlertTriangle size={11} aria-hidden="true" /> ≤ 3 أيام (عاجل)
              </span>
            </div>
          </div>
        </section>
      )}

      {tab === 'interviews' && <InterviewsTab />}
      {tab === 'cvs' && <CvTab />}
      {tab === 'reference' && <ReferenceTab />}

      {card && <CompanyModal app={card.app} defaults={card.defaults} onClose={() => setCard(null)} />}
    </div>
  );
}
