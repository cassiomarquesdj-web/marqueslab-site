-- Defesa em profundidade contra cadastro público: o PRIMEIRO usuário vira administrador ativo;
-- todo usuário seguinte nasce INATIVO (sem nenhum acesso) até um administrador ativá-lo.
-- Assim, mesmo que o "Allow new users to sign up" fique ligado por engano, ninguém ganha acesso.
-- O painel (convite) e o script de verificação ativam o usuário explicitamente.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  first_user boolean := not exists (select 1 from public.profiles where role = 'admin');
begin
  insert into public.profiles (id, full_name, role, active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    case when first_user then 'admin' else 'editor' end,
    first_user
  );
  return new;
end $$;
