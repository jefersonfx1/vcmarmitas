-- Rode no SQL Editor do Supabase
-- Atualiza o trigger para gravar TODOS os dados do cadastro no perfil

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    full_name,
    phone,
    cpf,
    address_street,
    address_number,
    address_complement,
    address_neighborhood,
    address_city,
    address_cep,
    is_admin
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'cpf', ''),
    coalesce(new.raw_user_meta_data->>'address_street', ''),
    coalesce(new.raw_user_meta_data->>'address_number', ''),
    nullif(new.raw_user_meta_data->>'address_complement', ''),
    nullif(new.raw_user_meta_data->>'address_neighborhood', ''),
    nullif(new.raw_user_meta_data->>'address_city', ''),
    coalesce(new.raw_user_meta_data->>'address_cep', ''),
    lower(new.email) = 'jefersonfferreira23@gmail.com'
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    phone = excluded.phone,
    cpf = excluded.cpf,
    address_street = excluded.address_street,
    address_number = excluded.address_number,
    address_complement = excluded.address_complement,
    address_neighborhood = excluded.address_neighborhood,
    address_city = excluded.address_city,
    address_cep = excluded.address_cep,
    is_admin = excluded.is_admin,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
