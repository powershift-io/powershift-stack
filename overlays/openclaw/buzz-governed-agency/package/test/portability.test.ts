import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const srcDir = fileURLToPath(new URL("../../src/", import.meta.url));
const packagePath = fileURLToPath(new URL("../../package.json", import.meta.url));

const source = readdirSync(srcDir)
  .filter((name) => name.endsWith(".ts"))
  .sort()
  .map((name) => `${name}\n${readFileSync(`${srcDir}/${name}`, "utf8")}`)
  .join("\n");

const forbiddenDeploymentLiterals: Array<[string, RegExp]> = [
  ["a developer home path", /\/Users\//],
  ["the reference host account", /polaritydancer/i],
  ["a local relay endpoint", /wss?:\/\/localhost(?::\d+)?/i],
  ["a deployment-specific Mind or human", /\b(?:Thomas|Down|Dance)\b/],
  ["direct environment access", /process\.env/],
  ["a concrete OpenClaw session key", /agent:[a-z0-9_-]+:/i],
];

for (const [label, pattern] of forbiddenDeploymentLiterals) {
  if (pattern.test(source)) {
    throw new Error(`portable production source contains ${label}: ${pattern}`);
  }
}

const requiredInjectedPorts = [
  "interface AdapterLogger",
  "interface ReplayStore",
  "interface BuzzReceiptPublisher",
  "interface ReceiptReturnStore",
  "interface MindConduitTransport",
  "interface MindConduitStore",
  "interface BuzzAcpResponsePublisher",
  "interface AcpResponseReturnStore",
  "interface RootDispatchTransport",
  "interface RootDispatchStore",
];

for (const declaration of requiredInjectedPorts) {
  if (!source.includes(declaration)) {
    throw new Error(`portable core is missing injected port: ${declaration}`);
  }
}

const packageJson = JSON.parse(readFileSync(packagePath, "utf8")) as {
  private?: boolean;
  dependencies?: Record<string, string>;
};

if (packageJson.private !== true) {
  throw new Error("reference package must remain private until public release review");
}

if (Object.keys(packageJson.dependencies ?? {}).length !== 0) {
  throw new Error("portable core unexpectedly acquired a runtime dependency");
}

process.stdout.write(
  `portability: 1/1 passed (${requiredInjectedPorts.length} injected ports)\n`,
);
