import { useEffect, useState } from 'react';

/** وقت حالي يتجدّد كل ms (للعدّادات التنازلية) */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

/** المتبقي حتى target (نص datetime-local أو ISO). null إذا لم يُحدَّد موعد صالح. */
export function remaining(target, now) {
  if (!target) return null;
  const diff = new Date(target).getTime() - now;
  if (Number.isNaN(diff)) return null;
  const s = Math.floor(Math.abs(diff) / 1000);
  return {
    past: diff <= 0,
    ms: diff,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

/** "2026-10-20 09:00" — صيغة ثابتة بأرقام لاتينية (تُعرض داخل <bdi dir="ltr">) */
export function fmtDateTime(v) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`;
}

/** تاريخ على نمط datetime-local بعد n يوماً من الآن عند الساعة 9 صباحاً */
export function daysFromNow(n, hour = 9) {
  const d = new Date(Date.now() + n * 864e5);
  d.setHours(hour, 0, 0, 0);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

/** تاريخ (yyyy-mm-dd) ليوم الأحد قبل n أسبوعاً */
export function weekStart(nWeeksAgo) {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() - nWeeksAgo * 7);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
