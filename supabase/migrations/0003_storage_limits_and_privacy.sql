-- Limites e tipos permitidos nos buckets (aplicados pelo próprio Storage, não só pelo app),
-- e privacidade de clientes para o papel "editor".

-- media: imagens até 10 MB e vídeos até 50 MB (teto do plano gratuito do Supabase).
-- Em planos pagos o limite global pode ser maior; ajuste file_size_limit e src/lib/media.ts juntos.
update storage.buckets
set file_size_limit = 52428800,
    allowed_mime_types = array[
      'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/x-icon',
      'video/mp4', 'video/webm'
    ]
where id = 'media';

-- lead-references: anexos de orçamento (enviados pela API) até 4 MB.
update storage.buckets
set file_size_limit = 4194304,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
where id = 'lead-references';

-- Editores só precisam do NOME do cliente para vincular projetos; não devem ver e-mail/telefone.
drop policy if exists clients_editor_read on public.clients;

create view public.client_options as
  select id, name from public.clients
  where public.has_role(array['admin', 'editor', 'sales']);

revoke all on public.client_options from anon, public;
grant select on public.client_options to authenticated;
