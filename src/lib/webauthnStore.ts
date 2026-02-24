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

    // Upstash puede devolverte el valor ya como objeto/array
    if (Array.isArray(raw)) return raw as StoredCredential[];

    if (typeof raw === "string") {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? (parsed as StoredCredential[]) : [];
        } catch {
            return [];
        }
    }

    // si viniera como objeto raro
    return [];
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