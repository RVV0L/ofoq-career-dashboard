// اختبار الواجهة الكامل: node tests/e2e/mock-supabase.mjs (خادم وهمي على 54321)، ثم بناء: VITE_SUPABASE_URL=http://localhost:54321 VITE_SUPABASE_ANON_KEY=anon-key npx vite build --outDir /tmp/dist-test، تقديم المجلد على المنفذ 4180، ثم python3 tests/e2e/ui_test.py (يحتاج playwright). يحتاج حزمة ws.
// خادم Supabase وهمي (Auth + PostgREST + Realtime/WebSocket) لاختبار الواجهة محلياً.
import http from 'node:http';
import { WebSocketServer } from 'ws';

const OWNER = 'owner@test.dev', STRANGER = 'stranger@test.dev', PW = 'pw12345';
const PUBLIC = ['projects', 'skills', 'certs'];
const rows = new Map();
const log = [];
const sockets = new Set();
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (email) => `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: 'uid-' + email, email, role: 'authenticated', aud: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
const emailOf = (tok) => { try { return JSON.parse(Buffer.from(String(tok).split('.')[1], 'base64url').toString()).email ?? null; } catch { return null; } };
const tokenOf = (req) => (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
const isOwner = (tok) => emailOf(tok) === OWNER;
const canSee = (tok, key) => isOwner(tok) || PUBLIC.includes(key);

const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': '*' };
const send = (res, code, body, extra = {}) => {
  res.writeHead(code, { ...cors, 'content-type': 'application/json', ...extra });
  res.end(body === undefined ? undefined : JSON.stringify(body));
};
const readBody = (req) => new Promise((r) => { let d = ''; req.on('data', (c) => (d += c)); req.on('end', () => r(d ? JSON.parse(d) : {})); });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  const tok = tokenOf(req);
  if (url.pathname === '/__log') return send(res, 200, log);
  if (url.pathname === '/__rows') return send(res, 200, [...rows.values()]);
  if (url.pathname === '/__reset') { rows.clear(); log.length = 0; return send(res, 200, {}); }

  if (url.pathname === '/auth/v1/token') {
    const { email, password } = await readBody(req);
    log.push(`login ${email}`);
    if ((email === OWNER || email === STRANGER) && password === PW) {
      const access_token = jwt(email);
      return send(res, 200, { access_token, token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: 'r-' + email, user: { id: 'uid-' + email, aud: 'authenticated', role: 'authenticated', email, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() } });
    }
    return send(res, 400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials', message: 'Invalid login credentials' });
  }
  if (url.pathname === '/auth/v1/logout') { log.push('logout'); res.writeHead(204, cors); return res.end(); }
  if (url.pathname === '/auth/v1/user') { const e = emailOf(tok); return e ? send(res, 200, { id: 'uid-' + e, email: e, aud: 'authenticated' }) : send(res, 401, { message: 'no' }); }

  if (url.pathname === '/rest/v1/rpc/is_owner') { log.push(`rpc is_owner as ${emailOf(tok) ?? 'anon'}`); return send(res, 200, isOwner(tok)); }

  if (url.pathname === '/rest/v1/app_data') {
    if (req.method === 'GET') {
      log.push(`select as ${emailOf(tok) ?? 'anon'} ${url.search}`);
      return send(res, 200, [...rows.values()].filter((r) => canSee(tok, r.key)));
    }
    if (req.method === 'POST') {
      const body = await readBody(req);
      const list = Array.isArray(body) ? body : [body];
      if (!isOwner(tok)) { log.push(`DENIED write as ${emailOf(tok) ?? 'anon'}`); return send(res, 401, { code: '42501', message: 'new row violates row-level security policy for table "app_data"' }); }
      for (const row of list) {
        rows.set(row.key, row);
        log.push(`upsert ${row.key}`);
        const msg = JSON.stringify([null, null, 'realtime:app_data_sync', 'postgres_changes', { ids: [1000], data: { schema: 'public', table: 'app_data', commit_timestamp: new Date().toISOString(), type: 'UPDATE', columns: [], record: row, old_record: {}, errors: null } }]);
        for (const s of sockets) if (s.readyState === 1 && canSee(s.token, row.key)) s.send(msg);
      }
      return send(res, 201);
    }
  }
  send(res, 404, { message: 'not found ' + url.pathname });
});

const wss = new WebSocketServer({ server, path: '/realtime/v1/websocket' });
wss.on('connection', (ws, req) => {
  ws.token = new URL(req.url, 'http://x').searchParams.get('apikey');
  sockets.add(ws);
  ws.on('close', () => sockets.delete(ws));
  ws.on('message', (data) => {
    const [jref, ref, topic, event, payload] = JSON.parse(data.toString());
    if (event === 'heartbeat') return ws.send(JSON.stringify([null, ref, 'phoenix', 'phx_reply', { status: 'ok', response: {} }]));
    if (event === 'access_token') { ws.token = payload.access_token; return; }
    if (event === 'phx_join') {
      if (payload.access_token) ws.token = payload.access_token;
      log.push(`ws join as ${emailOf(ws.token) ?? 'anon'}`);
      ws.send(JSON.stringify([jref, ref, topic, 'phx_reply', { status: 'ok', response: { postgres_changes: [{ id: 1000, event: '*', schema: 'public', table: 'app_data' }] } }]));
      ws.send(JSON.stringify([null, null, topic, 'system', { message: 'Subscribed to PostgreSQL', status: 'ok', extension: 'postgres_changes', channel: 'app_data_sync' }]));
    }
    if (event === 'phx_leave') ws.send(JSON.stringify([jref, ref, topic, 'phx_reply', { status: 'ok', response: {} }]));
  });
});
server.listen(54321, () => console.log('mock supabase on :54321'));
