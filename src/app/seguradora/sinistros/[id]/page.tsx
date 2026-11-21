import type { Metadata } from "next";
import { ClaimDetailShell } from "@/components/claim/claim-detail-shell";
import { FinancialSummaryView } from "@/components/claim/financial-summary";
import { QuoteTable } from "@/components/claim/quote-table";
import { VehicleViewer } from "@/components/vehicle-3d";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QUOTE_STATUS_LABEL } from "@/domain/labels";
import { canReviewQuote } from "@/domain/permissions";
import { financialSummary } from "@/domain/quote";
import { latestQuote, viewerDamages, viewerItems } from "@/lib/claim-view";
import { requirePageUser } from "@/lib/session";
import { getClaimForActor } from "@/server/claims";
import { listWorkshops } from "@/server/users";
import { QuoteReview } from "./quote-review";
import { TriagePanel } from "./triage-panel";

export const metadata: Metadata = { title: "Sinistro" };

export default async function InsurerClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser("SEGURADORA");
  const [claim, workshops] = await Promise.all([getClaimForActor(user, id), listWorkshops()]);
  const quote = latestQuote(claim);
  const v = claim.policy.vehicle;
  const reviewing = canReviewQuote(user, claim) && quote?.status === "ENVIADO";

  return (
    <ClaimDetailShell
      claim={claim}
      user={user}
      backHref="/seguradora"
      actions={<TriagePanel claimId={claim.id} status={claim.status} type={claim.type} workshops={workshops} />}
    >
      {reviewing && quote ? (
        <QuoteReview
          claimId={claim.id}
          vehicleType={v.type}
          color={v.color}
          damages={viewerDamages(claim)}
          items={quote.items}
          version={quote.version}
          estimatedDays={quote.estimatedDays}
          workshop={claim.workshop?.name ?? "Oficina"}
          deductible={claim.policy.deductible}
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Danos</CardTitle>
              <CardDescription>Declarados pelo segurado{quote ? " e itens do orçamento mais recente" : ""}.</CardDescription>
            </CardHeader>
            <CardContent>
              <VehicleViewer type={v.type} color={v.color} mode="view" damages={viewerDamages(claim)} items={viewerItems(quote)} />
            </CardContent>
          </Card>
          {quote ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Orçamento v{quote.version} · {QUOTE_STATUS_LABEL[quote.status]}</CardTitle>
                <CardDescription>{claim.workshop?.name} · prazo estimado de {quote.estimatedDays} dia(s).</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_320px]">
                <QuoteTable items={quote.items} />
                <FinancialSummaryView
                  summary={financialSummary(quote.items, claim.policy.deductible)}
                  audience="staff"
                  provisional={quote.items.some((i) => i.coverage === "PENDENTE")}
                />
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </ClaimDetailShell>
  );
}
