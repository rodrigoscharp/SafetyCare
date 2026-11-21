"use client";

import type { ClaimType, VehicleType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Bike, Car, Check, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { createClaimAction } from "@/actions/claims";
import { FormField } from "@/components/form-field";
import { VehicleViewer } from "@/components/vehicle-3d";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CLAIM_TYPE_LABEL, SEVERITY_LABEL } from "@/domain/labels";
import { partLabel } from "@/domain/parts";
import type { DamageLike } from "@/domain/part-status";
import { cn } from "@/lib/utils";

export type WizardVehicle = {
  id: string;
  type: VehicleType;
  label: string;
  plate: string;
  color: string;
  policyNumber: string | null;
  policyValid: boolean;
};

const STEPS = ["Veículo", "Ocorrido", "Danos", "Fotos", "Revisão"] as const;
const TYPES = Object.keys(CLAIM_TYPE_LABEL) as ClaimType[];
const MAX_FILES = 10;
const MAX_BYTES = 5 * 1024 * 1024;

function nowLocalInput(): string {
  const d = new Date(Date.now() - 3 * 60 * 60 * 1000); // America/Sao_Paulo (UTC-3)
  return d.toISOString().slice(0, 16);
}

export function NewClaimWizard({ vehicles }: { vehicles: WizardVehicle[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [vehicleId, setVehicleId] = useState(vehicles.find((v) => v.policyValid)?.id ?? "");
  const [type, setType] = useState<ClaimType>("COLISAO");
  const [occurredAt, setOccurredAt] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [damages, setDamages] = useState<DamageLike[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [maxDate, setMaxDate] = useState<string>();
  useEffect(() => setMaxDate(nowLocalInput()), []);

  const vehicle = vehicles.find((v) => v.id === vehicleId);
  const damagesOptional = type === "FURTO" || type === "ROUBO";

  const previews = useMemo(() => files.map((f) => ({ file: f, url: f.type.startsWith("image/") ? URL.createObjectURL(f) : null })), [files]);
  useEffect(() => () => previews.forEach((p) => p.url && URL.revokeObjectURL(p.url)), [previews]);

  function validate(s: number): string | null {
    if (s === 0 && !vehicle) return "Escolha o veículo.";
    if (s === 0 && vehicle && !vehicle.policyValid) return "A apólice deste veículo não está vigente.";
    if (s === 1) {
      if (!occurredAt) return "Informe data e hora do ocorrido.";
      if (location.trim().length < 3) return "Informe o local.";
      if (description.trim().length < 10) return "Descreva o ocorrido com ao menos 10 caracteres.";
    }
    if (s === 2 && !damagesOptional && damages.length === 0) return "Marque ao menos uma peça danificada no modelo 3D.";
    return null;
  }

  function next() {
    const err = validate(step);
    setError(err);
    if (!err) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list);
    const tooBig = incoming.find((f) => f.size > MAX_BYTES);
    if (tooBig) toast.error(`${tooBig.name} passa de 5 MB.`);
    setFiles((cur) => [...cur, ...incoming.filter((f) => f.size <= MAX_BYTES)].slice(0, MAX_FILES));
  }

  function submit() {
    for (let s = 0; s < 3; s++) {
      const err = validate(s);
      if (err) {
        setError(err);
        setStep(s);
        return;
      }
    }
    const fd = new FormData();
    fd.set(
      "payload",
      JSON.stringify({
        vehicleId,
        type,
        occurredAt,
        location,
        description,
        damages: damages.map((d) => ({ ...d, note: d.note?.trim() || null })),
      }),
    );
    files.forEach((f) => fd.append("files", f));
    start(async () => {
      const r = await createClaimAction(fd);
      if (r.ok) {
        toast.success(r.message);
        router.push(`/app/sinistros/${r.data.id}`);
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <div className="grid gap-6">
      <ol className="flex flex-wrap gap-2" aria-label="Passos">
        {STEPS.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                i === step && "border-primary bg-primary/10 font-medium",
                i < step && "hover:bg-accent",
                i > step && "text-muted-foreground opacity-70",
              )}
            >
              <span className={cn("grid size-5 place-items-center rounded-full text-[11px]", i < step ? "bg-primary text-primary-foreground" : "bg-muted")}>
                {i < step ? <Check className="size-3" /> : i + 1}
              </span>
              {label}
            </button>
          </li>
        ))}
      </ol>

      {error ? (
        <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
      ) : null}

      {step === 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Veículo">
          {vehicles.map((v) => {
            const Icon = v.type === "MOTO" ? Bike : Car;
            return (
              <button
                key={v.id}
                type="button"
                role="radio"
                aria-checked={vehicleId === v.id}
                onClick={() => setVehicleId(v.id)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                  vehicleId === v.id ? "border-primary bg-primary/5 ring-primary/20 ring-2" : "hover:bg-accent/50",
                )}
              >
                <Icon className="mt-0.5 size-5" style={{ color: v.color }} />
                <span className="min-w-0">
                  <span className="block font-medium">{v.label}</span>
                  <span className="text-muted-foreground block font-mono text-xs">{v.plate}</span>
                  <span className={cn("mt-1 block text-xs", v.policyValid ? "text-muted-foreground" : "text-destructive")}>
                    {v.policyNumber ? `Apólice ${v.policyNumber}${v.policyValid ? "" : " · vencida"}` : "Sem apólice"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {step === 1 ? (
        <Card>
          <CardContent className="grid gap-4 pt-6">
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Tipo de sinistro</legend>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <Button key={t} type="button" size="sm" variant={type === t ? "default" : "outline"} onClick={() => setType(t)} aria-pressed={type === t}>
                    {CLAIM_TYPE_LABEL[t]}
                  </Button>
                ))}
              </div>
            </fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField id="occurredAt" label="Data e hora do ocorrido">
                <Input id="occurredAt" type="datetime-local" max={maxDate} value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
              </FormField>
              <FormField id="location" label="Local">
                <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Rua, número, cidade/UF" maxLength={200} />
              </FormField>
            </div>
            <FormField id="description" label="O que aconteceu?" hint={`${description.length}/2000`}>
              <Textarea id="description" rows={5} maxLength={2000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Conte com suas palavras como foi o ocorrido." />
            </FormField>
          </CardContent>
        </Card>
      ) : null}

      {step === 2 && vehicle ? (
        <div className="grid gap-3">
          <p className="text-muted-foreground text-sm">
            Clique nas peças danificadas no modelo (ou na lista) e informe a gravidade.
            {damagesOptional ? " Em furto/roubo, marcar peças é opcional." : ""}
          </p>
          <VehicleViewer type={vehicle.type} color={vehicle.color} mode="select" damages={damages} onDamagesChange={setDamages} />
        </div>
      ) : null}

      {step === 3 ? (
        <Card>
          <CardContent className="grid gap-4 pt-6">
            <label
              htmlFor="photos"
              className="hover:bg-accent/40 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center"
            >
              <ImagePlus className="text-muted-foreground size-6" />
              <span className="text-sm font-medium">Adicionar fotos ou documentos</span>
              <span className="text-muted-foreground text-xs">JPG, PNG, WEBP ou PDF · até 5 MB cada · máx. {MAX_FILES} arquivos</span>
              <input
                id="photos"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="sr-only"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            {previews.length ? (
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {previews.map((p, i) => (
                  <li key={`${p.file.name}-${i}`} className="bg-muted relative aspect-square overflow-hidden rounded-lg border">
                    {p.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.url} alt={p.file.name} className="size-full object-cover" />
                    ) : (
                      <span className="text-muted-foreground flex size-full items-center justify-center p-2 text-center text-[11px]">{p.file.name}</span>
                    )}
                    <button
                      type="button"
                      aria-label={`Remover ${p.file.name}`}
                      onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))}
                      className="bg-background/80 absolute top-1 right-1 grid size-6 place-items-center rounded-full"
                    >
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center text-sm">Fotos ajudam a agilizar a análise, mas são opcionais.</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {step === 4 && vehicle ? (
        <Card>
          <CardContent className="grid gap-4 pt-6 text-sm">
            <Review k="Veículo" v={`${vehicle.label} · ${vehicle.plate}`} />
            <Review k="Tipo" v={CLAIM_TYPE_LABEL[type]} />
            <Review k="Quando" v={occurredAt.replace("T", " às ")} />
            <Review k="Onde" v={location} />
            <Review k="Relato" v={description} />
            <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
              <span className="text-muted-foreground">Danos ({damages.length})</span>
              <ul className="grid gap-1">
                {damages.length ? (
                  damages.map((d) => (
                    <li key={d.partKey}>
                      <span className="font-medium">{partLabel(d.partKey)}</span> — {SEVERITY_LABEL[d.severity]}
                      {d.note ? <span className="text-muted-foreground"> · {d.note}</span> : null}
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground">Nenhuma peça marcada</li>
                )}
              </ul>
            </div>
            <Review k="Anexos" v={`${files.length} arquivo(s)`} />
          </CardContent>
        </Card>
      ) : null}

      <div className="flex justify-between gap-2">
        <Button type="button" variant="outline" onClick={() => { setError(null); setStep((s) => Math.max(0, s - 1)); }} disabled={step === 0 || pending}>
          Voltar
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next}>Continuar</Button>
        ) : (
          <Button type="button" onClick={submit} disabled={pending}>{pending ? "Enviando…" : "Abrir sinistro"}</Button>
        )}
      </div>
    </div>
  );
}

function Review({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
      <span className="text-muted-foreground">{k}</span>
      <span className="break-words whitespace-pre-wrap">{v}</span>
    </div>
  );
}
