export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { redis } from "@/lib/adminSession";

const CREDS_KEY = "admin:webauthn:creds";

export async function GET() {
    const raw: any = await redis.get(CREDS_KEY);

    let count = 0;

    if (typeof raw === "string") {
        try {
            const parsed = JSON.parse(raw);
            count = Array.isArray(parsed) ? parsed.length : 0;
        } catch {
            count = 0;
        }
    } else if (Array.isArray(raw)) {
        count = raw.length;
    } else if (raw && typeof raw === "object") {
        // por si Upstash lo devuelve raro
        count = Object.values(raw).length;
    }

    return NextResponse.json({ hasPasskey: count > 0, count });
}