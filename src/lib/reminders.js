import { isPreSubmit } from '@/lib/pipeline';

export const DAY = 864e5;

/** أخضر: أكثر من 14 يوماً — أصفر: خلال 14 يوماً — أحمر: خلال 3 أيام */
export const levelFor = (ms) => (ms <= 3 * DAY ? 'red' : ms <= 14 * DAY ? 'yellow' : 'green');

export const LEVEL_TONE = {
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  yellow: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  red: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  gray: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};
export const LEVEL_LABEL = { green: 'متسع من الوقت', yellow: 'اقترب الموعد', red: 'عاجل', gray: 'انتهى' };

const ts = (v) => (v ? new Date(v).getTime() : NaN);

/**
 * التذكير الحالي لتقديم لم يُرسل بعد:
 *  opens  = ينتظر فتح البوابة | closes = البوابة مفتوحة وله موعد إغلاق
 *  closed = أُغلقت دون تقديم  | open   = فُتحت وبلا موعد إغلاق
 */
export function reminderFor(a, now) {
  if (!isPreSubmit(a)) return null;
  const o = ts(a.opensAt);
  const c = ts(a.closesAt);
  if (!Number.isNaN(o) && o > now) return { type: 'opens', ms: o - now, target: a.opensAt, level: levelFor(o - now) };
  if (!Number.isNaN(c)) {
    if (c > now) return { type: 'closes', ms: c - now, target: a.closesAt, level: levelFor(c - now) };
    return { type: 'closed', ms: 0, level: 'gray' };
  }
  if (!Number.isNaN(o)) return { type: 'open', ms: 0, level: 'yellow' };
  return null;
}

export function parts(ms) {
  const s = Math.floor(Math.max(ms, 0) / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
export function spanText(ms) {
  const { d, h, m } = parts(ms);
  return d > 0 ? `${d} يوم ${h} ساعة` : `${h} ساعة ${m} د`;
}
export function reminderText(r) {
  if (r.type === 'opens') return `يفتح خلال ${spanText(r.ms)}`;
  if (r.type === 'closes') return `يغلق خلال ${spanText(r.ms)}`;
  if (r.type === 'closed') return 'أُغلق دون تقديم';
  return 'الباب مفتوح — قدّم';
}
