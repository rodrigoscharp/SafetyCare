"use client";

import { motion, useReducedMotion } from "motion/react";
import { WordsReveal } from "./reveal";

const EASE = [0.16, 1, 0.3, 1] as const;

const STEPS = [
  { title: "Você abre o sinistro", text: "Conta o que aconteceu e toca nas peças danificadas no carro em 3D. Fotos são opcionais." },
  { title: "A seguradora analisa", text: "Um analista assume, confere o relato e escolhe a oficina credenciada mais adequada." },
  { title: "A oficina orça peça por peça", text: "Cada item diz se a peça vai ser trocada, reparada ou pintada, com valor de peça e mão de obra." },
  { title: "Você vê o que é coberto", text: "Antes do reparo começar você sabe o valor exato da sua parte. Depois é só acompanhar até a retirada." },
];

export function Steps() {
  const reduce = useReducedMotion();
  return (
    <section id="como-funciona" className="mx-auto w-full max-w-7xl scroll-mt-8 px-5 py-28 sm:px-8">
      <WordsReveal text="Do susto à retirada, em quatro movimentos." className="max-w-2xl text-4xl font-semibold tracking-[-0.035em] text-balance sm:text-5xl" />
      <ol className="relative mt-16 grid gap-10 md:grid-cols-4 md:gap-6">
        <motion.span
          aria-hidden
          className="bg-brand-gradient absolute top-5 right-0 left-0 hidden h-px origin-left md:block"
          initial={reduce ? false : { scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-20% 0px" }}
          transition={{ duration: 1.6, ease: EASE }}
        />
        {STEPS.map((s, i) => (
          <motion.li
            key={s.title}
            className="relative"
            initial={reduce ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20% 0px" }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.25 + i * 0.18 }}
          >
            <span className="bg-background relative grid size-10 place-items-center rounded-full text-sm font-semibold ring-1 ring-[#4b4bff]/40">
              <span className="text-brand-gradient">{i + 1}</span>
            </span>
            <h3 className="mt-5 text-lg font-semibold tracking-tight">{s.title}</h3>
            <p className="text-muted-foreground mt-2 text-pretty">{s.text}</p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
