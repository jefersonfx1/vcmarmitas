-- ============================================================
-- VC Marmitas - Categorias + suporte a upload de imagens
-- Rode no SQL Editor do Supabase
-- ============================================================

-- 1) Tabela de categorias (administrável pelo painel)
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Seed das categorias atuais
insert into categories (slug, name, sort_order) values
  ('tradicional', 'Tradicional', 1),
  ('fitness', 'Fitness', 2),
  ('vegetariana', 'Vegetariana', 3)
on conflict (slug) do nothing;

-- 2) Remover check rígido de category em products (permite categorias novas)
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where table_name = 'products' and constraint_type = 'CHECK'
      and constraint_name like '%category%'
  ) then
    alter table products drop constraint if exists products_category_check;
  end if;
exception when others then
  -- tenta pelo nome padrão do Postgres
  begin
    alter table products drop constraint if exists products_category_check;
  exception when others then null;
  end;
end $$;

-- Garante colunas úteis
alter table products add column if not exists sort_order integer not null default 0;

create index if not exists idx_categories_active on categories(active);
create index if not exists idx_categories_sort on categories(sort_order);

alter table categories enable row level security;

-- Leitura pública de categorias ativas
drop policy if exists "Categorias ativas são públicas" on categories;
create policy "Categorias ativas são públicas"
  on categories for select
  using (active = true);

-- ============================================================
-- 3) Storage (bucket de imagens de produtos)
-- No Dashboard → Storage → New bucket:
--   Nome: product-images
--   Public: SIM
-- Ou rode via API/dashboard. Políticas abaixo (opcional se bucket público):
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
-- on conflict (id) do nothing;
