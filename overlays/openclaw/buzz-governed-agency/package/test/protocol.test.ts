import assert from "node:assert/strict";
import {
  GOVERNED_ADAPTER_PROTOCOL,
  GOVERNED_ADAPTER_RELEASE,
  assertCompatibleProtocol,
  governedAdapterProtocolManifest,
} from "../src/protocol.js";

const manifest = governedAdapterProtocolManifest();
assert.equal(manifest.release, GOVERNED_ADAPTER_RELEASE);
assert.equal(manifest.protocol, GOVERNED_ADAPTER_PROTOCOL);
assert.deepEqual(manifest.compatible_protocols, ["0.1"]);
assert.equal(manifest.execution_default, "not_executed");
assert.equal(manifest.authority_transfer_default, "none");
assert.equal(manifest.session_policy, "require_existing_no_reset");
assert.throws(() => assertCompatibleProtocol("0.2"), /Unsupported governed-adapter protocol/);
assert.doesNotThrow(() => assertCompatibleProtocol("0.1"));
process.stdout.write("protocol: 1/1 passed\n");
