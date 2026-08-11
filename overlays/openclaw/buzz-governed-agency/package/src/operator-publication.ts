import type { CompletionReconciler, CompletionResult } from "./operator-supervisor.js";
import type { Hex } from "./types.js";

export interface ValidatedCompletion { source_event_id: Hex; assistant_text: string; completed_at: string; tools: [] }
export interface CompletionReader { read(sourceEventId: Hex): Promise<{ status: "completed"; completion: ValidatedCompletion } | { status: "pending" } | { status: "invalid"; code: string }> }
export interface SignerLease { publish(request: { source_event_id: Hex; assistant_text: string }): Promise<{ status: "accepted"; reply_event_id: Hex } | { status: "retryable"; code: string } | { status: "rejected"; code: string }>; close(): void }
export interface SignerBroker { lease(sourceEventId: Hex): Promise<SignerLease> }
export interface ReplyVerifier { verify(sourceEventId: Hex, replyEventId: Hex, assistantText: string): Promise<boolean> }

export class CredentialGatedPublicationReconciler implements CompletionReconciler {
  readonly #reader: CompletionReader; readonly #broker: SignerBroker; readonly #verifier: ReplyVerifier;
  constructor(input: { reader: CompletionReader; broker: SignerBroker; verifier: ReplyVerifier }) { this.#reader = input.reader; this.#broker = input.broker; this.#verifier = input.verifier; }
  async reconcile(sourceEventId: Hex): Promise<CompletionResult> {
    const read = await this.#reader.read(sourceEventId);
    if (read.status === "pending") return { status: "retryable", code: "completion_pending", observed_at: new Date().toISOString() };
    if (read.status === "invalid") return { status: "indeterminate", code: read.code, observed_at: new Date().toISOString() };
    if (read.completion.source_event_id !== sourceEventId || read.completion.tools.length !== 0 || !read.completion.assistant_text.trim()) return { status: "indeterminate", code: "completion_boundary", observed_at: new Date().toISOString() };
    const lease = await this.#broker.lease(sourceEventId);
    try {
      const published = await lease.publish({ source_event_id: sourceEventId, assistant_text: read.completion.assistant_text });
      if (published.status === "retryable") return { status: "retryable", code: published.code, observed_at: new Date().toISOString() };
      if (published.status === "rejected") return { status: "indeterminate", code: published.code, observed_at: new Date().toISOString() };
      const verified = await this.#verifier.verify(sourceEventId, published.reply_event_id, read.completion.assistant_text);
      if (!verified) return { status: "indeterminate", code: "reply_verification_failed", observed_at: new Date().toISOString() };
      return { status: "verified", proof_ref: `buzz-event:${published.reply_event_id}`, verified_at: new Date().toISOString() };
    } finally { lease.close(); }
  }
}
