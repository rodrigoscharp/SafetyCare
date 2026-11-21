import type { Metadata } from "next";
import { ClaimDetailShell } from "@/components/claim/claim-detail-shell";
import { QuoteTable } from "@/components/claim/quote-table";
import { VehicleViewer } from "@/components/vehicle-3d";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { canEditQuote } from "@/domain/permissions";
import { QUOTE_STATUS_LABEL } from "@/domain/labels";
import { latestQuote, viewerDamages, viewerItems } from "@/lib/claim-view";
import { requirePageUser } from "@/lib/session";
import { getClaimForActor } from "@/server/claims";
import { QuoteEditor } from "./quote-editor";
import { WorkshopPanel } from "./workshop-panel";

export const metadata: Metadata = { title: "Sinistro" };

export default async function WorkshopClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser("OFICINA");
  const claim = await getClaimForActor(user, id);
  const v = claim.policy.vehicle;
  const editable = canEditQuote(user, claim);
  const draftOrLast = latestQuote(claim, { includeDraft: true });
  const sent = latestQuote(claim);
  const damages = viewerDamages(claim);

  const nextVersion = draftOrLast?.status === "RASCUNHO" ? draftOrLast.version : (draftOrLast?.version ?? 0) + 1;

  return (
    <ClaimDetailShell claim={claim} userId={user.id} backHref="/oficina" actions={<WorkshopPanel claimId={claim.id} status={claim.status} />}>
      {editable ? (
        <QuoteEditor
          key={draftOrLast?.id ?? "new"}
          claimId={claim.id}
          vehicleType={v.type}
          color={v.color}
          damages={damages}
          initialItems={draftOrLast?.items ?? []}
          initialDays={draftOrLast?.estimatedDays ?? 0}
          version={nextVersion}
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Veículo</CardTitle>
              <CardDescription>
                {claim.status === "ENCAMINHADO_OFICINA" ? "Danos declarados pelo segurado. Confirme o recebimento para orçar." : "Itens do orçamento por peça."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VehicleViewer type={v.type} color={v.color} mode="view" damages={damages} items={viewerItems(sent)} />
            </CardContent>
          </Card>
          {sent ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Orçamento v{sent.version} · {QUOTE_STATUS_LABEL[sent.status]}</CardTitle>
                <CardDescription>Prazo estimado: {sent.estimatedDays} dia(s).</CardDescription>
              </CardHeader>
              <CardContent>
                <QuoteTable items={sent.items} />
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </ClaimDetailShell>
  );
}
