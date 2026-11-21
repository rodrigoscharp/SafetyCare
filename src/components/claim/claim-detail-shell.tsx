import type { Role } from "@prisma/client";
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, History, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CLAIM_TYPE_LABEL, VEHICLE_TYPE_LABEL } from "@/domain/labels";
import { financialSummary } from "@/domain/quote";
import { latestQuote } from "@/lib/claim-view";
import { formatBRL, formatDate, formatDateTime } from "@/lib/format";
import type { ClaimDetail } from "@/server/claims";
import { Attachments } from "./attachments";
import { ClaimTracker } from "./claim-tracker";
import { MessageForm } from "./message-form";
import { Timeline } from "./timeline";

/** Estrutura comum do detalhe do sinistro para os três perfis. */
export function ClaimDetailShell({
  claim,
  user,
  backHref,
  actions,
  children,
}: {
  claim: ClaimDetail;
  user: { id: string; role: Role };
  backHref: string;
  /** Painel de ações do perfil (coluna lateral) */
  actions?: ReactNode;
  /** Conteúdo principal (3D, orçamento, resumo financeiro) */
  children: ReactNode;
}) {
  const v = claim.policy.vehicle;
  const quote = latestQuote(claim);
  const summary = quote ? financialSummary(quote.items, claim.policy.deductible) : null;
  const messages = claim.events.filter((e) => e.type === "MENSAGEM");

  return (
    <div className="grid gap-6">
      <Link href={backHref} className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm font-medium">
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <ClaimTracker
        status={claim.status}
        viewer={user.role}
        facts={{
          protocol: claim.protocol,
          vehicle: `${v.brand} ${v.model} · ${v.plate}`,
          workshop: claim.workshop?.name,
          estimatedDays: quote?.estimatedDays,
          clientPays: summary && summary.quoteTotal > 0 ? summary.clientPays : null,
          provisional: summary ? summary.pendingTotal > 0 : false,
        }}
      />

      {actions ? <div className="grid gap-4 md:grid-cols-2 [&>*:only-child]:md:col-span-2">{actions}</div> : null}

      <div className="grid min-w-0 gap-6">{children}</div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="min-w-0">
          <CardContent>
            <Tabs defaultValue="mensagens">
              <TabsList>
                <TabsTrigger value="mensagens"><MessageSquare className="size-4" /> Mensagens ({messages.length})</TabsTrigger>
                <TabsTrigger value="historico"><History className="size-4" /> Histórico</TabsTrigger>
              </TabsList>
              <TabsContent value="mensagens" className="mt-6 grid gap-6">
                <MessageForm claimId={claim.id} />
                {messages.length ? (
                  <Timeline events={messages} currentUserId={user.id} />
                ) : (
                  <p className="text-muted-foreground text-sm">Nenhuma mensagem ainda. Fale com segurado, oficina e seguradora por aqui.</p>
                )}
              </TabsContent>
              <TabsContent value="historico" className="mt-6">
                <Timeline events={claim.events} currentUserId={user.id} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detalhes</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm">
                <Fact k="Tipo" v={CLAIM_TYPE_LABEL[claim.type]} />
                <Fact k="Segurado" v={claim.client.name} />
                <Fact k="Veículo" v={`${VEHICLE_TYPE_LABEL[v.type]} · ${v.brand} ${v.model} ${v.year}`} />
                <Fact k="Apólice" v={`${claim.policy.number} · franquia ${formatBRL(claim.policy.deductible)}`} />
                <Fact k="Ocorrido" v={formatDateTime(claim.occurredAt)} />
                <Fact k="Local" v={claim.location} />
                <Fact k="Analista" v={claim.adjuster?.name ?? "Ainda não atribuído"} />
                <Fact k="Aberto em" v={formatDate(claim.createdAt)} />
              </dl>
              <p className="bg-muted/60 mt-4 rounded-xl p-3 text-sm whitespace-pre-wrap">{claim.description}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fotos e documentos ({claim.attachments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Attachments claimId={claim.id} attachments={claim.attachments} canUpload />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-2">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="min-w-0 font-medium break-words">{v}</dd>
    </div>
  );
}
