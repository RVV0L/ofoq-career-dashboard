import { Pencil, Plus } from 'lucide-react';

export function EditButton({ onClick, label = 'تعديل' }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="btn-ghost !p-1.5">
      <Pencil size={15} />
    </button>
  );
}

export function Badge({ tone = '', children }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function Empty({ children }) {
  return <p className="py-4 text-center text-sm text-slate-400">{children}</p>;
}

/** onAdd غير ممرَّر (مثلاً في الوضع العام) = لا يظهر زر الإضافة */
export function SectionHeader({ title, onAdd, addLabel = 'إضافة' }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title}</h2>
      {onAdd && (
        <button onClick={onAdd} className="btn-primary !px-3 !py-1.5 !text-xs">
          <Plus size={14} /> {addLabel}
        </button>
      )}
    </div>
  );
}
