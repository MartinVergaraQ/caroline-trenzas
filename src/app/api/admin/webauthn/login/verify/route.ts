export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { clearChallenge, getChallenge, getCreds, setCreds } from "@/lib/webauthnStore";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { ADMIN_COOKIE, SESSION_TTL_SEC, newToken, redis, sessionKey } from "@/lib/adminSession";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const expectedChallenge = await getChallenge();
        if (!expectedChallenge) {
            return NextResponse.json({ ok: false, message: "Challenge expirado" }, { status: 400 });
        }

        const rpID = process.env.WEBAUTHN_RP_ID!;
        const origin = process.env.WEBAUTHN_ORIGIN!;

        const creds = await getCreds();

        const incomingId = String(body.id).replace(/=+$/g, "");
        const incomingRaw = String(body.rawId).replace(/=+$/g, "");

        const match = creds.find((c) => c.id === incomingId || c.id === incomingRaw);
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
                id: isoBase64URL.toBuffer(match.id),
                publicKey: isoBase64URL.toBuffer(match.publicKey),
                counter: match.counter,
            },
        } as any);

        if (!verification.verified) {
            return NextResponse.json({ ok: false, message: "Verificación falló" }, { status: 401 });
        }

        const newCounter = (verification as any).authenticationInfo?.newCounter ?? match.counter;
        await setCreds(creds.map((c) => (c.id === match.id ? { ...c, counter: newCounter } : c)));
        await clearChallenge();

        const token = newToken();
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
    } catch (e: any) {
        console.error("LOGIN VERIFY ERROR", e);
        return NextResponse.json({ ok: false, message: e?.message || "Error login/verify" }, { status: 500 });
    }
}