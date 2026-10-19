import { useRef, useState } from 'react';
import { Download, Paperclip, X } from 'lucide-react';
import { MAX_FILE, downloadFile, putFile } from '@/services/files';
import { uid } from '@/lib/utils';

const size = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/**
 * قائمة مرفقات متحكَّم بها. الملفات في IndexedDB، والقيمة بيانات وصفية فقط.
 * session = newSession() من services/files لتنظيف الملفات عند الإلغاء/الحفظ.
 */
export default function FileAttach({ files = [], onChange, session, kinds, single = false }) {
  const input = useRef(null);
  const [kind, setKind] = useState(kinds?.[0]?.value ?? '');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_FILE) return setErr('الحد الأقصى لحجم الملف 10 ميغابايت');
    setErr('');
    setBusy(true);
    try {
      const id = uid();
      await putFile(id, file);
      session.added.add(id);
      const meta = { id, name: file.name, type: file.type, size: file.size, kind };
      if (single) files.forEach((f) => session.removed.add(f.id));
      onChange(single ? [meta] : [...files, meta]);
    } catch {
      setErr('تعذّر حفظ الملف في هذا المتصفح (قد يكون الوضع الخاص مفعّلاً).');
    } finally {
      setBusy(false);
    }
  };

  const remove = (f) => {
    session.removed.add(f.id);
    onChange(files.filter((x) => x.id !== f.id));
  };
  const kindLabel = (k) => kinds?.find((x) => x.value === k)?.label;

  return (
    <div className="space-y-2">
      {files.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm dark:divide-slate-800 dark:border-slate-700">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-2 px-3 py-2">
              <Paperclip size={14} className="shrink-0 text-slate-400" />
              <bdi dir="ltr" className="min-w-0 flex-1 truncate">{f.name}</bdi>
              {kindLabel(f.kind) && <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{kindLabel(f.kind)}</span>}
              <bdi dir="ltr" className="text-xs text-slate-400">{size(f.size)}</bdi>
              <button type="button" className="btn-ghost !p-1.5" aria-label={`تنزيل ${f.name}`} onClick={() => downloadFile(f).catch((e) => setErr(e.message))}>
                <Download size={14} />
              </button>
              <button type="button" className="btn !p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950" aria-label={`إزالة ${f.name}`} onClick={() => remove(f)}>
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2">
        {kinds && (
          <select className="input !w-auto" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="نوع الملف">
            {kinds.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        )}
        <button type="button" className="btn-ghost border border-dashed border-slate-300 dark:border-slate-700" disabled={busy} onClick={() => input.current?.click()}>
          <Paperclip size={15} /> {busy ? 'جارٍ الحفظ…' : single && files.length ? 'استبدال الملف' : 'إرفاق ملف'}
        </button>
        <input ref={input} type="file" hidden accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" onChange={onPick} data-testid="file-input" />
      </div>
      {err && <p role="alert" className="text-xs text-rose-500">{err}</p>}
      <p className="text-xs text-slate-400">تُحفظ الملفات في متصفحك فقط (حتى 10 ميغابايت للملف).</p>
    </div>
  );
}
