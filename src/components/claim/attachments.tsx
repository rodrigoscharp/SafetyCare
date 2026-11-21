"use client";

import { useActionState, useEffect, useRef } from "react";
import { FileText, Upload } from "lucide-react";
import { toast } from "sonner";
import type { AttachmentKind } from "@prisma/client";
import { uploadAttachmentsAction } from "@/actions/claims";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

export type AttachmentView = { id: string; url: string; name: string; kind: AttachmentKind; createdAt: Date; uploader: { name: string } };

export function Attachments({ claimId, attachments, canUpload }: { claimId: string; attachments: AttachmentView[]; canUpload: boolean }) {
  const [state, action, pending] = useActionState(uploadAttachmentsAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message);
      formRef.current?.reset();
    } else toast.error(state.error);
  }, [state]);

  return (
    <div className="grid gap-3">
      {attachments.length ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {attachments.map((a) => (
            <li key={a.id}>
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="group bg-muted relative block aspect-square overflow-hidden rounded-lg border"
                title={`${a.name} · ${a.uploader.name} · ${formatDate(a.createdAt)}`}
              >
                {a.kind === "FOTO" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.url} alt={a.name} className="size-full object-cover transition-transform group-hover:scale-105" />
                ) : (
                  <span className="text-muted-foreground flex size-full flex-col items-center justify-center gap-1 p-2 text-center text-[11px]">
                    <FileText className="size-5" />
                    <span className="line-clamp-2">{a.name}</span>
                  </span>
                )}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">Nenhum anexo.</p>
      )}
      {canUpload ? (
        <form ref={formRef} action={action} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="claimId" value={claimId} />
          <label className="sr-only" htmlFor={`files-${claimId}`}>Arquivos</label>
          <input
            id={`files-${claimId}`}
            name="files"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="file:bg-secondary file:text-secondary-foreground text-muted-foreground max-w-full text-xs file:mr-2 file:rounded-md file:border-0 file:px-2.5 file:py-1.5 file:text-xs"
          />
          <Button type="submit" size="sm" variant="outline" disabled={pending}>
            <Upload className="size-3.5" /> {pending ? "Enviando…" : "Anexar"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
