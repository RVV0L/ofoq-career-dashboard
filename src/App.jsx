import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, GraduationCap, Briefcase, ClipboardList } from 'lucide-react';
import { useMode } from '@/context/ModeContext';
import { useReminderNotifications } from '@/hooks/useReminderNotifications';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Dashboard from '@/pages/Dashboard';
import Academic from '@/pages/Academic';
import Career from '@/pages/Career';
import Prep from '@/pages/Prep';

/**
 * تعريف الصفحات. privateOnly = تختفي في الوضع العام.
 * (الوضع العام يعرض فقط: المهارات، المشاريع، الشهادات.)
 */
export const PAGES = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, component: Dashboard, privateOnly: true },
  { id: 'academic', label: 'المسار الأكاديمي', icon: GraduationCap, component: Academic, privateOnly: true },
  { id: 'career', label: 'المهارات والمشاريع', icon: Briefcase, component: Career, privateOnly: false },
  { id: 'prep', label: 'التقديمات والمقابلات', icon: ClipboardList, component: Prep, privateOnly: true },
];

export default function App() {
  const { isPublic } = useMode();
  useReminderNotifications();
  const [page, setPage] = useState('dashboard');

  const visiblePages = PAGES.filter((p) => !(isPublic && p.privateOnly));

  // إذا اختفت الصفحة الحالية عند التحويل للوضع العام، ننتقل لأول صفحة متاحة
  useEffect(() => {
    if (!visiblePages.some((p) => p.id === page)) setPage(visiblePages[0].id);
  }, [isPublic]); // eslint-disable-line react-hooks/exhaustive-deps

  const Current = (visiblePages.find((p) => p.id === page) ?? visiblePages[0]).component;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <Sidebar pages={visiblePages} current={page} onNavigate={setPage} />
        <main className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${isPublic ? 'public' : 'private'}-${page}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <Current />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
