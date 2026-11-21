"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ClaimTracker } from "@/components/claim/claim-tracker";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { VehicleStage } from "@/components/vehicle-3d";
import { ACTION_LABEL } from "@/domain/labels";
import { partLabel } from "@/domain/parts";
import { financialSummary, itemTotal } from "@/domain/quote";
import { formatBRL } from "@/lib/format";
import { DEMO_DEDUCTIBLE, DEMO_ITEMS } from "./demo-data";
import { WordsReveal } from "./reveal";

const EASE = [0.16, 1, 0.3, 1] as const;
const STEP_MS = 1300;
const HOLD_MS = 5200;

/** Quantos itens do orçamento já "chegaram" — anima em loop, simulando a oficina orçando. */
function useQuoteBuildUp(total: number) {
  const reduce = useReducedMotion();
  const [count, setCount] = useState(reduce ? total : 0);
  useEffect(() => {
    if (reduce) return;
    const delay = count === 0 ? 1600 : count >= total ? HOLD_MS : STEP_MS;
    const t = setTimeout(() => setCount((c) => (c >= total ? 0 : c + 1)), delay);
    return () => clearTimeout(t);
  }, [count, total, reduce]);
  return reduce ? total : count;
}

export function Hero() {
  const reduce = useReducedMotion();
  const count = useQuoteBuildUp(DEMO_ITEMS.length);
  const items = useMemo(() => DEMO_ITEMS.slice(0, count), [count]);
  const done = count >= DEMO_ITEMS.length;
  const summary = financialSummary(items, DEMO_DEDUCTIBLE);
  const latest = count > 0 && !done ? DEMO_ITEMS[count - 1] : null;

  return (
    <section className="dark bg-background text-foreground relative isolate overflow-hidden">
      <motion.div
        aria-hidden
        className="absolute -top-56 left-1/2 -z-10 h-[38rem] w-[60rem] -translate-x-1/2 rounded-full bg-[#4b4bff]/30 blur-[120px]"
        animate={reduce ? undefined : { x: ["-50%", "-42%", "-56%", "-50%"], scale: [1, 1.08, 0.96, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute right-[-10rem] bottom-[-14rem] -z-10 size-[36rem] rounded-full bg-[#00c9b7]/15 blur-[120px]"
        animate={reduce ? undefined : { x: [0, -60, 0], y: [0, -40, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
      />

      <motion.header
        className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-8"
        initial={reduce ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Site">
          <a href="#como-funciona" className="text-muted-foreground hover:text-foreground hidden rounded-lg px-3 py-2 text-sm transition-colors md:block">
            Como funciona
          </a>
          <a href="#marca" className="text-muted-foreground hover:text-foreground hidden rounded-lg px-3 py-2 text-sm transition-colors md:block">
            Para oficinas e seguradoras
          </a>
          <Button asChild variant="ghost"><Link href="/login">Entrar</Link></Button>
          <Button asChild className="bg-brand-gradient hidden border-0 text-white sm:inline-flex"><Link href="/cadastro">Criar conta</Link></Button>
        </nav>
      </motion.header>

      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 pt-8 pb-20 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:pt-14 lg:pb-28">
        <div>
          <WordsReveal
            as="h1"
            text="Seu sinistro, peça por peça."
            className="text-[44px] leading-[1] font-semibold tracking-[-0.045em] text-balance sm:text-[68px] lg:text-[80px]"
            delay={0.15}
          />
          <motion.p
            className="text-muted-foreground mt-6 max-w-xl text-lg text-pretty sm:text-xl"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.55 }}
          >
            Marque o dano no carro em 3D, veja o orçamento de cada peça e saiba quanto você paga antes da oficina começar.
          </motion.p>
          <motion.div
            className="mt-9 flex flex-wrap gap-3"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.7 }}
          >
            <Button asChild size="lg" className="bg-brand-gradient group relative overflow-hidden border-0 text-white shadow-lg shadow-[#4b4bff]/30">
              <Link href="/cadastro">
                <span
                  aria-hidden
                  className="absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/25 transition-transform duration-700 group-hover:translate-x-[400%]"
                />
                Abrir minha conta
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/15 bg-white/5">
              <Link href="/login">Já tenho conta</Link>
            </Button>
          </motion.div>
        </div>

        <motion.div
          className="relative"
          initial={reduce ? false : { opacity: 0, scale: 0.96, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.1, ease: EASE, delay: 0.3 }}
        >
          <div className="relative h-[320px] overflow-hidden rounded-[2rem] bg-white/[0.03] ring-1 ring-white/10 sm:h-[500px]">
            <VehicleStage type="CARRO" color="#c9ced8" items={items} />
            <div className="pointer-events-none absolute top-4 right-4 left-4 flex justify-between gap-3">
              <p className="text-muted-foreground hidden text-sm sm:block">{done ? "Passe o mouse nas peças" : "A oficina está orçando…"}</p>
              <AnimatePresence mode="popLayout">
                {latest ? (
                  <motion.div
                    key={latest.partKey}
                    initial={{ opacity: 0, y: -14, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.97 }}
                    transition={{ duration: 0.45, ease: EASE }}
                    className="ml-auto flex items-center gap-2 rounded-full bg-white/10 py-1.5 pr-3 pl-1.5 text-sm ring-1 ring-white/15 backdrop-blur"
                  >
                    <span className="bg-brand-gradient grid size-6 place-items-center rounded-full text-white">
                      <Plus className="size-3.5" />
                    </span>
                    <span className="font-medium">{partLabel(latest.partKey)}</span>
                    <span className="text-muted-foreground">{ACTION_LABEL[latest.action]} · {formatBRL(itemTotal(latest))}</span>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
          <div className="relative mt-4 sm:-mt-28 sm:ml-auto sm:max-w-md lg:-mr-6">
            <ClaimTracker
              compact
              status={done ? "ORCAMENTO_APROVADO" : "AGUARDANDO_ORCAMENTO"}
              viewer="CLIENTE"
              facts={{
                protocol: "SC-2026-000123",
                vehicle: "Chevrolet Onix",
                workshop: "Auto Center Prime",
                estimatedDays: done ? 6 : null,
                clientPays: done ? summary.clientPays : null,
              }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
