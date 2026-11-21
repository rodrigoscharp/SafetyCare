import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <EmptyState
      icon={SearchX}
      title="Sinistro não encontrado"
      description="Ele não existe ou você não tem acesso a ele."
      action={<Button asChild variant="outline"><Link href="/app">Voltar aos sinistros</Link></Button>}
    />
  );
}
