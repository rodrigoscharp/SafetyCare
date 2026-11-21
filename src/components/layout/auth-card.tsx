import type { ReactNode } from "react";
import { ClaimTracker } from "@/components/claim/claim-tracker";
import { Logo, LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <main className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-4xl font-semibold tracking-[-0.035em]">{title}</h1>
          <p className="text-muted-foreground mt-2">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
      <aside className="dark bg-background text-foreground relative isolate hidden overflow-hidden lg:flex lg:flex-col lg:justify-center lg:p-14">
        <div aria-hidden className="absolute -top-48 -right-32 -z-10 size-[34rem] rounded-full bg-[#4b4bff]/35 blur-[110px]" />
        <div aria-hidden className="absolute -bottom-48 -left-32 -z-10 size-[30rem] rounded-full bg-[#00c9b7]/15 blur-[110px]" />
        <LogoMark tone="mono" className="absolute -right-24 -bottom-24 -z-10 size-[26rem] text-white opacity-[0.04]" />
        <div className="relative mx-auto w-full max-w-lg">
          <h2 className="text-4xl font-semibold tracking-[-0.035em] text-balance">Seu sinistro, peça por peça.</h2>
          <p className="text-muted-foreground mt-3 text-lg">Em que etapa está, com quem está e quanto você vai pagar.</p>
          <div className="mt-10">
            <ClaimTracker
              compact
              status="EM_REPARO"
              viewer="CLIENTE"
              facts={{ protocol: "SC-2026-000123", vehicle: "Chevrolet Onix", workshop: "Auto Center Prime", estimatedDays: 5, clientPays: 133_000 }}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
