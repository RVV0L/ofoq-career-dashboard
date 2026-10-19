import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { storage } from '@/services/storage';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { initialData } from '@/data/initialData';
import { uid } from '@/lib/utils';
import { isLegacy, normalizeApp } from '@/lib/pipeline';

const DataContext = createContext(null);

/**
 * مصدر البيانات الوحيد. كل مجموعة تُحفظ في localStorage عبر services/storage،
 * والدوال addItem / updateItem / removeItem تعمل على أي مجموعة بالاسم.
 */
export function DataProvider({ children }) {
  const [courses, setCourses] = useLocalStorage('courses', initialData.courses);
  const [sprints, setSprints] = useLocalStorage('sprints', initialData.sprints);
  const [skills, setSkills] = useLocalStorage('skills', initialData.skills);
  const [projects, setProjects] = useLocalStorage('projects', initialData.projects);
  const [certs, setCerts] = useLocalStorage('certs', initialData.certs);
  const [rawApplications, setApplications] = useLocalStorage('applications', initialData.applications);
  const [cheatSheet, setCheatSheet] = useLocalStorage('cheatSheet', initialData.cheatSheet);
  const [bugLog, setBugLog] = useLocalStorage('bugLog', initialData.bugLog);
  const [cvs, setCvs] = useLocalStorage('cvs', initialData.cvs);
  const [interviews, setInterviews] = useLocalStorage('interviews', initialData.interviews);
  const [focusLog, setFocusLog] = useLocalStorage('focusLog', initialData.focusLog);
  const [storedSettings, setSettings] = useLocalStorage('settings', initialData.settings);

  // الحالات القديمة (waiting/accepted/rejected) تُقرأ مُرحَّلة فوراً ثم تُحفظ مُرحَّلة
  const applications = useMemo(() => rawApplications.map(normalizeApp), [rawApplications]);
  useEffect(() => {
    if (rawApplications.some(isLegacy)) setApplications((l) => l.map(normalizeApp));
  }, [rawApplications, setApplications]);

  // دمج الافتراضيات حتى لا تضيع مفاتيح جديدة إذا كان المخزَّن قديماً
  const settings = useMemo(() => ({ ...initialData.settings, ...storedSettings }), [storedSettings]);

  const setters = useMemo(
    () => ({ courses: setCourses, sprints: setSprints, skills: setSkills, projects: setProjects, certs: setCerts, applications: setApplications, cheatSheet: setCheatSheet, bugLog: setBugLog, focusLog: setFocusLog, cvs: setCvs, interviews: setInterviews }),
    [setCourses, setSprints, setSkills, setProjects, setCerts, setApplications, setCheatSheet, setBugLog, setFocusLog, setCvs, setInterviews]
  );

  // ترحيل لمرة واحدة: مجموعات المهارات القديمة (عربية) -> المجموعات الأربع الجديدة
  useEffect(() => {
    if (storage.get('migrated:skillGroups')) return;
    storage.set('migrated:skillGroups', true);
    setSkills((list) =>
      list.map((k) => {
        if (k.group === 'الشبكات والأمن السيبراني')
          return { ...k, group: /kali|wireshark|nmap|security/i.test(k.name) ? 'Tools & Security' : 'Networking/CCNA' };
        if (k.group === 'البرمجة وقواعد البيانات')
          return { ...k, group: /react|html|css|tailwind|vue|javascript/i.test(k.name) ? 'Frontend' : 'Backend' };
        return k;
      })
    );
  }, [setSkills]);

  const addItem = useCallback((key, item) => setters[key]((l) => [...l, { ...item, id: uid() }]), [setters]);
  const updateItem = useCallback((key, id, patch) => setters[key]((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x))), [setters]);
  const removeItem = useCallback((key, id) => setters[key]((l) => l.filter((x) => x.id !== id)), [setters]);
  const updateSettings = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), [setSettings]);

  const value = useMemo(
    () => ({ courses, sprints, skills, projects, certs, applications, cheatSheet, bugLog, focusLog, cvs, interviews, settings, addItem, updateItem, removeItem, updateSettings }),
    [courses, sprints, skills, projects, certs, applications, cheatSheet, bugLog, focusLog, cvs, interviews, settings, addItem, updateItem, removeItem, updateSettings]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
