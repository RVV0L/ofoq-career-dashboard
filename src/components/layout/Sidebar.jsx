export default function Sidebar({ pages, current, onNavigate }) {
  return (
    <>
      <nav aria-label="التنقل الرئيسي" className="hidden w-56 shrink-0 md:block">
        <ul className="sticky top-20 space-y-1.5">
          {pages.map(({ id, label, icon: Icon }) => {
            const active = id === current;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onNavigate(id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-[42px] w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                    active
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <Icon size={18} className="shrink-0" aria-hidden="true" />
                  <span className="truncate">{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav
        aria-label="التنقل السفلي للجوال"
        className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-slate-200/90 bg-white/95 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden dark:border-slate-800 dark:bg-slate-950/95"
      >
        {pages.map(({ id, label, icon: Icon }) => {
          const active = id === current;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-[48px] min-w-[64px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                active
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon size={20} className="shrink-0" aria-hidden="true" />
              <span className="max-w-full truncate">{label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
