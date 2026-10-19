import { useState } from 'react';
import { Award, BookOpenCheck, Briefcase, FolderCheck, Network, Rocket } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useStats } from '@/hooks/useStats';
import { appLabel, isSubmitted, stageIndex } from '@/lib/pipeline';
import { appTone } from '@/data/schemas';
import ProgressBar from '@/components/ui/ProgressBar';
import FormModal from '@/components/ui/FormModal';
import { Badge, EditButton, Empty } from '@/components/ui/Controls';
import Kanban from '@/components/Kanban';
import FocusChart from '@/components/FocusChart';
import CountdownCard from '@/components/CountdownCard';
import ReminderChip from '@/components/ReminderChip';
import ReadinessCard from '@/components/ReadinessCard';
import ReadinessEditor from '@/components/ReadinessEditor';

function Kpi({ icon: Icon, title, value, hint, manual, onEdit, children }) {
  return (
    <div className="card animate-fade-up">
      <div className="flex items-start justify-between">
        <p className="card-title">{title}</p>
        <div className="-mt-1 -ms-1 flex items-center gap-1">
          {manual && <Badge tone="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">يدوي</Badge>}
          <Icon size={18} className="text-brand-500" />
          {onEdit && <EditButton onClick={onEdit} />}
        </div>
      </div>
      <p className="text-3xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {children}
    </div>
  );
}

export default function Dashboard() {
  const s = useStats();
  const { settings, updateSettings, skills, updateItem, addItem, applications, projects } = useData();
  const [editing, setEditing] = useState(null);

  // CCNA: مصدرها مهارة باسم CCNA (مصدر واحد للحقيقة مع صفحة المهارات)
  const ccna = skills.find((k) => /ccna/i.test(k.name));
  const ccnaLevel = ccna?.level ?? 0;

  const targets = applications.length;
  const applied = applications.filter(isSubmitted).length;
  const interviews = applications.filter((a) => stageIndex(a.status) >= 3).length;
  const done = projects.filter((p) => p.status === 'done').length;

  const forms = {
    ccna: {
      title: 'تعديل نسبة إنجاز CCNA',
      fields: [{ name: 'level', label: 'نسبة الإنجاز', type: 'range', min: 0, max: 100, step: 5 }],
      initial: { level: ccnaLevel },
      onSave: (v) => (ccna ? updateItem('skills', ccna.id, { level: v.level }) : addItem('skills', { group: 'Networking/CCNA', name: 'CCNA', level: v.level })),
    },
    gpa: {
      title: 'تعديل المعدل التراكمي',
      fields: [
        { name: 'gpaOverride', label: 'المعدل (قيمة يدوية)', type: 'number', min: 0, max: s.scale, step: 0.01, hint: `اتركه فارغاً للحساب التلقائي من المواد (الحالي: ${s.autoGpa.toFixed(2)})` },
        { name: 'gpaScale', label: 'سلّم المعدل (الحد الأعلى)', type: 'number', required: true, min: 1, max: 100, step: 0.5 },
      ],
    },
    hours: {
      title: 'تعديل الساعات',
      fields: [
        { name: 'doneHoursOverride', label: 'الساعات المنجزة (قيمة يدوية)', type: 'number', min: 0, step: 1, hint: `اتركه فارغاً للحساب التلقائي من المواد المكتملة (الحالي: ${s.autoDone})` },
        { name: 'totalHours', label: 'إجمالي ساعات الخطة', type: 'number', required: true, min: 1, step: 1 },
      ],
    },
  };
  const f = editing && editing !== 'weights' && forms[editing];


  const pipeline = [...applications].sort((a, b) => stageIndex(b.status) - stageIndex(a.status));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <Kpi icon={Network} title="إنجاز CCNA" value={`${Math.round(ccnaLevel)}%`} onEdit={() => setEditing('ccna')}>
          <div className="mt-3"><ProgressBar value={ccnaLevel} showValue={false} /></div>
        </Kpi>
        <Kpi icon={Briefcase} title="حالة التقديم للـ COOP" value={`${applied} / ${targets}`}
          hint={`${targets} شركة مستهدفة · ${applied} تم التقديم · ${interviews} وصلت للتقييم أو أبعد`}>
          <div className="mt-3"><ProgressBar value={targets ? (applied / targets) * 100 : 0} showValue={false} /></div>
        </Kpi>
        <Kpi icon={FolderCheck} title="المشاريع المنجزة" value={done} hint={`من أصل ${projects.length} مشروع في المعرض`} />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Kpi icon={Award} title="المعدل التراكمي (GPA)" value={s.gpa.toFixed(2)} hint={`من ${s.scale}`} manual={s.gpaManual} onEdit={() => setEditing('gpa')} />
        <Kpi icon={BookOpenCheck} title="الساعات المنجزة / المتبقية" value={`${s.doneHours} / ${s.remaining}`} hint={`من أصل ${s.total} ساعة`} manual={s.hoursManual} onEdit={() => setEditing('hours')} />
        <Kpi icon={Rocket} title="COOP Readiness" value={`${Math.round(s.coop)}%`} hint="محسوبة بأوزان قابلة للتعديل" onEdit={() => setEditing('weights')} />
      </section>

      <ReadinessCard onEdit={() => setEditing('weights')} />

      <FocusChart />

      <section className="grid gap-4 lg:grid-cols-2">
        <CountdownCard />
        <div className="card">
          <p className="card-title">مسار التقديم على الشركات (COOP Pipeline)</p>
          {pipeline.length === 0 ? <Empty>لا توجد شركات مستهدفة بعد.</Empty> : (
            <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
              {pipeline.slice(0, 7).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="font-medium">{a.company}</span>
                  <span className="flex items-center gap-2">
                    <ReminderChip app={a} />
                    <span aria-hidden>➔</span>
                    <Badge tone={appTone(a)}>{appLabel(a)}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-500 dark:text-slate-400">Active Sprints</h2>
        <Kanban />
      </section>

      {editing === 'weights' && <ReadinessEditor onClose={() => setEditing(null)} />}

      {f && (
        <FormModal
          title={f.title}
          submitLabel="حفظ"
          fields={f.fields}
          initial={f.initial ?? settings}
          onSave={f.onSave ?? updateSettings}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
