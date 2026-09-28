import { argon2id } from "@noble/hashes/argon2.js";

const MEMORY_KIB = 65_536;
const ITERATIONS = 3;
const PARALLELISM = 1;
const HASH_LENGTH = 32;
const SALT_LENGTH = 16;

export async function hashPassword(password: string): Promise<string> {
  assertPasswordInput(password);

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const hash = argon2id(new TextEncoder().encode(password), salt, {
    m: MEMORY_KIB,
    t: ITERATIONS,
    p: PARALLELISM,
    dkLen: HASH_LENGTH,
  });

  return `$argon2id$v=19$m=${MEMORY_KIB},t=${ITERATIONS},p=${PARALLELISM}$${toBase64(salt)}$${toBase64(hash)}`;
}

export async function verifyPassword(encodedHash: string, password: string): Promise<boolean> {
  assertPasswordInput(password);

  const parsed = parseArgon2idHash(encodedHash);
  if (!parsed) return false;

  const hash = argon2id(new TextEncoder().encode(password), parsed.salt, {
    m: parsed.memory,
    t: parsed.iterations,
    p: parsed.parallelism,
    dkLen: parsed.hash.length,
  });

  return constantTimeEqual(hash, parsed.hash);
}

function assertPasswordInput(password: string): void {
  if (typeof password !== "string" || password.length === 0) {
    throw new TypeError("Password must be a non-empty string");
  }
}

function parseArgon2idHash(encoded: string): {
  memory: number;
  iterations: number;
  parallelism: number;
  salt: Uint8Array;
  hash: Uint8Array;
} | null {
  const match = /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/u.exec(encoded);
  if (!match) return null;

  const memory = Number(match[1]);
  const iterations = Number(match[2]);
  const parallelism = Number(match[3]);
  if (!Number.isSafeInteger(memory) || !Number.isSafeInteger(iterations) || !Number.isSafeInteger(parallelism)) return null;
  if (memory < MEMORY_KIB || iterations < ITERATIONS || parallelism < 1) return null;

  return {
    memory,
    iterations,
    parallelism,
    salt: fromBase64(match[4]!),
    hash: fromBase64(match[5]!),
  };
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=+$/u, "");
}

function fromBase64(value: string): Uint8Array {
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index]! ^ right[index]!;
  }
  return difference === 0;
}
