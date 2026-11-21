"use client";

import { motion, useReducedMotion } from "motion/react";
import { Check, X } from "lucide-react";
import { ACTION_LABEL } from "@/domain/labels";
import { partLabel } from "@/domain/parts";
import { financialSummary, itemTotal } from "@/domain/quote";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CountUpBRL } from "./count-up";
import { DEMO_DEDUCTIBLE, DEMO_ITEMS } from "./demo-data";
import { FadeUp, WordsReveal } from "./reveal";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Coverage() {
  const reduce = useReducedMotion();
  const summary = financialSummary(DEMO_ITEMS, DEMO_DEDUCTIBLE);
  return (
    <section className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-28 sm:px-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
      <div>
        <WordsReveal text="Cobertura sem letra miúda." className="max-w-2xl text-4xl font-semibold tracking-[-0.035em] text-balance sm:text-5xl" />
        <FadeUp delay={0.2}>
          <p className="text-muted-foreground mt-5 max-w-xl text-lg text-pretty">A seguradora decide peça por peça, com o motivo escrito. Você vê a mesma tabela que ela.</p>
        </FadeUp>
        <ul className="bg-card mt-10 divide-y overflow-hidden rounded-3xl border">
          {DEMO_ITEMS.map((i, idx) => {
            const covered = i.coverage === "COBERTO";
            return (
              <motion.li
                key={i.partKey}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4"
                initial={reduce ? false : { opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-15% 0px" }}
                transition={{ duration: 0.6, ease: EASE, delay: idx * 0.12 }}
              >
                <motion.span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full",
                    covered ? "bg-[#00c9b7]/15 text-[#00a89a] dark:text-[#2ee0cf]" : "bg-destructive/10 text-destructive",
                  )}
                  initial={reduce ? false : { scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true, margin: "-15% 0px" }}
                  transition={{ type: "spring", stiffness: 420, damping: 18, delay: 0.25 + idx * 0.12 }}
                >
                  {covered ? <Check className="size-4" /> : <X className="size-4" />}
                </motion.span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{partLabel(i.partKey)}</p>
                  <p className="text-muted-foreground text-sm">
                    {ACTION_LABEL[i.action]}
                    {i.insurerNote ? ` · ${i.insurerNote}` : ""}
                  </p>
                </div>
                <span className={cn("font-medium tabular-nums", !covered && "text-destructive")}>{formatBRL(itemTotal(i))}</span>
              </motion.li>
            );
          })}
        </ul>
      </div>

      <FadeUp delay={0.3} className="lg:mt-[7.5rem]">
        <div className="dark bg-background text-foreground relative isolate overflow-hidden rounded-[1.75rem] p-7 ring-1 ring-white/10">
          <div aria-hidden className="absolute -top-24 -right-16 -z-10 size-64 rounded-full bg-[#4b4bff]/40 blur-3xl" />
          <dl className="grid gap-3 text-sm">
            <Line k="Total do orçamento" v={summary.quoteTotal} />
            <Line k="Coberto pela seguradora" v={summary.coveredTotal} />
            <Line k="Franquia" v={summary.deductibleApplied} />
            <Line k="Não coberto" v={summary.notCoveredTotal} />
          </dl>
          <div className="mt-6 border-t border-white/10 pt-6">
            <p className="text-muted-foreground text-sm">Você paga</p>
            <CountUpBRL cents={summary.clientPays} className="mt-1 block text-5xl font-semibold tracking-[-0.04em] tabular-nums" />
            <p className="text-muted-foreground mt-2 text-sm">Franquia mais os itens não cobertos. O resto fica com a seguradora.</p>
          </div>
        </div>
      </FadeUp>
    </section>
  );
}

function Line({ k, v }: { k: string; v: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-medium tabular-nums">{formatBRL(v)}</dd>
    </div>
  );
}
