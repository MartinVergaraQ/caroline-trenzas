import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import crypto from "crypto";
import { ADMIN_COOKIE, SESSION_TTL_SEC, newToken, redis, sessionKey } from "@/lib/adminSession";

function getIP(req: Request) {
    const xf = req.headers.get("x-forwarded-for");
    const xr = req.headers.get("x-real-ip");
    const ip = (xf ? xf.split(",")[0].trim() : xr?.trim()) || "unknown";
    return ip;
}

async function rateLimitLogin(req: Request) {
    const ip = getIP(req);

    // En local a veces no hay IP real. Evita bloquearte a ti mismo.
    if (process.env.NODE_ENV !== "production" && ip === "unknown") {
        return { limited: false, remaining: 99, retryAfterSec: 0 };
    }

    const key = `admin:login:ip:${ip}`;
    const windowSec = 600; // 10 min
    const limit = 5;

    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSec);

    const ttl = await redis.ttl(key); // segundos restantes del bloqueo/ventana
    const remaining = Math.max(0, limit - count);

    return {
        limited: count > limit,
        remaining,
        retryAfterSec: ttl > 0 ? ttl : windowSec,
    };
}

function timingSafeEqualStr(a: string, b: string) {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) return false;
    return crypto.timingSafeEqual(aBuf, bBuf);
}

export async function POST(req: Request) {
    // 1) rate limit antes de validar password
    const rl = await rateLimitLogin(req);
    if (rl.limited) {
        return NextResponse.json(
            { ok: false, message: "Demasiados intentos. Espera un rato." },
            {
                status: 429,
                headers: {
                    "Retry-After": String(rl.retryAfterSec),
                },
            }
        );
    }

    // 2) validar password (timing-safe)
    const { password } = await req.json().catch(() => ({}));
    const expected = process.env.ADMIN_PASSWORD || "";
    const ok = typeof password === "string" && timingSafeEqualStr(password, expected);

    if (!ok) {
        return NextResponse.json(
            { ok: false, message: "Clave incorrecta." },
            { status: 401 }
        );
    }

    // 3) crear sesión token + guardar en redis + set cookie
    const token = newToken(); // o crypto.randomBytes(32).toString("base64url")

    await redis.set(sessionKey(token), "1", { ex: SESSION_TTL_SEC });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: SESSION_TTL_SEC,
    });

    return res;
}