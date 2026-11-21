import Link from "next/link";
import { Building2, Car, ShieldCheck, Wrench } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

const PROFILES = [
  { icon: Car, title: "Segurado", text: "Abra o sinistro, marque no modelo 3D onde foi o dano e acompanhe cada etapa até a entrega." },
  { icon: Building2, title: "Seguradora", text: "Analise, encaminhe à oficina credenciada e aprove o orçamento item a item." },
  { icon: Wrench, title: "Oficina", text: "Receba o veículo, monte o orçamento clicando nas peças e atualize o reparo." },
];

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost"><Link href="/login">Entrar</Link></Button>
          <Button asChild><Link href="/cadastro">Criar conta</Link></Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-14 px-4 py-16">
        <section className="max-w-2xl">
          <p className="text-primary mb-3 inline-flex items-center gap-2 text-sm font-medium">
            <ShieldCheck className="size-4" /> Sinistro de veículo, sem ligação e sem papel
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Do registro do sinistro à entrega do veículo, todos vendo a mesma coisa.
          </h1>
          <p className="text-muted-foreground mt-4 text-lg text-pretty">
            Segurado, seguradora e oficina acompanham o mesmo sinistro em um modelo 3D do veículo: cada peça mostra a ação, o valor e se está coberta.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link href="/login">Acessar minha conta</Link></Button>
            <Button asChild size="lg" variant="outline"><Link href="/lab/3d">Ver o modelo 3D</Link></Button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {PROFILES.map((p) => (
            <div key={p.title} className="bg-card rounded-xl border p-5">
              <p.icon className="text-primary size-5" />
              <h2 className="mt-3 font-medium">{p.title}</h2>
              <p className="text-muted-foreground mt-1 text-sm">{p.text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="text-muted-foreground mx-auto w-full max-w-6xl px-4 py-6 text-xs">
        SafetyCare · MVP de demonstração. Não processa pagamentos nem dados reais.
      </footer>
    </div>
  );
}
