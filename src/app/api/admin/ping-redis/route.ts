export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { redis } from "@/lib/adminSession";

const CREDS_KEY = "admin:webauthn:creds";

export async function GET() {
    // marca de este deployment
    const markKey = "admin:debug:deployment";
    const markVal = `${process.env.VERCEL_ENV || "unknown"}:${process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "noSHA"}:${Date.now()}`;

    await redis.set(markKey, markVal, { ex: 300 });

    const url =
        process.env.UPSTASH_REDIS_REST_URL ||
        process.env.KV_REST_API_URL ||
        "missing";

    const credsRaw = await redis.get<string>(CREDS_KEY);
    const credsLen = credsRaw ? (() => { try { return JSON.parse(credsRaw).length } catch { return -1 } })() : 0;

    return NextResponse.json({
        ok: true,
        env: process.env.VERCEL_ENV || "unknown",
        urlHint: url === "missing" ? "missing" : url.slice(0, 35) + "...",
        envKeysPresent: {
            UPSTASH: !!process.env.UPSTASH_REDIS_REST_URL,
            KV: !!process.env.KV_REST_API_URL,
        },
        mark: markVal,
        creds: {
            key: CREDS_KEY,
            rawPresent: !!credsRaw,
            len: credsLen,
        },
    });
}