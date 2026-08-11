import type { BuzzEvent } from "./types.js";

const FIELD_PRIME =
  0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;
const GROUP_ORDER =
  0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const GENERATOR_X =
  0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n;
const GENERATOR_Y =
  0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n;

interface Point {
  x: bigint;
  y: bigint;
  z: bigint;
}

const INFINITY: Point = { x: 0n, y: 1n, z: 0n };
const GENERATOR: Point = { x: GENERATOR_X, y: GENERATOR_Y, z: 1n };
const encoder = new TextEncoder();

function mod(value: bigint, modulus = FIELD_PRIME): bigint {
  const result = value % modulus;
  return result >= 0n ? result : result + modulus;
}

function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  let result = 1n;
  let factor = mod(base, modulus);
  let power = exponent;
  while (power > 0n) {
    if ((power & 1n) === 1n) result = mod(result * factor, modulus);
    factor = mod(factor * factor, modulus);
    power >>= 1n;
  }
  return result;
}

function pointDouble(point: Point): Point {
  if (point.z === 0n || point.y === 0n) return INFINITY;
  const a = mod(point.x * point.x);
  const b = mod(point.y * point.y);
  const c = mod(b * b);
  const d = mod(2n * (mod((point.x + b) * (point.x + b)) - a - c));
  const e = mod(3n * a);
  const f = mod(e * e);
  return {
    x: mod(f - 2n * d),
    y: mod(e * (d - mod(f - 2n * d)) - 8n * c),
    z: mod(2n * point.y * point.z),
  };
}

function pointAdd(left: Point, right: Point): Point {
  if (left.z === 0n) return right;
  if (right.z === 0n) return left;

  const z1z1 = mod(left.z * left.z);
  const z2z2 = mod(right.z * right.z);
  const u1 = mod(left.x * z2z2);
  const u2 = mod(right.x * z1z1);
  const s1 = mod(left.y * right.z * z2z2);
  const s2 = mod(right.y * left.z * z1z1);
  if (u1 === u2) return s1 === s2 ? pointDouble(left) : INFINITY;

  const h = mod(u2 - u1);
  const i = mod((2n * h) * (2n * h));
  const j = mod(h * i);
  const r = mod(2n * (s2 - s1));
  const v = mod(u1 * i);
  const x = mod(r * r - j - 2n * v);
  return {
    x,
    y: mod(r * (v - x) - 2n * s1 * j),
    z: mod((mod((left.z + right.z) * (left.z + right.z)) - z1z1 - z2z2) * h),
  };
}

function scalarMultiply(scalar: bigint, point: Point): Point {
  let result = INFINITY;
  let addend = point;
  let value = mod(scalar, GROUP_ORDER);
  while (value > 0n) {
    if ((value & 1n) === 1n) result = pointAdd(result, addend);
    addend = pointDouble(addend);
    value >>= 1n;
  }
  return result;
}

function toAffine(point: Point): { x: bigint; y: bigint } | null {
  if (point.z === 0n) return null;
  const inverse = modPow(point.z, FIELD_PRIME - 2n, FIELD_PRIME);
  const inverseSquared = mod(inverse * inverse);
  return {
    x: mod(point.x * inverseSquared),
    y: mod(point.y * inverseSquared * inverse),
  };
}

function liftX(x: bigint): Point | null {
  if (x >= FIELD_PRIME) return null;
  const candidate = modPow(mod(x * x * x + 7n), (FIELD_PRIME + 1n) / 4n, FIELD_PRIME);
  if (mod(candidate * candidate - (x * x * x + 7n)) !== 0n) return null;
  const y = (candidate & 1n) === 0n ? candidate : FIELD_PRIME - candidate;
  return { x, y, z: 1n };
}

function hexToBytes(value: string): Uint8Array | null {
  if (value.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(value)) return null;
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(value: Uint8Array): string {
  return Array.from(value, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function bytesToBigInt(value: Uint8Array): bigint {
  return BigInt(`0x${bytesToHex(value) || "0"}`);
}

function concatBytes(...values: Uint8Array[]): Uint8Array {
  const length = values.reduce((total, value) => total + value.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const value of values) {
    output.set(value, offset);
    offset += value.length;
  }
  return output;
}

export async function sha256Bytes(value: Uint8Array): Promise<Uint8Array> {
  const input = value.buffer.slice(
    value.byteOffset,
    value.byteOffset + value.byteLength,
  ) as ArrayBuffer;
  return new Uint8Array(await crypto.subtle.digest("SHA-256", input));
}

export async function sha256Hex(value: string): Promise<string> {
  return bytesToHex(await sha256Bytes(encoder.encode(value)));
}

async function taggedHash(tag: string, payload: Uint8Array): Promise<Uint8Array> {
  const tagHash = await sha256Bytes(encoder.encode(tag));
  return sha256Bytes(concatBytes(tagHash, tagHash, payload));
}

export function serializeNostrEvent(event: BuzzEvent): string {
  return JSON.stringify([
    0,
    event.pubkey,
    event.created_at,
    event.kind,
    event.tags,
    event.content,
  ]);
}

export async function computeNostrEventId(event: BuzzEvent): Promise<string> {
  return sha256Hex(serializeNostrEvent(event));
}

export async function verifyNostrEventId(event: BuzzEvent): Promise<boolean> {
  return (await computeNostrEventId(event)) === event.id.toLowerCase();
}

export async function verifySchnorrSignature(event: BuzzEvent): Promise<boolean> {
  const signature = hexToBytes(event.sig);
  const publicKey = hexToBytes(event.pubkey);
  const message = hexToBytes(event.id);
  if (
    signature?.length !== 64 ||
    publicKey?.length !== 32 ||
    message?.length !== 32
  ) {
    return false;
  }

  const r = bytesToBigInt(signature.slice(0, 32));
  const s = bytesToBigInt(signature.slice(32));
  if (r >= FIELD_PRIME || s >= GROUP_ORDER) return false;
  const publicPoint = liftX(bytesToBigInt(publicKey));
  if (!publicPoint) return false;

  const challenge = bytesToBigInt(
    await taggedHash(
      "BIP0340/challenge",
      concatBytes(signature.slice(0, 32), publicKey, message),
    ),
  ) % GROUP_ORDER;
  const negatedPublicPoint: Point = {
    x: publicPoint.x,
    y: mod(-publicPoint.y),
    z: publicPoint.z,
  };
  const result = toAffine(
    pointAdd(
      scalarMultiply(s, GENERATOR),
      scalarMultiply(challenge, negatedPublicPoint),
    ),
  );
  return Boolean(result && (result.y & 1n) === 0n && result.x === r);
}
