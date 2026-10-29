export default function ProgressBar({ value, label, showValue = true }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const rounded = Math.round(v);

  return (
    <div>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
          <bdi dir="ltr" className="min-w-0 truncate font-medium">{label}</bdi>
          {showValue && <span className="shrink-0 text-xs font-medium text-slate-500 tabular-nums">{rounded}%</span>}
        </div>
      )}
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={rounded}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ? `نسبة إنجاز ${label}` : 'شريط التقدم'}
      >
        <div className="progress-bar" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
