import { useEffect, useRef, useState } from 'react';
import { storage } from '@/services/storage';

/**
 * مثل useState لكن يحفظ القيمة عبر طبقة التخزين، ويتحدّث تلقائياً
 * عندما يصل تعديل من جهاز آخر (Realtime).
 * القيمة الافتراضية لا تُكتب في التخزين إلا بعد أن يغيّرها المستخدم فعلاً،
 * حتى لا تُرفع بيانات تجريبية فوق بياناتك في السحابة.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = storage.get(key);
    return stored !== undefined ? stored : initialValue;
  });
  const last = useRef(value);

  useEffect(() => {
    if (Object.is(value, last.current)) return;
    last.current = value;
    storage.set(key, value);
  }, [key, value]);

  useEffect(
    () =>
      storage.subscribe(key, (remote) => {
        last.current = remote; // لا نعيد كتابة ما وصل من السحابة
        setValue(remote);
      }),
    [key]
  );

  return [value, setValue];
}
