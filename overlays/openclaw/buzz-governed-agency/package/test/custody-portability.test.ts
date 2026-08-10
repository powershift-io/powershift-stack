import assert from "node:assert/strict";
import { PortableCustodyExporter, PortableCustodyRestorer } from "../src/custody-portability.js";
const body = (value: string) => Buffer.from(value).toString("base64");
const source = { async exportObjects() { return [
  { id: "attachment:a", kind: "attachment" as const, media_type: "text/plain", body_base64: body("attachment bytes"), references: [] },
  { id: "event:root", kind: "event" as const, media_type: "application/json", body_base64: body('{"signed":true}'), references: ["attachment:a"] },
  { id: "binding:root", kind: "binding" as const, media_type: "application/json", body_base64: body('{"session":"digest-only"}'), references: ["event:root"] },
  { id: "receipt:root", kind: "receipt" as const, media_type: "application/json", body_base64: body('{"reply":"verified"}'), references: ["event:root"] },
  { id: "operator:root", kind: "operator_state" as const, media_type: "application/json", body_base64: body('{"state":"reconciled"}'), references: ["receipt:root"] },
]; } };
const bundle = await new PortableCustodyExporter(source).export("2026-08-08T13:40:00.000Z"); let committed = 0;
const restorer = new PortableCustodyRestorer({ verifier: { async verify() { return true; } }, sink: { async commit(objects) { committed = objects.length; } } });
assert.deepEqual(await restorer.restore(bundle), { status: "restored", objects: 5 }); assert.equal(committed, 5);
const missing = structuredClone(bundle); missing.objects = missing.objects.filter((item) => item.id !== "attachment:a");
await assert.rejects(restorer.restore(missing), /manifest mismatch|missing referenced object/); assert.equal(committed, 5);
const tampered = structuredClone(bundle); tampered.objects[0]!.body_base64 = body("changed");
await assert.rejects(restorer.restore(tampered), /manifest mismatch|digest mismatch/); assert.equal(committed, 5);
const badSignature = new PortableCustodyRestorer({ verifier: { async verify() { return false; } }, sink: { async commit() { throw new Error("must not commit"); } } });
await assert.rejects(badSignature.restore(bundle), /signed event verification failed/);
console.log("1..1\n# 1 complete custody export/restore test passed");
