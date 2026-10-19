import { useEffect, useState } from 'react';
import { Cloud, CloudOff, HardDrive, RefreshCw, UploadCloud } from 'lucide-react';
import { storage } from '@/services/storage';

const MAP = {
  local: { Icon: HardDrive, text: 'التخزين محلي فقط (لم يُضبط Supabase)', cls: 'text-slate-400' },
  synced: { Icon: Cloud, text: 'متزامن مع السحابة', cls: 'text-emerald-600 dark:text-emerald-400' },
  syncing: { Icon: RefreshCw, text: 'جارٍ المزامنة…', cls: 'text-brand-600 dark:text-brand-400 animate-spin' },
  pending: { Icon: UploadCloud, text: 'تعديلات بانتظار الرفع', cls: 'text-amber-600 dark:text-amber-400' },
  offline: { Icon: CloudOff, text: 'غير متصل — التعديلات محفوظة محلياً وستُرفع عند عودة الاتصال', cls: 'text-rose-600 dark:text-rose-400' },
};

export default function SyncBadge() {
  const [s, setS] = useState(storage.getStatus());
  useEffect(() => storage.onStatus(setS), []);
  const m = MAP[s.state];
  if (!m) return null;
  const label = s.pending > 0 && s.state !== 'syncing' ? `${m.text} (${s.pending})` : m.text;
  return (
    <span data-testid="sync-badge" data-state={s.state} title={label} aria-label={label} role="status" className="flex items-center px-1">
      <m.Icon size={18} className={m.cls} />
    </span>
  );
}
