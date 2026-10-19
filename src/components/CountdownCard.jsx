import { AlarmClock, BellRing } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { fmtDateTime, useNow } from '@/lib/time';
import { LEVEL_TONE, parts, reminderFor, spanText } from '@/lib/reminders';

const CELL_TONE = {
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  yellow: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  red: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
};
const Cell = ({ n, label, tone }) => (
  <div className={`flex-1 rounded-xl py-3 text-center ${tone}`}>
    <p className="text-2xl font-bold tabular-nums sm:text-3xl">{String(n).padStart(2, '0')}</p>
    <p className="text-[11px] opacity-80">{label}</p>
  </div>
);

/** عدّاد تنازلي لأقرب موعد فتح/إغلاق + تنبيهات ملوّنة (أخضر/أصفر/أحمر) */
export default function CountdownCard() {
  const { applications } = useData();
  const now = useNow(1000);

  const items = applications.map((a) => ({ a, r: reminderFor(a, now) })).filter((x) => x.r);
  const timed = items.filter((x) => x.r.type === 'opens' || x.r.type === 'closes').sort((x, y) => x.r.ms - y.r.ms);
  const next = timed[0];
  const p = next && parts(next.r.ms);
  const urgent = timed.filter((x) => x.r.level !== 'green').slice(0, 4);
  const openNow = items.filter((x) => x.r.type === 'open');
  const closed = items.filter((x) => x.r.type === 'closed');

  return (
    <section className="card">
      <div className="mb-3 flex items-center justify-between">
        <p className="card-title !mb-0">العدّ التنازلي والتنبيهات</p>
        <AlarmClock size={18} className="text-brand-500" />
      </div>

      {next ? (
        <>
          <p className="mb-2 text-sm">
            {next.r.type === 'opens' ? 'يفتح التقديم في' : 'يغلق التقديم في'} <b><bdi>{next.a.company}</bdi></b>
            <span className="block text-xs text-slate-500"><bdi dir="ltr">{fmtDateTime(next.r.target)}</bdi> (تقديري)</span>
          </p>
          <div className="flex gap-2" role="timer" aria-label={`المتبقي لـ ${next.a.company}`}>
            <Cell n={p.d} label="يوم" tone={CELL_TONE[next.r.level]} />
            <Cell n={p.h} label="ساعة" tone={CELL_TONE[next.r.level]} />
            <Cell n={p.m} label="دقيقة" tone={CELL_TONE[next.r.level]} />
            <Cell n={p.s} label="ثانية" tone={CELL_TONE[next.r.level]} />
          </div>
        </>
      ) : (
        <p className="py-3 text-sm text-slate-500">لا توجد مواعيد قادمة. أضف تاريخ فتح/إغلاق التقديم من بطاقة الشركة في صفحة التقديمات.</p>
      )}

      {(urgent.length > 0 || openNow.length > 0 || closed.length > 0) && (
        <ul className="mt-4 space-y-2 text-sm">
          {urgent.map(({ a, r }) => (
            <li key={a.id} className={`flex items-start gap-2 rounded-xl p-2.5 ${LEVEL_TONE[r.level]}`}>
              <BellRing size={16} className="mt-0.5 shrink-0" />
              <span><b><bdi>{a.company}</bdi></b> {r.type === 'opens' ? 'يفتح' : 'يغلق'} خلال <bdi>{spanText(r.ms)}</bdi>{r.level === 'red' ? ' — عاجل' : ' — جهّز المتطلبات'}.</span>
            </li>
          ))}
          {openNow.map(({ a }) => (
            <li key={a.id} className={`flex items-start gap-2 rounded-xl p-2.5 ${LEVEL_TONE.yellow}`}>
              <BellRing size={16} className="mt-0.5 shrink-0" />
              <span>باب التقديم في <b><bdi>{a.company}</bdi></b> مفتوح — قدّم الآن.</span>
            </li>
          ))}
          {closed.map(({ a }) => (
            <li key={a.id} className={`flex items-start gap-2 rounded-xl p-2.5 ${LEVEL_TONE.gray}`}>
              <BellRing size={16} className="mt-0.5 shrink-0" />
              <span>أُغلق التقديم في <b><bdi>{a.company}</bdi></b> دون تقديم.</span>
            </li>
          ))}
        </ul>
      )}

      {timed.length > 1 && (
        <ul className="mt-4 divide-y divide-slate-100 text-xs dark:divide-slate-800">
          {timed.slice(1, 4).map(({ a, r }) => (
            <li key={a.id} className="flex justify-between py-1.5">
              <span><bdi>{a.company}</bdi> · {r.type === 'opens' ? 'يفتح' : 'يغلق'}</span>
              <span className={`badge ${LEVEL_TONE[r.level]}`}><bdi>{spanText(r.ms)}</bdi></span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
