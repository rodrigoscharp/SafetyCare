import type { Metadata } from "next";
import { ClaimDetailShell } from "@/components/claim/claim-detail-shell";
import { FinancialSummaryView } from "@/components/claim/financial-summary";
import { QuoteTable } from "@/components/claim/quote-table";
import { VehicleViewer } from "@/components/vehicle-3d";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { financialSummary } from "@/domain/quote";
import { latestQuote, viewerDamages, viewerItems } from "@/lib/claim-view";
import { requirePageUser } from "@/lib/session";
import { getClaimForActor } from "@/server/claims";
import { ConfirmPickup } from "./confirm-pickup";

export const metadata: Metadata = { title: "Sinistro" };

export default async function ClientClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser("CLIENTE");
  const claim = await getClaimForActor(user, id);
  const quote = latestQuote(claim);
  const v = claim.policy.vehicle;

  return (
    <ClaimDetailShell
      claim={claim}
      user={user}
      backHref="/app"
      actions={claim.status === "PRONTO_PARA_RETIRADA" ? <ConfirmPickup claimId={claim.id} workshop={claim.workshop?.name ?? "oficina"} /> : null}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seu veículo</CardTitle>
          <CardDescription>
            {quote ? "Passe o mouse (ou toque) nas peças para ver ação, valores e cobertura." : "Peças que você marcou como danificadas."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleViewer type={v.type} color={v.color} mode="view" damages={viewerDamages(claim)} items={viewerItems(quote)} />
        </CardContent>
      </Card>
      {quote ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quanto você vai pagar</CardTitle>
            <CardDescription>
              Orçamento da {claim.workshop?.name ?? "oficina"} · prazo estimado de {quote.estimatedDays} dia(s).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="order-2 min-w-0 2xl:order-1">
              <QuoteTable items={quote.items} />
            </div>
            <div className="order-1 min-w-0 2xl:order-2">
              <FinancialSummaryView
                summary={financialSummary(quote.items, claim.policy.deductible)}
                audience="client"
                provisional={quote.items.some((i) => i.coverage === "PENDENTE")}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </ClaimDetailShell>
  );
}
