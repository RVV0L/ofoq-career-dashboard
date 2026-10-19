/**
 * تخزين الملفات المرفقة (CV، خطابات) في IndexedDB — localStorage لا يتسع للملفات.
 * في السجلات نحفظ فقط البيانات الوصفية {id,name,type,size,kind}.
 * لاحقاً يمكن استبدال هذا الملف بـ Firebase Storage / Supabase Storage بنفس الدوال.
 */
const DB = 'cd-files';
const STORE = 'files';
export const MAX_FILE = 10 * 1024 * 1024; // 10MB

const openDb = () =>
  new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });

async function run(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => { db.close(); resolve(req.result); };
    t.onerror = () => { db.close(); reject(t.error); };
    t.onabort = () => { db.close(); reject(t.error); };
  });
}

export const putFile = (id, blob) => run('readwrite', (s) => s.put(blob, id));
export const getFile = (id) => run('readonly', (s) => s.get(id));
export const deleteFile = (id) => run('readwrite', (s) => s.delete(id));

export async function downloadFile(meta) {
  const blob = await getFile(meta.id);
  if (!blob) throw new Error('الملف غير موجود في هذا المتصفح');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = meta.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** جلسة تحرير: ما أُضيف يُحذف عند الإلغاء، وما أُزيل يُحذف عند الحفظ */
export const newSession = () => ({ added: new Set(), removed: new Set() });
export const commit = (s) => Promise.all([...s.removed].map((id) => deleteFile(id).catch(() => {})));
export const rollback = (s) => Promise.all([...s.added].map((id) => deleteFile(id).catch(() => {})));
