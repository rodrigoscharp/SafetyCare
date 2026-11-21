"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteVehicleAction, saveVehicleAction } from "@/actions/vehicles";
import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type VehicleFormValues = {
  id?: string;
  type: "CARRO" | "MOTO";
  brand: string;
  model: string;
  year: string;
  plate: string;
  color: string;
  policyNumber: string;
  deductible: string;
  validUntil: string;
};

const EMPTY: VehicleFormValues = {
  type: "CARRO",
  brand: "",
  model: "",
  year: "",
  plate: "",
  color: "#9aa3ad",
  policyNumber: "",
  deductible: "",
  validUntil: "",
};

export function VehicleFormDialog({ initial }: { initial?: VehicleFormValues }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(saveVehicleAction, null);
  const v = initial ?? EMPTY;
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  useEffect(() => {
    if (!state) return;
    if (state.ok) {
      toast.success(state.message);
      setOpen(false);
    } else if (!state.fieldErrors) toast.error(state.error);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {initial ? (
          <Button variant="outline" size="sm"><Pencil className="size-3.5" /> Editar</Button>
        ) : (
          <Button><Plus className="size-4" /> Novo veículo</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar veículo" : "Novo veículo"}</DialogTitle>
          <DialogDescription>Dados do veículo e da apólice vinculada.</DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-4" key={state?.ok ? "reset" : "form"}>
          {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}
          <div className="grid grid-cols-2 gap-3">
            <FormField id="type" label="Tipo" error={fe?.type}>
              <Select name="type" defaultValue={v.type}>
                <SelectTrigger id="type" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CARRO">Carro</SelectItem>
                  <SelectItem value="MOTO">Moto</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField id="plate" label="Placa" error={fe?.plate}>
              <Input id="plate" name="plate" defaultValue={v.plate} placeholder="ABC1D23" className="uppercase" required />
            </FormField>
            <FormField id="brand" label="Marca" error={fe?.brand}>
              <Input id="brand" name="brand" defaultValue={v.brand} required />
            </FormField>
            <FormField id="model" label="Modelo" error={fe?.model}>
              <Input id="model" name="model" defaultValue={v.model} required />
            </FormField>
            <FormField id="year" label="Ano" error={fe?.year}>
              <Input id="year" name="year" type="number" inputMode="numeric" defaultValue={v.year} required />
            </FormField>
            <FormField id="color" label="Cor" error={fe?.color}>
              <Input id="color" name="color" type="color" defaultValue={v.color} className="h-9 p-1" />
            </FormField>
          </div>
          <fieldset className="grid gap-3 rounded-lg border p-3">
            <legend className="px-1 text-sm font-medium">Apólice</legend>
            <FormField id="policyNumber" label="Número" error={fe?.policyNumber}>
              <Input id="policyNumber" name="policyNumber" defaultValue={v.policyNumber} required />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField id="deductible" label="Franquia (R$)" error={fe?.deductible}>
                <Input id="deductible" name="deductible" inputMode="decimal" defaultValue={v.deductible} placeholder="2500,00" required />
              </FormField>
              <FormField id="validUntil" label="Vigente até" error={fe?.validUntil}>
                <Input id="validUntil" name="validUntil" type="date" defaultValue={v.validUntil} required />
              </FormField>
            </div>
          </fieldset>
          <DialogFooter>
            <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteVehicleButton({ id, label }: { id: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive"><Trash2 className="size-3.5" /> Excluir</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir {label}?</DialogTitle>
          <DialogDescription>A apólice vinculada também será removida. Veículos com sinistros não podem ser excluídos.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await deleteVehicleAction(id);
                if (r.ok) {
                  toast.success(r.message);
                  setOpen(false);
                } else toast.error(r.error);
              })
            }
          >
            {pending ? "Excluindo…" : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
