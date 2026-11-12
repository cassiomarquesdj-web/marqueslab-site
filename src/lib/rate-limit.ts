const hits = new Map<string, number[]>();

/**
 * Limite por janela em memória. Em ambiente serverless cada instância tem o seu contador,
 * então é uma proteção de melhor esforço; use um limitador compartilhado para garantia forte.
 */
export function rateLimit(key: string, max = 5, windowMs = 10 * 60 * 1000, now = Date.now()) {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}
