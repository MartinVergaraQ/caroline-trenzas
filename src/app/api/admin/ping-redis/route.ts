export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { redis } from "@/lib/adminSession";

export async function GET() {
    await redis.set("ping", "ok", { ex: 60 });
    const v = await redis.get("ping");
    return NextResponse.json({ ok: v === "ok", v });
}