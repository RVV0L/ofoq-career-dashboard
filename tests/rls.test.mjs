// يختبر supabase/schema.sql على Postgres حقيقي (PGlite) مع محاكاة أدوار Supabase.
// تشغيل: npm i -D @electric-sql/pglite  ثم  node tests/rls.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const OWNER = 'me@test.dev';
const sql = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8').replaceAll('owner@example.com', OWNER);
const db = new PGlite();

// ---- محاكاة بيئة Supabase (الأدوار، auth.jwt()، storage، publication) ----
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create function auth.jwt() returns jsonb language sql stable
    as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint);
  create table storage.objects (id uuid default gen_random_uuid() primary key, bucket_id text, name text);
  alter table storage.objects enable row level security;
  grant usage on schema auth, storage to anon, authenticated;
  grant all on storage.objects to anon, authenticated;
  create publication supabase_realtime;
`);
await db.exec(sql);
// تشغيل ثانٍ للتأكد أن السكربت قابل لإعادة التشغيل (idempotent)
await db.exec(sql);

const ALL = ['projects', 'skills', 'certs', 'courses', 'sprints', 'applications', 'cheatSheet', 'bugLog', 'focusLog', 'cvs', 'interviews', 'settings'];
for (const k of ALL) await db.query(`insert into public.app_data(key,value) values ($1,$2)`, [k, JSON.stringify([k])]);

async function as(role, email, fn) {
  const claims = email === undefined ? '{}' : JSON.stringify({ email });
  await db.exec(`select set_config('request.jwt.claims', '${claims}', false); set role ${role};`);
  try { return await fn(); } finally { await db.exec('reset role;'); }
}
const keys = async () => (await db.query('select key from public.app_data order by key')).rows.map((r) => r.key);
const fails = async (q, re = /permission denied|row-level security/) => {
  await assert.rejects(() => db.query(q), re);
};
const affected = async (q) => (await db.query(q)).affectedRows;
let n = 0; const test = async (name, fn) => { await fn(); console.log(`ok ${++n} - ${name}`); };
const PUB = ['certs', 'projects', 'skills'];

await test('زائر مجهول (anon): يقرأ المفاتيح العامة فقط', async () => {
  assert.deepEqual(await as('anon', undefined, keys), PUB);
  assert.equal(await as('anon', undefined, async () => (await db.query(`select * from public.app_data where key='applications'`)).rows.length), 0);
});
await test('زائر مجهول: لا يكتب ولا يعدّل ولا يحذف', async () => {
  await as('anon', undefined, async () => {
    await fails(`insert into public.app_data(key,value) values ('projects','[]')`);
    await fails(`insert into public.app_data(key,value) values ('x','[]')`);
    await fails(`update public.app_data set value='[]' where key='projects'`);
    await fails(`delete from public.app_data where key='projects'`);
  });
  assert.equal((await db.query(`select value from public.app_data where key='projects'`)).rows[0].value[0], 'projects');
});
await test('مستخدم مسجّل لكنه ليس المالك: نفس صلاحيات الزائر', async () => {
  await as('authenticated', 'stranger@x.com', async () => {
    assert.deepEqual(await keys(), PUB);
    await fails(`insert into public.app_data(key,value) values ('courses','[]')`);
    assert.equal(await affected(`update public.app_data set value='["hacked"]'`), 0);
    assert.equal(await affected(`delete from public.app_data`), 0);
  });
  assert.equal((await db.query('select count(*)::int c from public.app_data')).rows[0].c, ALL.length);
});
await test('مستخدم مسجّل بلا بريد في التوكن: ليس مالكاً', async () => {
  await as('authenticated', undefined, async () => assert.deepEqual(await keys(), PUB));
});
await test('بريد مشابه لبريد المالك (تحايل): مرفوض', async () => {
  for (const e of [OWNER + '.evil', 'x' + OWNER, OWNER.replace('@', '@sub.')])
    await as('authenticated', e, async () => assert.deepEqual(await keys(), PUB));
});
await test('المالك: يقرأ كل شيء ويكتب ويعدّل ويحذف', async () => {
  await as('authenticated', OWNER, async () => {
    assert.equal((await keys()).length, ALL.length);
    await db.query(`insert into public.app_data(key,value) values ('extra','[1]')`);
    assert.equal(await affected(`update public.app_data set value='["edited"]' where key='applications'`), 1);
    assert.equal(await affected(`delete from public.app_data where key='extra'`), 1);
  });
});
await test('المالك: البريد غير حساس لحالة الأحرف', async () => {
  await as('authenticated', OWNER.toUpperCase(), async () => assert.equal((await keys()).length, ALL.length));
});
await test('is_owner(): false للزائر، true للمالك', async () => {
  const f = async () => (await db.query('select public.is_owner() as o')).rows[0].o;
  assert.equal(await as('anon', undefined, f), false);
  assert.equal(await as('authenticated', 'stranger@x.com', f), false);
  assert.equal(await as('authenticated', OWNER, f), true);
});
await test('Storage (ملفات CV): المالك فقط', async () => {
  const b = (await db.query(`select public from storage.buckets where id='files'`)).rows[0];
  assert.equal(b.public, false);
  await as('authenticated', OWNER, async () => { await db.query(`insert into storage.objects(bucket_id,name) values ('files','cv.pdf')`); });
  await as('authenticated', 'stranger@x.com', async () => {
    await fails(`insert into storage.objects(bucket_id,name) values ('files','evil.pdf')`);
    assert.equal((await db.query(`select * from storage.objects`)).rows.length, 0);
  });
  await as('anon', undefined, async () => assert.equal((await db.query(`select * from storage.objects`)).rows.length, 0));
});
await test('RLS مفعّل ومفروض على الجدول، والجدول ضمن publication الـ Realtime', async () => {
  const r = (await db.query(`select relrowsecurity, relforcerowsecurity from pg_class where relname='app_data'`)).rows[0];
  assert.deepEqual(r, { relrowsecurity: true, relforcerowsecurity: true });
  assert.equal((await db.query(`select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='app_data'`)).rows.length, 1);
});

console.log(`\nالكل نجح: ${n} اختبار RLS`);
process.exit(0);
