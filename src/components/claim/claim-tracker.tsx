import type { ClaimStatus, Role } from "@prisma/client";
import { ArrowRight, CalendarClock, CircleDollarSign, Hand, UserRound, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { MAIN_PATH, STATUS_LABEL, stepIndex } from "@/domain/claim-state-machine";
import { journeyStep } from "@/domain/claim-journey";
import { ROLE_LABEL } from "@/domain/roles";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

export type TrackerFacts = {
  protocol: string;
  vehicle: string;
  workshop?: string | null;
  estimatedDays?: number | null;
  clientPays?: number | null;
  provisional?: boolean;
};

/** Card de acompanhamento estilo "pedido a caminho": status em primeiro lugar. */
export function ClaimTracker({ status, viewer, facts, compact }: { status: ClaimStatus; viewer: Role; facts: TrackerFacts; compact?: boolean }) {
  const j = journeyStep(status, viewer);
  const idx = stepIndex(status);
  const next = idx >= 0 && idx < MAIN_PATH.length - 1 ? MAIN_PATH[idx + 1] : null;

  return (
    <section
      aria-label="Andamento do sinistro"
      className={cn(
        "relative overflow-hidden rounded-3xl p-5 shadow-xl sm:p-7",
        j.tone === "danger" && "bg-destructive text-white shadow-destructive/20",
        j.tone === "success" && "bg-emerald-600 text-white shadow-emerald-600/20 dark:bg-emerald-700",
        (j.tone === "progress" || j.tone === "neutral") && "bg-tracker text-tracker-foreground shadow-primary/25",
      )}
    >
      <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-white/10" />
      <div aria-hidden className="pointer-events-none absolute -right-8 -bottom-32 size-64 rounded-full bg-white/5" />

      <div className="relative flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/75">
        <span className="font-mono">{facts.protocol}</span>
        <span aria-hidden>·</span>
        <span>{facts.vehicle}</span>
        {j.step ? <span className="ml-auto font-medium text-white/90">Etapa {j.step} de {j.total}</span> : null}
      </div>

      <div className="relative mt-4 flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h2 className={cn("font-bold tracking-tight text-balance", compact ? "text-2xl" : "text-2xl sm:text-4xl")}>{j.title}</h2>
          <p className="mt-2 text-base text-pretty text-white/85 sm:text-lg">{j.description}</p>
        </div>
        {j.yourTurn ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-sm font-semibold text-[color:var(--tracker)] shadow-sm">
            <Hand className="size-4" /> Sua vez
          </span>
        ) : null}
      </div>

      <div className="relative mt-6 flex gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={j.total} aria-valuenow={j.step ?? j.total} aria-label="Progresso">
        {MAIN_PATH.map((s, i) => {
          const done = j.progress === 1 || i < idx;
          const current = i === idx && j.progress < 1;
          return (
            <span
              key={s}
              title={STATUS_LABEL[s]}
              className={cn(
                "h-2 flex-1 rounded-full",
                done && "bg-white",
                current && "animate-pulse bg-white",
                !done && !current && "bg-white/25",
              )}
            />
          );
        })}
      </div>
      {next ? (
        <p className="relative mt-2 flex items-center gap-1.5 text-sm text-white/75">
          Próximo <ArrowRight className="size-3.5" /> <span className="font-medium text-white">{STATUS_LABEL[next]}</span>
        </p>
      ) : null}

      <div className="relative mt-5 flex flex-wrap gap-2">
        {j.owner ? <Chip icon={<UserRound className="size-4" />} label="Com" value={j.owner === viewer ? "Você" : ROLE_LABEL[j.owner]} /> : null}
        {facts.workshop ? <Chip icon={<Wrench className="size-4" />} label="Oficina" value={facts.workshop} /> : null}
        {facts.estimatedDays ? <Chip icon={<CalendarClock className="size-4" />} label="Prazo" value={`${facts.estimatedDays} dia(s)`} /> : null}
        {facts.clientPays !== undefined && facts.clientPays !== null ? (
          <Chip
            icon={<CircleDollarSign className="size-4" />}
            label={viewer === "CLIENTE" ? "Você paga" : "Segurado paga"}
            value={`${formatBRL(facts.clientPays)}${facts.provisional ? "*" : ""}`}
            strong
          />
        ) : null}
      </div>
    </section>
  );
}

function Chip({ icon, label, value, strong }: { icon: ReactNode; label: string; value: string; strong?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm", strong ? "bg-white text-zinc-900" : "bg-white/12 text-white")}>
      {icon}
      <span className={strong ? "opacity-80" : "text-white/75"}>{label}</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}
