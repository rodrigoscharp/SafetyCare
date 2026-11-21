import type { VehicleType } from "@prisma/client";
import type { BufferGeometry } from "three";

/** Tipo de material base de uma peça (usado quando ela está intacta). */
export type MaterialKind = "body" | "glass" | "headlight" | "taillight" | "tire" | "chrome" | "dark" | "seat" | "plate" | "metal";

type Vec3 = [number, number, number];

export type MeshSpec = {
  geometry: BufferGeometry;
  position: Vec3;
  rotation?: Vec3;
  material: MaterialKind;
};

/** Mesh selecionável: o `key` é o partKey do catálogo e vira `mesh.name`. */
export type PartMeshSpec = MeshSpec & { key: string };

export type VehicleModel = {
  parts: PartMeshSpec[];
  /** Malhas decorativas, não interativas (chassi, cabine, cubos de roda...) */
  decor: MeshSpec[];
  camera: { position: Vec3; target: Vec3; minDistance: number; maxDistance: number };
};

/**
 * Fornece os meshes do veículo por partKey. A implementação procedural é a primeira;
 * uma implementação GLB futura pode carregar o arquivo, percorrer os nós e mapear `node.name` → partKey.
 */
export interface VehicleModelProvider {
  readonly id: string;
  getModel(type: VehicleType): VehicleModel;
}
