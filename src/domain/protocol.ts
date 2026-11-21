/** Formata protocolo legível: SC-2026-000123 */
export function formatProtocol(year: number, seq: number): string {
  return `SC-${year}-${String(seq).padStart(6, "0")}`;
}
