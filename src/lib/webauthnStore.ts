import { redis } from "@/lib/adminSession";

const CREDS_KEY = "admin:webauthn:creds";
const CHALLENGE_KEY = "admin:webauthn:challenge";

export type StoredCredential = {
    id: string;       // base64url
    publicKey: string; // base64url
    counter: number;
};

export async function getCreds(): Promise<StoredCredential[]> {
    console.log("ENV", process.env.VERCEL_ENV);
    console.log(
        "REDIS",
        (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "").slice(0, 35)
    );
    console.log("KEY", CREDS_KEY);

    const raw = await redis.get<string>(CREDS_KEY);
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return []; }
}

export async function setCreds(creds: StoredCredential[]) {
    console.log("ENV", process.env.VERCEL_ENV);
    console.log(
        "REDIS",
        (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "").slice(0, 35)
    );
    console.log("KEY", CREDS_KEY);
    console.log("SET CREDS LEN", creds.length);

    await redis.set(CREDS_KEY, JSON.stringify(creds));
}

export async function setChallenge(challenge: string) {
    await redis.set(CHALLENGE_KEY, challenge, { ex: 300 });
}

export async function getChallenge() {
    return (await redis.get<string>(CHALLENGE_KEY)) || null;
}

export async function clearChallenge() {
    await redis.del(CHALLENGE_KEY);
}