-- Idempotência do orçamento: cada tentativa de envio do formulário carrega uma chave única.
-- Se a resposta se perder (timeout, queda de conexão) e o cliente reenviar, a API devolve o
-- protocolo já existente em vez de gravar um orçamento duplicado.
alter table public.leads add column idempotency_key uuid unique;
