import { useState } from 'react';
import { Bell, BellOff, Moon, Sun, Lock, Globe, LogIn, LogOut, ShieldCheck } from 'lucide-react';
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
    try {
      new Notification('تم تفعيل تذكيرات التقديم', {
        body: 'ستصلك إشعارات عند اقتراب فتح أو إغلاق التقديم (ما دام التبويب مفتوحاً).',
        lang: 'ar',
        dir: 'rtl',
      });
    } catch {
      /* تجاهل */
    }
  };
  return (
    <div className="relative">
      <button
        type="button"
        onClick={click}
        aria-pressed={on}
        aria-label="تذكيرات المتصفح"
        title={on ? 'إيقاف إشعارات التذكير' : 'تفعيل إشعارات التذكير'}
        className={`btn-ghost !min-h-[40px] !min-w-[40px] !p-2 ${
          on ? 'text-brand-600 dark:text-brand-400' : ''
        }`}
      >
        {on ? <Bell size={18} aria-hidden="true" /> : <BellOff size={18} aria-hidden="true" />}
      </button>
      {msg && (
        <p
          role="alert"
          className="absolute end-0 top-full z-40 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          {msg}
        </p>
      )}
    </div>
  );
}

export default function Header() {
  const { isPrivate, toggleMode } = useMode();
  const { isOwner, cloud, openLogin, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-brand-500/20 bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <ShieldCheck size={18} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold sm:text-base">
              {isPrivate ? 'مساري الأكاديمي والمهني' : 'المعرض التقني والمهني'}
            </h1>
            <p className="hidden truncate text-[11px] text-slate-500 dark:text-slate-400 sm:block">
              {isPrivate ? 'لوحة متابعة الأهداف والتدريب التعاوني' : 'Portfolio • Projects, Skills & Certifications'}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {isOwner && (
            <button
              type="button"
              onClick={toggleMode}
              aria-label={`الوضع الحالي: ${isPrivate ? 'خاص' : 'عام'}. اضغط للتبديل`}
              className="relative flex min-h-[40px] items-center rounded-full border border-[var(--border-subtle)] bg-slate-100/90 p-1 text-xs font-medium cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-slate-800/90"
            >
              {[
                { key: true, label: 'Private', Icon: Lock },
                { key: false, label: 'Public', Icon: Globe },
              ].map(({ key, label, Icon }) => {
                const active = isPrivate === key;
                return (
                  <span key={label} className="relative z-10 flex items-center gap-1.5 px-3 py-1">
                    {active && (
                      <motion.span
                        layoutId="mode-pill"
                        className="absolute inset-0 -z-10 rounded-full bg-brand-600 shadow-sm"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon size={13} className={active ? 'text-white' : 'text-slate-500'} aria-hidden="true" />
                    <span className={`ltr-text ${active ? 'text-white font-semibold' : 'text-slate-500'}`}>
                      {label}
                    </span>
                  </span>
                );
              })}
            </button>
          )}

          {isOwner && <SyncBadge />}
          {isPrivate && <NotifyToggle />}

          {cloud && !isOwner && (
            <button
              type="button"
              onClick={openLogin}
              className="btn-ghost !min-h-[40px] gap-1.5 !px-3 text-xs"
              aria-label="تسجيل دخول المالك"
            >
              <LogIn size={16} aria-hidden="true" />
              <span className="hidden sm:inline">دخول المالك</span>
            </button>
          )}
          {cloud && isOwner && (
            <button
              type="button"
              onClick={signOut}
              className="btn-ghost !min-h-[40px] !min-w-[40px] !p-2"
              aria-label="تسجيل الخروج"
              title="تسجيل الخروج"
            >
              <LogOut size={18} aria-hidden="true" />
            </button>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
            title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
            className="btn-ghost !min-h-[40px] !min-w-[40px] !p-2"
          >
            {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}
