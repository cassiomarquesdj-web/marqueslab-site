-- Marques Lab — schema inicial
-- Papéis: admin (tudo), editor (conteúdo), sales (orçamentos e clientes).


-- ───────────── tipos ─────────────
create type public.publish_status as enum ('draft', 'published');
create type public.lead_status as enum (
  'novo', 'em_analise', 'aguardando_informacoes', 'proposta_enviada',
  'aprovado', 'em_producao', 'concluido', 'cancelado'
);
create type public.product_status as enum (
  'em_desenvolvimento', 'em_testes', 'disponivel', 'em_evolucao', 'experimental'
);

-- ───────────── utilidades ─────────────
create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ───────────── papéis e perfis ─────────────
create table public.roles (
  key text primary key,
  label text not null
);
insert into public.roles (key, label) values
  ('admin', 'Administrador'),
  ('editor', 'Editor'),
  ('sales', 'Gerente comercial');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'editor' references public.roles (key),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

create function public.app_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create function public.has_role(allowed text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.app_role() = any (allowed), false)
$$;

-- O primeiro usuário criado vira administrador; os demais entram como editor.
-- Desative o cadastro público no Supabase Auth e convide usuários pelo painel.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    case when exists (select 1 from public.profiles where role = 'admin')
         then 'editor' else 'admin' end
  );
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────── conteúdo ─────────────
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  sort integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger clients_updated before update on public.clients
  for each row execute function public.set_updated_at();

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  category_id uuid references public.categories (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  show_client boolean not null default false,
  description text,
  process text,
  result text,
  cover_url text,
  video_url text,
  featured boolean not null default false,
  sort integer not null default 0,
  status public.publish_status not null default 'draft',
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_status_sort_idx on public.projects (status, sort);
create index projects_category_idx on public.projects (category_id);
create index projects_client_idx on public.projects (client_id);
create trigger projects_updated before update on public.projects
  for each row execute function public.set_updated_at();

create table public.project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  kind text not null default 'image' check (kind in ('image', 'video')),
  url text not null,
  caption text,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);
create index project_media_project_idx on public.project_media (project_id, sort);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  category text not null,
  tagline text,
  summary text,
  banner_url text,
  benefits jsonb not null default '[]',
  faq jsonb not null default '[]',
  sort integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger services_updated before update on public.services
  for each row execute function public.set_updated_at();

create table public.service_items (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  title text not null,
  sort integer not null default 0
);
create index service_items_service_idx on public.service_items (service_id, sort);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  status public.product_status not null default 'em_desenvolvimento',
  summary text,
  description text,
  features text[] not null default '{}',
  cover_url text,
  sort integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger products_updated before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  kind text not null default 'image' check (kind in ('image', 'video')),
  url text not null,
  caption text,
  sort integer not null default 0
);
create index product_media_product_idx on public.product_media (product_id, sort);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text,
  subtitle text,
  cta_label text,
  cta_url text,
  cta2_label text,
  cta2_url text,
  image_url text,
  video_url text,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
create trigger banners_updated before update on public.banners
  for each row execute function public.set_updated_at();

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  kind text not null default 'article' check (kind in ('article', 'page')),
  excerpt text,
  body text,
  cover_url text,
  status public.publish_status not null default 'draft',
  seo_title text,
  seo_description text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index articles_status_idx on public.articles (status, published_at desc);
create trigger articles_updated before update on public.articles
  for each row execute function public.set_updated_at();

create table public.site_settings (
  key text primary key,
  value jsonb not null default '""',
  updated_at timestamptz not null default now()
);
create trigger site_settings_updated before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ───────────── orçamentos ─────────────
create sequence public.lead_seq;

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  protocol text not null unique
    default ('ML-' || lpad(nextval('public.lead_seq')::text, 6, '0')),
  name text not null check (char_length(name) between 2 and 120),
  company text,
  whatsapp text not null check (char_length(whatsapp) between 8 and 30),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  category text not null,
  description text not null check (char_length(description) between 10 and 5000),
  deadline text,
  budget text,
  attachments jsonb not null default '[]',
  status public.lead_status not null default 'novo',
  notes text,
  client_id uuid references public.clients (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_status_idx on public.leads (status, created_at desc);
create index leads_client_idx on public.leads (client_id);
create trigger leads_updated before update on public.leads
  for each row execute function public.set_updated_at();

create table public.lead_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  author uuid references auth.users (id) on delete set null,
  action text not null,
  from_status public.lead_status,
  to_status public.lead_status,
  note text,
  created_at timestamptz not null default now()
);
create index lead_history_lead_idx on public.lead_history (lead_id, created_at desc);

create function public.log_lead_changes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.lead_history (lead_id, author, action, to_status)
    values (new.id, auth.uid(), 'created', new.status);
  else
    if new.status is distinct from old.status then
      insert into public.lead_history (lead_id, author, action, from_status, to_status)
      values (new.id, auth.uid(), 'status', old.status, new.status);
    end if;
    if new.notes is distinct from old.notes then
      insert into public.lead_history (lead_id, author, action, note)
      values (new.id, auth.uid(), 'note', new.notes);
    end if;
  end if;
  return new;
end $$;
create trigger leads_history after insert or update on public.leads
  for each row execute function public.log_lead_changes();

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id text,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index activity_logs_created_idx on public.activity_logs (created_at desc);

-- ───────────── RLS ─────────────
alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.project_media enable row level security;
alter table public.services enable row level security;
alter table public.service_items enable row level security;
alter table public.products enable row level security;
alter table public.product_media enable row level security;
alter table public.banners enable row level security;
alter table public.articles enable row level security;
alter table public.site_settings enable row level security;
alter table public.leads enable row level security;
alter table public.lead_history enable row level security;
alter table public.activity_logs enable row level security;

-- Leitura pública apenas do conteúdo publicado/ativo.
create policy roles_read on public.roles for select to authenticated using (true);
create policy categories_public on public.categories for select to anon, authenticated using (active);
create policy projects_public on public.projects for select to anon, authenticated
  using (status = 'published');
create policy project_media_public on public.project_media for select to anon, authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.status = 'published'));
create policy services_public on public.services for select to anon, authenticated using (active);
create policy service_items_public on public.service_items for select to anon, authenticated
  using (exists (select 1 from public.services s where s.id = service_id and s.active));
create policy products_public on public.products for select to anon, authenticated using (published);
create policy product_media_public on public.product_media for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.published));
create policy banners_public on public.banners for select to anon, authenticated using (active);
create policy articles_public on public.articles for select to anon, authenticated
  using (status = 'published');
create policy settings_public on public.site_settings for select to anon, authenticated using (true);

-- Conteúdo: administrador e editor.
do $$
declare t text;
begin
  foreach t in array array[
    'categories','projects','project_media','services','service_items',
    'products','product_media','banners','articles'
  ] loop
    execute format(
      'create policy %I on public.%I for all to authenticated
         using (public.has_role(array[''admin'',''editor'']))
         with check (public.has_role(array[''admin'',''editor'']))',
      t || '_staff', t);
  end loop;
end $$;

-- Configurações: somente administrador escreve.
create policy settings_admin on public.site_settings for all to authenticated
  using (public.has_role(array['admin'])) with check (public.has_role(array['admin']));

-- Comercial: administrador e gerente comercial.
create policy clients_sales on public.clients for all to authenticated
  using (public.has_role(array['admin','sales']))
  with check (public.has_role(array['admin','sales']));
create policy leads_sales on public.leads for all to authenticated
  using (public.has_role(array['admin','sales']))
  with check (public.has_role(array['admin','sales']));
create policy lead_history_sales on public.lead_history for select to authenticated
  using (public.has_role(array['admin','sales']));
-- Editores precisam listar clientes ao vincular projetos.
create policy clients_editor_read on public.clients for select to authenticated
  using (public.has_role(array['editor']));

-- Perfis: cada um vê o próprio; administrador gerencia todos.
create policy profiles_self on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_admin on public.profiles for all to authenticated
  using (public.has_role(array['admin'])) with check (public.has_role(array['admin']));

-- Atividades: qualquer membro da equipe registra e lê.
create policy activity_read on public.activity_logs for select to authenticated
  using (public.has_role(array['admin','editor','sales']));
create policy activity_insert on public.activity_logs for insert to authenticated
  with check (user_id = auth.uid() and public.has_role(array['admin','editor','sales']));

-- Orçamentos públicos entram apenas pela API (service role); não há política de insert anônimo.

-- ───────────── storage ─────────────
insert into storage.buckets (id, name, public) values
  ('media', 'media', true),
  ('lead-references', 'lead-references', false)
on conflict (id) do nothing;

create policy media_public_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'media');
create policy media_staff_write on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.has_role(array['admin','editor']));
create policy media_staff_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.has_role(array['admin','editor']));
create policy media_staff_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.has_role(array['admin','editor']));
create policy lead_refs_read on storage.objects for select to authenticated
  using (bucket_id = 'lead-references' and public.has_role(array['admin','sales']));
