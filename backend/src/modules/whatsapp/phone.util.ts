export function phoneDigits(phone: string) {
  return phone.replace(/\D/g, "");
}

export function toInternalEmailFromPhone(phone: string) {
  return `wa_${phoneDigits(phone)}@wa.internal`;
}

export function toE164(phone: string) {
  const d = phoneDigits(phone);
  if (!d) return phone.trim();
  return d.startsWith("0") ? `+${d.replace(/^0+/, "")}` : `+${d}`;
}
