import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Plus } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { focusFields } from '@/data/schemas';
import EntityModal from '@/components/ui/EntityModal';
import { EditButton } from '@/components/ui/Controls';

const SERIES = [
  { key: 'web', label: 'تطوير الويب', color: 'var(--series-1)' },
  { key: 'ccna', label: 'شبكات CCNA', color: 'var(--series-2)' },
  { key: 'cv', label: 'تجهيز السيرة الذاتية', color: 'var(--series-3)' },
];
const WEEKS = 8;
const short = (iso) => { const d = new Date(iso); return `${d.getDate()}/${d.getMonth() + 1}`; };

function Tip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-1.5 font-semibold">أسبوع {label}</p>
      {[...payload].reverse().map((p) => (
        <p key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="tabular-nums">
            {p.value} س · {total ? Math.round((p.value / total) * 100) : 0}%
          </span>
        </p>
      ))}
    </div>
  );
}

/** رسم مكدّس: نسبة توزيع التركيز بين المسارات الثلاثة على آخر الأسابيع (نسبة % أو ساعات). */
export default function FocusChart() {
  const { focusLog } = useData();
  const [pct, setPct] = useState(true);
  const [modal, setModal] = useState(null);

  const rows = useMemo(
    () => [...focusLog].sort((a, b) => a.week.localeCompare(b.week)).slice(-WEEKS),
    [focusLog]
  );
  const data = rows.map((r) => ({ ...r, label: short(r.week) }));
  const totals = SERIES.map((s) => ({ ...s, sum: rows.reduce((a, r) => a + (Number(r[s.key]) || 0), 0) }));
  const grand = totals.reduce((a, t) => a + t.sum, 0);

  return (
    <section className="card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="card-title !mb-0">توزيع التركيز والإنجاز (آخر {WEEKS} أسابيع)</p>
          <p className="text-xs text-slate-500">ساعات كل أسبوع موزعة بين المسارات الثلاثة</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 p-0.5 text-xs dark:bg-slate-800" role="group" aria-label="نوع العرض">
            {[[true, 'نسبة %'], [false, 'ساعات']].map(([v, l]) => (
              <button key={l} onClick={() => setPct(v)} aria-pressed={pct === v}
                className={`rounded-lg px-3 py-1.5 font-medium transition ${pct === v ? 'bg-white shadow-sm dark:bg-slate-700' : 'text-slate-500'}`}>
                {l}
              </button>
            ))}
          </div>
          <button className="btn-primary !px-3 !py-1.5 !text-xs" onClick={() => setModal({ defaults: { week: new Date().toISOString().slice(0, 10) } })}>
            <Plus size={14} /> تسجيل أسبوع
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">سجّل ساعات أول أسبوع لعرض الرسم.</p>
      ) : (
        <>
          {/* legend دائم: الهوية لا تعتمد على اللون وحده */}
          <ul className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-xs">
            {totals.map((t) => (
              <li key={t.key} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: t.color }} />
                <span>{t.label}</span>
                <span className="text-slate-400 tabular-nums">{grand ? Math.round((t.sum / grand) * 100) : 0}%</span>
              </li>
            ))}
          </ul>

          <div dir="ltr" className="h-64 w-full text-[11px]" style={{ color: 'var(--viz-text)' }}>
            <ResponsiveContainer>
              <BarChart data={data} stackOffset={pct ? 'expand' : 'none'} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--viz-grid)" />
                <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: 'var(--viz-grid)' }} tick={{ fill: 'currentColor' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: 'currentColor' }}
                  tickFormatter={pct ? (v) => `${Math.round(v * 100)}%` : undefined} />
                <Tooltip content={<Tip />} cursor={{ fill: 'var(--viz-grid)', opacity: 0.5 }} />
                {SERIES.map((s, i) => (
                  <Bar key={s.key} dataKey={s.key} name={s.label} stackId="a" fill={s.color}
                    stroke="var(--viz-surface)" strokeWidth={2} maxBarSize={36} isAnimationActive={false}
                    radius={i === SERIES.length - 1 ? [4, 4, 0, 0] : 0} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-slate-500">عرض كجدول / تعديل الأسابيع</summary>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[380px] text-xs">
                <thead className="text-slate-500">
                  <tr>
                    <th className="py-1.5 text-start font-medium">الأسبوع</th>
                    {SERIES.map((s) => <th key={s.key} className="text-start font-medium">{s.label}</th>)}
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[...rows].reverse().map((r) => (
                    <tr key={r.id}>
                      <td className="py-1.5 tabular-nums">{r.week}</td>
                      {SERIES.map((s) => <td key={s.key} className="tabular-nums">{r[s.key] ?? 0}</td>)}
                      <td><EditButton onClick={() => setModal({ item: r })} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}

      <EntityModal state={modal} onClose={() => setModal(null)} collection="focusLog" entityName="أسبوع" fields={focusFields} />
    </section>
  );
}
