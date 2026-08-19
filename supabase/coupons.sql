-- Rode no SQL Editor do Supabase

create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  -- percent = desconto percentual | fixed = valor fixo em R$
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  min_order_value numeric(10,2) default 0,
  max_uses int, -- null = ilimitado
  used_count int not null default 0,
  active boolean not null default true,
  starts_at timestamptz default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_coupons_code on coupons (upper(code));

alter table coupons enable row level security;

-- Leitura pública só de cupons ativos (validação no checkout usa service role)
drop policy if exists "Cupons ativos legíveis" on coupons;
create policy "Cupons ativos legíveis"
  on coupons for select
  using (active = true);

-- Coluna de cupom nos pedidos
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'orders' and column_name = 'coupon_code'
  ) then
    alter table orders add column coupon_code text;
    alter table orders add column discount_amount numeric(10,2) default 0;
  end if;
end $$;

-- Exemplos (opcional)
insert into coupons (code, description, discount_type, discount_value, min_order_value, max_uses)
values
  ('BEMVINDO10', '10% na primeira compra', 'percent', 10, 0, 100),
  ('KIT20', 'R$ 20 off em pedidos acima de R$ 150', 'fixed', 20, 150, null)
on conflict (code) do nothing;
