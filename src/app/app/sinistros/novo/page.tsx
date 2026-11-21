import type { Metadata } from "next";
import Link from "next/link";
import { Car } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requirePageUser } from "@/lib/session";
import { listVehicles } from "@/server/vehicles";
import { NewClaimWizard, type WizardVehicle } from "./wizard";

export const metadata: Metadata = { title: "Abrir sinistro" };

export default async function NewClaimPage() {
  const user = await requirePageUser("CLIENTE");
  const vehicles = await listVehicles(user);
  const options: WizardVehicle[] = vehicles.map((v) => ({
    id: v.id,
    type: v.type,
    label: `${v.brand} ${v.model} ${v.year}`,
    plate: v.plate,
    color: v.color,
    policyNumber: v.policies[0]?.number ?? null,
    policyValid: v.policies[0] ? v.policies[0].validUntil.getTime() >= Date.now() : false,
  }));

  return (
    <>
      <PageHeader title="Abrir sinistro" description="Leva poucos minutos. Você poderá enviar mais fotos e mensagens depois." />
      {options.length ? (
        <NewClaimWizard vehicles={options} />
      ) : (
        <EmptyState
          icon={Car}
          title="Cadastre um veículo primeiro"
          description="Para abrir um sinistro, cadastre o veículo e a apólice vinculada."
          action={<Button asChild><Link href="/app/veiculos">Cadastrar veículo</Link></Button>}
        />
      )}
    </>
  );
}
