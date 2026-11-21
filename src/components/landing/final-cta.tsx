"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { WordsReveal } from "./reveal";

export function FinalCta() {
  const reduce = useReducedMotion();
  return (
    <section className="px-5 pb-24 sm:px-8">
      <div className="animate-gradient-pan relative isolate mx-auto grid max-w-7xl gap-8 overflow-hidden rounded-[2rem] bg-[linear-gradient(120deg,#4b4bff,#00c9b7,#4b4bff)] bg-[length:200%_100%] px-7 py-16 text-white sm:px-14 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <motion.div
          aria-hidden
          className="absolute -top-20 -right-12 -z-10"
          animate={reduce ? undefined : { rotate: [0, 8, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        >
          <LogoMark tone="mono" className="size-96 text-white opacity-15" />
        </motion.div>
        <div>
          <WordsReveal text="Abra seu próximo sinistro aqui." className="text-4xl font-semibold tracking-[-0.035em] text-balance sm:text-5xl" />
          <p className="mt-3 max-w-lg text-lg text-white/85">Leva poucos minutos. Se você é oficina ou seguradora, crie a conta com o seu perfil.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="bg-white text-[#0e1530] hover:bg-white/90">
            <Link href="/cadastro">Criar conta</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/15 hover:text-white">
            <Link href="/lab/3d">Explorar o modelo 3D</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
