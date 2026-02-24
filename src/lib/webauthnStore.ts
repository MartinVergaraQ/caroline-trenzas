import { redis } from "@/lib/adminSession";

const CREDS_KEY = "admin:webauthn:creds";
const CHALLENGE_KEY = "admin:webauthn:challenge";

export type StoredCredential = {
    id: string;        // base64url
    publicKey: string; // base64url
    counter: number;
};

export async function getCreds(): Promise<StoredCredential[]> {
    const raw: any = await redis.get(CREDS_KEY);
    if (!raw) return [];

    // 1) Si ya viene como array, listo
    if (Array.isArray(raw)) {
        return raw
            .filter((c: any) => c?.id && c?.publicKey)
            .map((c: any) => ({ id: String(c.id), publicKey: String(c.publicKey), counter: Number(c.counter ?? 0) }));
    }

    // 2) Si viene como string JSON, parsea
    if (typeof raw === "string") {
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed
                    .filter((c: any) => c?.id && c?.publicKey)
                    .map((c: any) => ({ id: String(c.id), publicKey: String(c.publicKey), counter: Number(c.counter ?? 0) }));
            }
            return [];
        } catch {
            return [];
        }
    }

    // 3) Si viene como objeto (caso Upstash raro), intenta convertirlo a array
    if (typeof raw === "object") {
        // Caso: {0:{...},1:{...}} o similar
        const vals = Object.values(raw);
        if (vals.length && vals.every((v: any) => typeof v === "object")) {
            return vals
                .filter((c: any) => c?.id && c?.publicKey)
                .map((c: any) => ({ id: String(c.id), publicKey: String(c.publicKey), counter: Number(c.counter ?? 0) }));
        }
    }

    return [];
}

export async function setCreds(creds: StoredCredential[]) {
    // ✅ Guarda SIEMPRE como string, así no hay ambigüedad en el tipo al leer
    await redis.set(CREDS_KEY, JSON.stringify(creds));
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