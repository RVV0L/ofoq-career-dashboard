import { useEffect, useState } from 'react';
import { storage } from '@/services/storage';

/** مثل useState لكن يحفظ القيمة عبر طبقة التخزين (localStorage حالياً). */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = storage.get(key);
    return stored !== undefined ? stored : initialValue;
  });

  useEffect(() => {
    storage.set(key, value);
  }, [key, value]);

  return [value, setValue];
}
