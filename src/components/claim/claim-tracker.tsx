import type { ClaimStatus, Role } from "@prisma/client";
import { ArrowRight, CalendarClock, Hand, UserRound, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/logo";
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

/** Card de acompanhamento: status em primeiro lugar, como um pedido a caminho. */
export function ClaimTracker({ status, viewer, facts, compact }: { status: ClaimStatus; viewer: Role; facts: TrackerFacts; compact?: boolean }) {
  const j = journeyStep(status, viewer);
  const idx = stepIndex(status);
  const next = idx >= 0 && idx < MAIN_PATH.length - 1 ? MAIN_PATH[idx + 1] : null;
  const pct = Math.round(j.progress * 100);
  const showPay = facts.clientPays !== undefined && facts.clientPays !== null;

  return (
    <section
      aria-label="Andamento do sinistro"
      className="bg-tracker text-tracker-foreground relative isolate overflow-hidden rounded-[1.75rem] p-5 ring-1 ring-white/10 sm:p-7"
    >
      <div aria-hidden className="absolute -top-40 -right-24 -z-10 size-96 rounded-full bg-[#4b4bff]/40 blur-3xl" />
      <div aria-hidden className="absolute -bottom-40 -left-24 -z-10 size-80 rounded-full bg-[#00c9b7]/20 blur-3xl" />
      <LogoMark tone="mono" className="pointer-events-none absolute -right-10 -bottom-12 -z-10 size-56 text-white opacity-[0.05]" />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[color:var(--tracker-muted)]">
        <span className="font-mono text-[13px]">{facts.protocol}</span>
        <span className="truncate">{facts.vehicle}</span>
        {j.step ? <span className="ml-auto tabular-nums">Etapa {j.step}/{j.total}</span> : null}
      </div>

      <div className={cn("mt-5 grid gap-6", showPay && !compact && "md:grid-cols-[minmax(0,1fr)_auto] md:items-end")}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className={cn("font-semibold tracking-[-0.03em] text-balance", compact ? "text-2xl" : "text-[28px] sm:text-[40px] sm:leading-[1.05]")}>{j.title}</h2>
            {j.yourTurn ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00c9b7] px-3 py-1 text-sm font-semibold text-[#0e1530]">
                <Hand className="size-4" /> Sua vez
              </span>
            ) : null}
          </div>
          <p className="mt-2 max-w-2xl text-base text-pretty text-white/75 sm:text-lg">{j.description}</p>
        </div>
        {showPay && !compact ? (
          <div className="rounded-2xl bg-white/[0.06] px-5 py-4 ring-1 ring-white/10 md:text-right">
            <p className="text-sm text-[color:var(--tracker-muted)]">{viewer === "CLIENTE" ? "Você paga" : "Segurado paga"}</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
              {formatBRL(facts.clientPays ?? 0)}
              {facts.provisional ? <span className="text-[color:var(--tracker-muted)]">*</span> : null}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-6">
        <div
          className="relative h-2.5 overflow-hidden rounded-full bg-[color:var(--tracker-track)]"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label={`Progresso: ${pct}%`}
        >
          <div
            className={cn("h-full rounded-full", j.tone === "danger" ? "bg-[#ff6369]" : "bg-brand-gradient")}
            style={{ width: `${Math.max(pct, 4)}%` }}
          />
          <div aria-hidden className="absolute inset-0 flex">
            {MAIN_PATH.slice(1).map((s) => (
              <span key={s} className="flex-1 border-r-2 border-[color:var(--tracker)] last:border-r-0" />
            ))}
          </div>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-sm text-[color:var(--tracker-muted)]">
          {next ? (
            <span className="flex items-center gap-1.5">
              Próximo <ArrowRight className="size-3.5" /> <span className="text-white">{STATUS_LABEL[next]}</span>
            </span>
          ) : (
            <span className="text-white">{j.tone === "danger" ? "Encerrado sem cobertura" : "Encerrado"}</span>
          )}
          <span className="tabular-nums">{pct}%</span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {j.owner ? <Chip icon={<UserRound className="size-4" />} label="Com" value={j.owner === viewer ? "Você" : ROLE_LABEL[j.owner]} /> : null}
        {facts.workshop ? <Chip icon={<Wrench className="size-4" />} label="Oficina" value={facts.workshop} /> : null}
        {facts.estimatedDays ? <Chip icon={<CalendarClock className="size-4" />} label="Prazo" value={`${facts.estimatedDays} dia(s)`} /> : null}
        {showPay && compact ? (
          <span className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm text-[#0e1530]">
            {viewer === "CLIENTE" ? "Você paga" : "Segurado paga"}
            <span className="font-semibold tabular-nums">
              {formatBRL(facts.clientPays ?? 0)}
              {facts.provisional ? "*" : ""}
            </span>
          </span>
        ) : null}
      </div>
    </section>
  );
}

function Chip({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2 text-sm ring-1 ring-white/10">
      <span className="text-[color:var(--tracker-muted)]">{icon}</span>
      <span className="text-[color:var(--tracker-muted)]">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </span>
  );
}
