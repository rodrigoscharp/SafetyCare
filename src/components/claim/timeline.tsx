import type { ClaimEventType, ClaimStatus, Role } from "@prisma/client";
import { ArrowRight, FileText, MessageSquare, Paperclip, ShieldCheck, Sparkles } from "lucide-react";
import { STATUS_LABEL } from "@/domain/claim-state-machine";
import { ROLE_LABEL } from "@/domain/roles";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export type TimelineEvent = {
  id: string;
  type: ClaimEventType;
  fromStatus: ClaimStatus | null;
  toStatus: ClaimStatus | null;
  message: string;
  createdAt: Date;
  actor: { id: string; name: string; role: Role };
};

const ICON: Record<ClaimEventType, typeof MessageSquare> = {
  CRIACAO: Sparkles,
  STATUS: ArrowRight,
  MENSAGEM: MessageSquare,
  ORCAMENTO: FileText,
  COBERTURA: ShieldCheck,
  ANEXO: Paperclip,
};

export function Timeline({ events, currentUserId }: { events: TimelineEvent[]; currentUserId: string }) {
  if (!events.length) return <p className="text-muted-foreground text-sm">Nenhum evento ainda.</p>;
  return (
    <ol className="relative grid gap-4 before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-px before:bg-border">
      {[...events].reverse().map((e) => {
        const Icon = ICON[e.type];
        const isMessage = e.type === "MENSAGEM";
        const mine = e.actor.id === currentUserId;
        return (
          <li key={e.id} className="relative flex gap-3">
            <span
              className={cn(
                "bg-background relative z-10 grid size-8 shrink-0 place-items-center rounded-full border",
                isMessage && "border-primary/40 text-primary",
              )}
            >
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-muted-foreground text-xs">
                <span className="text-foreground font-medium">{mine ? "Você" : e.actor.name}</span> · {ROLE_LABEL[e.actor.role]} ·{" "}
                <time dateTime={new Date(e.createdAt).toISOString()}>{formatDateTime(e.createdAt)}</time>
              </p>
              {e.type === "STATUS" && e.toStatus ? (
                <p className="mt-0.5 text-sm font-medium">
                  {e.fromStatus ? `${STATUS_LABEL[e.fromStatus]} → ` : ""}
                  {STATUS_LABEL[e.toStatus]}
                </p>
              ) : null}
              <p
                className={cn(
                  "mt-1 text-sm break-words whitespace-pre-wrap",
                  isMessage ? "bg-muted/60 rounded-lg rounded-tl-none px-3 py-2" : "text-muted-foreground",
                )}
              >
                {e.message}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
