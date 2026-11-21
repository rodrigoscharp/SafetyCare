const TZ = "America/Sao_Paulo";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFmt = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Formata centavos como moeda brasileira. */
export function formatBRL(cents: number): string {
  return brl.format(cents / 100);
}

export function formatDate(d: Date | string): string {
  return dateFmt.format(new Date(d));
}

export function formatDateTime(d: Date | string): string {
  return dateTimeFmt.format(new Date(d));
}

/** "1.234,56" ou "1234.56" → centavos. Retorna null se inválido. */
export function parseBRLToCents(input: string): number | null {
  const clean = input.replace(/[^\d,.-]/g, "").trim();
  if (!clean) return null;
  const normalized = clean.includes(",") ? clean.replace(/\./g, "").replace(",", ".") : clean;
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

/** Centavos → "1234,56" para inputs. */
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** "YYYY-MM-DDTHH:mm" digitado no fuso de São Paulo (UTC-3, sem horário de verão) → Date UTC. */
export function parseSaoPauloDateTime(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const d = new Date(`${value}:00-03:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "YYYY-MM-DD" (data local) → Date UTC ao fim do dia em São Paulo. */
export function parseSaoPauloDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T23:59:59-03:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date → "YYYY-MM-DD" no fuso de São Paulo (para inputs). */
export function toSaoPauloDateInput(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(d);
}
