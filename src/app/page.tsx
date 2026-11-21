import Link from "next/link";
import { ArrowRight, Box, Building2, Car, MessageSquare, Receipt, Wrench } from "lucide-react";
import { ClaimTracker } from "@/components/claim/claim-tracker";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const FEATURES = [
  { icon: Box, title: "Danos no modelo 3D", text: "Marque a peça exata. Oficina e seguradora veem o mesmo carro, colorido por ação." },
  { icon: Receipt, title: "Cobertura item a item", text: "Cada peça mostra se está coberta, o valor e quanto fica para você." },
  { icon: MessageSquare, title: "Tudo em um só lugar", text: "Mensagens, fotos e histórico do sinistro, sem ligação nem e-mail." },
];

const PROFILES = [
  { icon: Car, title: "Segurado", text: "Abre o sinistro e acompanha cada etapa até a entrega." },
  { icon: Building2, title: "Seguradora", text: "Analisa, encaminha e aprova o orçamento peça por peça." },
  { icon: Wrench, title: "Oficina", text: "Recebe o veículo, orça clicando nas peças e atualiza o reparo." },
];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <Logo />
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost"><Link href="/login">Entrar</Link></Button>
          <Button asChild className="hidden sm:inline-flex"><Link href="/cadastro">Criar conta</Link></Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5">
        <section className="grid items-center gap-12 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:py-20">
          <div>
            <span className="bg-accent text-accent-foreground inline-flex rounded-full px-3 py-1 text-sm font-semibold">Sinistro de carro e moto</span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance sm:text-6xl">
              Acompanhe seu sinistro como acompanha uma entrega.
            </h1>
            <p className="text-muted-foreground mt-5 max-w-xl text-lg text-pretty">
              Do registro à retirada do veículo: você vê a etapa, quem está com o sinistro e quanto vai pagar, peça por peça.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link href="/login">Acompanhar meu sinistro <ArrowRight className="size-5" /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/lab/3d">Ver o modelo 3D</Link></Button>
            </div>
          </div>
          <div className="relative">
            <div aria-hidden className="bg-primary/15 absolute -inset-6 rounded-[2.5rem] blur-2xl" />
            <div className="relative grid gap-4">
              <ClaimTracker
                status="ORCAMENTO_APROVADO"
                viewer="CLIENTE"
                facts={{ protocol: "SC-2026-000123", vehicle: "Chevrolet Onix · RTA1B23", workshop: "Auto Center Prime", estimatedDays: 5, clientPays: 290_000 }}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 pb-12 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-card rounded-3xl border p-6 shadow-sm shadow-black/[0.03]">
              <span className="bg-primary/10 text-primary grid size-11 place-items-center rounded-2xl"><f.icon className="size-5" /></span>
              <h2 className="mt-4 text-lg font-semibold">{f.title}</h2>
              <p className="text-muted-foreground mt-1">{f.text}</p>
            </div>
          ))}
        </section>

        <section className="bg-card mb-16 grid gap-6 rounded-3xl border p-6 sm:p-10 md:grid-cols-3">
          {PROFILES.map((p) => (
            <div key={p.title} className="flex gap-4">
              <p.icon className="text-primary mt-1 size-5 shrink-0" />
              <div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{p.text}</p>
              </div>
            </div>
          ))}
        </section>
      </main>

      <footer className="text-muted-foreground mx-auto w-full max-w-6xl px-5 py-6 text-xs">
        SafetyCare · MVP de demonstração. Não processa pagamentos nem dados reais.
      </footer>
    </div>
  );
}
