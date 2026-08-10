import { createHash } from "node:crypto";

export type CustodyObjectKind = "event" | "binding" | "receipt" | "operator_state" | "attachment";
export interface CustodyObject { id: string; kind: CustodyObjectKind; media_type: string; body_base64: string; sha256: string; references: string[]; }
export interface CustodyBundle { format: "powershift-buzz-custody"; version: "0.1"; created_at: string; objects: CustodyObject[]; manifest_sha256: string; }
export interface CustodySource { exportObjects(): Promise<Omit<CustodyObject, "sha256">[]>; }
export interface CustodySink { commit(objects: CustodyObject[]): Promise<void>; }
export interface SignedEventMaterialVerifier { verify(object: CustodyObject): Promise<boolean>; }

const sha = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");
const canonical = (objects: CustodyObject[]) => JSON.stringify(objects.map((item) => ({ ...item, references: [...item.references].sort() })).sort((a, b) => a.id.localeCompare(b.id)));

export class PortableCustodyExporter {
  readonly #source: CustodySource;
  constructor(source: CustodySource) { this.#source = source; }
  async export(createdAt: string): Promise<CustodyBundle> {
    if (!Number.isFinite(Date.parse(createdAt))) throw new Error("invalid export timestamp");
    const raw = await this.#source.exportObjects(); const ids = new Set<string>();
    const objects = raw.map((item) => { if (!item.id || ids.has(item.id) || !item.body_base64) throw new Error("invalid or duplicate custody object"); ids.add(item.id); return { ...item, references: [...item.references].sort(), sha256: sha(item.body_base64) }; }).sort((a, b) => a.id.localeCompare(b.id));
    for (const item of objects) for (const reference of item.references) if (!ids.has(reference)) throw new Error(`missing referenced object: ${reference}`);
    return { format: "powershift-buzz-custody", version: "0.1", created_at: createdAt, objects, manifest_sha256: sha(canonical(objects)) };
  }
}
export class PortableCustodyRestorer {
  readonly #sink: CustodySink; readonly #verifier: SignedEventMaterialVerifier;
  constructor(input: { sink: CustodySink; verifier: SignedEventMaterialVerifier }) { this.#sink = input.sink; this.#verifier = input.verifier; }
  async restore(bundle: CustodyBundle): Promise<{ status: "restored"; objects: number }> {
    if (bundle.format !== "powershift-buzz-custody" || bundle.version !== "0.1" || bundle.manifest_sha256 !== sha(canonical(bundle.objects))) throw new Error("custody manifest mismatch");
    const ids = new Set(bundle.objects.map((item) => item.id));
    for (const item of bundle.objects) {
      if (item.sha256 !== sha(item.body_base64)) throw new Error(`custody object digest mismatch: ${item.id}`);
      for (const reference of item.references) if (!ids.has(reference)) throw new Error(`missing referenced object: ${reference}`);
      if (item.kind === "event" && !await this.#verifier.verify(item)) throw new Error(`signed event verification failed: ${item.id}`);
    }
    await this.#sink.commit(structuredClone(bundle.objects));
    return { status: "restored", objects: bundle.objects.length };
  }
}
