-- Rode este SQL no Supabase SQL Editor se o cardápio estiver com erro

-- Garante leitura pública de produtos ativos
drop policy if exists "Produtos ativos são públicos" on products;

create policy "Produtos ativos são públicos"
  on products for select
  using (active = true);

-- Permite que service_role e anon leiam produtos
-- (service_role já bypassa RLS, mas reforçamos)

-- Se a tabela estiver vazia, reinsere os produtos
insert into products (name, description, price, image_url, category, calories, weight)
select * from (values
  ('Frango Grelhado com Legumes', 'Peito de frango grelhado, arroz integral, brócolis e cenoura.', 22.90, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop', 'fitness', 380, '400g'),
  ('Strogonoff de Frango', 'Strogonoff cremoso de frango com arroz e batata palha.', 24.90, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&h=400&fit=crop', 'tradicional', 520, '450g'),
  ('Feijoada Light', 'Feijoada com menos gordura, acompanhada de arroz e farofa.', 26.90, 'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?w=600&h=400&fit=crop', 'tradicional', 480, '450g'),
  ('Salmão com Quinoa', 'Filé de salmão grelhado, quinoa e legumes no vapor.', 34.90, 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=400&fit=crop', 'fitness', 420, '400g'),
  ('Risoto de Cogumelos', 'Risoto cremoso de cogumelos frescos e parmesão.', 27.90, 'https://images.unsplash.com/photo-1476124369491-e7addf8db027?w=600&h=400&fit=crop', 'vegetariana', 450, '400g'),
  ('Carne Assada com Purê', 'Carne bovina assada, purê de batata e salada verde.', 28.90, 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=600&h=400&fit=crop', 'tradicional', 560, '450g')
) as v(name, description, price, image_url, category, calories, weight)
where not exists (select 1 from products limit 1);
