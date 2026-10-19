import { useState } from 'react';
import { ExternalLink, Github, Network, Server, ShieldCheck, Code2 } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useMode } from '@/context/ModeContext';
import { CERT_STATUS, PROJECT_STATUS, SKILL_GROUPS, TONE, certFields, labelOf, projectFields, skillFields } from '@/data/schemas';
import { normalizeUrl } from '@/lib/utils';
import ProgressBar from '@/components/ui/ProgressBar';
import EntityModal from '@/components/ui/EntityModal';
import { Badge, EditButton, Empty, SectionHeader } from '@/components/ui/Controls';

const GROUP_ICON = { Frontend: Code2, Backend: Server, 'Networking/CCNA': Network, 'Tools & Security': ShieldCheck };
const PROJECT_TONE = {
  done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  progress: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
};

export default function Career() {
  const { skills, projects, certs } = useData();
  const { isPrivate } = useMode(); // أزرار التعديل تظهر في الوضع الخاص فقط
  const [modal, setModal] = useState(null); // { kind, item?, defaults? }
  const open = (kind) => (extra = {}) => setModal({ kind, ...extra });
  const close = () => setModal(null);

  // المجموعات الأربع بترتيب ثابت ثم أي مجموعة مخصصة أضافها المستخدم
  const extra = [...new Set(skills.map((s) => s.group))].filter((g) => !SKILL_GROUPS.includes(g));
  const groups = [...SKILL_GROUPS, ...extra].filter((g) => isPrivate || skills.some((s) => s.group === g));
  const allGroups = [...SKILL_GROUPS, ...extra];

  const cfg = {
    skills: { collection: 'skills', entityName: 'مهارة', fields: skillFields({ groups: allGroups }) },
    projects: { collection: 'projects', entityName: 'مشروع', fields: projectFields },
    certs: { collection: 'certs', entityName: 'شهادة', fields: certFields },
  };

  return (
    <div className="space-y-8">
      {/* المشاريع */}
      <section>
        <SectionHeader title="Projects Hub" onAdd={isPrivate ? open('projects') : undefined} addLabel="إضافة مشروع" />
        {projects.length === 0 && <div className="card"><Empty>لا توجد مشاريع.</Empty></div>}
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => {
            const gh = normalizeUrl(p.github);
            const demo = normalizeUrl(p.demo);
            const st = p.status ?? 'progress';
            return (
              <article key={p.id} className="card group animate-fade-up flex flex-col transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{p.title}</h3>
                    <Badge tone={PROJECT_TONE[st]}>{labelOf(PROJECT_STATUS, st)}</Badge>
                  </div>
                  {isPrivate && <EditButton onClick={() => open('projects')({ item: p })} />}
                </div>
                {p.description && <p className="mt-2 text-sm text-slate-500">{p.description}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(p.tech ?? []).map((t) => (
                    <span key={t} className="badge ltr-text bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">{t}</span>
                  ))}
                </div>
                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  {gh && <a href={gh} target="_blank" rel="noreferrer noopener" className="btn-ghost !px-2.5 !py-1.5"><Github size={16} /> GitHub</a>}
                  {demo && <a href={demo} target="_blank" rel="noreferrer noopener" className="btn-ghost !px-2.5 !py-1.5"><ExternalLink size={16} /> Live Demo</a>}
                  {!gh && !demo && isPrivate && (
                    <button onClick={() => open('projects')({ item: p })} className="text-xs text-slate-400 underline decoration-dotted">أضف رابط GitHub / Live Demo</button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* المهارات */}
      <section>
        <SectionHeader title="Technical Skills" onAdd={isPrivate ? open('skills') : undefined} addLabel="إضافة مهارة" />
        {skills.length === 0 && <div className="card"><Empty>لا توجد مهارات.</Empty></div>}
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((g) => {
            const Icon = GROUP_ICON[g] ?? Code2;
            const list = skills.filter((s) => s.group === g);
            return (
              <div key={g} className="card animate-fade-up space-y-3">
                <p className="card-title !mb-0 flex items-center gap-2 !text-slate-700 dark:!text-slate-200">
                  <Icon size={16} className="text-brand-500" /> <span className="ltr-text">{g}</span>
                </p>
                {list.length === 0 && <Empty>لا توجد مهارات في هذه المجموعة.</Empty>}
                {list.map((s) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <div className="flex-1"><ProgressBar label={s.name} value={s.level} /></div>
                    {isPrivate && <EditButton onClick={() => open('skills')({ item: s })} />}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </section>

      {/* الشهادات */}
      <section>
        <SectionHeader title="Certifications" onAdd={isPrivate ? open('certs') : undefined} addLabel="إضافة شهادة" />
        <div className="card">
          {certs.length === 0 && <Empty>لا توجد شهادات.</Empty>}
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {certs.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="ltr-text font-medium">{c.name}</span>
                <span className="flex items-center gap-3">
                  {c.date && <span className="text-slate-500 tabular-nums">{c.date}</span>}
                  <Badge tone={TONE[c.status]}>{labelOf(CERT_STATUS, c.status)}</Badge>
                  {isPrivate && <EditButton onClick={() => open('certs')({ item: c })} />}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {modal && <EntityModal state={modal} onClose={close} {...cfg[modal.kind]} />}
    </div>
  );
}
