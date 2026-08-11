import type { CustodyObject, CustodySink, CustodySource } from "./custody-portability.js";

type RawObject = Omit<CustodyObject, "sha256">;
export interface RelayCustodyReader {
  events(): Promise<RawObject[]>;
  bindings(): Promise<RawObject[]>;
  receipts(): Promise<RawObject[]>;
  operatorStates(): Promise<RawObject[]>;
  attachments(): Promise<RawObject[]>;
}
export interface RelayRestoreTransaction { stage(object: CustodyObject): Promise<void>; commit(): Promise<void>; rollback(): Promise<void>; }
export interface FreshRelayWriter { begin(): Promise<RelayRestoreTransaction>; }

export class RelayCustodySource implements CustodySource {
  readonly #reader: RelayCustodyReader;
  constructor(reader: RelayCustodyReader) { this.#reader = reader; }
  async exportObjects(): Promise<RawObject[]> {
    const groups = await Promise.all([this.#reader.events(), this.#reader.bindings(), this.#reader.receipts(), this.#reader.operatorStates(), this.#reader.attachments()]);
    const objects = groups.flat();
    if (objects.some((item) => item.kind === "attachment" && !item.body_base64)) throw new Error("attachment body unavailable");
    return objects;
  }
}
export class TransactionalRelayCustodySink implements CustodySink {
  readonly #writer: FreshRelayWriter;
  constructor(writer: FreshRelayWriter) { this.#writer = writer; }
  async commit(objects: CustodyObject[]): Promise<void> {
    const transaction = await this.#writer.begin();
    try {
      for (const object of objects) await transaction.stage(structuredClone(object));
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
