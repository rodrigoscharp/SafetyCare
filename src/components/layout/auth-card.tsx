import type { ReactNode } from "react";
import { ClaimTracker } from "@/components/claim/claim-tracker";
import { Logo } from "@/components/logo";
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
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-2">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
      <aside className="bg-accent/60 relative hidden overflow-hidden border-l lg:flex lg:flex-col lg:justify-center lg:p-12">
        <div aria-hidden className="bg-primary/10 absolute -top-40 -left-40 size-[28rem] rounded-full" />
        <div className="relative mx-auto w-full max-w-lg">
          <p className="text-primary text-sm font-semibold">Como um app de entrega, só que do seu sinistro</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-balance">Saiba em que etapa está, com quem está e quanto você vai pagar.</h2>
          <div className="mt-8 rotate-[-1.5deg]">
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
