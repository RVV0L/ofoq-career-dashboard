import { clamp, normalizeUrl } from '@/lib/utils';
import { isPreSubmit, isSubmitted } from '@/lib/pipeline';

export const DEFAULT_WEIGHTS = { gpa: 25, ccna: 20, projects: 20, cv: 15, prep: 10, apps: 10 };

export const FACTORS = [
  { key: 'gpa', ar: 'المعدل التراكمي', en: 'GPA' },
  { key: 'ccna', ar: 'إنجاز CCNA', en: 'CCNA progress' },
  { key: 'projects', ar: 'مشاريع منشورة (GitHub + Demo)', en: 'Published projects' },
  { key: 'cv', ar: 'جاهزية CV وLinkedIn', en: 'CV & LinkedIn readiness' },
  { key: 'prep', ar: 'تحضير المقابلات', en: 'Interview prep' },
  { key: 'apps', ar: 'التقديمات المرسلة', en: 'Applications sent' },
];

const ARD = ['', 'الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'];
const ordEn = (n) => (n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`);
const fmtGain = (g) => (g >= 1 ? `${Math.round(g)}%` : g >= 0.1 ? `${g.toFixed(1)}%` : '<1%');

/**
 * درجة الجاهزية = Σ (وزن العامل × نسبة تحققه) ÷ Σ الأوزان.
 * كل عامل نسبته 0–100، وتُرجع الدالة أيضاً أكبر الفجوات مرتبة حسب أثرها على الدرجة.
 */
export function computeReadiness({ gpa, scale, skills, projects, cvs, interviews, cheatSheet, applications, settings }) {
  const W = { ...DEFAULT_WEIGHTS, ...(settings.weights ?? {}) };
  const sumW = Object.values(W).reduce((a, b) => a + (Number(b) || 0), 0) || 1;
  const projectsTarget = Math.max(settings.projectsTarget || 3, 1);
  const appsTarget = Math.max(settings.applicationsTarget || 5, 1);
  const prepTarget = Math.max(settings.prepTarget || 15, 1);
  const linkedin = clamp(Number(settings.linkedinPct ?? 0), 0, 100);

  const ccna = skills.find((k) => /ccna/i.test(k.name));
  const ccnaPct = clamp(ccna?.level ?? 0, 0, 100);
  const published = projects.filter((p) => normalizeUrl(p.github) && normalizeUrl(p.demo));
  const unpublished = projects.filter((p) => !(normalizeUrl(p.github) && normalizeUrl(p.demo)));
  const cvHasFile = cvs.some((c) => c.files?.length > 0);
  const cvReady = cvHasFile ? 100 : cvs.length ? 40 : 0;
  const qa = interviews.reduce((n, i) => n + (i.qa?.length ?? 0), 0);
  const prepCount = qa + cheatSheet.length;
  const sent = applications.filter(isSubmitted).length;

  const pct = {
    gpa: scale ? clamp(gpa / scale, 0, 1) * 100 : 0,
    ccna: ccnaPct,
    projects: clamp(published.length / projectsTarget, 0, 1) * 100,
    cv: (cvReady + linkedin) / 2,
    prep: clamp(prepCount / prepTarget, 0, 1) * 100,
    apps: clamp(sent / appsTarget, 0, 1) * 100,
  };
  const detail = {
    gpa: `${gpa.toFixed(2)} / ${scale}`,
    ccna: `${Math.round(ccnaPct)}%`,
    projects: `${published.length} / ${projectsTarget}`,
    cv: `CV ${cvReady}% · LinkedIn ${Math.round(linkedin)}%`,
    prep: `${prepCount} / ${prepTarget}`,
    apps: `${sent} / ${appsTarget}`,
  };

  const rows = FACTORS.map((f) => ({
    ...f,
    weight: Number(W[f.key]) || 0,
    share: ((Number(W[f.key]) || 0) / sumW) * 100,
    pct: pct[f.key],
    points: (pct[f.key] * (Number(W[f.key]) || 0)) / sumW,
    detail: detail[f.key],
  }));
  const total = rows.reduce((a, r) => a + r.points, 0);

  // الأثر على الدرجة لو تحسّن عامل من نسبته الحالية إلى newPct
  const gainOf = (key, newPct) => ((clamp(newPct, 0, 100) - pct[key]) * (Number(W[key]) || 0)) / sumW;
  const gaps = [];
  const add = (key, gain, ar, en) => {
    if (gain > 0.05) gaps.push({ key, gain, ar, en, label: fmtGain(gain), arFull: `${ar} ← يرفع الجاهزية ≈ ${fmtGain(gain)}`, enFull: `${en} → adds ≈ ${fmtGain(gain)} to readiness` });
  };

  if (published.length < projectsTarget) {
    const g = gainOf('projects', ((published.length + 1) / projectsTarget) * 100);
    if (unpublished.length) {
      const t = unpublished[0].title;
      add('projects', g, `أضف رابطَي GitHub وLive Demo لمشروع «${t}» ليُحسب منشوراً`, `Add GitHub + Live Demo links to "${t}" so it counts as published`);
    } else {
      const n = published.length + 1;
      add('projects', g, `إضافة مشروع ${ARD[n] ?? n} منشور (GitHub + Demo)`, `Publish a ${ordEn(n)} project (GitHub + Demo)`);
    }
  }
  if (!cvHasFile) add('cv', gainOf('cv', (100 + linkedin) / 2), 'ارفع ملف نسخة CV جاهزة', 'Upload a finished CV file');
  if (linkedin < 100) add('cv', gainOf('cv', (cvReady + 100) / 2), `أكمل ملف LinkedIn (الحالي ${Math.round(linkedin)}%)`, `Complete your LinkedIn profile (now ${Math.round(linkedin)}%)`);
  if (ccnaPct < 100) add('ccna', gainOf('ccna', ccnaPct + 10), 'تقدّم 10% إضافية في CCNA', 'Advance another 10% in CCNA');
  if (sent < appsTarget) {
    const hasCandidate = applications.some(isPreSubmit);
    add('apps', gainOf('apps', ((sent + 1) / appsTarget) * 100),
      hasCandidate ? 'أرسل تقديماً إضافياً على إحدى الشركات الجاهزة' : 'أضف شركة مستهدفة وقدّم عليها',
      hasCandidate ? 'Submit one more application to a ready company' : 'Add a target company and apply');
  }
  if (prepCount < prepTarget) add('prep', gainOf('prep', ((prepCount + 5) / prepTarget) * 100), 'أضف 5 أسئلة مقابلات أو مفاهيم تقنية', 'Add 5 interview questions or technical concepts');
  if (pct.gpa < 100) add('gpa', gainOf('gpa', ((gpa + 0.25 * (scale / 5)) / scale) * 100), `ارفع المعدل التراكمي بمقدار ${(0.25 * (scale / 5)).toFixed(2)}`, `Raise your GPA by ${(0.25 * (scale / 5)).toFixed(2)}`);

  gaps.sort((a, b) => b.gain - a.gain);
  return { total, rows, gaps, sumW };
}
