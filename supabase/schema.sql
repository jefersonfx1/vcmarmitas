-- ============================================================
-- VC Marmitas - Schema Supabase
-- Rode este SQL no SQL Editor do Supabase (Dashboard → SQL)
-- ============================================================

-- Produtos (marmitas)
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null,
  image_url text,
  category text not null check (category in ('tradicional', 'fitness', 'vegetariana')),
  calories integer,
  weight text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Pedidos
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  customer_cpf text,
  address_street text not null,
  address_number text not null,
  address_complement text,
  address_neighborhood text,
  address_city text,
  address_cep text not null,
  total numeric(10,2) not null,
  status text not null default 'pendente'
    check (status in ('pendente', 'confirmado', 'preparando', 'enviado', 'entregue', 'cancelado')),
  asaas_checkout_id text,
  asaas_payment_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Itens do pedido
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  product_price numeric(10,2) not null,
  quantity integer not null check (quantity > 0)
);

-- Índices úteis
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created_at on orders(created_at desc);
create index if not exists idx_order_items_order_id on order_items(order_id);
create index if not exists idx_products_category on products(category);
create index if not exists idx_products_active on products(active);

-- Atualiza updated_at automaticamente
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists orders_updated_at on orders;
create trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

-- RLS (Row Level Security) - por enquanto aberto para service_role
-- Depois protegemos com auth
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Políticas temporárias (leitura pública de produtos ativos)
create policy "Produtos ativos são públicos"
  on products for select
  using (active = true);

-- Service role bypassa RLS automaticamente.
-- Policies de insert/update serão adicionadas com auth.

-- Seed inicial de produtos (opcional)
insert into products (name, description, price, image_url, category, calories, weight) values
  ('Frango Grelhado com Legumes', 'Peito de frango grelhado, arroz integral, brócolis e cenoura.', 22.90, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop', 'fitness', 380, '400g'),
  ('Strogonoff de Frango', 'Strogonoff cremoso de frango com arroz e batata palha.', 24.90, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&h=400&fit=crop', 'tradicional', 520, '450g'),
  ('Feijoada Light', 'Feijoada com menos gordura, acompanhada de arroz e farofa.', 26.90, 'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=600&h=400&fit=crop', 'tradicional', 480, '450g'),
  ('Salmão com Quinoa', 'Filé de salmão grelhado, quinoa e legumes no vapor.', 34.90, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=400&fit=crop', 'fitness', 420, '400g'),
  ('Risoto de Cogumelos', 'Risoto cremoso de cogumelos frescos e parmesão.', 27.90, 'https://images.unsplash.com/photo-1476124369491-e7addf8db027?w=600&h=400&fit=crop', 'vegetariana', 450, '400g'),
  ('Carne Assada com Purê', 'Carne bovina assada, purê de batata e salada verde.', 28.90, 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600&h=400&fit=crop', 'tradicional', 560, '450g')
on conflict do nothing;
