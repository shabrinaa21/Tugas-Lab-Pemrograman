-- BOOKITA v2 — Supabase schema
-- Jalankan seluruh script ini di Supabase Dashboard > SQL Editor > New query.
create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration_minutes integer not null check (duration_minutes between 15 and 480),
  price numeric(12,2) not null default 0 check (price >= 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  booking_code text not null unique,
  customer_name text not null,
  phone text not null,
  service_id uuid references public.services(id),
  staff_id uuid references public.staff(id),
  service_name text not null,
  staff_name text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'confirmed' check (status in ('pending','confirmed','completed','cancelled','no_show')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','dp_paid','paid','refunded')),
  notes text,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

-- Hard database-level protection: one stylist cannot have overlapping active appointments.
do $$ begin
  alter table public.appointments add constraint appointments_no_staff_overlap
  exclude using gist (staff_id with =, tstzrange(starts_at, ends_at, '[)') with &&)
  where (status not in ('cancelled','no_show'));
exception when duplicate_object then null;
end $$;

alter table public.services enable row level security;
alter table public.staff enable row level security;
alter table public.appointments enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Public can read active services" on public.services;
create policy "Public can read active services" on public.services for select to anon, authenticated using (is_active = true);
drop policy if exists "Public can read active staff" on public.staff;
create policy "Public can read active staff" on public.staff for select to anon, authenticated using (is_active = true);
drop policy if exists "Admins can manage services" on public.services;
create policy "Admins can manage services" on public.services for all to authenticated using (exists(select 1 from public.admin_users a where a.user_id=auth.uid())) with check (exists(select 1 from public.admin_users a where a.user_id=auth.uid()));
drop policy if exists "Admins can manage staff" on public.staff;
create policy "Admins can manage staff" on public.staff for all to authenticated using (exists(select 1 from public.admin_users a where a.user_id=auth.uid())) with check (exists(select 1 from public.admin_users a where a.user_id=auth.uid()));
drop policy if exists "Admins can read appointments" on public.appointments;
create policy "Admins can read appointments" on public.appointments for select to authenticated using (exists(select 1 from public.admin_users a where a.user_id=auth.uid()));
drop policy if exists "Admins can update appointments" on public.appointments;
create policy "Admins can update appointments" on public.appointments for update to authenticated using (exists(select 1 from public.admin_users a where a.user_id=auth.uid())) with check (exists(select 1 from public.admin_users a where a.user_id=auth.uid()));
drop policy if exists "Admins can read themselves" on public.admin_users;
create policy "Admins can read themselves" on public.admin_users for select to authenticated using (user_id=auth.uid());

create or replace function public.get_available_slots(p_service_id uuid,p_staff_id uuid,p_date date)
returns table(slot_start timestamptz)
language plpgsql security definer set search_path=public
as $$
declare v_duration integer; v_start timestamptz; v_end timestamptz; v_slot timestamptz;
begin
  select duration_minutes into v_duration from services where id=p_service_id and is_active=true;
  if v_duration is null or not exists(select 1 from staff where id=p_staff_id and is_active=true) then return; end if;
  v_start := (p_date::text || ' 09:00:00')::timestamp at time zone 'Asia/Jakarta';
  v_end := (p_date::text || ' 18:00:00')::timestamp at time zone 'Asia/Jakarta';
  v_slot := v_start;
  while v_slot + make_interval(mins=>v_duration) <= v_end loop
    if not exists(select 1 from appointments a where a.staff_id=p_staff_id and a.status not in ('cancelled','no_show') and tstzrange(a.starts_at,a.ends_at,'[)') && tstzrange(v_slot,v_slot+make_interval(mins=>v_duration),'[)')) then
      slot_start := v_slot; return next;
    end if;
    v_slot := v_slot + interval '30 minutes';
  end loop;
end $$;

create or replace function public.create_booking(p_customer_name text,p_phone text,p_service_id uuid,p_staff_id uuid,p_start_at timestamptz,p_notes text default '')
returns jsonb language plpgsql security definer set search_path=public,extensions
as $$
declare v_service services%rowtype; v_staff staff%rowtype; v_end timestamptz; v_code text; v_id uuid;
begin
  if length(trim(coalesce(p_customer_name,'')))<2 or length(trim(coalesce(p_phone,'')))<8 then raise exception 'Nama dan nomor WhatsApp harus valid.'; end if;
  select * into v_service from services where id=p_service_id and is_active=true;
  if not found then raise exception 'Layanan tidak tersedia.'; end if;
  select * into v_staff from staff where id=p_staff_id and is_active=true;
  if not found then raise exception 'Stylist tidak tersedia.'; end if;
  if p_start_at <= now() then raise exception 'Pilih jadwal di masa mendatang.'; end if;
  if (p_start_at at time zone 'Asia/Jakarta')::time < time '09:00' or (p_start_at at time zone 'Asia/Jakarta')::time >= time '18:00' then raise exception 'Di luar jam operasional.'; end if;
  v_end := p_start_at + make_interval(mins=>v_service.duration_minutes);
  v_code := 'BK' || upper(substr(encode(gen_random_bytes(6),'hex'),1,10));
  insert into appointments(booking_code,customer_name,phone,service_id,staff_id,service_name,staff_name,starts_at,ends_at,notes)
  values(v_code,trim(p_customer_name),trim(p_phone),p_service_id,p_staff_id,v_service.name,v_staff.name,p_start_at,v_end,nullif(trim(coalesce(p_notes,'')),''))
  returning id into v_id;
  return jsonb_build_object('id',v_id,'booking_code',v_code,'customer_name',trim(p_customer_name),'service_name',v_service.name,'staff_name',v_staff.name,'starts_at',p_start_at,'status','confirmed');
exception when exclusion_violation then
  raise exception 'Slot baru saja dipesan pelanggan lain. Silakan pilih jam berbeda.';
end $$;

create or replace function public.lookup_booking(p_booking_code text,p_phone text)
returns jsonb language sql security definer set search_path=public
as $$
  select jsonb_build_object('booking_code',booking_code,'service_name',service_name,'staff_name',staff_name,'starts_at',starts_at,'status',status)
  from appointments where upper(booking_code)=upper(trim(p_booking_code)) and regexp_replace(phone,'[^0-9]','','g')=regexp_replace(trim(p_phone),'[^0-9]','','g') limit 1;
$$;

revoke all on function public.get_available_slots(uuid,uuid,date) from public;
revoke all on function public.create_booking(text,text,uuid,uuid,timestamptz,text) from public;
revoke all on function public.lookup_booking(text,text) from public;
grant execute on function public.get_available_slots(uuid,uuid,date) to anon,authenticated;
grant execute on function public.create_booking(text,text,uuid,uuid,timestamptz,text) to anon,authenticated;
grant execute on function public.lookup_booking(text,text) to anon,authenticated;

-- Seed contoh layanan dan stylist. Hapus/ubah sesuai salon.
insert into public.services(name,description,duration_minutes,price,image_url) values
('Make Up Look','Make up natural hingga glam untuk berbagai acara.',90,350000,'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=700&q=80'),
('Hair Styling','Blow, curl, dan styling dengan hasil profesional.',60,250000,'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=700&q=80'),
('Nail Art','Perawatan kuku dan nail art dengan desain cantik.',60,200000,'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=700&q=80'),
('Facial Treatment','Deep cleansing untuk kulit terasa lebih segar.',60,300000,'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=700&q=80')
on conflict do nothing;
insert into public.staff(name,role) values ('Victoria Bair','Senior Beauty Specialist'),('Alexandra Sel','Nail Specialist'),('Laura Martin','Beauty Specialist')
on conflict do nothing;

-- Setelah membuat user admin melalui Authentication > Users, jalankan:
-- insert into public.admin_users(user_id) values ('PASTE-AUTH-USER-UUID-HERE');
