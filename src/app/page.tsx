import { BrandLayers } from "@/components/landing/brand-layers";
import { Coverage } from "@/components/landing/coverage";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { Marquee } from "@/components/landing/marquee";
import { Steps } from "@/components/landing/steps";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-dvh">
      <Hero />
      <Marquee />
      <main>
        <Steps />
        <BrandLayers />
        <Coverage />
        <FinalCta />
      </main>
      <footer className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 border-t px-5 py-8 sm:px-8">
        <Logo />
        <p className="text-muted-foreground text-sm">MVP de demonstração. Não processa pagamentos nem dados reais.</p>
        <ThemeToggle />
      </footer>
    </div>
  );
}
