import { site } from "@/lib/site";

const digits = site.whatsapp.replace(/\D/g, "");

export const hasWhatsapp = digits.length >= 10;

export const waLink = (message: string) =>
  hasWhatsapp ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : null;
