import { CheckCircle2, ClipboardList, Hand, MessageSquare, MousePointerClick, PackageCheck, Send, Wrench, type LucideIcon } from "lucide-react";

const EVENTS: { icon: LucideIcon; text: string }[] = [
  { icon: MousePointerClick, text: "Para-choque marcado no 3D" },
  { icon: ClipboardList, text: "Sinistro SC-2026-000123 aberto" },
  { icon: Send, text: "Encaminhado à Auto Center Prime" },
  { icon: Wrench, text: "Orçamento v1 enviado" },
  { icon: CheckCircle2, text: "Capô coberto" },
  { icon: MessageSquare, text: "Nova mensagem da oficina" },
  { icon: Hand, text: "Sua vez: confirmar retirada" },
  { icon: PackageCheck, text: "Veículo entregue" },
];

/** Faixa contínua com eventos reais de um sinistro. */
export function Marquee() {
  const row = [...EVENTS, ...EVENTS];
  return (
    <div className="dark bg-background text-foreground group relative overflow-hidden border-y border-white/10 py-5" aria-label="Exemplos de eventos de um sinistro">
      <div aria-hidden className="from-background pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r to-transparent" />
      <div aria-hidden className="from-background pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l to-transparent" />
      <ul className="animate-marquee flex w-max gap-3 group-hover:[animation-play-state:paused]">
        {row.map((e, i) => (
          <li key={i} aria-hidden={i >= EVENTS.length} className="flex items-center gap-2.5 rounded-full bg-white/[0.05] px-4 py-2 text-sm whitespace-nowrap ring-1 ring-white/10">
            <e.icon className="size-4 text-[#2ee0cf]" />
            {e.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
