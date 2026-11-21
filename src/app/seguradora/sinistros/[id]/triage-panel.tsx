"use client";

import type { ClaimStatus, ClaimType } from "@prisma/client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { assumeClaimAction, denyClaimAction, forwardClaimAction, totalLossAction } from "@/actions/insurer";
import { ReasonDialog } from "@/components/reason-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ActionResult } from "@/lib/action-result";

export function TriagePanel({
  claimId,
  status,
  type,
  workshops,
}: {
  claimId: string;
  status: ClaimStatus;
  type: ClaimType;
  workshops: { id: string; name: string }[];
}) {
  const [pending, start] = useTransition();
  const [workshopId, setWorkshopId] = useState("");
  const run = (fn: () => Promise<ActionResult>) =>
    start(async () => {
      const r = await fn();
      if (r.ok) toast.success(r.message);
      else toast.error(r.error);
    });

  if (status === "ABERTO") {
    return (
      <Card className="border-primary/40">
        <CardHeader>
          <CardTitle className="text-base">Novo sinistro</CardTitle>
          <CardDescription>Assuma a análise para decidir o encaminhamento.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" disabled={pending} onClick={() => run(() => assumeClaimAction(claimId))}>
            {pending ? "Assumindo…" : "Assumir análise"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status !== "EM_ANALISE") return null;
  const theft = type === "FURTO" || type === "ROUBO";

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="text-base">Decisão da análise</CardTitle>
        <CardDescription>
          {theft ? "Furto/roubo: normalmente segue para indenização integral." : "Encaminhe a uma oficina credenciada ou encerre."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="grid gap-2">
          <label htmlFor="workshop" className="text-sm font-medium">Oficina</label>
          <Select value={workshopId} onValueChange={setWorkshopId}>
            <SelectTrigger id="workshop" className="w-full"><SelectValue placeholder="Escolha a oficina" /></SelectTrigger>
            <SelectContent>
              {workshops.map((w) => (
                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button disabled={pending || !workshopId} onClick={() => run(() => forwardClaimAction(claimId, workshopId))}>
            {pending ? "Encaminhando…" : "Encaminhar à oficina"}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 border-t pt-3">
          <ReasonDialog
            trigger={<Button variant="outline">Indenização integral</Button>}
            title="Indenização integral"
            description="Furto, roubo ou perda total. O sinistro será encerrado sem passar por oficina."
            confirmLabel="Confirmar indenização"
            placeholder="Ex.: veículo não localizado após 30 dias."
            onConfirm={(t) => totalLossAction(claimId, t)}
          />
          <ReasonDialog
            trigger={<Button variant="outline" className="text-destructive">Negar</Button>}
            title="Negar sinistro"
            description="O motivo ficará visível para o segurado na linha do tempo."
            confirmLabel="Negar sinistro"
            placeholder="Ex.: evento fora da vigência da apólice."
            destructive
            onConfirm={(t) => denyClaimAction(claimId, t)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
