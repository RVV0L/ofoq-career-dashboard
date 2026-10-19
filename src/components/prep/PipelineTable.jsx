import { useData } from '@/context/DataContext';
import { STAGES, stageIndex } from '@/lib/pipeline';
import { appTone } from '@/data/schemas';
import { fmtDateTime } from '@/lib/time';
import ReminderChip from '@/components/ReminderChip';
import { EditButton, Empty } from '@/components/ui/Controls';

export default function PipelineTable({ onOpen }) {
  const { applications, cvs, updateItem } = useData();
  const change = (a, status) =>
    updateItem('applications', a.id, {
      status,
      ...(stageIndex(status) >= 2 && !a.date ? { date: new Date().toISOString().slice(0, 10) } : {}),
      ...(status !== 'decision' ? { outcome: '' } : {}),
    });
  const sorted = [...applications].sort((a, b) => {
    const wa = stageIndex(a.status) < 2 && a.opensAt, wb = stageIndex(b.status) < 2 && b.opensAt;
    if (wa && wb) return a.opensAt.localeCompare(b.opensAt);
    return wa ? -1 : wb ? 1 : stageIndex(a.status) - stageIndex(b.status);
  });
  if (!applications.length) return <div className="card"><Empty>لا توجد شركات مستهدفة بعد.</Empty></div>;

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[860px] text-sm">
        <thead className="text-slate-500">
          <tr>
            {['الشركة', 'الوظيفة', 'المرحلة', 'فتح التقديم', 'إغلاق التقديم', 'التذكير', 'CV'].map((h) => <th key={h} className="py-2 text-start font-medium">{h}</th>)}
            <th className="w-10" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {sorted.map((a) => (
            <tr key={a.id}>
              <td className="py-2.5 font-medium"><bdi>{a.company}</bdi></td>
              <td className="ltr-text" dir="ltr">{a.role}</td>
              <td>
                <select value={a.status} onChange={(e) => change(a, e.target.value)} aria-label={`مرحلة ${a.company}`}
                  className={`cursor-pointer rounded-full border-0 py-1 ps-3 pe-7 text-xs font-medium outline-none focus:ring-2 focus:ring-brand-500 ${appTone(a)}`}>
                  {STAGES.map((s) => <option key={s.value} value={s.value} className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">{s.label}</option>)}
                </select>
              </td>
              <td className="text-xs text-slate-500">{a.opensAt ? <bdi dir="ltr">{fmtDateTime(a.opensAt)}</bdi> : '—'}</td>
              <td className="text-xs text-slate-500">{a.closesAt ? <bdi dir="ltr">{fmtDateTime(a.closesAt)}</bdi> : '—'}</td>
              <td className="text-xs"><ReminderChip app={a} /></td>
              <td className="text-xs text-slate-500">{cvs.find((c) => c.id === a.cvId)?.name ?? '—'}</td>
              <td><EditButton onClick={() => onOpen(a)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
