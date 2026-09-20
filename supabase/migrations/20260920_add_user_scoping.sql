-- Run this migration once in the Supabase SQL Editor after the first account
-- has been created. The first Auth user receives the existing data.

begin;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

do $$
declare
  owner_id uuid;
  table_name text;
begin
  select id into owner_id
  from auth.users
  order by created_at
  limit 1;

  if owner_id is null then
    raise exception 'Create the first Supabase Auth account before running this migration';
  end if;

  foreach table_name in array array[
    'kakeibo',
    'categories',
    'payment_methods',
    'qr_payment_providers',
    'credit_card_providers',
    'auto_buttons',
    'auto_schedules'
  ] loop
    execute format('alter table public.%I add column if not exists user_id uuid references auth.users(id) on delete cascade', table_name);
    execute format('update public.%I set user_id = %L where user_id is null', table_name, owner_id);
    execute format('alter table public.%I alter column user_id set not null', table_name);
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon', table_name);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', table_name);

    execute format('drop policy if exists "User scoped access" on public.%I', table_name);
    execute format(
      'create policy "User scoped access" on public.%I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      table_name
    );

    execute format('create or replace function public.set_%I_user_id() returns trigger language plpgsql security invoker as $fn$ begin new.user_id := auth.uid(); return new; end; $fn$', table_name);
    execute format('drop trigger if exists set_user_id on public.%I', table_name);
    execute format('create trigger set_user_id before insert on public.%I for each row execute function public.set_%I_user_id()', table_name, table_name);
  end loop;
end $$;

insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
order by created_at
limit 1
on conflict (user_id) do update set role = 'admin';

revoke all on table public.user_roles from anon;
grant select on table public.user_roles to authenticated;

drop policy if exists "Users can read their own role" on public.user_roles;
create policy "Users can read their own role"
  on public.user_roles
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

commit;
