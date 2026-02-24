import { redis } from "@/lib/adminSession";

const CREDS_KEY = "admin:webauthn:creds";
const CHALLENGE_KEY = "admin:webauthn:challenge";

export type StoredCredential = {
    id: string;        // base64url
    publicKey: string; // base64url
    counter: number;
};

export async function getCreds(): Promise<StoredCredential[]> {
    const raw = await redis.get(CREDS_KEY);
    if (!raw) return [];

    const arr = Array.isArray(raw)
        ? raw
        : typeof raw === "string"
            ? (() => { try { return JSON.parse(raw); } catch { return []; } })()
            : [];

    if (!Array.isArray(arr)) return [];

    // ✅ Normaliza y filtra basura
    const norm = arr
        .map((c: any) => ({
            id: c?.id ?? c?.credentialID ?? c?.credentialId ?? null,
            publicKey: c?.publicKey ?? c?.credentialPublicKey ?? c?.credentialPublicKeyBytes ?? null,
            counter: typeof c?.counter === "number" ? c.counter : 0,
        }))
        .filter((c: any) => !!c.id && !!c.publicKey);

    return norm as StoredCredential[];
}

export async function setCreds(creds: StoredCredential[]) {
    // guarda como JSON nativo (no string)
    await redis.set(CREDS_KEY, creds);
}

export async function setChallenge(challenge: string) {
    await redis.set(CHALLENGE_KEY, challenge, { ex: 300 });
}

export async function getChallenge() {
    const v = await redis.get(CHALLENGE_KEY);
    return typeof v === "string" ? v : (v as any) || null;
}

export async function clearChallenge() {
    await redis.del(CHALLENGE_KEY);
}