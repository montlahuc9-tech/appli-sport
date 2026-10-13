-- ============================================================
--  Appli Sport : à coller UNE fois dans Supabase > SQL Editor > Run
-- ============================================================

-- 1) Les membres : qui a le droit d'utiliser l'appli
create table if not exists public.membres (
  email   text primary key,
  prenom  text,
  actif   boolean not null default false,   -- false = en attente ou bloqué
  test    boolean not null default false,   -- true = a accès à la version TEST
  role    text not null default 'membre',   -- 'admin' = Alex
  jusqu_au date,                            -- fin de l'accès gratuit (vide = sans limite)
  ajoute  timestamptz not null default now()
);

-- 2) L'interrupteur général de l'appli
create table if not exists public.appli (
  id       int primary key default 1,
  ouverte  boolean not null default true,
  message  text not null default ''
);
insert into public.appli (id) values (1) on conflict do nothing;
alter table public.membres add column if not exists jusqu_au date;

-- 3) Les séances et réglages de chaque personne (séparés entre version test et version amis)
create table if not exists public.donnees (
  user_id  uuid not null references auth.users on delete cascade,
  env      text not null default 'prod',
  email    text, prenom text,
  contenu  jsonb not null default '{}'::jsonb,
  maj      timestamptz default now(),
  primary key (user_id, env)
);

-- Alex est l'administrateur (changer l'adresse si besoin)
insert into public.membres (email, prenom, actif, test, role)
values ('montlahuc9@gmail.com', 'Alex', true, true, 'admin')
on conflict (email) do update set actif = true, test = true, role = 'admin';

-- Petites fonctions de contrôle
create or replace function public.mon_email() returns text language sql stable as $$ select lower(coalesce(auth.jwt()->>'email', '')) $$;
create or replace function public.est_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from membres where email = mon_email() and role = 'admin' and actif) $$;
create or replace function public.est_actif() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from membres where email = mon_email() and actif and (role = 'admin' or ((jusqu_au is null or jusqu_au >= current_date) and (select ouverte from appli where id = 1)))) $$;

-- Sécurité : chacun ne voit que ce qui le concerne, Alex voit et gère tout
alter table public.membres enable row level security;
alter table public.appli   enable row level security;
alter table public.donnees enable row level security;

drop policy if exists "membres lire" on public.membres;
drop policy if exists "membres demande" on public.membres;
drop policy if exists "membres admin" on public.membres;
create policy "membres lire"    on public.membres for select using (email = mon_email() or est_admin());
create policy "membres demande" on public.membres for insert with check (email = mon_email() and actif = false and test = false and role = 'membre' and jusqu_au is null);
create policy "membres admin"   on public.membres for all using (est_admin()) with check (est_admin());

drop policy if exists "appli lire" on public.appli;
drop policy if exists "appli admin" on public.appli;
create policy "appli lire"  on public.appli for select using (true);
create policy "appli admin" on public.appli for update using (est_admin()) with check (est_admin());

drop policy if exists "donnees perso" on public.donnees;
drop policy if exists "donnees admin" on public.donnees;
create policy "donnees perso" on public.donnees for all using (auth.uid() = user_id and est_actif()) with check (auth.uid() = user_id and est_actif());
create policy "donnees admin" on public.donnees for delete using (est_admin());
