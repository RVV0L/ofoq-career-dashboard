import { useMemo, useState } from 'react';
import {
  ExternalLink,
  Github,
  Network,
  Server,
  ShieldCheck,
  Code2,
  CheckCircle2,
  Clock,
  Target,
  Award,
  Layers,
  FolderGit2,
  Terminal,
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useMode } from '@/context/ModeContext';
import {
  CERT_STATUS,
  PROJECT_STATUS,
  SKILL_GROUPS,
  TONE,
  certFields,
  labelOf,
  projectFields,
  skillFields,
} from '@/data/schemas';
import { normalizeUrl } from '@/lib/utils';
import ProgressBar from '@/components/ui/ProgressBar';
import EntityModal from '@/components/ui/EntityModal';
import { Badge, EditButton, Empty, SectionHeader } from '@/components/ui/Controls';

const GROUP_ICON = {
  Frontend: Code2,
  Backend: Server,
  'Networking/CCNA': Network,
  'Tools & Security': ShieldCheck,
};

const PROJECT_TONE = {
  done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-500/20',
  progress: 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-500/20',
};

const PROJECT_ICON = {
  done: CheckCircle2,
  progress: Clock,
};

const CERT_ICON = {
  earned: CheckCircle2,
  progress: Clock,
  target: Target,
};

function PortfolioHero({ projects, skills, certs }) {
  const doneProjects = projects.filter((p) => p.status === 'done').length;
  const activeCerts = certs.length;

  return (
    <section
      aria-label="الملف التعريفي المهني"
      className="card relative overflow-hidden border-brand-500/20 bg-gradient-to-br from-[var(--bg-surface)] via-[var(--bg-surface)] to-brand-500/5 p-6 sm:p-8"
    >
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div className="min-w-0 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            <span>متاح للتدريب التعاوني (COOP) • الشبكات، الأمن السيبراني، وهندسة البرمجيات</span>
          </div>

          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            باسل العتيبي <span className="font-normal text-slate-400">|</span>{' '}
            <span className="text-base font-medium text-brand-600 dark:text-brand-400 sm:text-lg">
              طالب علوم حاسب • شبكات وأمن سيبراني وتطوير ويب
            </span>
          </h2>

          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            أركز على بناء أنظمة ويب حديثة وتأمين البنية التحتية للشبكات، مع الجمع بين التطبيق البرمجي العملي
            (React, Java, C++, SQL) والتحضير الاحترافي لشهادات الشبكات والأمن السيبراني (CCNA &amp; Security+).
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="badge gap-1.5 border border-slate-200 bg-slate-100/80 text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
              <Terminal size={13} className="text-brand-500" aria-hidden="true" />
              <span className="ltr-text">Computer Science Undergraduate</span>
            </span>
            <span className="badge gap-1.5 border border-slate-200 bg-slate-100/80 text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200">
              <Network size={13} className="text-emerald-500" aria-hidden="true" />
              <span className="ltr-text">Networking &amp; Security Track</span>
            </span>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-3 gap-3 sm:w-auto">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-4 py-3 text-center">
            <FolderGit2 size={18} className="mx-auto mb-1 text-brand-500" aria-hidden="true" />
            <p className="text-xl font-bold tabular-nums sm:text-2xl">{projects.length}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              مشاريع ({doneProjects} منجز)
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-4 py-3 text-center">
            <Layers size={18} className="mx-auto mb-1 text-emerald-500" aria-hidden="true" />
            <p className="text-xl font-bold tabular-nums sm:text-2xl">{skills.length}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">مهارة تقنية</p>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/60 px-4 py-3 text-center">
            <Award size={18} className="mx-auto mb-1 text-amber-500" aria-hidden="true" />
            <p className="text-xl font-bold tabular-nums sm:text-2xl">{activeCerts}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">شهادات احترافية</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Career() {
  const { skills, projects, certs } = useData();
  const { isPrivate, isPublic } = useMode();
  const [modal, setModal] = useState(null);
  const [projectFilter, setProjectFilter] = useState('all');

  const open = (kind) => (extra = {}) => setModal({ kind, ...extra });
  const close = () => setModal(null);

  const extra = [...new Set(skills.map((s) => s.group))].filter((g) => !SKILL_GROUPS.includes(g));
  const groups = [...SKILL_GROUPS, ...extra].filter((g) => isPrivate || skills.some((s) => s.group === g));
  const allGroups = [...SKILL_GROUPS, ...extra];

  const filteredProjects = useMemo(() => {
    if (projectFilter === 'all') return projects;
    return projects.filter((p) => (p.status ?? 'progress') === projectFilter);
  }, [projects, projectFilter]);

  const cfg = {
    skills: { collection: 'skills', entityName: 'مهارة', fields: skillFields({ groups: allGroups }) },
    projects: { collection: 'projects', entityName: 'مشروع', fields: projectFields },
    certs: { collection: 'certs', entityName: 'شهادة', fields: certFields },
  };

  return (
    <div className="space-y-8">
      {isPublic && <PortfolioHero projects={projects} skills={skills} certs={certs} />}

      <section aria-labelledby="projects-heading">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="projects-heading" className="text-sm font-semibold tracking-tight text-slate-600 dark:text-slate-300">
            Projects Hub — معرض المشاريع
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            {projects.length > 0 && (
              <div
                role="group"
                aria-label="تصفية المشاريع حسب الحالة"
                className="flex rounded-xl bg-slate-100 p-0.5 text-xs dark:bg-slate-800"
              >
                {[
                  ['all', `الكل (${projects.length})`],
                  ['done', `منجز (${projects.filter((p) => p.status === 'done').length})`],
                  ['progress', `قيد العمل (${projects.filter((p) => (p.status ?? 'progress') === 'progress').length})`],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setProjectFilter(val)}
                    aria-pressed={projectFilter === val}
                    className={`min-h-[32px] rounded-lg px-2.5 py-1 font-medium transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                      projectFilter === val
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {isPrivate && (
              <button
                type="button"
                onClick={() => open('projects')()}
                className="btn-primary !min-h-[36px] !px-3.5 !py-1.5 !text-xs"
              >
                + إضافة مشروع
              </button>
            )}
          </div>
        </div>

        {filteredProjects.length === 0 && (
          <div className="card">
            <Empty>{projects.length ? 'لا توجد مشاريع في هذا الفلتر.' : 'لا توجد مشاريع.'}</Empty>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {filteredProjects.map((p) => {
            const gh = normalizeUrl(p.github);
            const demo = normalizeUrl(p.demo);
            const st = p.status ?? 'progress';
            const StatusIcon = PROJECT_ICON[st] ?? Clock;

            return (
              <article
                key={p.id}
                className="card group animate-fade-up flex flex-col justify-between transition-colors duration-200 hover:border-brand-500/40"
              >
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1.5">
                      <h3 className="break-words text-base font-semibold leading-snug">{p.title}</h3>
                      <Badge tone={`gap-1 ${PROJECT_TONE[st]}`}>
                        <StatusIcon size={12} className="shrink-0" aria-hidden="true" />
                        <span>{labelOf(PROJECT_STATUS, st)}</span>
                      </Badge>
                    </div>
                    {isPrivate && <EditButton onClick={() => open('projects')({ item: p })} />}
                  </div>

                  {p.description && (
                    <p className="mt-3 break-words text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {p.description}
                    </p>
                  )}

                  {(p.tech ?? []).length > 0 && (
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {p.tech.map((t) => (
                        <span
                          key={t}
                          className="badge ltr-text border border-brand-500/15 bg-brand-50/80 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border-subtle)] pt-3.5">
                  {gh && (
                    <a
                      href={gh}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="btn-ghost !min-h-[36px] border border-[var(--border-subtle)] !px-3 !py-1.5 !text-xs"
                    >
                      <Github size={15} aria-hidden="true" /> <span className="ltr-text">GitHub</span>
                    </a>
                  )}
                  {demo && (
                    <a
                      href={demo}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="btn-primary !min-h-[36px] !px-3 !py-1.5 !text-xs"
                    >
                      <ExternalLink size={15} aria-hidden="true" /> <span className="ltr-text">Live Demo</span>
                    </a>
                  )}
                  {!gh && !demo && isPrivate && (
                    <button
                      type="button"
                      onClick={() => open('projects')({ item: p })}
                      className="text-xs text-slate-400 underline decoration-dotted hover:text-brand-500 cursor-pointer"
                    >
                      أضف رابط GitHub / Live Demo لرفع جاهزية الـ COOP
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="skills-heading">
        <SectionHeader
          title="Technical Skills — المهارات التقنية"
          onAdd={isPrivate ? open('skills') : undefined}
          addLabel="إضافة مهارة"
        />
        {skills.length === 0 && (
          <div className="card">
            <Empty>لا توجد مهارات.</Empty>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((g) => {
            const Icon = GROUP_ICON[g] ?? Code2;
            const list = skills.filter((s) => s.group === g);
            return (
              <div key={g} className="card animate-fade-up space-y-3.5">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2.5">
                  <p className="card-title !mb-0 flex items-center gap-2 !text-slate-700 dark:!text-slate-200">
                    <Icon size={16} className="text-brand-500 shrink-0" aria-hidden="true" />
                    <span className="ltr-text font-semibold">{g}</span>
                  </p>
                  <span className="text-xs text-slate-400 tabular-nums">{list.length}</span>
                </div>

                {list.length === 0 && <Empty>لا توجد مهارات في هذه المجموعة.</Empty>}
                {list.map((s) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <ProgressBar label={s.name} value={s.level} />
                    </div>
                    {isPrivate && <EditButton onClick={() => open('skills')({ item: s })} />}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="certs-heading">
        <SectionHeader
          title="Certifications — الشهادات الاحترافية"
          onAdd={isPrivate ? open('certs') : undefined}
          addLabel="إضافة شهادة"
        />
        {certs.length === 0 ? (
          <div className="card">
            <Empty>لا توجد شهادات.</Empty>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {certs.map((c) => {
              const CertIcon = CERT_ICON[c.status] ?? Award;
              return (
                <article
                  key={c.id}
                  className="card animate-fade-up flex items-center justify-between gap-3 !p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-500/20 bg-brand-500/10 text-brand-600 dark:text-brand-400">
                      <Award size={18} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="ltr-text truncate font-semibold">{c.name}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge tone={`gap-1 ${TONE[c.status]}`}>
                          <CertIcon size={11} className="shrink-0" aria-hidden="true" />
                          <span>{labelOf(CERT_STATUS, c.status)}</span>
                        </Badge>
                        {c.date && (
                          <span className="text-xs text-slate-500 tabular-nums">{c.date}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isPrivate && <EditButton onClick={() => open('certs')({ item: c })} />}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {modal && <EntityModal state={modal} onClose={close} {...cfg[modal.kind]} />}
    </div>
  );
}
