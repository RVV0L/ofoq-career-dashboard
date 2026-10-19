export const uid = () =>
  Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

export const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));

/** يضمن أن الرابط http(s) فقط (يمنع javascript: وغيرها). */
export function normalizeUrl(url) {
  const u = (url || '').trim();
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  if (/^[a-z][a-z0-9+.-]*:/i.test(u) && !/^[^/]+:\d+/.test(u)) return '';
  return 'https://' + u;
}
