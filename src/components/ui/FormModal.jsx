import { useId, useState } from 'react';
import { Trash2 } from 'lucide-react';
import Modal from './Modal';

/**
 * نموذج عام مبني على تعريف الحقول (data/schemas.js).
 * field: { name, label, type: text|number|textarea|select|range|date|tags,
 *          options, required, min, max, step, rows, default, half, ltr, hint,
 *          placeholder, suggestions }
 * - الحقل الرقمي الفارغ يُحفظ null (يعني "تلقائي/غير محدد")
 * - بعد onSave / onDelete يُغلق النموذج تلقائياً
 */
const initValue = (f, v) => {
  if (f.type === 'tags') return Array.isArray(v) ? v.join(', ') : v ?? '';
  if (f.type === 'range') return v ?? f.default ?? f.min ?? 0;
  if (f.type === 'select') return v ?? f.options[0].value;
  return v ?? '';
};

const toValue = (f, v) => {
  if (f.type === 'number') return v === '' ? null : Number(v);
  if (f.type === 'range') return Number(v);
  if (f.type === 'tags') return String(v).split(/[,،]/).map((s) => s.trim()).filter(Boolean);
  return typeof v === 'string' ? v.trim() : v;
};

export default function FormModal({ title, fields, initial = {}, onSave, onDelete, onClose, submitLabel }) {
  const uidBase = useId();
  const [form, setForm] = useState(() => Object.fromEntries(fields.map((f) => [f.name, initValue(f, initial[f.name])])));
  const [error, setError] = useState('');
  const isEdit = Boolean(initial.id);

  const set = (name, value) => setForm((x) => ({ ...x, [name]: value }));

  const submit = (e) => {
    e.preventDefault();
    for (const f of fields) {
      const raw = form[f.name];
      if (f.required && String(raw).trim() === '') return setError(`الحقل «${f.label}» مطلوب`);
      if (f.type === 'number' && raw !== '') {
        const n = Number(raw);
        if (Number.isNaN(n) || (f.min !== undefined && n < f.min) || (f.max !== undefined && n > f.max))
          return setError(`قيمة «${f.label}» يجب أن تكون بين ${f.min ?? '−∞'} و ${f.max ?? '∞'}`);
      }
    }
    onSave(Object.fromEntries(fields.map((f) => [f.name, toValue(f, form[f.name])])));
    onClose();
  };

  const del = () => {
    if (window.confirm('هل تريد حذف هذا العنصر؟ لا يمكن التراجع.')) {
      onDelete();
      onClose();
    }
  };

  return (
    <Modal open title={title} onClose={onClose}>
      <form onSubmit={submit} className="grid grid-cols-2 gap-3">
        {fields.map((f) => {
          const id = `${uidBase}-${f.name}`;
          const listId = f.suggestions?.length ? `${id}-list` : undefined;
          return (
            <div key={f.name} className={f.half ? 'col-span-1' : 'col-span-2'}>
              <label htmlFor={id} className="mb-1 flex items-center justify-between text-sm font-medium">
                <span>
                  {f.label}
                  {f.required && <span className="text-rose-500"> *</span>}
                </span>
                {f.type === 'range' && <span className="text-slate-500">{form[f.name]}%</span>}
              </label>

              {f.type === 'textarea' ? (
                <textarea id={id} rows={f.rows ?? 3} className="input" dir={f.ltr ? 'ltr' : undefined}
                  placeholder={f.placeholder} value={form[f.name]} onChange={(e) => set(f.name, e.target.value)} />
              ) : f.type === 'select' ? (
                <select id={id} className="input" value={form[f.name]} onChange={(e) => set(f.name, e.target.value)}>
                  {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : f.type === 'range' ? (
                <input id={id} type="range" className="w-full accent-brand-600" min={f.min ?? 0} max={f.max ?? 100}
                  step={f.step ?? 1} value={form[f.name]} onChange={(e) => set(f.name, e.target.value)} />
              ) : (
                <>
                  <input id={id} list={listId} className="input"
                    type={['number', 'date', 'datetime-local'].includes(f.type) ? f.type : 'text'}
                    dir={f.ltr || f.type === 'tags' ? 'ltr' : undefined}
                    min={f.min} max={f.max} step={f.type === 'number' ? f.step ?? 'any' : undefined}
                    placeholder={f.placeholder} value={form[f.name]} onChange={(e) => set(f.name, e.target.value)} />
                  {listId && <datalist id={listId}>{f.suggestions.map((s) => <option key={s} value={s} />)}</datalist>}
                </>
              )}
              {f.hint && <p className="mt-1 text-xs text-slate-500">{f.hint}</p>}
            </div>
          );
        })}

        {error && <p role="alert" className="col-span-2 text-sm text-rose-500">{error}</p>}

        <div className="col-span-2 flex items-center justify-between pt-2">
          <div>
            {isEdit && onDelete && (
              <button type="button" onClick={del} className="btn text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950">
                <Trash2 size={16} /> حذف
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn-primary">{submitLabel ?? (isEdit ? 'حفظ التعديل' : 'إضافة')}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
