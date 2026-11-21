"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/action-result";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

/** Diálogo que pede um texto (motivo) antes de executar a ação. */
export function ReasonDialog({
  trigger,
  title,
  description,
  confirmLabel,
  placeholder,
  destructive,
  onConfirm,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  placeholder?: string;
  destructive?: boolean;
  onConfirm: (text: string) => Promise<ActionResult>;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <label htmlFor="reason-text" className="sr-only">Motivo</label>
        <Textarea id="reason-text" rows={4} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={pending || text.trim().length < 5}
            onClick={() =>
              start(async () => {
                const r = await onConfirm(text);
                if (r.ok) {
                  toast.success(r.message);
                  setOpen(false);
                  setText("");
                } else toast.error(r.error);
              })
            }
          >
            {pending ? "Salvando…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
