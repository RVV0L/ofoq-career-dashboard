import { createClient } from '@supabase/supabase-js';

/**
 * عميل Supabase. المفتاح هنا هو anon (عام بطبيعته) والحماية الفعلية في RLS.
 * لا تضع service_role key في الواجهة أبداً.
 * إن لم تُضبط المتغيرات يعمل التطبيق محلياً فقط (localStorage) كما كان.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const cloudEnabled = Boolean(url && anon);
export const googleEnabled = import.meta.env.VITE_ENABLE_GOOGLE === 'true';

export const supabase = cloudEnabled
  ? createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;
