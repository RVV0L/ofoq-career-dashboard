export default function ProgressBar({ value, label, showValue = true }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div>
      {(label || showValue) && (
        <div className="mb-1 flex items-center justify-between text-sm">
          <bdi dir="ltr" className="font-medium">{label}</bdi>
          {showValue && <span className="text-slate-500">{Math.round(v)}%</span>}
        </div>
      )}
      <div className="progress-track">
        <div className="progress-bar" style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}
