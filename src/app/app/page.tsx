import type { Metadata } from "next";
import Link from "next/link";
import { FileWarning, Plus } from "lucide-react";
import { ClaimList } from "@/components/claim/claim-list";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requirePageUser } from "@/lib/session";
import { listClaimsForActor } from "@/server/claims";

export const metadata: Metadata = { title: "Meus sinistros" };

export default async function ClientHome() {
  const user = await requirePageUser("CLIENTE");
  const claims = await listClaimsForActor(user);
  return (
    <>
      <PageHeader
        title="Meus sinistros"
        description="Acompanhe cada etapa, do registro à entrega do veículo."
        actions={
          <Button asChild>
            <Link href="/app/sinistros/novo"><Plus className="size-4" /> Abrir sinistro</Link>
          </Button>
        }
      />
      {claims.length ? (
        <ClaimList claims={claims} basePath="/app" show="workshop" />
      ) : (
        <EmptyState
          icon={FileWarning}
          title="Nenhum sinistro por aqui"
          description="Quando algo acontecer com seu veículo, abra um sinistro e marque os danos no modelo 3D."
          action={<Button asChild><Link href="/app/sinistros/novo">Abrir sinistro</Link></Button>}
        />
      )}
    </>
  );
}
