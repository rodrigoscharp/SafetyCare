import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-muted-foreground font-mono text-sm">404</p>
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <Button asChild variant="outline"><Link href="/">Ir para o início</Link></Button>
    </main>
  );
}
