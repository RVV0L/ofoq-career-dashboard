/**
 * طبقة التخزين (Storage Adapter)
 * -------------------------------------------------
 * كل التطبيق يتعامل مع هذه الواجهة فقط: get / set / remove.
 * لاحقاً عند الربط بـ Firebase أو Supabase يكفي استبدال
 * كائن `localAdapter` بـ adapter جديد بنفس الدوال (وجعلها async عند الحاجة)
 * دون لمس باقي المكوّنات.
 */
const PREFIX = 'cd:';

const localAdapter = {
  get(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw === null ? undefined : JSON.parse(raw);
    } catch {
      return undefined;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* التخزين ممتلئ أو معطّل */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      /* تجاهل */
    }
  },
};

// مثال مستقبلي:
// const supabaseAdapter = { async get(key) {...}, async set(key, value) {...} };

export const storage = localAdapter;
