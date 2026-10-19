export default function Sidebar({ pages, current, onNavigate }) {
  return (
    <>
      {/* سطح المكتب: شريط جانبي */}
      <nav className="hidden w-56 shrink-0 md:block">
        <ul className="sticky top-20 space-y-1">
          {pages.map(({ id, label, icon: Icon }) => {
            const active = id === current;
            return (
              <li key={id}>
                <button
                  onClick={() => onNavigate(id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* الجوال: شريط سفلي */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-slate-200 bg-white/90 py-2 backdrop-blur md:hidden dark:border-slate-800 dark:bg-slate-950/90">
        {pages.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`flex flex-col items-center gap-0.5 px-2 text-[11px] ${
              id === current ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500'
            }`}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}
