create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'participant', 'vendor');
  end if;

  if not exists (select 1 from pg_type where typname = 'service_type') then
    create type public.service_type as enum ('food', 'merchandise', 'service', 'other');
  end if;

  if not exists (select 1 from pg_type where typname = 'stall_status') then
    create type public.stall_status as enum ('unassigned', 'active', 'inactive');
  end if;

  if not exists (select 1 from pg_type where typname = 'zone_status') then
    create type public.zone_status as enum ('open', 'busy', 'closed');
  end if;

  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum ('pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'sos_status') then
    create type public.sos_status as enum ('open', 'acknowledged', 'resolved');
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role,
  event_id uuid,
  full_name text,
  email text,
  phone_number text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  event_code text not null unique,
  location jsonb not null default '{}'::jsonb,
  latitude double precision,
  longitude double precision,
  start_date timestamptz not null,
  end_date timestamptz not null,
  max_participants integer not null check (max_participants > 0),
  number_of_stalls integer not null default 0 check (number_of_stalls >= 0),
  category text not null,
  contact_email text,
  contact_phone text,
  banner_url text,
  admin_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint events_dates_valid check (end_date >= start_date)
);

alter table public.profiles
  drop constraint if exists profiles_event_id_fkey;

alter table public.profiles
  add constraint profiles_event_id_fkey foreign key (event_id) references public.events (id) on delete set null;

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  full_name text not null,
  email text not null,
  phone_number text not null,
  college_name text,
  organization text,
  course text,
  year_of_study text,
  city text,
  state text,
  gender text,
  emergency_contact text,
  id_proof_url text,
  qr_code_url text,
  qr_token text unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  vendor_name text not null,
  owner_name text not null,
  phone_number text not null,
  email text not null,
  service_type public.service_type not null,
  stall_name text,
  items_offered jsonb not null default '[]'::jsonb,
  pricing_range text,
  required_resources jsonb not null default '[]'::jsonb,
  setup_time timestamptz,
  license_document_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.stalls (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  vendor_id uuid unique references public.vendors (id) on delete set null,
  name text not null,
  location_zone text not null,
  queue_time integer not null default 0 check (queue_time >= 0),
  status public.stall_status not null default 'unassigned',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.zones (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  crowd_density integer not null default 0 check (crowd_density between 0 and 100),
  status public.zone_status not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint zones_event_name_key unique (event_id, name)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants (id) on delete cascade,
  stall_id uuid not null references public.stalls (id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  total_price numeric(10, 2) not null default 0,
  status public.order_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sos_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  location jsonb not null default '{}'::jsonb,
  message text,
  status public.sos_status not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  message text not null,
  target_role public.app_role,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_profiles_event_id on public.profiles (event_id);
create index if not exists idx_events_admin_id on public.events (admin_id);
create index if not exists idx_events_event_code on public.events (event_code);
create index if not exists idx_participants_event_id on public.participants (event_id);
create index if not exists idx_participants_profile_id on public.participants (profile_id);
create index if not exists idx_vendors_event_id on public.vendors (event_id);
create index if not exists idx_vendors_profile_id on public.vendors (profile_id);
create index if not exists idx_stalls_event_id on public.stalls (event_id);
create index if not exists idx_stalls_vendor_id on public.stalls (vendor_id);
create index if not exists idx_zones_event_id on public.zones (event_id);
create index if not exists idx_orders_participant_id on public.orders (participant_id);
create index if not exists idx_orders_stall_id on public.orders (stall_id);
create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_sos_requests_event_id on public.sos_requests (event_id);
create index if not exists idx_sos_requests_user_id on public.sos_requests (user_id);
create index if not exists idx_notifications_event_id on public.notifications (event_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.generate_event_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  generated text;
begin
  loop
    generated := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
    exit when not exists (select 1 from public.events where event_code = generated);
  end loop;
  return generated;
end;
$$;

create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select p.role from public.profiles p where p.id = auth.uid()
$$;

create or replace function public.request_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid()
$$;

create or replace function public.current_event_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.event_id from public.profiles p where p.id = auth.uid()
$$;

create or replace function public.current_participant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select participant.id from public.participants participant where participant.profile_id = auth.uid()
$$;

create or replace function public.current_vendor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select vendor.id from public.vendors vendor where vendor.profile_id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_role() = 'admin', false)
$$;

create or replace function public.is_event_admin(target_event uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.events event
    where event.id = target_event
      and event.admin_id = auth.uid()
  )
$$;

create or replace function public.in_current_event(target_event uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_event_id() = target_event, false)
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone_number)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.phone
  )
  on conflict (id) do update
    set email = excluded.email,
        phone_number = coalesce(excluded.phone_number, public.profiles.phone_number),
        updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create or replace function public.apply_default_event_resources()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  zone_names text[] := array['Entry Gate', 'Food Court', 'Main Stage', 'Help Desk', 'Exit'];
  idx integer;
begin
  for idx in array_lower(zone_names, 1)..array_upper(zone_names, 1) loop
    insert into public.zones (event_id, name)
    values (new.id, zone_names[idx])
    on conflict (event_id, name) do nothing;
  end loop;

  for idx in 1..coalesce(new.number_of_stalls, 0)
  loop
    insert into public.stalls (event_id, name, location_zone, queue_time, status)
    values (
      new.id,
      format('Stall %s', idx),
      case when idx % 2 = 0 then 'Food Court' else 'Main Stage' end,
      0,
      'unassigned'
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists events_seed_defaults on public.events;

create trigger events_seed_defaults
after insert on public.events
for each row
execute function public.apply_default_event_resources();

create or replace function public.join_event(input_event_code text)
returns public.events
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_event public.events;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select *
  into matched_event
  from public.events
  where upper(event_code) = upper(trim(input_event_code));

  if matched_event.id is null then
    raise exception 'Invalid event code';
  end if;

  update public.profiles
  set event_id = matched_event.id,
      updated_at = timezone('utc', now())
  where id = auth.uid();

  return matched_event;
end;
$$;

create or replace function public.assign_stall_to_vendor(input_vendor_id uuid)
returns public.stalls
language plpgsql
security definer
set search_path = public
as $$
declare
  vendor_row public.vendors;
  assigned_stall public.stalls;
begin
  select *
  into vendor_row
  from public.vendors
  where id = input_vendor_id;

  if vendor_row.id is null then
    raise exception 'Vendor not found';
  end if;

  select *
  into assigned_stall
  from public.stalls
  where event_id = vendor_row.event_id
    and vendor_id is null
  order by created_at asc
  limit 1
  for update skip locked;

  if assigned_stall.id is null then
    raise exception 'No stalls available for this event';
  end if;

  update public.stalls
  set vendor_id = vendor_row.id,
      status = 'active',
      name = coalesce(nullif(vendor_row.stall_name, ''), assigned_stall.name),
      updated_at = timezone('utc', now())
  where id = assigned_stall.id
  returning * into assigned_stall;

  update public.vendors
  set stall_name = assigned_stall.name,
      updated_at = timezone('utc', now())
  where id = vendor_row.id;

  return assigned_stall;
end;
$$;

create or replace function public.assign_vendor_stall_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.assign_stall_to_vendor(new.id);
  return new;
end;
$$;

drop trigger if exists vendors_assign_stall on public.vendors;

create trigger vendors_assign_stall
after insert on public.vendors
for each row
execute function public.assign_vendor_stall_trigger();

create or replace function public.generate_qr_code(input_participant_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_token text;
begin
  next_token := encode(gen_random_bytes(24), 'hex');

  update public.participants
  set qr_token = next_token,
      updated_at = timezone('utc', now())
  where id = input_participant_id;

  if not found then
    raise exception 'Participant not found';
  end if;

  return next_token;
end;
$$;

create or replace function public.handle_sos_alert(
  input_event_id uuid,
  input_location jsonb,
  input_message text default null
)
returns public.sos_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_alert public.sos_requests;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if public.current_event_id() is distinct from input_event_id then
    raise exception 'You can only create alerts for your joined event';
  end if;

  insert into public.sos_requests (user_id, event_id, location, message)
  values (auth.uid(), input_event_id, coalesce(input_location, '{}'::jsonb), input_message)
  returning * into inserted_alert;

  insert into public.notifications (event_id, message, target_role)
  values (input_event_id, 'New SOS alert raised', 'admin');

  return inserted_alert;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at before update on public.events for each row execute function public.set_updated_at();

drop trigger if exists participants_set_updated_at on public.participants;
create trigger participants_set_updated_at before update on public.participants for each row execute function public.set_updated_at();

drop trigger if exists vendors_set_updated_at on public.vendors;
create trigger vendors_set_updated_at before update on public.vendors for each row execute function public.set_updated_at();

drop trigger if exists stalls_set_updated_at on public.stalls;
create trigger stalls_set_updated_at before update on public.stalls for each row execute function public.set_updated_at();

drop trigger if exists zones_set_updated_at on public.zones;
create trigger zones_set_updated_at before update on public.zones for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();

drop trigger if exists sos_requests_set_updated_at on public.sos_requests;
create trigger sos_requests_set_updated_at before update on public.sos_requests for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.participants enable row level security;
alter table public.vendors enable row level security;
alter table public.stalls enable row level security;
alter table public.zones enable row level security;
alter table public.orders enable row level security;
alter table public.sos_requests enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (
  id = (select public.request_user_id())
  or (public.is_admin() and public.in_current_event(event_id))
);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = (select public.request_user_id()))
with check (id = (select public.request_user_id()));

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (id = (select public.request_user_id()));

drop policy if exists "events_select_current_event" on public.events;
create policy "events_select_current_event"
on public.events
for select
to authenticated
using (
  admin_id = (select public.request_user_id())
  or public.in_current_event(id)
);

drop policy if exists "events_admin_insert" on public.events;
create policy "events_admin_insert"
on public.events
for insert
to authenticated
with check (
  public.current_role() = 'admin'
  and admin_id = (select public.request_user_id())
);

drop policy if exists "events_admin_update" on public.events;
create policy "events_admin_update"
on public.events
for update
to authenticated
using (public.is_event_admin(id))
with check (public.is_event_admin(id));

drop policy if exists "events_admin_delete" on public.events;
create policy "events_admin_delete"
on public.events
for delete
to authenticated
using (public.is_event_admin(id));

drop policy if exists "participants_select_self_or_admin" on public.participants;
create policy "participants_select_self_or_admin"
on public.participants
for select
to authenticated
using (
  profile_id = (select public.request_user_id())
  or public.is_event_admin(event_id)
);

drop policy if exists "participants_insert_self" on public.participants;
create policy "participants_insert_self"
on public.participants
for insert
to authenticated
with check (
  profile_id = (select public.request_user_id())
  and public.current_role() = 'participant'
  and public.in_current_event(event_id)
);

drop policy if exists "participants_update_self_or_admin" on public.participants;
create policy "participants_update_self_or_admin"
on public.participants
for update
to authenticated
using (
  profile_id = (select public.request_user_id())
  or public.is_event_admin(event_id)
)
with check (
  profile_id = (select public.request_user_id())
  or public.is_event_admin(event_id)
);

drop policy if exists "vendors_select_self_or_admin" on public.vendors;
create policy "vendors_select_self_or_admin"
on public.vendors
for select
to authenticated
using (
  profile_id = (select public.request_user_id())
  or public.is_event_admin(event_id)
);

drop policy if exists "vendors_insert_self" on public.vendors;
create policy "vendors_insert_self"
on public.vendors
for insert
to authenticated
with check (
  profile_id = (select public.request_user_id())
  and public.current_role() = 'vendor'
  and public.in_current_event(event_id)
);

drop policy if exists "vendors_update_self_or_admin" on public.vendors;
create policy "vendors_update_self_or_admin"
on public.vendors
for update
to authenticated
using (
  profile_id = (select public.request_user_id())
  or public.is_event_admin(event_id)
)
with check (
  profile_id = (select public.request_user_id())
  or public.is_event_admin(event_id)
);

drop policy if exists "stalls_select_same_event" on public.stalls;
create policy "stalls_select_same_event"
on public.stalls
for select
to authenticated
using (public.in_current_event(event_id));

drop policy if exists "stalls_admin_insert" on public.stalls;
create policy "stalls_admin_insert"
on public.stalls
for insert
to authenticated
with check (public.is_event_admin(event_id));

drop policy if exists "stalls_admin_or_vendor_update" on public.stalls;
create policy "stalls_admin_or_vendor_update"
on public.stalls
for update
to authenticated
using (
  public.is_event_admin(event_id)
  or vendor_id = public.current_vendor_id()
)
with check (
  public.is_event_admin(event_id)
  or vendor_id = public.current_vendor_id()
);

drop policy if exists "stalls_admin_delete" on public.stalls;
create policy "stalls_admin_delete"
on public.stalls
for delete
to authenticated
using (public.is_event_admin(event_id));

drop policy if exists "zones_select_same_event" on public.zones;
create policy "zones_select_same_event"
on public.zones
for select
to authenticated
using (public.in_current_event(event_id));

drop policy if exists "zones_admin_write" on public.zones;
drop policy if exists "zones_admin_insert" on public.zones;
create policy "zones_admin_insert"
on public.zones
for insert
to authenticated
with check (public.is_event_admin(event_id));

drop policy if exists "zones_admin_update" on public.zones;
create policy "zones_admin_update"
on public.zones
for update
to authenticated
using (public.is_event_admin(event_id))
with check (public.is_event_admin(event_id));

drop policy if exists "zones_admin_delete" on public.zones;
create policy "zones_admin_delete"
on public.zones
for delete
to authenticated
using (public.is_event_admin(event_id));

drop policy if exists "orders_select_by_actor" on public.orders;
create policy "orders_select_by_actor"
on public.orders
for select
to authenticated
using (
  participant_id = public.current_participant_id()
  or exists (
    select 1
    from public.stalls stall
    where stall.id = orders.stall_id
      and stall.vendor_id = public.current_vendor_id()
  )
  or exists (
    select 1
    from public.stalls stall
    where stall.id = orders.stall_id
      and public.is_event_admin(stall.event_id)
  )
);

drop policy if exists "orders_participant_insert" on public.orders;
create policy "orders_participant_insert"
on public.orders
for insert
to authenticated
with check (
  participant_id = public.current_participant_id()
  and exists (
    select 1
    from public.stalls stall
    where stall.id = orders.stall_id
      and public.in_current_event(stall.event_id)
  )
);

drop policy if exists "orders_vendor_or_admin_update" on public.orders;
create policy "orders_vendor_or_admin_update"
on public.orders
for update
to authenticated
using (
  exists (
    select 1
    from public.stalls stall
    where stall.id = orders.stall_id
      and (
        stall.vendor_id = public.current_vendor_id()
        or public.is_event_admin(stall.event_id)
      )
  )
)
with check (
  exists (
    select 1
    from public.stalls stall
    where stall.id = orders.stall_id
      and (
        stall.vendor_id = public.current_vendor_id()
        or public.is_event_admin(stall.event_id)
      )
  )
);

drop policy if exists "sos_select_self_or_admin" on public.sos_requests;
create policy "sos_select_self_or_admin"
on public.sos_requests
for select
to authenticated
using (
  user_id = (select public.request_user_id())
  or public.is_event_admin(event_id)
);

drop policy if exists "sos_insert_self" on public.sos_requests;
create policy "sos_insert_self"
on public.sos_requests
for insert
to authenticated
with check (
  user_id = (select public.request_user_id())
  and public.in_current_event(event_id)
);

drop policy if exists "sos_admin_update" on public.sos_requests;
create policy "sos_admin_update"
on public.sos_requests
for update
to authenticated
using (public.is_event_admin(event_id))
with check (public.is_event_admin(event_id));

drop policy if exists "notifications_select_target_role" on public.notifications;
create policy "notifications_select_target_role"
on public.notifications
for select
to authenticated
using (
  public.in_current_event(event_id)
  and (target_role is null or target_role = public.current_role())
);

drop policy if exists "notifications_admin_write" on public.notifications;
drop policy if exists "notifications_admin_insert" on public.notifications;
create policy "notifications_admin_insert"
on public.notifications
for insert
to authenticated
with check (public.is_event_admin(event_id));

drop policy if exists "notifications_admin_update" on public.notifications;
create policy "notifications_admin_update"
on public.notifications
for update
to authenticated
using (public.is_event_admin(event_id))
with check (public.is_event_admin(event_id));

drop policy if exists "notifications_admin_delete" on public.notifications;
create policy "notifications_admin_delete"
on public.notifications
for delete
to authenticated
using (public.is_event_admin(event_id));

grant execute on function public.join_event(text) to authenticated;
grant execute on function public.handle_sos_alert(uuid, jsonb, text) to authenticated;
grant execute on function public.generate_event_code() to authenticated;
grant execute on function public.assign_stall_to_vendor(uuid) to service_role;
grant execute on function public.generate_qr_code(uuid) to service_role;

revoke execute on function public.assign_stall_to_vendor(uuid) from public;
revoke execute on function public.generate_qr_code(uuid) from public;

insert into storage.buckets (id, name, public)
values
  ('qr_codes', 'qr_codes', false),
  ('event_assets', 'event_assets', true),
  ('vendor_docs', 'vendor_docs', false),
  ('participant_docs', 'participant_docs', false)
on conflict (id) do nothing;

drop policy if exists "qr_codes_select_owner" on storage.objects;
create policy "qr_codes_select_owner"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'qr_codes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "qr_codes_insert_owner" on storage.objects;
create policy "qr_codes_insert_owner"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'qr_codes'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "participant_docs_access_owner" on storage.objects;
create policy "participant_docs_access_owner"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'participant_docs'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'participant_docs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "vendor_docs_access_owner" on storage.objects;
create policy "vendor_docs_access_owner"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'vendor_docs'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'vendor_docs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "event_assets_select_current_event" on storage.objects;
create policy "event_assets_select_current_event"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'event_assets'
  and (storage.foldername(name))[1] = public.current_event_id()::text
);

drop policy if exists "event_assets_admin_write" on storage.objects;
create policy "event_assets_admin_write"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'event_assets'
  and public.is_event_admin(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'event_assets'
  and public.is_event_admin(((storage.foldername(name))[1])::uuid)
);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'zones'
  ) then
    alter publication supabase_realtime add table public.zones;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sos_requests'
  ) then
    alter publication supabase_realtime add table public.sos_requests;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$$;
