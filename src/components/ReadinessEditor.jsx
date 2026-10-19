import { useData } from '@/context/DataContext';
import FormModal from '@/components/ui/FormModal';
import { DEFAULT_WEIGHTS } from '@/lib/readiness';

const W = (name, label) => ({ name: `w_${name}`, label: `وزن: ${label} (%)`, type: 'number', required: true, min: 0, max: 100, step: 1, half: true });

/** تعديل أوزان درجة الجاهزية وأهدافها (تُطبَّع الأوزان تلقائياً إن لم يكن مجموعها 100) */
export default function ReadinessEditor({ onClose }) {
  const { settings, updateSettings } = useData();
  const w = { ...DEFAULT_WEIGHTS, ...(settings.weights ?? {}) };
  const initial = {
    w_gpa: w.gpa, w_ccna: w.ccna, w_projects: w.projects, w_cv: w.cv, w_prep: w.prep, w_apps: w.apps,
    projectsTarget: settings.projectsTarget, applicationsTarget: settings.applicationsTarget,
    prepTarget: settings.prepTarget, linkedinPct: settings.linkedinPct,
  };
  const fields = [
    W('gpa', 'المعدل GPA'), W('ccna', 'إنجاز CCNA'), W('projects', 'مشاريع منشورة'),
    W('cv', 'CV وLinkedIn'), W('prep', 'تحضير المقابلات'), W('apps', 'التقديمات المرسلة'),
    { name: 'projectsTarget', label: 'المشاريع المنشورة المستهدفة', type: 'number', required: true, min: 1, max: 20, step: 1, half: true },
    { name: 'applicationsTarget', label: 'التقديمات المستهدف إرسالها', type: 'number', required: true, min: 1, max: 50, step: 1, half: true },
    { name: 'prepTarget', label: 'أسئلة/مفاهيم التحضير المستهدفة', type: 'number', required: true, min: 1, max: 200, step: 1, half: true },
    { name: 'linkedinPct', label: 'جاهزية LinkedIn الآن', type: 'range', min: 0, max: 100, step: 5, hint: 'تقديرك الشخصي لاكتمال الملف (الصورة، النبذة، الخبرات، المشاريع).' },
  ];
  return (
    <FormModal
      title="أوزان وأهداف درجة الجاهزية"
      submitLabel="حفظ"
      fields={fields}
      initial={initial}
      onClose={onClose}
      onSave={(v) =>
        updateSettings({
          weights: { gpa: v.w_gpa, ccna: v.w_ccna, projects: v.w_projects, cv: v.w_cv, prep: v.w_prep, apps: v.w_apps },
          projectsTarget: v.projectsTarget, applicationsTarget: v.applicationsTarget, prepTarget: v.prepTarget, linkedinPct: v.linkedinPct,
        })
      }
    />
  );
}
