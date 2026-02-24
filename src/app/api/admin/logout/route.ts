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

export async function POST(req: Request) {
    const token = readCookie(req, ADMIN_COOKIE);

    if (token) {
        await redis.del(sessionKey(token));
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
    });

    return res;
}