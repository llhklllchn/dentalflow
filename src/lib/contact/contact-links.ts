export function normalizeContactPhone(phone: string) {
  const trimmed = phone.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("+")) {
    return `+${trimmed.slice(1).replace(/[^\d]/g, "")}`;
  }

  return trimmed.replace(/[^\d]/g, "");
}

export function buildTelHref(phone: string) {
  const normalized = normalizeContactPhone(phone);
  return normalized ? `tel:${normalized}` : "";
}

export function buildWhatsAppHref(phone: string, text?: string) {
  const normalized = normalizeContactPhone(phone).replace(/^\+/, "");

  if (!normalized) {
    return "";
  }

  const query = text?.trim() ? `?text=${encodeURIComponent(text.trim())}` : "";
  return `https://wa.me/${normalized}${query}`;
}
