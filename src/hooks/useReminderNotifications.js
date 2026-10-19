import { useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { isPreSubmit } from '@/lib/pipeline';
import { DAY } from '@/lib/reminders';
import { storage } from '@/services/storage';

const THRESHOLDS = [14, 3, 1, 0]; // أيام قبل الفتح/الإغلاق

/**
 * إشعارات المتصفح (Notification API). تعمل ما دام تبويب الموقع مفتوحاً،
 * ولا تُرسَل نفس العتبة مرتين (المفتاح = شركة + نوع + التاريخ + العتبة).
 */
export function useReminderNotifications() {
  const { applications, settings } = useData();
  const enabled = settings.notifyEnabled;

  useEffect(() => {
    if (!enabled || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    const check = () => {
      const now = Date.now();
      const done = new Set(storage.get('notified') ?? []);
      let changed = false;
      for (const a of applications) {
        if (!isPreSubmit(a)) continue;
        for (const [type, value] of [['opens', a.opensAt], ['closes', a.closesAt]]) {
          const t = value ? new Date(value).getTime() : NaN;
          if (Number.isNaN(t)) continue;
          const ms = t - now;
          const crossed = THRESHOLDS.filter((d) => ms <= d * DAY);
          if (!crossed.length) continue;
          const smallest = Math.min(...crossed);
          const key = (d) => `${a.id}:${type}:${value}:${d}`;
          if (done.has(key(smallest))) continue;
          crossed.forEach((d) => done.add(key(d)));
          changed = true;
          if (ms < -DAY) continue; // قديم جداً: نسجّله فقط دون إزعاج
          const left = Math.max(1, Math.ceil(ms / DAY));
          const when = smallest === 0 ? '' : left === 1 ? 'خلال يوم' : `خلال ${left} يوم`;
          const title =
            type === 'opens'
              ? smallest === 0 ? `فُتح باب التقديم في ${a.company}` : `يفتح التقديم في ${a.company} ${when}`
              : smallest === 0 ? `حان موعد إغلاق التقديم في ${a.company}` : `يغلق التقديم في ${a.company} ${when}`;
          try {
            new Notification(title, { body: a.role ? `الوظيفة: ${a.role}` : 'افتح اللوحة لمتابعة التقديم', tag: key(smallest), lang: 'ar', dir: 'rtl' });
          } catch { /* بعض المتصفحات تمنع الإنشاء المباشر */ }
        }
      }
      if (changed) storage.set('notified', [...done]);
    };

    check();
    const t = setInterval(check, 60000);
    return () => clearInterval(t);
  }, [enabled, applications]);
}
