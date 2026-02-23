import { NextResponse } from "next/server";
import { ADMIN_COOKIE, redis, sessionKey } from "@/lib/adminSession";

function readCookie(req: Request, name: string) {
    const raw = req.headers.get("cookie") || "";
    const found = raw
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(name + "="));
    return found ? decodeURIComponent(found.split("=").slice(1).join("=")) : null;
}

export async function requireAdmin(req: Request) {
    const token = readCookie(req, ADMIN_COOKIE);

    if (!token) {
        return { ok: false as const, res: NextResponse.json({ ok: false }, { status: 401 }) };
    }

    const s = (await redis.get(sessionKey(token))) as string | null;
    if (!s) {
        return { ok: false as const, res: NextResponse.json({ ok: false }, { status: 401 }) };
    }

    return { ok: true as const };
}