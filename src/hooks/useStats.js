import { useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { computeReadiness } from '@/lib/readiness';

/**
 * كل المؤشرات المحسوبة. القيم اليدوية (override) للمعدل والساعات تتقدّم على الحساب التلقائي.
 * درجة COOP لم تعد رقماً ثابتاً: تُحسب بأوزان قابلة للتعديل (lib/readiness.js) وتُرجَع في `readiness`.
 */
export function useStats() {
  const { courses, skills, projects, cvs, interviews, cheatSheet, applications, settings } = useData();

  return useMemo(() => {
    const scale = settings.gpaScale || 5;
    const total = settings.totalHours || 1;

    const graded = courses.filter((c) => c.status === 'done' && c.grade != null);
    const gradedHours = graded.reduce((s, c) => s + (c.hours || 0), 0);
    const autoGpa = gradedHours ? graded.reduce((s, c) => s + c.grade * c.hours, 0) / gradedHours : 0;
    const autoDone = courses.filter((c) => c.status === 'done').reduce((s, c) => s + (c.hours || 0), 0);

    const gpa = settings.gpaOverride ?? autoGpa;
    const doneHours = settings.doneHoursOverride ?? autoDone;
    const remaining = Math.max(total - doneHours, 0);

    const readiness = computeReadiness({ gpa, scale, skills, projects, cvs, interviews, cheatSheet, applications, settings });

    return {
      scale, total,
      gpa, autoGpa, gpaManual: settings.gpaOverride != null,
      doneHours, autoDone, remaining, hoursManual: settings.doneHoursOverride != null,
      coop: readiness.total,
      readiness,
      baseQualityPoints: graded.reduce((s, c) => s + c.grade * c.hours, 0),
      baseGradedHours: gradedHours,
    };
  }, [courses, skills, projects, cvs, interviews, cheatSheet, applications, settings]);
}
