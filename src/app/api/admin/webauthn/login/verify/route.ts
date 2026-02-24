export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { clearChallenge, getChallenge, getCreds, setCreds } from "@/lib/webauthnStore";
import { b64urlToBuf, normalizeIdToB64url } from "@/lib/b64url";
import { ADMIN_COOKIE, SESSION_TTL_SEC, newToken, redis, sessionKey } from "@/lib/adminSession";

export async function POST(req: Request) {
    const body = await req.json();

    const expectedChallenge = await getChallenge();
    if (!expectedChallenge) {
        return NextResponse.json({ ok: false, message: "Challenge expirado" }, { status: 400 });
    }

    const rpID = process.env.WEBAUTHN_RP_ID!;
    const origin = process.env.WEBAUTHN_ORIGIN!;

    const creds = await getCreds();

    const stripPad = (s: string) => s.replace(/=+$/g, "");
    const incomingId = stripPad(String(body.id));
    const incomingRaw = stripPad(String(body.rawId));
    const match = creds.find(c => stripPad(c.id) === incomingId || stripPad(c.id) === incomingRaw);

    if (!match) {
        return NextResponse.json(
            { ok: false, message: "Credencial no encontrada", debug: { incomingId, incomingRaw, stored: creds.map(c => c.id) } },
            { status: 401 }
        );
    }

    const verification = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
            id: b64urlToBuf(match.id),          // ✅
            publicKey: b64urlToBuf(match.publicKey),
            counter: match.counter,
        },
    } as any);

    if (!verification.verified) {
        return NextResponse.json({ ok: false, message: "Verificación falló" }, { status: 401 });
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