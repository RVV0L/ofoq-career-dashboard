import { STAGES, appLabel } from '@/lib/pipeline';

/** تعريف حقول النماذج + قوائم الحالات لكل نوع بيانات. */

export const COURSE_STATUS = [
  { value: 'done', label: 'مكتملة' },
  { value: 'current', label: 'حالية' },
  { value: 'planned', label: 'مخططة' },
];
export const APP_STATUS = STAGES.map(({ value, label }) => ({ value, label }));
export const CERT_STATUS = [
  { value: 'earned', label: 'منجزة' },
  { value: 'progress', label: 'قيد الدراسة' },
  { value: 'target', label: 'مستهدفة' },
];
export const PROJECT_STATUS = [
  { value: 'done', label: 'منجز' },
  { value: 'progress', label: 'قيد العمل' },
];
export const SKILL_GROUPS = ['Frontend', 'Backend', 'Networking/CCNA', 'Tools & Security'];

/** مكوّنات درجة المادة: المفتاح + الاسم + الدرجة العظمى الافتراضية */
export const SCORE_PARTS = [
  { key: 'cw', label: 'أعمال السنة', max: 20 },
  { key: 'quiz', label: 'الكويزات', max: 10 },
  { key: 'mid', label: 'الميد', max: 30 },
  { key: 'final', label: 'الفاينل', max: 40 },
];
export const scoreDefaults = Object.fromEntries(SCORE_PARTS.map((p) => [`${p.key}Max`, p.max]));

export const SPRINT_COLUMNS = [
  { value: 'todo', label: 'To Do' },
  { value: 'inprogress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export const labelOf = (list, v) => list.find((o) => o.value === v)?.label ?? v;

/** ألوان الشارات حسب الحالة */
export const TONE = {
  done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  current: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  planned: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  waiting: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  monitoring: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  ready: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  assessment: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  offer: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  decision: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  applied: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  interview: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  earned: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  progress: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  target: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export const courseFields = ({ terms = [], scale = 5 } = {}) => [
  { name: 'term', label: 'الفصل الدراسي', required: true, suggestions: terms, placeholder: 'مثال: الفصل الثالث' },
  { name: 'code', label: 'رمز المادة', ltr: true, half: true, placeholder: 'CS101' },
  { name: 'hours', label: 'الساعات المعتمدة', type: 'number', required: true, min: 0, max: 30, step: 1, half: true },
  { name: 'name', label: 'اسم المادة', required: true },
  { name: 'status', label: 'الحالة', type: 'select', options: COURSE_STATUS, half: true },
  { name: 'grade', label: `الدرجة (من ${scale})`, type: 'number', min: 0, max: scale, step: 0.01, half: true, hint: 'اتركها فارغة للمواد غير المكتملة' },
  ...SCORE_PARTS.flatMap((p) => [
    { name: `${p.key}Score`, label: `${p.label} — الدرجة`, type: 'number', min: 0, step: 0.25, half: true },
    { name: `${p.key}Max`, label: `${p.label} — من`, type: 'number', min: 0, step: 1, half: true },
  ]),
  { name: 'drive', label: 'رابط Google Drive', ltr: true, placeholder: 'https://drive.google.com/...' },
  { name: 'onenote', label: 'رابط OneNote', ltr: true },
  { name: 'anki', label: 'رابط Anki', ltr: true },
];

export const sprintFields = [
  { name: 'title', label: 'المهمة', required: true },
  { name: 'column', label: 'العمود', type: 'select', options: SPRINT_COLUMNS },
];

export const skillFields = ({ groups = [] } = {}) => [
  { name: 'group', label: 'المجموعة', required: true, suggestions: [...new Set([...SKILL_GROUPS, ...groups])] },
  { name: 'name', label: 'اسم المهارة', required: true, ltr: true },
  { name: 'level', label: 'مستوى الإتقان', type: 'range', min: 0, max: 100, step: 5, default: 30 },
];

export const projectFields = [
  { name: 'title', label: 'اسم المشروع', required: true },
  { name: 'status', label: 'حالة المشروع', type: 'select', options: PROJECT_STATUS },
  { name: 'description', label: 'الوصف', type: 'textarea', rows: 3 },
  { name: 'tech', label: 'التقنيات المستخدمة', type: 'tags', ltr: true, hint: 'افصل بينها بفاصلة: React, Node.js' },
  { name: 'github', label: 'رابط GitHub', ltr: true },
  { name: 'demo', label: 'رابط Live Demo', ltr: true },
];

export const certFields = [
  { name: 'name', label: 'اسم الشهادة', required: true, ltr: true },
  { name: 'status', label: 'الحالة', type: 'select', options: CERT_STATUS, half: true },
  { name: 'date', label: 'تاريخ الحصول / الموعد', type: 'date', half: true },
];



export const focusFields = [
  { name: 'week', label: 'بداية الأسبوع', type: 'date', required: true },
  { name: 'web', label: 'تطوير الويب (ساعات)', type: 'number', min: 0, step: 0.5, half: true },
  { name: 'ccna', label: 'شبكات CCNA (ساعات)', type: 'number', min: 0, step: 0.5, half: true },
  { name: 'cv', label: 'تجهيز السيرة الذاتية (ساعات)', type: 'number', min: 0, step: 0.5 },
];

export const cheatFields = [
  { name: 'title', label: 'المفهوم / السؤال', required: true },
  { name: 'body', label: 'الشرح', type: 'textarea', rows: 6, required: true },
];

export const bugFields = [
  { name: 'title', label: 'عنوان المشكلة', required: true },
  { name: 'problem', label: 'وصف المشكلة', type: 'textarea', rows: 3 },
  { name: 'solution', label: 'كيف تم الحل', type: 'textarea', rows: 4 },
  { name: 'date', label: 'التاريخ', type: 'date' },
];

/** لون/اسم شارة المرحلة (مع نتيجة القبول/الرفض) */
export const appTone = (a) =>
  a.status === 'decision' && a.outcome ? TONE[a.outcome] : TONE[a.status];
export { appLabel };

export const INTERVIEW_TYPES = [
  { value: 'hr', label: 'تعريفية / HR' },
  { value: 'technical', label: 'تقنية' },
  { value: 'phone', label: 'هاتفية' },
  { value: 'assessment', label: 'اختبار / تقييم' },
  { value: 'panel', label: 'لجنة' },
  { value: 'other', label: 'أخرى' },
];
export const CV_FIELDS = [
  { value: 'networks', label: 'شبكات / أمن' },
  { value: 'web', label: 'تطوير ويب' },
  { value: 'general', label: 'عام' },
];
