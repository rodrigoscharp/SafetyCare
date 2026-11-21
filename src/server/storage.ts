import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { DomainError } from "@/domain/errors";

export type StoredFile = { url: string; name: string };

/** Ponto de extensão: trocar por S3/GCS sem mudar quem chama. */
export interface StorageService {
  save(folder: string, file: File): Promise<StoredFile>;
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export function validateUpload(file: File): void {
  if (!ALLOWED[file.type]) throw new DomainError(`Formato não suportado: ${file.name}. Use JPG, PNG, WEBP ou PDF.`);
  if (file.size > MAX_UPLOAD_BYTES) throw new DomainError(`Arquivo muito grande: ${file.name} (máx. 5 MB).`);
}

/** MVP: grava em /public/uploads. */
export class LocalStorageService implements StorageService {
  constructor(private readonly root = path.join(process.cwd(), "public", "uploads")) {}

  async save(folder: string, file: File): Promise<StoredFile> {
    validateUpload(file);
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "");
    const dir = path.join(this.root, safeFolder);
    await mkdir(dir, { recursive: true });
    const filename = `${randomUUID()}.${ALLOWED[file.type]}`;
    await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
    return { url: `/uploads/${safeFolder}/${filename}`, name: file.name.slice(0, 120) };
  }
}

export const storage: StorageService = new LocalStorageService();

export function attachmentKindFor(file: File): "FOTO" | "DOCUMENTO" {
  return file.type.startsWith("image/") ? "FOTO" : "DOCUMENTO";
}
