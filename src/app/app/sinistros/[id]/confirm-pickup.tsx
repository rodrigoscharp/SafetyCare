"use client";

import { useTransition } from "react";
import { CircleCheck } from "lucide-react";
import { toast } from "sonner";
import { confirmPickupAction } from "@/actions/claims";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ConfirmPickup({ claimId, workshop }: { claimId: string; workshop: string }) {
  const [pending, start] = useTransition();
  return (
    <Card className="border-green-500/40 bg-green-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CircleCheck className="size-4 text-green-500" /> Veículo pronto!
        </CardTitle>
        <CardDescription>Retire seu veículo na {workshop} e confirme aqui para encerrar o sinistro.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          className="w-full"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await confirmPickupAction(claimId);
              if (r.ok) toast.success(r.message);
              else toast.error(r.error);
            })
          }
        >
          {pending ? "Confirmando…" : "Confirmar retirada"}
        </Button>
      </CardContent>
    </Card>
  );
}
