"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-14 text-center">
      <TriangleAlert className="text-destructive size-6" />
      <div>
        <p className="font-medium">Algo deu errado</p>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          Não foi possível carregar esta página. Tente novamente em instantes.
          {error.digest ? <span className="block font-mono text-xs">Código: {error.digest}</span> : null}
        </p>
      </div>
      <Button variant="outline" onClick={reset}>Tentar novamente</Button>
    </div>
  );
}
