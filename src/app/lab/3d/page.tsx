import type { Metadata } from "next";
import { LabClient } from "./lab-client";

export const metadata: Metadata = { title: "Laboratório 3D" };

export default function Lab3DPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Laboratório 3D</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Visualizador isolado: carro e moto procedurais, modos <code>select</code> e <code>view</code>.
      </p>
      <LabClient />
    </main>
  );
}
