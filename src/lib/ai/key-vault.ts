import { R } from "@mobily/ts-belt";
import type { AiProviderId } from "./types";

/**
 * Optional at-rest storage for an AI key, encrypted with a password only the
 * user knows: PBKDF2 (SHA-256) derives an AES-GCM key from the password and a
 * random salt. The password is never stored; without it the stored blob is
 * useless. The default is not to store the key at all.
 */

const ITERATIONS = 600_000;

export interface VaultRecord {
  v: 1;
  salt: string;
  iv: string;
  data: string;
}

function storageKey(provider: AiProviderId): string {
  return `kast:ai-vault:${provider}`;
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
}

async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>) {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptSecret(
  secret: string,
  password: string,
): Promise<VaultRecord> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(secret),
  );
  return {
    v: 1,
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(data)),
  };
}

export async function decryptSecret(
  record: VaultRecord,
  password: string,
): Promise<R.Result<string, "wrong-password">> {
  try {
    const key = await deriveKey(password, fromBase64(record.salt));
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(record.iv) },
      key,
      fromBase64(record.data),
    );
    return R.makeOk(new TextDecoder().decode(plain));
  } catch {
    // AES-GCM authenticates: a wrong password fails here, never decodes junk.
    return R.makeError("wrong-password");
  }
}

export function readVault(provider: AiProviderId): VaultRecord | null {
  try {
    const raw = localStorage.getItem(storageKey(provider));
    if (!raw) return null;
    const record = JSON.parse(raw) as VaultRecord;
    return record.v === 1 ? record : null;
  } catch {
    return null;
  }
}

export function writeVault(provider: AiProviderId, record: VaultRecord): void {
  localStorage.setItem(storageKey(provider), JSON.stringify(record));
}

export function deleteVault(provider: AiProviderId): void {
  try {
    localStorage.removeItem(storageKey(provider));
  } catch {
    // Storage blocked: nothing was stored.
  }
}
