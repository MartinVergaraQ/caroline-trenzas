export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { clearChallenge, getChallenge, getCreds, setCreds } from "@/lib/webauthnStore";
import { b64urlToBuf } from "@/lib/b64url";
import { ADMIN_COOKIE, SESSION_TTL_SEC, newToken, redis, sessionKey } from "@/lib/adminSession";

export async function POST(req: Request) {
    const body = await req.json();

    const expectedChallenge = await getChallenge();
    if (!expectedChallenge) {
        return NextResponse.json({ ok: false, message: "Challenge expirado" }, { status: 400 });
    }

    const rpID = process.env.WEBAUTHN_RP_ID || "localhost";
    const origin = process.env.WEBAUTHN_ORIGIN || "http://localhost:3000";

    const creds = await getCreds(); // ✅ TE FALTABA
    const incomingId = String(body.id || "");
    const incomingRaw = String(body.rawId || "");
    const match = creds.find((c) => c.id === incomingId || c.id === incomingRaw);

    if (!match) {
        return NextResponse.json(
            { ok: false, message: "Credencial no encontrada", debug: { incomingId, incomingRaw } },
            { status: 401 }
        );
    }

    const verification = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
            id: match.id,
            publicKey: b64urlToBuf(match.publicKey),
            counter: match.counter,
        },
    } as any);

    if (!verification.verified) {
        return NextResponse.json(
            { ok: false, message: "Verificación falló", debug: verification },
            { status: 401 }
        );
    }

    const newCounter = (verification as any).authenticationInfo?.newCounter ?? match.counter;
    await setCreds(creds.map((c) => (c.id === match.id ? { ...c, counter: newCounter } : c)));
    await clearChallenge();

    // sesión token
    const token = newToken();
    await redis.set(
        sessionKey(token),
        JSON.stringify({ user: "admin", createdAt: new Date().toISOString() }),
        { ex: SESSION_TTL_SEC }
    );

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