/** Monta o link wa.me a partir do número configurado; null se não houver número válido. */
export function buildWaLink(number: string, message: string): string | null {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
