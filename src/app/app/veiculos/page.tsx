import type { Metadata } from "next";
import { Bike, Car } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { VEHICLE_TYPE_LABEL } from "@/domain/labels";
import { formatBRL, formatDate, toSaoPauloDateInput, centsToInput } from "@/lib/format";
import { requirePageUser } from "@/lib/session";
import { listVehicles } from "@/server/vehicles";
import { DeleteVehicleButton, VehicleFormDialog, type VehicleFormValues } from "./vehicle-form";

export const metadata: Metadata = { title: "Veículos" };

export default async function VehiclesPage() {
  const user = await requirePageUser("CLIENTE");
  const vehicles = await listVehicles(user);

  return (
    <>
      <PageHeader
        title="Meus veículos"
        description="Veículos segurados e a apólice vinculada a cada um."
        actions={<VehicleFormDialog />}
      />
      {vehicles.length === 0 ? (
        <EmptyState icon={Car} title="Nenhum veículo cadastrado" description="Cadastre seu carro ou moto com a apólice para poder abrir sinistros." action={<VehicleFormDialog />} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => {
            const p = v.policies[0];
            const Icon = v.type === "MOTO" ? Bike : Car;
            const values: VehicleFormValues = {
              id: v.id,
              type: v.type,
              brand: v.brand,
              model: v.model,
              year: String(v.year),
              plate: v.plate,
              color: v.color,
              policyNumber: p?.number ?? "",
              deductible: p ? centsToInput(p.deductible) : "",
              validUntil: p ? toSaoPauloDateInput(p.validUntil) : "",
            };
            const expired = p ? p.validUntil.getTime() < Date.now() : true;
            return (
              <Card key={v.id}>
                <CardContent className="grid gap-4 pt-6">
                  <div className="flex items-start gap-3">
                    <span className="grid size-11 place-items-center rounded-lg border" style={{ background: `${v.color}22` }}>
                      <Icon className="size-5" style={{ color: v.color }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{v.brand} {v.model}</p>
                      <p className="text-muted-foreground text-sm">{VEHICLE_TYPE_LABEL[v.type]} · {v.year} · <span className="font-mono">{v.plate}</span></p>
                    </div>
                  </div>
                  <dl className="bg-muted/50 grid gap-1.5 rounded-lg p-3 text-sm">
                    {p ? (
                      <>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Apólice</dt><dd className="font-mono">{p.number}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Franquia</dt><dd>{formatBRL(p.deductible)}</dd></div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Vigência</dt>
                          <dd className={expired ? "text-destructive" : undefined}>{expired ? "Vencida em " : "Até "}{formatDate(p.validUntil)}</dd>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Sem apólice vinculada.</p>
                    )}
                  </dl>
                  <div className="flex justify-end gap-2">
                    <DeleteVehicleButton id={v.id} label={`${v.brand} ${v.model}`} />
                    <VehicleFormDialog initial={values} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
