"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Building2, Car, Wrench, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const LAYERS: { role: string; title: string; text: string; icon: LucideIcon; bar: string }[] = [
  {
    role: "Segurado",
    title: "Sabe sempre em que pé está",
    text: "Etapa atual, próximo passo e quanto vai pagar antes do conserto.",
    icon: Car,
    bar: "bg-[#4b4bff]/35",
  },
  {
    role: "Oficina",
    title: "Orça clicando no carro",
    text: "Os danos já chegam marcados no 3D. Cada peça vira um item do orçamento.",
    icon: Wrench,
    bar: "bg-[#4b4bff]/70",
  },
  {
    role: "Seguradora",
    title: "Decide item a item",
    text: "Coberto ou não coberto em cada peça, com a prévia do valor ao vivo.",
    icon: Building2,
    bar: "bg-brand-gradient",
  },
];

function useIsNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setNarrow(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return narrow;
}

/**
 * O símbolo "Camadas" se abre conforme a rolagem: as três faixas giram, se separam
 * e cada uma revela um dos perfis que atuam no mesmo sinistro.
 */
export function BrandLayers() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  const rotate = useTransform(scrollYProgress, [0, 0.45], [-35, 0]);
  const gap = useTransform(scrollYProgress, [0.05, 0.5], [0, 1]);
  const wordOpacity = useTransform(scrollYProgress, [0, 0.25, 0.55], [1, 1, 0.08]);
  const wordScale = useTransform(scrollYProgress, [0, 0.55], [1, 0.9]);
  const labelsOpacity = useTransform(scrollYProgress, [0.4, 0.6], [0, 1]);
  const narrow = useIsNarrow();

  if (reduce) return <BrandLayersStatic />;

  return (
    <section id="marca" ref={ref} className="dark bg-background text-foreground relative h-[260vh] scroll-mt-0" aria-label="Três lados, um sinistro só">
      <div className="sticky top-0 isolate flex h-dvh items-center overflow-hidden">
        <div aria-hidden className="absolute top-1/2 left-1/2 -z-10 size-[44rem] -translate-1/2 rounded-full bg-[#4b4bff]/20 blur-[140px]" />

        <motion.p
          aria-hidden
          style={{ opacity: wordOpacity, scale: wordScale }}
          className="text-brand-gradient pointer-events-none absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 text-center text-[22vw] leading-none font-semibold tracking-[-0.06em] select-none"
        >
          safetycare
        </motion.p>

        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 sm:px-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-10">
          <motion.div style={{ opacity: labelsOpacity }} className="order-2 md:order-1">
            <h2 className="text-4xl font-semibold tracking-[-0.035em] text-balance sm:text-5xl">Três lados, um sinistro só.</h2>
            <p className="text-muted-foreground mt-4 max-w-md text-lg text-pretty">
              Cada camada do símbolo é uma das partes. Todas olham para o mesmo carro, a mesma lista de peças e o mesmo histórico.
            </p>
          </motion.div>

          <motion.div style={{ rotate }} className="order-1 mx-auto grid w-full max-w-md origin-center md:order-2">
            {LAYERS.map((l, i) => (
              <Layer key={l.role} index={i} layer={l} gap={gap} labelsOpacity={labelsOpacity} narrow={narrow} />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Layer({
  index,
  layer,
  gap,
  labelsOpacity,
  narrow,
}: {
  narrow: boolean;
  index: number;
  layer: (typeof LAYERS)[number];
  gap: MotionValue<number>;
  labelsOpacity: MotionValue<number>;
}) {
  const offset = index - 1; // -1, 0, 1 — a faixa do meio fica no centro
  const y = useTransform(gap, (g) => `${offset * g * (narrow ? 14 : 70)}%`);
  const height = useTransform(gap, [0, 1], narrow ? ["2.75rem", "4.75rem"] : ["3.25rem", "7.25rem"]);
  const radius = useTransform(gap, [0, 1], ["999px", "28px"]);
  const Icon = layer.icon;
  return (
    <motion.div
      style={{ y, height, borderRadius: radius }}
      className={cn("relative mt-2 flex items-center gap-4 overflow-hidden px-5 text-white first:mt-0", layer.bar)}
    >
      <motion.div style={{ opacity: labelsOpacity }} className="flex min-w-0 items-center gap-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/15">
          <Icon className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm text-white/75">{layer.role}</span>
          <span className="block truncate text-base font-semibold sm:text-lg">{layer.title}</span>
          <span className="hidden text-sm leading-snug text-white/80 sm:line-clamp-2">{layer.text}</span>
        </span>
      </motion.div>
    </motion.div>
  );
}

function BrandLayersStatic() {
  return (
    <section id="marca" className="dark bg-background text-foreground px-5 py-24 sm:px-8" aria-label="Três lados, um sinistro só">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 md:items-center">
        <div>
          <h2 className="text-4xl font-semibold tracking-[-0.035em] text-balance sm:text-5xl">Três lados, um sinistro só.</h2>
          <p className="text-muted-foreground mt-4 max-w-md text-lg">
            Cada camada do símbolo é uma das partes. Todas olham para o mesmo carro, a mesma lista de peças e o mesmo histórico.
          </p>
        </div>
        <div className="grid gap-3">
          {LAYERS.map((l) => (
            <div key={l.role} className={cn("flex items-center gap-4 rounded-[28px] p-5 text-white", l.bar)}>
              <l.icon className="size-5" />
              <div>
                <p className="text-sm text-white/75">{l.role}</p>
                <p className="font-semibold">{l.title}</p>
                <p className="text-sm text-white/80">{l.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
