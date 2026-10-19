// تشغيل: node tests/sync.test.mjs
// يحاكي جهازين (laptop / phone) على خادم وهمي فيه RLS وRealtime، ويختبر محرك المزامنة الحقيقي.
import assert from 'node:assert/strict';
import { createSync, PUBLIC_KEYS } from '../src/services/sync.js';

const tick = (ms = 5) => new Promise((r) => setTimeout(r, ms));

function makeServer() {
  const rows = new Map();
  const subs = new Set();
  return {
    rows,
    client(role, { failWrites = () => false } = {}) {
      const visible = (k) => role === 'owner' || PUBLIC_KEYS.includes(k); // = سياسات RLS
      return {
        from() {
          return {
            select() {
              let filter = null;
              const q = {
                in(_c, list) { filter = list; return q; },
                then(res, rej) {
                  const data = [...rows.values()].filter((r) => visible(r.key) && (!filter || filter.includes(r.key)));
                  return Promise.resolve({ data: structuredClone(data), error: null }).then(res, rej);
                },
              };
              return q;
            },
            async upsert(row) {
              if (failWrites()) return { error: { message: 'network' } };
              if (role !== 'owner') return { error: { message: 'new row violates row-level security policy' } };
              rows.set(row.key, structuredClone(row));
              for (const s of subs) if (s.visible(row.key)) setTimeout(() => s.cb({ eventType: 'UPDATE', new: structuredClone(row) }), 1);
              return { error: null };
            },
          };
        },
        channel() {
          const ch = { _cb: null, on(_t, _f, cb) { ch._cb = cb; return ch; }, subscribe(st) { subs.add({ cb: ch._cb, visible }); queueMicrotask(() => st('SUBSCRIBED')); return ch; } };
          return ch;
        },
        removeChannel() {},
      };
    },
  };
}

function makeLs(init = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m };
}
let clock = 1_000_000;
const now = () => (clock += 10);
const device = (server, role, ls = makeLs(), opts) => ({ ls, s: createSync({ client: server.client(role, opts), ls, now, pullTimeoutMs: 500 }) });

let n = 0;
const test = async (name, fn) => { await fn(); console.log(`ok ${++n} - ${name}`); };

await test('ترقية: بيانات محلية قديمة تُرفع للسحابة عند أول دخول', async () => {
  const server = makeServer();
  const ls = makeLs({ 'cd:projects': JSON.stringify([{ id: 'p1', title: 'Old' }]), 'cd:courses': JSON.stringify([{ id: 'c1' }]), 'cd:theme': '"dark"' });
  const laptop = device(server, 'owner', ls);
  await laptop.s.start('owner');
  await laptop.s.flush();
  assert.deepEqual(server.rows.get('projects').value, [{ id: 'p1', title: 'Old' }]);
  assert.ok(server.rows.has('courses'));
  assert.ok(!server.rows.has('theme'), 'المفاتيح المحلية (theme) لا تُرفع');
  assert.equal(laptop.s.getStatus().state, 'synced');
});

await test('جهاز جديد: يستلم البيانات ولا يكتب القيم الافتراضية', async () => {
  const server = makeServer();
  const laptop = device(server, 'owner');
  await laptop.s.start('owner');
  laptop.s.set('projects', [{ id: 'p1', title: 'A' }]);
  await laptop.s.flush();
  const phone = device(server, 'owner');
  await phone.s.start('owner');
  assert.deepEqual(phone.s.get('projects'), [{ id: 'p1', title: 'A' }]);
  assert.equal(phone.s.get('courses'), undefined);
  assert.equal(phone.s.getStatus().pending, 0, 'لا شيء بانتظار الرفع (لم نرفع افتراضيات)');
  assert.equal(server.rows.size, 1);
});

await test('Realtime: تعديل اللابتوب يظهر على الجوال فوراً ويُبلّغ المكوّنات', async () => {
  const server = makeServer();
  const laptop = device(server, 'owner'); const phone = device(server, 'owner');
  await laptop.s.start('owner'); await phone.s.start('owner');
  const seen = [];
  phone.s.subscribe('projects', (v) => seen.push(v));
  const echoes = [];
  laptop.s.subscribe('projects', (v) => echoes.push(v));
  laptop.s.set('projects', [{ id: 'p2', title: 'New' }]);
  await laptop.s.flush();
  await tick(20);
  assert.deepEqual(seen, [[{ id: 'p2', title: 'New' }]]);
  assert.equal(echoes.length, 0, 'صدى كتابتي لا يُطبَّق عليّ');
  assert.deepEqual(phone.s.get('projects'), [{ id: 'p2', title: 'New' }]);
});

await test('الرفع التلقائي (debounce) بدون استدعاء flush يدوي', async () => {
  const server = makeServer();
  const laptop = device(server, 'owner'); await laptop.s.start('owner');
  laptop.s.set('skills', [{ id: 's1' }]);
  assert.ok(!server.rows.has('skills'));
  await tick(900);
  assert.ok(server.rows.has('skills'));
});

await test('بلا إنترنت: التعديل محلي ويبقى في الصندوق ثم يُرفع عند عودة الاتصال', async () => {
  const server = makeServer();
  let down = false;
  const phone = device(server, 'owner', makeLs(), { failWrites: () => down });
  const laptop = device(server, 'owner');
  await phone.s.start('owner'); await laptop.s.start('owner');
  down = true;
  phone.s.set('courses', [{ id: 'c9', name: 'Offline edit' }]);
  await phone.s.flush();
  assert.deepEqual(phone.s.get('courses'), [{ id: 'c9', name: 'Offline edit' }], 'القراءة المحلية تعمل');
  assert.equal(phone.s.getStatus().pending, 1);
  assert.ok(!server.rows.has('courses'));
  down = false;
  await phone.s.flush();
  assert.equal(phone.s.getStatus().pending, 0);
  await tick(20);
  assert.deepEqual(laptop.s.get('courses'), [{ id: 'c9', name: 'Offline edit' }]);
});

await test('الصندوق يبقى بعد إعادة تحميل الصفحة (يُحفظ في التخزين)', async () => {
  const server = makeServer();
  let down = true;
  const ls = makeLs();
  const d1 = device(server, 'owner', ls, { failWrites: () => down });
  await d1.s.start('owner');
  d1.s.set('sprints', [{ id: 'x' }]); await d1.s.flush();
  const d2 = device(server, 'owner', ls); // "صفحة جديدة" بنفس التخزين وإنترنت سليم
  await d2.s.start('owner'); await d2.s.flush();
  assert.deepEqual(server.rows.get('sprints').value, [{ id: 'x' }]);
});

await test('تعارض: الأحدث يفوز (التعديل القديم المعلّق يُتجاهل)', async () => {
  const server = makeServer();
  let down = true;
  const phone = device(server, 'owner', makeLs(), { failWrites: () => down });
  const laptop = device(server, 'owner');
  await phone.s.start('owner'); await laptop.s.start('owner');
  phone.s.set('cheatSheet', ['old-from-phone']); await phone.s.flush(); // معلّق
  laptop.s.set('cheatSheet', ['newer-from-laptop']); await laptop.s.flush(); // أحدث
  down = false;
  await phone.s.pull(); await phone.s.flush();
  assert.deepEqual(phone.s.get('cheatSheet'), ['newer-from-laptop']);
  assert.deepEqual(server.rows.get('cheatSheet').value, ['newer-from-laptop']);
});

await test('عدم تكرار الكتابة: نفس القيمة لا تُرفع', async () => {
  const server = makeServer();
  const d = device(server, 'owner'); await d.s.start('owner');
  d.s.set('bugLog', [1]); await d.s.flush();
  d.s.set('bugLog', [1]);
  assert.equal(d.s.getStatus().pending, 0);
});

await test('الزائر: يرى العام فقط، لا يقرأ الخاص ولا يكتب', async () => {
  const server = makeServer();
  const laptop = device(server, 'owner'); await laptop.s.start('owner');
  laptop.s.set('projects', [{ id: 'pub' }]);
  laptop.s.set('applications', [{ id: 'secret', company: 'Aramco' }]);
  await laptop.s.flush();
  // نفس المتصفح فيه بيانات خاصة قديمة من استخدام المالك السابق:
  const ls = makeLs({ 'cd:applications': JSON.stringify([{ id: 'leftover' }]), 'cd:projects': JSON.stringify([{ id: 'stale' }]) });
  const visitor = device(server, 'viewer', ls);
  await visitor.s.start('viewer');
  assert.deepEqual(visitor.s.get('projects'), [{ id: 'pub' }]);
  assert.equal(visitor.s.get('applications'), undefined, 'الخاص مخفي حتى لو بقي في المتصفح');
  assert.equal(visitor.s.get('settings'), undefined);
  visitor.s.set('projects', [{ id: 'hack' }]); visitor.s.set('courses', [1]);
  assert.deepEqual(visitor.s.get('projects'), [{ id: 'pub' }], 'الزائر لا يكتب');
  assert.equal(visitor.s.getStatus().state, 'viewer');
  await visitor.s.flush();
  assert.deepEqual(server.rows.get('projects').value, [{ id: 'pub' }]);
});

await test('الزائر: حتى لو سرّب السيرفر صفاً خاصاً (خطأ افتراضي) يتجاهله العميل', async () => {
  const server = makeServer();
  const visitor = device(server, 'viewer'); await visitor.s.start('viewer');
  assert.equal(visitor.s.applyRemote({ key: 'applications', value: [1], updated_at: new Date(clock + 1000).toISOString() }), false);
  assert.equal(visitor.s.get('applications'), undefined);
});

await test('الزائر يستلم تحديثات المعرض العام حية', async () => {
  const server = makeServer();
  const laptop = device(server, 'owner'); const visitor = device(server, 'viewer');
  await laptop.s.start('owner'); await visitor.s.start('viewer');
  const seen = []; visitor.s.subscribe('certs', (v) => seen.push(v));
  laptop.s.set('certs', [{ id: 'ccna' }]); laptop.s.set('courses', [{ id: 'private' }]);
  await laptop.s.flush(); await tick(20);
  assert.deepEqual(seen, [[{ id: 'ccna' }]]);
  assert.equal(visitor.s.get('courses'), undefined);
});

await test('(محاكاة) السيرفر الوهمي يرفض كتابة الزائر — RLS الحقيقي يُختبر في tests/rls.test.mjs', async () => {
  const server = makeServer();
  const c = server.client('viewer');
  const { error } = await c.from('app_data').upsert({ key: 'projects', value: [], updated_at: new Date().toISOString() });
  assert.match(error.message, /row-level security/);
});

await test('نسخة احتياطية للبيانات المحلية القديمة عند استبدالها ببيانات السحابة', async () => {
  const server = makeServer();
  const a = device(server, 'owner'); await a.s.start('owner');
  a.s.set('interviews', [{ id: 'cloud' }]); await a.s.flush();
  const ls = makeLs({ 'cd:interviews': JSON.stringify([{ id: 'legacy-local' }]) });
  const b = device(server, 'owner', ls); await b.s.start('owner');
  assert.deepEqual(b.s.get('interviews'), [{ id: 'cloud' }]);
  assert.deepEqual(JSON.parse(ls.getItem('cd:__backup:interviews')), [{ id: 'legacy-local' }]);
});

await test('تسجيل الخروج يمسح كل النسخ المحلية الخاصة', async () => {
  const server = makeServer();
  const ls = makeLs();
  const d = device(server, 'owner', ls); await d.s.start('owner');
  d.s.set('applications', [{ id: 'a' }]); d.s.set('theme', 'dark'); await d.s.flush();
  d.s.clearLocal();
  assert.equal(ls.getItem('cd:applications'), null);
  assert.equal(ls.getItem('cd:__meta'), null);
  assert.equal(ls.getItem('cd:theme'), '"dark"', 'إعدادات الثيم المحلية تبقى');
});

await test('بدون Supabase: يعمل محلياً فقط', async () => {
  const ls = makeLs();
  const s = createSync({ client: null, ls });
  await s.start('owner');
  s.set('projects', [1]);
  assert.deepEqual(s.get('projects'), [1]);
  assert.equal(s.getStatus().state, 'local');
});

console.log(`\nالكل نجح: ${n} اختبار`);
process.exit(0);
