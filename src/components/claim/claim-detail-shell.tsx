import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CLAIM_TYPE_LABEL, VEHICLE_TYPE_LABEL } from "@/domain/labels";
import { formatBRL, formatDate, formatDateTime } from "@/lib/format";
import type { ClaimDetail } from "@/server/claims";
import { Attachments } from "./attachments";
import { MessageForm } from "./message-form";
import { StatusBadge } from "./status-badge";
import { StatusStepper } from "./status-stepper";
import { Timeline } from "./timeline";

/** Estrutura comum do detalhe do sinistro para os três perfis. */
export function ClaimDetailShell({
  claim,
  userId,
  backHref,
  actions,
  children,
}: {
  claim: ClaimDetail;
  userId: string;
  backHref: string;
  /** Painel de ações do perfil (coluna lateral) */
  actions?: ReactNode;
  /** Conteúdo principal (3D, orçamento, resumo financeiro) */
  children: ReactNode;
}) {
  const v = claim.policy.vehicle;
  return (
    <div className="grid gap-6">
      <div>
        <Link href={backHref} className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm">
          <ArrowLeft className="size-3.5" /> Voltar
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-semibold tracking-tight">{claim.protocol}</h1>
          <StatusBadge status={claim.status} className="text-sm" />
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          {CLAIM_TYPE_LABEL[claim.type]} · {v.brand} {v.model} {v.year} · {v.plate} · aberto em {formatDate(claim.createdAt)}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <StatusStepper status={claim.status} />
        </CardContent>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid min-w-0 gap-6">{children}</div>

        <div className="grid gap-6">
          {actions}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados do sinistro</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-2.5 text-sm">
                <Fact k="Segurado" v={claim.client.name} />
                <Fact k="Veículo" v={`${VEHICLE_TYPE_LABEL[v.type]} · ${v.brand} ${v.model}`} />
                <Fact k="Apólice" v={`${claim.policy.number} · franquia ${formatBRL(claim.policy.deductible)}`} />
                <Fact k="Ocorrido em" v={formatDateTime(claim.occurredAt)} />
                <Fact k="Local" v={claim.location} />
                <Fact k="Oficina" v={claim.workshop?.name ?? "Ainda não definida"} />
                <Fact k="Analista" v={claim.adjuster?.name ?? "Ainda não atribuído"} />
              </dl>
              <p className="bg-muted/50 mt-4 rounded-lg p-3 text-sm whitespace-pre-wrap">{claim.description}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Anexos ({claim.attachments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Attachments claimId={claim.id} attachments={claim.attachments} canUpload />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Linha do tempo e mensagens</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Timeline events={claim.events} currentUserId={userId} />
          <div className="lg:sticky lg:top-20 lg:self-start">
            <MessageForm claimId={claim.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-2">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="min-w-0 break-words">{v}</dd>
    </div>
  );
}
