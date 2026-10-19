import { useMemo, useState } from 'react';
import { HardDrive, Layers, NotebookPen } from 'lucide-react';
import { useData } from '@/context/DataContext';
import { useStats } from '@/hooks/useStats';
import { COURSE_STATUS, SCORE_PARTS, TONE, courseFields, labelOf, scoreDefaults } from '@/data/schemas';
import { normalizeUrl } from '@/lib/utils';
import EntityModal from '@/components/ui/EntityModal';
import { Badge, EditButton, Empty, SectionHeader } from '@/components/ui/Controls';

const LINKS = [
  { key: 'drive', label: 'Google Drive', Icon: HardDrive },
  { key: 'onenote', label: 'OneNote', Icon: NotebookPen },
  { key: 'anki', label: 'Anki', Icon: Layers },
];

function ResourceLinks({ course }) {
  return (
    <span className="flex items-center gap-1">
      {LINKS.map(({ key, label, Icon }) => {
        const href = normalizeUrl(course[key]);
        return href ? (
          <a key={key} href={href} target="_blank" rel="noreferrer noopener" title={label} aria-label={label}
            className="rounded-lg p-1.5 text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-slate-800">
            <Icon size={16} />
          </a>
        ) : (
          <span key={key} title={`${label} (غير مضاف)`} className="p-1.5 text-slate-300 dark:text-slate-700">
            <Icon size={16} />
          </span>
        );
      })}
    </span>
  );
}

function GpaCalculator({ courses }) {
  const s = useStats();
  const [hypo, setHypo] = useState({});
  const open = courses.filter((c) => c.status !== 'done');

  const expected = useMemo(() => {
    let qp = s.baseQualityPoints;
    let h = s.baseGradedHours;
    for (const c of open) {
      const g = parseFloat(hypo[c.id]);
      if (!Number.isNaN(g)) { qp += Math.min(Math.max(g, 0), s.scale) * c.hours; h += c.hours; }
    }
    return h ? qp / h : 0;
  }, [hypo, open, s]);

  if (open.length === 0) return null;
  return (
    <section className="card">
      <p className="card-title">حاسبة المعدل المتوقع</p>
      <p className="mb-3 text-xs text-slate-500">أدخل الدرجة المتوقعة (من {s.scale}) للمواد الحالية والمخططة لترى معدلك التراكمي المتوقع.</p>
      <ul className="space-y-2">
        {open.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
            <span><span className="ltr-text font-mono text-xs text-slate-500">{c.code}</span> · {c.name} <span className="text-slate-400">({c.hours} س)</span></span>
            <input type="number" min={0} max={s.scale} step={0.01} value={hypo[c.id] ?? ''} placeholder="—"
              onChange={(e) => setHypo((h) => ({ ...h, [c.id]: e.target.value }))}
              className="input !w-24 text-center" aria-label={`الدرجة المتوقعة لمادة ${c.name}`} />
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-between rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800">
        <span>الحالي (من المواد): <b className="tabular-nums">{s.autoGpa.toFixed(2)}</b></span>
        <span>المتوقع: <b className="text-brand-600 tabular-nums dark:text-brand-400">{expected.toFixed(2)}</b></span>
      </div>
    </section>
  );
}

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
const fmt = (n) => (Number.isInteger(n) ? n : n.toFixed(2).replace(/\.?0+$/, ''));

/** مجموع درجات المادة: مجموع المُدخَل من الدرجات ÷ مجموع الدرجات العظمى لكل المكوّنات */
function totals(c) {
  const parts = SCORE_PARTS.map((p) => ({
    ...p,
    score: num(c[`${p.key}Score`]),
    max: num(c[`${p.key}Max`]) ?? p.max,
  }));
  const entered = parts.filter((p) => p.score !== null);
  return {
    parts,
    score: entered.reduce((a, p) => a + p.score, 0),
    max: parts.reduce((a, p) => a + p.max, 0),
    any: entered.length > 0,
    graded: entered.reduce((a, p) => a + p.max, 0), // الدرجة العظمى للمكوّنات التي صدرت نتيجتها
  };
}

function termKind(list) {
  if (list.some((c) => c.status === 'current')) return 'current';
  if (list.some((c) => c.status === 'planned')) return 'next';
  return 'done';
}
const KIND = {
  current: { label: 'الترم الحالي', tone: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  next: { label: 'الترم القادم', tone: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  done: { label: 'منتهي', tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
};
const TABS = [
  { id: 'active', label: 'الحالي والقادم' },
  { id: 'done', label: 'المنتهية' },
  { id: 'all', label: 'الكل' },
];

export default function Academic() {
  const { courses } = useData();
  const s = useStats();
  const [modal, setModal] = useState(null);
  const [tab, setTab] = useState('active');

  const terms = [...new Set(courses.map((c) => c.term))];
  const fields = courseFields({ terms, scale: s.scale });
  const groups = terms.map((term) => {
    const list = courses.filter((c) => c.term === term);
    return { term, list, kind: termKind(list) };
  });
  const rank = { current: 0, next: 1, done: 2 };
  const shown = groups
    .filter((g) => (tab === 'all' ? true : tab === 'done' ? g.kind === 'done' : g.kind !== 'done'))
    .sort((a, b) => rank[a.kind] - rank[b.kind]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="الخطة الدراسية"
        onAdd={() => setModal({ defaults: { status: 'planned', hours: 3, term: terms.at(-1) ?? '', ...scoreDefaults } })}
        addLabel="إضافة مادة"
      />

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 text-sm dark:bg-slate-800" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`flex-1 rounded-lg px-3 py-1.5 font-medium transition ${tab === t.id ? 'bg-white shadow-sm dark:bg-slate-700' : 'text-slate-500'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {courses.length === 0 && <div className="card"><Empty>لم تُضف أي مادة بعد.</Empty></div>}
      {courses.length > 0 && shown.length === 0 && <div className="card"><Empty>لا توجد فصول في هذا التبويب.</Empty></div>}

      {shown.map(({ term, list, kind }) => (
        <section key={term} className="card animate-fade-up">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="card-title !mb-0">{term}</p>
              <Badge tone={KIND[kind].tone}>{KIND[kind].label}</Badge>
            </div>
            <span className="text-xs text-slate-400">{list.reduce((a, c) => a + (c.hours || 0), 0)} ساعة</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="text-xs text-slate-500">
                <tr>
                  <th className="py-2 text-start font-medium">المادة</th>
                  <th className="text-start font-medium">س</th>
                  {SCORE_PARTS.map((p) => <th key={p.key} className="text-center font-medium">{p.label}</th>)}
                  <th className="text-center font-medium">المجموع</th>
                  <th className="text-start font-medium">الحالة</th>
                  <th className="text-start font-medium">الروابط</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {list.map((c) => {
                  const t = totals(c);
                  const pct = t.graded ? (t.score / t.graded) * 100 : 0;
                  return (
                    <tr key={c.id}>
                      <td className="py-2.5">
                        <span className="ltr-text font-mono text-xs text-slate-500">{c.code}</span> · {c.name}
                      </td>
                      <td className="text-slate-500">{c.hours}</td>
                      {t.parts.map((p) => (
                        <td key={p.key} className="text-center tabular-nums">
                          <bdi dir="ltr">
                            {p.score === null ? <span className="text-slate-300 dark:text-slate-600">— / {p.max}</span> : <>{fmt(p.score)}<span className="text-slate-400"> / {p.max}</span></>}
                          </bdi>
                        </td>
                      ))}
                      <td className="text-center">
                        {t.any ? (
                          <span className="inline-block min-w-[4.5rem]">
                            <bdi dir="ltr"><b className="tabular-nums">{fmt(t.score)}</b><span className="text-slate-400 tabular-nums"> / {t.max}</span></bdi>
                            <span className="mt-1 block h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                              <span className="block h-full rounded-full bg-brand-500" style={{ width: `${Math.min(pct, 100)}%` }} />
                            </span>
                          </span>
                        ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                      <td><Badge tone={TONE[c.status]}>{labelOf(COURSE_STATUS, c.status)}</Badge></td>
                      <td><ResourceLinks course={c} /></td>
                      <td><EditButton onClick={() => setModal({ item: c })} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <p className="text-xs text-slate-400">المجموع = مجموع الدرجات المُدخلة ÷ مجموع الدرجات العظمى (أعمال السنة + الكويزات + الميد + الفاينل). عدّل الدرجات من قلم كل مادة.</p>

      <GpaCalculator courses={courses} />

      <EntityModal state={modal} onClose={() => setModal(null)} collection="courses" entityName="مادة" fields={fields} />
    </div>
  );
}
