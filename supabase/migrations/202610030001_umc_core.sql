-- UMC: Ultimate Menfe Championship · core schema
create extension if not exists pgcrypto;
create type public.fighter_gender as enum ('masculino','feminino');
create type public.victory_type as enum ('knockout_round_1','submission','points');
create type public.event_stage as enum ('qualificatoria','main_event','unificacao');
create table public.teams(id uuid primary key default gen_random_uuid(),name text not null unique,manager_name text,created_at timestamptz not null default now());
create table public.fighters(id uuid primary key default gen_random_uuid(),user_id uuid unique references auth.users(id) on delete set null,name text not null,gender public.fighter_gender not null,style text not null check(style in ('Jiu-Jitsu','Karatê','Muay Thai','Kickboxing','Wrestling','Taekwondo')),team_id uuid references public.teams(id) on delete set null,avatar_path text,active boolean not null default true,created_at timestamptz not null default now());
create table public.events(id uuid primary key default gen_random_uuid(),stage public.event_stage not null unique,title text not null,vgv_goal numeric(14,2) not null check(vgv_goal>0),belt_name text not null,prize_label text,starts_at timestamptz,ends_at timestamptz,created_at timestamptz not null default now());
insert into public.events(stage,title,vgv_goal,belt_name,prize_label,starts_at,ends_at) values
('qualificatoria','Evento 01 · Qualificatória',2500000,'Cinturão Qualifier','Primeira venda do executivo: R$ 500','2026-10-01 00:00:00-03','2026-10-31 23:59:59-03'),
('main_event','Evento 02 · Main Event',3500000,'Cinturão Main Event','Premiação da Meta 2','2026-10-01 00:00:00-03','2026-10-31 23:59:59-03'),
('unificacao','Evento 03 · Luta pelo Cinturão Unificado',5000000,'Cinturão Unificado','Grande final','2026-10-01 00:00:00-03','2026-10-31 23:59:59-03');
create table public.sales(id uuid primary key default gen_random_uuid(),fighter_id uuid not null references public.fighters(id),vgv numeric(14,2) not null check(vgv>0),sale_at timestamptz not null default now(),victory public.victory_type not null,round_label text,opponent_note text,created_by uuid references auth.users(id),created_at timestamptz not null default now());
create table public.event_winners(id uuid primary key default gen_random_uuid(),event_id uuid not null references public.events(id),fighter_id uuid not null references public.fighters(id),vgv_at_award numeric(14,2) not null,awarded_at timestamptz not null default now(),unique(event_id));
create table public.reward_rules(id uuid primary key default gen_random_uuid(),name text not null,amount numeric(12,2) not null check(amount>=0),condition jsonb not null default '{}',active boolean not null default true);
insert into public.reward_rules(name,amount,condition) values('Primeira vitória do executivo no mês',500,'{"type":"first_sale_month"}');
create table public.profiles(user_id uuid primary key references auth.users(id) on delete cascade,role text not null default 'fighter' check(role in ('admin','manager','fighter')),fighter_id uuid references public.fighters(id),created_at timestamptz not null default now());
create table public.reward_awards(id uuid primary key default gen_random_uuid(),fighter_id uuid not null references public.fighters(id),reward_rule_id uuid not null references public.reward_rules(id),sale_id uuid references public.sales(id),amount numeric(12,2) not null,awarded_at timestamptz not null default now(),period_start date not null,unique(fighter_id,reward_rule_id,period_start));
alter table public.reward_awards enable row level security;
create policy "authenticated read reward awards" on public.reward_awards for select to authenticated using(true);
create policy "admins manage reward awards" on public.reward_awards for all to authenticated using(public.is_umc_admin()) with check(public.is_umc_admin());
create or replace function public.umc_award_first_sale() returns trigger language plpgsql security definer set search_path=public as $$
declare month_start date; rule_id uuid; reward_amount numeric(12,2);
begin
 month_start := date_trunc('month', new.sale_at)::date;
 select id,amount into rule_id,reward_amount from public.reward_rules where name='Primeira vitória do executivo no mês' and active=true limit 1;
 if rule_id is not null and not exists(select 1 from public.sales where fighter_id=new.fighter_id and id<>new.id and sale_at>=month_start and sale_at<month_start+interval '1 month') then
  insert into public.reward_awards(fighter_id,reward_rule_id,sale_id,amount,period_start) values(new.fighter_id,rule_id,new.id,reward_amount,month_start) on conflict(fighter_id,reward_rule_id,period_start) do nothing;
 end if;
 return new;
end; $$;
create trigger umc_first_sale_reward after insert on public.sales for each row execute function public.umc_award_first_sale();
create or replace function public.umc_award_event_winners() returns trigger language plpgsql security definer set search_path=public as $$
declare ev record; operation_total numeric(14,2); winner uuid; winner_total numeric(14,2);
begin
 for ev in select * from public.events where new.sale_at::date between coalesce(starts_at::date,new.sale_at::date) and coalesce(ends_at::date,new.sale_at::date) order by vgv_goal loop
  select coalesce(sum(vgv),0) into operation_total from public.sales where sale_at::date between coalesce(ev.starts_at::date,new.sale_at::date) and coalesce(ev.ends_at::date,new.sale_at::date);
  if operation_total>=ev.vgv_goal and not exists(select 1 from public.event_winners where event_id=ev.id) then
   select fighter_id,sum(vgv) into winner,winner_total from public.sales where sale_at::date between coalesce(ev.starts_at::date,new.sale_at::date) and coalesce(ev.ends_at::date,new.sale_at::date) group by fighter_id order by sum(vgv) desc,fighter_id limit 1;
   if winner is not null then insert into public.event_winners(event_id,fighter_id,vgv_at_award) values(ev.id,winner,winner_total) on conflict(event_id) do nothing; end if;
  end if;
 end loop;
 return new;
end; $$;
create trigger umc_event_winner after insert on public.sales for each row execute function public.umc_award_event_winners();
create or replace view public.fighter_standings as select f.id,f.name,f.gender,f.style,f.team_id,f.avatar_path,count(s.id)::int as sales_count,coalesce(sum(s.vgv),0)::numeric(14,2) as total_vgv,case when count(s.id)>=5 then 'peso pesado' when count(s.id)>=3 then 'meio-pesado' when count(s.id)>=1 then 'peso leve' else 'estreante' end as weight_class from public.fighters f left join public.sales s on s.fighter_id=f.id group by f.id;
create or replace function public.is_umc_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where user_id=auth.uid() and role in ('admin','manager')); $$;
alter table public.teams enable row level security; alter table public.fighters enable row level security; alter table public.events enable row level security; alter table public.sales enable row level security; alter table public.event_winners enable row level security; alter table public.reward_rules enable row level security; alter table public.profiles enable row level security;
create policy "authenticated read teams" on public.teams for select to authenticated using(true);
create policy "authenticated read fighters" on public.fighters for select to authenticated using(true);
create policy "admins manage teams" on public.teams for all to authenticated using(public.is_umc_admin()) with check(public.is_umc_admin());
create policy "admins manage fighters" on public.fighters for all to authenticated using(public.is_umc_admin()) with check(public.is_umc_admin());
create policy "authenticated read events" on public.events for select to authenticated using(true);
create policy "admins manage events" on public.events for all to authenticated using(public.is_umc_admin()) with check(public.is_umc_admin());
create policy "authenticated read sales" on public.sales for select to authenticated using(true);
create policy "admins insert sales" on public.sales for insert to authenticated with check(public.is_umc_admin());
create policy "admins update sales" on public.sales for update to authenticated using(public.is_umc_admin()) with check(public.is_umc_admin());
create policy "authenticated read winners" on public.event_winners for select to authenticated using(true);
create policy "admins manage winners" on public.event_winners for all to authenticated using(public.is_umc_admin()) with check(public.is_umc_admin());
create policy "authenticated read rewards" on public.reward_rules for select to authenticated using(true);
create policy "admins manage rewards" on public.reward_rules for all to authenticated using(public.is_umc_admin()) with check(public.is_umc_admin());
create policy "users read own profile or admins all" on public.profiles for select to authenticated using(user_id=auth.uid() or public.is_umc_admin());
create policy "admins manage profiles" on public.profiles for all to authenticated using(public.is_umc_admin()) with check(public.is_umc_admin());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('fighter-avatars','fighter-avatars',false,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy "authenticated view fighter avatars" on storage.objects for select to authenticated using(bucket_id='fighter-avatars');
create policy "users upload own fighter avatar" on storage.objects for insert to authenticated with check(bucket_id='fighter-avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "users update own fighter avatar" on storage.objects for update to authenticated using(bucket_id='fighter-avatars' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='fighter-avatars' and (storage.foldername(name))[1]=auth.uid()::text);
