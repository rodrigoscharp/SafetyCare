import Link from "next/link";
import { Building2, Car, Check, Wrench, X } from "lucide-react";
import { ClaimTracker } from "@/components/claim/claim-tracker";
import { Logo, LogoMark } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { VehicleStage } from "@/components/vehicle-3d";
import type { QuoteItemLike } from "@/domain/part-status";
import { ACTION_LABEL } from "@/domain/labels";
import { partLabel } from "@/domain/parts";
import { financialSummary, itemTotal } from "@/domain/quote";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

const DEMO_ITEMS: QuoteItemLike[] = [
  { partKey: "parachoque_dianteiro", action: "TROCAR", partPrice: 140_000, laborPrice: 30_000, coverage: "COBERTO" },
  { partKey: "capo", action: "REPARAR", partPrice: 0, laborPrice: 55_000, coverage: "COBERTO" },
  { partKey: "farol_esq", action: "TROCAR", partPrice: 115_000, laborPrice: 10_000, coverage: "COBERTO" },
  {
    partKey: "paralama_dianteiro_esq",
    action: "PINTAR",
    partPrice: 0,
    laborPrice: 40_000,
    coverage: "NAO_COBERTO",
    insurerNote: "Riscos anteriores ao acidente",
  },
];
const DEMO_DEDUCTIBLE = 250_000;

const STEPS = [
  { title: "Você abre o sinistro", text: "Conta o que aconteceu e toca nas peças danificadas no carro em 3D. Fotos são opcionais." },
  { title: "A seguradora analisa", text: "Um analista assume, confere o relato e escolhe a oficina credenciada mais adequada." },
  { title: "A oficina orça peça por peça", text: "Cada item diz se a peça vai ser trocada, reparada ou pintada, com valor de peça e mão de obra." },
  { title: "Você vê o que é coberto", text: "Antes do reparo começar você sabe o valor exato da sua parte. Depois é só acompanhar até a retirada." },
];

const SIDES = [
  {
    icon: Car,
    role: "Segurado",
    title: "Sabe sempre em que pé está",
    points: ["Etapa atual e o que vem depois", "Quanto vai pagar antes do conserto", "Mensagens com oficina e seguradora no mesmo lugar"],
  },
  {
    icon: Wrench,
    role: "Oficina",
    title: "Orça clicando no carro",
    points: ["Danos declarados já marcados no 3D", "Itens novos viram registro da oficina", "Fila com o que está parado há dias"],
  },
  {
    icon: Building2,
    role: "Seguradora",
    title: "Decide item a item",
    points: ["Coberto ou não coberto em cada peça", "Prévia do valor a pagar ao vivo", "Pedido de ajuste sem troca de e-mail"],
  },
];

export default function Home() {
  const summary = financialSummary(DEMO_ITEMS, DEMO_DEDUCTIBLE);

  return (
    <div className="min-h-dvh">
      {/* Abertura sempre escura, independente do tema */}
      <section className="dark bg-background text-foreground relative isolate overflow-hidden">
        <div aria-hidden className="absolute -top-56 left-1/2 -z-10 h-[38rem] w-[60rem] -translate-x-1/2 rounded-full bg-[#4b4bff]/30 blur-[120px]" />
        <div aria-hidden className="absolute right-[-10rem] bottom-[-14rem] -z-10 size-[36rem] rounded-full bg-[#00c9b7]/15 blur-[120px]" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        />

        <header className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <Logo />
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Site">
            <a href="#como-funciona" className="text-muted-foreground hover:text-foreground hidden rounded-lg px-3 py-2 text-sm md:block">
              Como funciona
            </a>
            <a href="#para-quem" className="text-muted-foreground hover:text-foreground hidden rounded-lg px-3 py-2 text-sm md:block">
              Para oficinas e seguradoras
            </a>
            <Button asChild variant="ghost"><Link href="/login">Entrar</Link></Button>
            <Button asChild className="bg-brand-gradient hidden border-0 text-white sm:inline-flex"><Link href="/cadastro">Criar conta</Link></Button>
          </nav>
        </header>

        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 pt-8 pb-20 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:pt-14 lg:pb-28">
          <div>
            <h1 className="text-[44px] leading-[1] font-semibold tracking-[-0.045em] text-balance sm:text-[68px] lg:text-[80px]">
              Seu sinistro, peça por peça.
            </h1>
            <p className="text-muted-foreground mt-6 max-w-xl text-lg text-pretty sm:text-xl">
              Marque o dano no carro em 3D, veja o orçamento de cada peça e saiba quanto você paga antes da oficina começar.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-brand-gradient border-0 text-white shadow-lg shadow-[#4b4bff]/30">
                <Link href="/cadastro">Abrir minha conta</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/15 bg-white/5">
                <Link href="/login">Já tenho conta</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="relative h-[320px] overflow-hidden rounded-[2rem] bg-white/[0.03] ring-1 ring-white/10 sm:h-[500px]">
              <VehicleStage type="CARRO" color="#c9ced8" items={DEMO_ITEMS} />
              <p className="text-muted-foreground pointer-events-none absolute top-4 left-5 hidden text-sm sm:block">Passe o mouse nas peças</p>
            </div>
            <div className="relative mt-4 sm:-mt-28 sm:ml-auto sm:max-w-md lg:-mr-6">
              <ClaimTracker
                compact
                status="ORCAMENTO_APROVADO"
                viewer="CLIENTE"
                facts={{
                  protocol: "SC-2026-000123",
                  vehicle: "Chevrolet Onix",
                  workshop: "Auto Center Prime",
                  estimatedDays: 6,
                  clientPays: summary.clientPays,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <main>
        <section id="como-funciona" className="mx-auto w-full max-w-7xl scroll-mt-8 px-5 py-24 sm:px-8">
          <h2 className="max-w-2xl text-4xl font-semibold tracking-[-0.035em] text-balance sm:text-5xl">Do susto à retirada, em quatro movimentos.</h2>
          <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
            <span aria-hidden className="bg-brand-gradient absolute top-5 right-0 left-0 hidden h-px opacity-60 md:block" />
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative">
                <span className="bg-background relative grid size-10 place-items-center rounded-full text-sm font-semibold ring-1 ring-[#4b4bff]/40">
                  <span className="text-brand-gradient">{i + 1}</span>
                </span>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{s.title}</h3>
                <p className="text-muted-foreground mt-2 text-pretty">{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="para-quem" className="scroll-mt-8 border-y bg-card">
          <div className="mx-auto grid w-full max-w-7xl gap-14 px-5 py-24 sm:px-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <div>
              <LogoMark className="size-16" />
              <h2 className="mt-6 text-4xl font-semibold tracking-[-0.035em] text-balance sm:text-5xl">Três lados, um sinistro só.</h2>
              <p className="text-muted-foreground mt-5 max-w-md text-lg text-pretty">
                Cada camada do símbolo é uma das partes. Todas olham para o mesmo carro, a mesma lista de peças e o mesmo histórico, cada uma com o que precisa fazer.
              </p>
            </div>
            <div className="grid gap-4">
              {SIDES.map((s, i) => (
                <article
                  key={s.role}
                  className={cn(
                    "bg-background grid gap-4 rounded-3xl border p-6 sm:grid-cols-[180px_minmax(0,1fr)] sm:p-7",
                    i === 1 && "lg:ml-10",
                    i === 2 && "lg:ml-20",
                  )}
                >
                  <div>
                    <span className={cn("grid size-11 place-items-center rounded-2xl text-white", i === 2 ? "bg-brand-gradient" : "bg-[#4b4bff]", i === 0 && "opacity-60", i === 1 && "opacity-85")}>
                      <s.icon className="size-5" />
                    </span>
                    <p className="text-muted-foreground mt-3 text-sm">{s.role}</p>
                    <h3 className="text-lg font-semibold tracking-tight">{s.title}</h3>
                  </div>
                  <ul className="grid content-center gap-2.5">
                    {s.points.map((p) => (
                      <li key={p} className="flex gap-2.5">
                        <Check className="mt-0.5 size-4 shrink-0 text-[#00a89a] dark:text-[#2ee0cf]" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <div>
            <h2 className="max-w-2xl text-4xl font-semibold tracking-[-0.035em] text-balance sm:text-5xl">Cobertura sem letra miúda.</h2>
            <p className="text-muted-foreground mt-5 max-w-xl text-lg text-pretty">
              A seguradora decide peça por peça, com o motivo escrito. Você vê a mesma tabela que ela.
            </p>
            <ul className="bg-card mt-10 divide-y overflow-hidden rounded-3xl border">
              {DEMO_ITEMS.map((i) => (
                <li key={i.partKey} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-4">
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full",
                      i.coverage === "COBERTO" ? "bg-[#00c9b7]/15 text-[#00a89a] dark:text-[#2ee0cf]" : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {i.coverage === "COBERTO" ? <Check className="size-4" /> : <X className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{partLabel(i.partKey)}</p>
                    <p className="text-muted-foreground text-sm">
                      {ACTION_LABEL[i.action]}
                      {i.insurerNote ? ` · ${i.insurerNote}` : ""}
                    </p>
                  </div>
                  <span className={cn("font-medium tabular-nums", i.coverage === "NAO_COBERTO" && "text-destructive")}>{formatBRL(itemTotal(i))}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="dark bg-background text-foreground relative isolate overflow-hidden rounded-[1.75rem] p-7 ring-1 ring-white/10 lg:mt-[7.5rem]">
            <div aria-hidden className="absolute -top-24 -right-16 -z-10 size-64 rounded-full bg-[#4b4bff]/40 blur-3xl" />
            <dl className="grid gap-3 text-sm">
              <Line k="Total do orçamento" v={summary.quoteTotal} />
              <Line k="Coberto pela seguradora" v={summary.coveredTotal} />
              <Line k="Franquia" v={summary.deductibleApplied} />
              <Line k="Não coberto" v={summary.notCoveredTotal} />
            </dl>
            <div className="mt-6 border-t border-white/10 pt-6">
              <p className="text-muted-foreground text-sm">Você paga</p>
              <p className="mt-1 text-5xl font-semibold tracking-[-0.04em] tabular-nums">{formatBRL(summary.clientPays)}</p>
              <p className="text-muted-foreground mt-2 text-sm">Franquia mais os itens não cobertos. O resto fica com a seguradora.</p>
            </div>
          </div>
        </section>

        <section className="px-5 pb-24 sm:px-8">
          <div className="bg-brand-gradient relative isolate mx-auto grid max-w-7xl gap-8 overflow-hidden rounded-[2rem] px-7 py-14 text-white sm:px-14 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <LogoMark tone="mono" className="absolute -top-16 -right-10 -z-10 size-80 text-white opacity-15" />
            <div>
              <h2 className="text-4xl font-semibold tracking-[-0.035em] text-balance sm:text-5xl">Abra seu próximo sinistro aqui.</h2>
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
      </main>

      <footer className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 border-t px-5 py-8 sm:px-8">
        <Logo />
        <p className="text-muted-foreground text-sm">MVP de demonstração. Não processa pagamentos nem dados reais.</p>
        <ThemeToggle />
      </footer>
    </div>
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
