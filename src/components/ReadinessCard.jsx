import { Lightbulb, SlidersHorizontal } from 'lucide-react';
import { useStats } from '@/hooks/useStats';
import ProgressBar from '@/components/ui/ProgressBar';

/** درجة COOP Readiness الشفافة: كل عامل بوزنه ونسبته ومساهمته + قائمة "وش ينقصني؟" */
export default function ReadinessCard({ onEdit }) {
  const { readiness: r } = useStats();
  const off = Math.round(r.sumW) !== 100;

  return (
    <section className="card space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="card-title !mb-0">COOP Readiness Score</p>
          <p className="text-xs text-slate-500">كل عامل بوزنه — الدرجة = مجموع (الوزن × نسبة تحقق العامل)</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-4xl font-bold tabular-nums" aria-label={`الدرجة ${Math.round(r.total)} بالمئة`}>{Math.round(r.total)}%</p>
          <button className="btn-ghost border border-slate-200 dark:border-slate-700" onClick={onEdit}><SlidersHorizontal size={15} /> الأوزان</button>
        </div>
      </div>

      <ProgressBar value={r.total} showValue={false} />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-xs text-slate-500">
            <tr>
              <th className="py-1.5 text-start font-medium">العامل</th>
              <th className="text-center font-medium">الوزن</th>
              <th className="w-[34%] text-start font-medium">تحققك</th>
              <th className="text-end font-medium">المساهمة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {r.rows.map((x) => (
              <tr key={x.key}>
                <td className="py-2.5">
                  <p className="font-medium">{x.ar}</p>
                  <p className="text-[11px] text-slate-400" dir="ltr">{x.en} · {x.detail}</p>
                </td>
                <td className="text-center tabular-nums text-slate-500">{x.weight}%</td>
                <td className="pe-4"><ProgressBar value={x.pct} /></td>
                <td className="text-end font-semibold tabular-nums"><bdi dir="ltr">+{x.points.toFixed(1)}</bdi></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 text-xs text-slate-500 dark:border-slate-700">
              <td className="pt-2">المجموع</td>
              <td className="pt-2 text-center tabular-nums">{r.sumW}%</td>
              <td />
              <td className="pt-2 text-end font-semibold tabular-nums text-slate-800 dark:text-slate-100">{r.total.toFixed(1)}</td>
            </tr>
          </tfoot>
        </table>
        {off && <p className="mt-2 text-xs text-amber-600">مجموع الأوزان {r.sumW}% وليس 100%، لذلك تُطبَّع الأوزان تلقائياً (كل وزن ÷ المجموع).</p>}
      </div>

      <div>
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Lightbulb size={16} className="text-amber-500" /> وش ينقصني؟ <span className="font-normal text-slate-400" dir="ltr">What am I missing?</span></p>
        {r.gaps.length === 0 ? (
          <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">كل العوامل مكتملة. أحسنت! · All factors are complete.</p>
        ) : (
          <ol className="space-y-2" data-testid="gaps">
            {r.gaps.slice(0, 5).map((g, i) => (
              <li key={`${g.key}-${i}`} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p>{g.ar} ← يرفع الجاهزية ≈ <bdi dir="ltr">{g.label}</bdi></p>
                  <p className="mt-0.5 text-xs text-slate-500" dir="ltr" lang="en">{g.enFull}</p>
                </div>
                <span className="badge shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" dir="ltr">+{g.label}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
