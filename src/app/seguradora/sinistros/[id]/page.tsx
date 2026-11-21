import type { Metadata } from "next";
import { ClaimDetailShell } from "@/components/claim/claim-detail-shell";
import { VehicleViewer } from "@/components/vehicle-3d";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { latestQuote, viewerDamages, viewerItems } from "@/lib/claim-view";
import { requirePageUser } from "@/lib/session";
import { getClaimForActor } from "@/server/claims";
import { listWorkshops } from "@/server/users";
import { TriagePanel } from "./triage-panel";

export const metadata: Metadata = { title: "Sinistro" };

export default async function InsurerClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageUser("SEGURADORA");
  const [claim, workshops] = await Promise.all([getClaimForActor(user, id), listWorkshops()]);
  const quote = latestQuote(claim);
  const v = claim.policy.vehicle;

  return (
    <ClaimDetailShell
      claim={claim}
      userId={user.id}
      backHref="/seguradora"
      actions={<TriagePanel claimId={claim.id} status={claim.status} type={claim.type} workshops={workshops} />}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danos</CardTitle>
          <CardDescription>Declarados pelo segurado{quote ? " e itens do orçamento mais recente" : ""}.</CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleViewer type={v.type} color={v.color} mode="view" damages={viewerDamages(claim)} items={viewerItems(quote)} />
        </CardContent>
      </Card>
    </ClaimDetailShell>
  );
}
