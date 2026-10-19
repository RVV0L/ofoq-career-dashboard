-- =====================================================================
--  Career Dashboard — قاعدة البيانات + الحماية (Row Level Security)
--  شغّله مرة واحدة في Supabase: SQL Editor > New query > Run
--  ⚠️ قبل التشغيل: استبدل owner@example.com ببريدك (في دالة is_owner فقط)
-- =====================================================================

-- 1) الجدول: صف لكل مجموعة بيانات (projects, courses, ...) بصيغة JSON
create table if not exists public.app_data (
  key        text primary key,
  value      jsonb       not null,
  updated_at timestamptz not null default now()
);

-- 2) من هو المالك؟ (غيّر البريد هنا)
--    security definer + search_path فارغ = لا يمكن التلاعب بها.
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(lower(auth.jwt() ->> 'email') = lower('owner@example.com'), false);
$$;

revoke all on function public.is_owner() from public;
grant execute on function public.is_owner() to anon, authenticated;

-- 3) تفعيل RLS (بدون سياسة = لا وصول لأحد)
alter table public.app_data enable row level security;
alter table public.app_data force  row level security;

-- 4) صلاحيات الجدول على مستوى الأدوار (الطبقة الأولى)
revoke all on public.app_data from anon, authenticated;
grant select                         on public.app_data to anon;
grant select, insert, update, delete on public.app_data to authenticated;

-- 5) السياسات (الطبقة الثانية)
drop policy if exists "owner full access" on public.app_data;
drop policy if exists "public read portfolio" on public.app_data;

-- المالك فقط: قراءة وكتابة كل شيء
create policy "owner full access" on public.app_data
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- أي زائر: قراءة (SELECT فقط) للمعرض العام: المشاريع والمهارات والشهادات
create policy "public read portfolio" on public.app_data
  for select to anon, authenticated
  using (key in ('projects', 'skills', 'certs'));

-- 6) المزامنة الحية (Realtime) — تحترم نفس سياسات RLS
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'app_data'
  ) then
    alter publication supabase_realtime add table public.app_data;
  end if;
end $$;

-- 7) الملفات المرفقة (CV، خطابات): bucket خاص، المالك فقط
insert into storage.buckets (id, name, public, file_size_limit)
values ('files', 'files', false, 10485760)
on conflict (id) do update set public = false, file_size_limit = 10485760;

drop policy if exists "owner files" on storage.objects;
create policy "owner files" on storage.objects
  for all to authenticated
  using (bucket_id = 'files' and public.is_owner())
  with check (bucket_id = 'files' and public.is_owner());

-- =====================================================================
--  اختبار الحماية (اختياري — من SQL Editor):
--    set local role anon;      select key from public.app_data;   -- تظهر المفاتيح العامة فقط
--    set local role anon;      insert into public.app_data(key,value) values ('x','{}'); -- يجب أن يفشل
-- =====================================================================
