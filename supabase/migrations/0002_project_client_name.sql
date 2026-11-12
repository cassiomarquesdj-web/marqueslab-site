-- Nome do cliente exibido publicamente (somente quando show_client = true).
-- clients é privado (RLS), então o site público usa este campo, não o join.
alter table public.projects add column client_name text;
