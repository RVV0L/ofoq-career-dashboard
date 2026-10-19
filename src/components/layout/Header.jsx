import { useState } from 'react';
import { Bell, BellOff, Moon, Sun, Lock, Globe, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import SyncBadge from '@/components/auth/SyncBadge';
import { useData } from '@/context/DataContext';
import { motion } from 'framer-motion';
import { useMode } from '@/context/ModeContext';
import { useTheme } from '@/context/ThemeContext';

function NotifyToggle() {
  const { settings, updateSettings } = useData();
  const [msg, setMsg] = useState('');
  if (typeof Notification === 'undefined') return null;
  const on = settings.notifyEnabled && Notification.permission === 'granted';
  const click = async () => {
    setMsg('');
    if (on) return updateSettings({ notifyEnabled: false });
    let p = Notification.permission;
    if (p === 'default') p = await Notification.requestPermission();
    if (p !== 'granted') return setMsg('الإشعارات محظورة. فعّلها من إعدادات الموقع في المتصفح.');
    updateSettings({ notifyEnabled: true });
    try { new Notification('تم تفعيل تذكيرات التقديم', { body: 'ستصلك إشعارات عند اقتراب فتح أو إغلاق التقديم (ما دام التبويب مفتوحاً).', lang: 'ar', dir: 'rtl' }); } catch { /* تجاهل */ }
  };
  return (
    <div className="relative">
      <button onClick={click} aria-pressed={on} aria-label="تذكيرات المتصفح" title={on ? 'إيقاف إشعارات التذكير' : 'تفعيل إشعارات التذكير'} className={`btn-ghost !px-2.5 ${on ? 'text-brand-600 dark:text-brand-400' : ''}`}>
        {on ? <Bell size={18} /> : <BellOff size={18} />}
      </button>
      {msg && <p role="alert" className="absolute end-0 top-full z-40 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-2.5 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">{msg}</p>}
    </div>
  );
}

export default function Header() {
  const { isPrivate, toggleMode } = useMode();
  const { isOwner, cloud, openLogin, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <h1 className="text-base font-bold sm:text-lg">
          {isPrivate ? 'مساري الأكاديمي والمهني' : 'Portfolio'}
        </h1>

        <div className="flex items-center gap-2">
          {/* زر التبديل الرئيسي: Private / Public (للمالك فقط) */}
          {isOwner && (
            <button
              onClick={toggleMode}
              aria-label="تبديل الوضع"
              className="relative flex items-center rounded-full bg-slate-100 p-1 text-xs font-medium dark:bg-slate-800"
            >
              {[
                { key: true, label: 'Private', Icon: Lock },
                { key: false, label: 'Public', Icon: Globe },
              ].map(({ key, label, Icon }) => {
                const active = isPrivate === key;
                return (
                  <span key={label} className="relative z-10 flex items-center gap-1.5 px-3 py-1.5">
                    {active && (
                      <motion.span
                        layoutId="mode-pill"
                        className="absolute inset-0 -z-10 rounded-full bg-brand-600"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon size={14} className={active ? 'text-white' : 'text-slate-500'} />
                    <span className={active ? 'text-white' : 'text-slate-500'}>{label}</span>
                  </span>
                );
              })}
            </button>
          )}

          {isOwner && <SyncBadge />}
          {isPrivate && <NotifyToggle />}

          {cloud && !isOwner && (
            <button onClick={openLogin} className="btn-ghost gap-1.5 !px-2.5 text-xs" aria-label="تسجيل دخول المالك">
              <LogIn size={16} /> <span className="hidden sm:inline">دخول</span>
            </button>
          )}
          {cloud && isOwner && (
            <button onClick={signOut} className="btn-ghost !px-2.5" aria-label="تسجيل الخروج" title="تسجيل الخروج">
              <LogOut size={18} />
            </button>
          )}

          <button onClick={toggleTheme} aria-label="تبديل الثيم" className="btn-ghost !px-2.5">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
