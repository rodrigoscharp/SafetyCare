import Link from "next/link";
import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * Símbolo "Camadas": três faixas que ganham cor — segurado, oficina e seguradora
 * no mesmo sinistro, ficando mais nítido a cada etapa.
 */
export function LogoMark({ className, tone = "brand" }: { className?: string; tone?: "brand" | "mono" }) {
  const id = useId();
  const gid = `sc-grad-${id}`;
  return (
    <svg viewBox="0 0 120 120" className={cn("size-8", className)} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4B4BFF" />
          <stop offset="1" stopColor="#00C9B7" />
        </linearGradient>
      </defs>
      <g transform="rotate(-35 60 60)">
        <rect x="22" y="22" width="76" height="22" rx="11" fill={tone === "mono" ? "currentColor" : "#4B4BFF"} opacity="0.35" />
        <rect x="22" y="49" width="76" height="22" rx="11" fill={tone === "mono" ? "currentColor" : "#4B4BFF"} opacity="0.68" />
        <rect x="22" y="76" width="76" height="22" rx="11" fill={tone === "mono" ? "currentColor" : `url(#${gid})`} />
      </g>
    </svg>
  );
}

export function Logo({ href = "/", className, tone }: { href?: string; className?: string; tone?: "brand" | "mono" }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring", className)} aria-label="SafetyCare, início">
      <LogoMark tone={tone} className="size-7" />
      <span className="text-[19px] leading-none font-semibold tracking-[-0.035em]">safetycare</span>
    </Link>
  );
}
