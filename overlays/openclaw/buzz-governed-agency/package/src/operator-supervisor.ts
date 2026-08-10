import type { OperatorControlPlane } from "./operator-control.js";
import type { BuzzRootDispatchQueue } from "./root-dispatch.js";
import type { RootDispatchEnvelope, RootDrainResult, RootEnqueueResult } from "./root-dispatch-types.js";
import type { Hex } from "./types.js";

export type CompletionResult =
  | { status: "verified"; proof_ref: string; verified_at: string }
  | { status: "retryable"; code: string; observed_at: string }
  | { status: "indeterminate"; code: string; observed_at: string };

export interface CompletionReconciler {
  reconcile(sourceEventId: Hex): Promise<CompletionResult>;
}
export interface ReconciledTelemetrySink { recordReconciled(sourceEventId: Hex, result: Extract<CompletionResult, { status: "verified" }>): Promise<void>; }

export interface SupervisorCycleResult {
  drain: RootDrainResult;
  reconciled: Hex[];
  retryable: Hex[];
  quarantined: Hex[];
}

export class DurableOperatorSupervisor {
  readonly #queue: BuzzRootDispatchQueue;
  readonly #control: OperatorControlPlane;
  readonly #completion: CompletionReconciler;
  readonly #telemetry: ReconciledTelemetrySink | undefined;

  constructor(input: { queue: BuzzRootDispatchQueue; control: OperatorControlPlane; completion: CompletionReconciler; telemetry?: ReconciledTelemetrySink }) {
    this.#queue = input.queue;
    this.#control = input.control;
    this.#completion = input.completion;
    this.#telemetry = input.telemetry;
  }

  accept(envelope: RootDispatchEnvelope, at: string): RootEnqueueResult {
    const registered = this.#control.register(envelope.source_event_id, envelope.binding_id, at);
    if (registered.status === "rejected") {
      return { status: "rejected", code: "invalid_envelope", consequence: "No ACP turn, response closure, execution, or authority transfer occurred." };
    }
    return this.#queue.enqueue(envelope, at);
  }

  async cycle(bindingId: string, at: string): Promise<SupervisorCycleResult> {
    const drain = await this.#queue.drain(bindingId, at);
    const reconciled: Hex[] = [];
    const retryable: Hex[] = [];
    const quarantined: Hex[] = [];
    const completionCandidates = Array.from(new Set([
      ...drain.dispatched_source_event_ids,
      ...this.#queue.dispatchedRecords(bindingId)
        .map((record) => record.envelope.source_event_id)
        .filter((sourceEventId) => this.#control.get(sourceEventId)?.disposition !== "reconciled"),
    ]));
    for (const sourceEventId of completionCandidates) {
      const result = await this.#completion.reconcile(sourceEventId);
      if (result.status === "verified") {
        await this.#telemetry?.recordReconciled(sourceEventId, result);
        this.#control.recordReconciled(sourceEventId, "publication_verified", result.verified_at, result.proof_ref);
        reconciled.push(sourceEventId);
      } else if (result.status === "retryable") {
        this.#control.recordRetryable(sourceEventId, result.code, result.observed_at);
        retryable.push(sourceEventId);
      } else {
        this.#control.recordQuarantine(sourceEventId, result.code, result.observed_at);
        quarantined.push(sourceEventId);
      }
    }
    return { drain, reconciled, retryable, quarantined };
  }
}
