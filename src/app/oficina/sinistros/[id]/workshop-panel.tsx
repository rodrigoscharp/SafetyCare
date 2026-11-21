"use client";

import type { ClaimStatus } from "@prisma/client";
import { useTransition } from "react";
import { toast } from "sonner";
import { readyForPickupAction, receiveVehicleAction, startRepairAction } from "@/actions/workshop";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ActionResult } from "@/lib/action-result";

const CONFIG: Partial<Record<ClaimStatus, { title: string; description: string; label: string; run: (id: string) => Promise<ActionResult> }>> = {
  ENCAMINHADO_OFICINA: {
    title: "Sinistro encaminhado",
    description: "Confirme quando o veículo chegar à oficina para liberar o orçamento.",
    label: "Confirmar recebimento do veículo",
    run: receiveVehicleAction,
  },
  ORCAMENTO_APROVADO: {
    title: "Orçamento aprovado",
    description: "Execute apenas os itens aprovados. Itens não cobertos são pagos pelo segurado.",
    label: "Iniciar reparo",
    run: startRepairAction,
  },
  EM_REPARO: {
    title: "Reparo em andamento",
    description: "Ao terminar, avise o segurado de que o veículo está pronto.",
    label: "Marcar pronto para retirada",
    run: readyForPickupAction,
  },
};

export function WorkshopPanel({ claimId, status }: { claimId: string; status: ClaimStatus }) {
  const [pending, start] = useTransition();
  const cfg = CONFIG[status];
  if (!cfg) return null;
  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="text-base">{cfg.title}</CardTitle>
        <CardDescription>{cfg.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          className="w-full"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await cfg.run(claimId);
              if (r.ok) toast.success(r.message);
              else toast.error(r.error);
            })
          }
        >
          {pending ? "Salvando…" : cfg.label}
        </Button>
      </CardContent>
    </Card>
  );
}
