"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { formatBRL } from "@/lib/format";

/** Conta de 0 até o valor (centavos) quando entra na tela. */
export function CountUpBRL({ cents, className }: { cents: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? cents : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setValue(cents);
      return;
    }
    const controls = animate(0, cents, { duration: 1.4, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setValue(Math.round(v)) });
    return () => controls.stop();
  }, [inView, cents, reduce]);

  return (
    <span ref={ref} className={className}>
      {formatBRL(value)}
    </span>
  );
}
