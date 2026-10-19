/**
 * طبقة التخزين (Storage Adapter)
 * -------------------------------------------------
 * الواجهة التي يستخدمها التطبيق: get / set / remove / subscribe.
 * - بدون إعداد Supabase: تخزين محلي فقط (localStorage).
 * - مع الإعداد: localStorage + مزامنة سحابية حية (انظر services/sync.js).
 */
import { supabase } from './supabase';
import { createSync } from './sync';

// localStorage قد يرمي استثناء (وضع خاص / ممتلئ): نرجع لذاكرة مؤقتة
const mem = new Map();
const ls = {
  getItem(k) {
    try { return localStorage.getItem(k); } catch { return mem.has(k) ? mem.get(k) : null; }
  },
  setItem(k, v) {
    try { localStorage.setItem(k, v); } catch { mem.set(k, v); }
  },
  removeItem(k) {
    try { localStorage.removeItem(k); } catch { mem.delete(k); }
    mem.delete(k);
  },
};

export const sync = createSync({ client: supabase, ls });

export const storage = {
  get: sync.get,
  set: sync.set,
  remove: sync.remove,
  subscribe: sync.subscribe,
  onStatus: sync.onStatus,
  getStatus: sync.getStatus,
};
