import { Clock } from 'lucide-react';
import { useNow } from '@/lib/time';
import { LEVEL_LABEL, LEVEL_TONE, reminderFor, reminderText } from '@/lib/reminders';

/** شارة عدّاد ملوّنة: أخضر (>14 يوماً) / أصفر (≤14) / أحمر (≤3) / رمادي (أُغلق) */
export default function ReminderChip({ app }) {
  const now = useNow(30000);
  const r = reminderFor(app, now);
  if (!r) return null;
  return (
    <span className={`badge gap-1 ${LEVEL_TONE[r.level]}`} title={LEVEL_LABEL[r.level]}>
      <Clock size={11} aria-hidden />
      <bdi>{reminderText(r)}</bdi>
    </span>
  );
}
