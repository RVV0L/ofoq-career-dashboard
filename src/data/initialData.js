import { daysFromNow, weekStart } from '@/lib/time';
import { scoreDefaults } from '@/data/schemas';

/**
 * بيانات أولية تجريبية (أرقام ومواعيد وروابط تقديرية) — عدّلها من الواجهة مباشرة.
 * مواعيد فتح التقديم أدناه مجرد أمثلة نسبية لتاريخ أول تشغيل، وليست مواعيد رسمية.
 */
const sc = (cw, quiz, mid, fin) => ({
  ...scoreDefaults, cwScore: cw, quizScore: quiz, midScore: mid, finalScore: fin,
});

export const initialData = {
  settings: {
    totalHours: 132,
    gpaScale: 5,
    // null = حساب تلقائي، رقم = قيمة يدوية
    gpaOverride: null,
    doneHoursOverride: null,
    coopOverride: null, // لم يعد مستخدماً: الدرجة تُحسب بأوزان شفافة (انظر lib/readiness.js)
    // أوزان درجة COOP Readiness (قابلة للتعديل؛ تُطبَّع تلقائياً إن لم يكن مجموعها 100)
    weights: { gpa: 25, ccna: 20, projects: 20, cv: 15, prep: 10, apps: 10 },
    projectsTarget: 3,     // عدد المشاريع المنشورة المستهدف
    applicationsTarget: 5, // عدد التقديمات المستهدف إرسالها
    prepTarget: 15,        // أسئلة مقابلات + مفاهيم مستهدفة
    linkedinPct: 40,       // جاهزية LinkedIn (يدوي)
    notifyEnabled: false,  // إشعارات المتصفح للتذكيرات
  },
  courses: [
    { id: 'c1', term: 'الفصل الأول', code: 'CS101', name: 'مقدمة في البرمجة', hours: 3, status: 'done', grade: 4.75, drive: '', onenote: '', anki: '', ...sc(19, 9, 28, 38) },
    { id: 'c2', term: 'الفصل الأول', code: 'MATH101', name: 'التفاضل والتكامل', hours: 3, status: 'done', grade: 4.5, drive: '', onenote: '', anki: '', ...sc(18, 8, 26, 36) },
    { id: 'c3', term: 'الفصل الحالي', code: 'NET201', name: 'شبكات الحاسب', hours: 3, status: 'current', grade: null, drive: '', onenote: '', anki: '', ...sc(15, 7, 24, null) },
    { id: 'c4', term: 'الفصل الحالي', code: 'CS201', name: 'هياكل البيانات', hours: 3, status: 'current', grade: null, drive: '', onenote: '', anki: '', ...sc(16, 8, null, null) },
    { id: 'c5', term: 'الفصل القادم', code: 'DB301', name: 'قواعد البيانات', hours: 3, status: 'planned', grade: null, drive: '', onenote: '', anki: '', ...sc(null, null, null, null) },
    { id: 'c6', term: 'الفصل القادم', code: 'SEC301', name: 'أمن المعلومات', hours: 3, status: 'planned', grade: null, drive: '', onenote: '', anki: '', ...sc(null, null, null, null) },
  ],
  sprints: [
    { id: 's1', title: 'مراجعة فصل الشبكات (OSI)', column: 'todo' },
    { id: 's2', title: 'تحديث السيرة الذاتية', column: 'inprogress' },
    { id: 's3', title: 'التقديم على 3 شركات', column: 'done' },
  ],
  skills: [
    { id: 'k1', group: 'Frontend', name: 'React', level: 45 },
    { id: 'k2', group: 'Frontend', name: 'Tailwind CSS', level: 55 },
    { id: 'k3', group: 'Frontend', name: 'HTML / CSS', level: 70 },
    { id: 'k4', group: 'Backend', name: 'Java', level: 50 },
    { id: 'k5', group: 'Backend', name: 'C++', level: 60 },
    { id: 'k6', group: 'Backend', name: 'SQL', level: 55 },
    { id: 'k7', group: 'Networking/CCNA', name: 'CCNA', level: 40 },
    { id: 'k8', group: 'Networking/CCNA', name: 'Subnetting', level: 50 },
    { id: 'k9', group: 'Networking/CCNA', name: 'Routing & Switching', level: 35 },
    { id: 'k10', group: 'Tools & Security', name: 'Wireshark', level: 55 },
    { id: 'k11', group: 'Tools & Security', name: 'Kali Linux', level: 35 },
    { id: 'k12', group: 'Tools & Security', name: 'Git / GitHub', level: 50 },
  ],
  projects: [
    { id: 'p1', title: 'موقع تتبع المسار الأكاديمي والمهني', status: 'progress', description: 'لوحة خاصة لمتابعة الدراسة والمهارات والتقديمات، مع وضع عام كمعرض أعمال.', tech: ['React', 'Tailwind CSS', 'Recharts', 'Framer Motion'], github: '', demo: '' },
    { id: 'p2', title: 'مشروع النادي الرياضي', status: 'done', description: 'نظام لإدارة اشتراكات النادي والمواعيد.', tech: ['Java', 'SQL'], github: '', demo: '' },
  ],
  certs: [{ id: 'ct1', name: 'CCNA', status: 'progress', date: '' }],
  applications: [
    { id: 'a1', company: 'STC', role: 'Network Engineer Intern', status: 'applied', outcome: '', date: '2026-10-01', portalUrl: '', opensAt: '', closesAt: '', contact: '', notes: '', cvId: 'cv1', files: [] },
    { id: 'a2', company: 'Aramco', role: 'IT Co-op Student', status: 'monitoring', outcome: '', date: '', portalUrl: '', opensAt: daysFromNow(5), closesAt: daysFromNow(35), contact: '', notes: '', cvId: '', files: [] },
    { id: 'a3', company: 'Elm', role: 'Software Engineering Co-op', status: 'monitoring', outcome: '', date: '', portalUrl: '', opensAt: daysFromNow(19), closesAt: daysFromNow(49), contact: '', notes: '', cvId: '', files: [] },
    { id: 'a4', company: 'SDAIA', role: 'Data & AI Co-op', status: 'ready', outcome: '', date: '', portalUrl: '', opensAt: daysFromNow(-2), closesAt: daysFromNow(12), contact: '', notes: '', cvId: 'cv2', files: [] },
    { id: 'a5', company: 'SITE', role: 'Cybersecurity Co-op', status: 'monitoring', outcome: '', date: '', portalUrl: '', opensAt: daysFromNow(47), closesAt: '', contact: '', notes: '', cvId: '', files: [] },
  ],
  cvs: [
    { id: 'cv1', name: 'CV — شبكات وأمن', field: 'networks', notes: 'يركّز على CCNA وWireshark والمختبرات.', files: [], updatedAt: '2026-10-01' },
    { id: 'cv2', name: 'CV — تطوير ويب', field: 'web', notes: 'يركّز على React والمشاريع المنشورة.', files: [], updatedAt: '2026-10-01' },
  ],
  interviews: [
    {
      id: 'i1', appId: '', company: 'مثال (احذفه)', date: '2026-10-05', type: 'technical', notes: 'مثال لتوضيح الشكل فقط.',
      qa: [
        { id: 'q1', q: 'ما الفرق بين TCP و UDP؟ ومتى تستخدم كلاً منهما؟', a: 'TCP موثوق ومتصل ويضمن الترتيب، وUDP أسرع بلا ضمان.', improve: 'أذكر أمثلة (HTTP / DNS / البث) وآلية المصافحة الثلاثية.', tags: ['Networking', 'TCP'] },
      ],
    },
  ],
  focusLog: [
    { id: 'f1', week: weekStart(5), web: 10, ccna: 4, cv: 0 },
    { id: 'f2', week: weekStart(4), web: 8, ccna: 6, cv: 1 },
    { id: 'f3', week: weekStart(3), web: 12, ccna: 5, cv: 0 },
    { id: 'f4', week: weekStart(2), web: 9, ccna: 8, cv: 2 },
    { id: 'f5', week: weekStart(1), web: 6, ccna: 10, cv: 3 },
    { id: 'f6', week: weekStart(0), web: 7, ccna: 9, cv: 2 },
  ],
  cheatSheet: [
    { id: 'h1', title: 'طبقات OSI', body: 'Physical, Data Link, Network, Transport, Session, Presentation, Application.' },
  ],
  bugLog: [
    { id: 'b1', title: 'مثال مشكلة', problem: 'وصف المشكلة', solution: 'كيف تم حلها', date: '2026-10-01' },
  ],
};
