/** مراحل التقديم (أعمدة الـ Kanban) بالترتيب */
export const STAGES = [
  { value: 'monitoring', label: 'مراقبة', en: 'Monitoring' },
  { value: 'ready', label: 'جاهز للتقديم', en: 'Ready to apply' },
  { value: 'applied', label: 'تم التقديم', en: 'Applied' },
  { value: 'assessment', label: 'تقييم / اختبار', en: 'Assessment' },
  { value: 'interview', label: 'مقابلة', en: 'Interview' },
  { value: 'offer', label: 'عرض', en: 'Offer' },
  { value: 'decision', label: 'قبول / رفض', en: 'Decision' },
];
export const STAGE_ORDER = STAGES.map((s) => s.value);
export const stageIndex = (status) => STAGE_ORDER.indexOf(status);

/** أُرسل التقديم فعلاً (من «تم التقديم» فما بعد) */
export const isSubmitted = (a) => stageIndex(a.status) >= 2;
/** لم يُرسل بعد (مراقبة / جاهز) — هي المراحل التي تخضع للتذكيرات */
export const isPreSubmit = (a) => stageIndex(a.status) < 2;

export const OUTCOMES = [
  { value: '', label: 'لم يُحسم' },
  { value: 'accepted', label: 'قبول' },
  { value: 'rejected', label: 'رفض' },
];

/** ترحيل الحالات القديمة (waiting / accepted / rejected) إلى المراحل الجديدة */
const LEGACY = {
  waiting: { status: 'monitoring' },
  accepted: { status: 'decision', outcome: 'accepted' },
  rejected: { status: 'decision', outcome: 'rejected' },
};
export const isLegacy = (a) => a.status in LEGACY;
export const normalizeApp = (a) => (isLegacy(a) ? { ...a, ...LEGACY[a.status] } : a);

export function appLabel(a) {
  if (a.status === 'decision' && a.outcome === 'accepted') return 'مقبول';
  if (a.status === 'decision' && a.outcome === 'rejected') return 'مرفوض';
  return STAGES.find((s) => s.value === a.status)?.label ?? a.status;
}
