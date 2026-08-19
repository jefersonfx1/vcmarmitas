-- Rode no SQL Editor do Supabase (atualização de cupons)

-- Novos campos na tabela coupons
alter table coupons add column if not exists applies_to text not null default 'order'
  check (applies_to in ('order', 'freight', 'both'));

alter table coupons add column if not exists per_user_limit int;
-- null = sem limite por usuário | 1 = uso único por usuário

alter table coupons add column if not exists first_purchase_only boolean not null default false;

-- Histórico de uso por usuário/e-mail (para limite por usuário e 1ª compra)
create table if not exists coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references coupons(id) on delete cascade,
  coupon_code text not null,
  user_id uuid references auth.users(id) on delete set null,
  customer_email text not null,
  order_id uuid references orders(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_coupon_redemptions_coupon on coupon_redemptions(coupon_id);
create index if not exists idx_coupon_redemptions_email on coupon_redemptions(lower(customer_email));
create index if not exists idx_coupon_redemptions_user on coupon_redemptions(user_id);

alter table coupon_redemptions enable row level security;

-- Exemplo: frete grátis na 1ª compra, 1 uso por usuário
insert into coupons (
  code, description, discount_type, discount_value,
  min_order_value, max_uses, applies_to, per_user_limit, first_purchase_only, active
) values (
  'FRETEGRATIS',
  'Frete grátis na primeira compra',
  'percent',
  100,
  0,
  null,
  'freight',
  1,
  true,
  true
) on conflict (code) do nothing;
