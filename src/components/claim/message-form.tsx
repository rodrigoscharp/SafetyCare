"use client";

import { useActionState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { postMessageAction } from "@/actions/claims";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function MessageForm({ claimId }: { claimId: string }) {
  const [state, action, pending] = useActionState(postMessageAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state) return;
    if (state.ok) formRef.current?.reset();
    else toast.error(state.error);
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-2">
      <input type="hidden" name="claimId" value={claimId} />
      <label htmlFor="message" className="sr-only">Mensagem</label>
      <Textarea
        id="message"
        name="message"
        rows={3}
        maxLength={1000}
        required
        placeholder="Escreva uma mensagem para os envolvidos neste sinistro…"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) formRef.current?.requestSubmit();
        }}
      />
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs">Visível para segurado, oficina e seguradora.</span>
        <Button type="submit" size="sm" disabled={pending}>
          <Send className="size-3.5" /> {pending ? "Enviando…" : "Enviar"}
        </Button>
      </div>
    </form>
  );
}
