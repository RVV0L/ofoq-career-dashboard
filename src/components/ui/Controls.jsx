import { Pencil, Plus } from 'lucide-react';

export function EditButton({ onClick, label = 'تعديل' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="btn-ghost !min-h-[36px] !min-w-[36px] !p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
    >
      <Pencil size={15} aria-hidden="true" />
    </button>
  );
}

export function Badge({ tone = '', children }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function Empty({ children }) {
  return <p className="py-6 text-center text-sm text-slate-400">{children}</p>;
}

export function SectionHeader({ title, onAdd, addLabel = 'إضافة' }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 tracking-tight">{title}</h2>
      {onAdd && (
        <button type="button" onClick={onAdd} className="btn-primary !min-h-[36px] !px-3.5 !py-1.5 !text-xs">
          <Plus size={14} aria-hidden="true" /> {addLabel}
        </button>
      )}
    </div>
  );
}
