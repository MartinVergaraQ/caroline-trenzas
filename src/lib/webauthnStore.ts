import { redis } from "@/lib/adminSession";

const CREDS_KEY = "admin:webauthn:creds";
const CHALLENGE_KEY = "admin:webauthn:challenge";

export type StoredCredential = {
    id: string;
    publicKey: string;
    counter: number;
};

export async function getCreds(): Promise<StoredCredential[]> {
    const raw: any = await redis.get(CREDS_KEY);
    if (!raw) return [];
    if (typeof raw !== "string") return [];

    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .filter((c: any) => typeof c?.id === "string" && typeof c?.publicKey === "string")
            .map((c: any) => ({
                id: c.id,
                publicKey: c.publicKey,
                counter: Number(c.counter ?? 0),
            }));
    } catch {
        return [];
    }
}

export async function setCreds(creds: StoredCredential[]) {
    await redis.set(CREDS_KEY, JSON.stringify(creds));
}

export async function setChallenge(challenge: string) {
    await redis.set(CHALLENGE_KEY, challenge, { ex: 300 });
}

export async function getChallenge() {
    const v: any = await redis.get(CHALLENGE_KEY);
    return typeof v === "string" ? v : null;
}

export async function clearChallenge() {
    await redis.del(CHALLENGE_KEY);
}