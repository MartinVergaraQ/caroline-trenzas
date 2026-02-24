export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { clearChallenge, getChallenge, getCreds, setCreds } from "@/lib/webauthnStore";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { ADMIN_COOKIE, SESSION_TTL_SEC, newToken, redis, sessionKey } from "@/lib/adminSession";

function anyToUint8(v: any): Uint8Array {
    if (!v) throw new Error("cred value vacío");

    if (typeof v === "string") {
        const canon = v.replace(/=+$/g, "");
        return isoBase64URL.toBuffer(canon);
    }

    if (typeof v === "object" && Array.isArray(v.data)) {
        return new Uint8Array(v.data);
    }

    if (v instanceof Uint8Array) return v;
    if (v instanceof ArrayBuffer) return new Uint8Array(v);

    throw new Error("Tipo de credencial no soportado: " + typeof v);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const expectedChallenge = await getChallenge();
        if (!expectedChallenge) {
            return NextResponse.json({ ok: false, message: "Challenge expirado" }, { status: 400 });
        }

        const rpID = process.env.WEBAUTHN_RP_ID;
        const origin = process.env.WEBAUTHN_ORIGIN;
        if (!rpID || !origin) {
            return NextResponse.json(
                { ok: false, message: "Faltan WEBAUTHN_RP_ID o WEBAUTHN_ORIGIN" },
                { status: 500 }
            );
        }

        const creds = await getCreds();

        const stripPad = (s: string) => s.replace(/=+$/g, "");
        const incomingId = stripPad(String(body.id));
        const incomingRaw = stripPad(String(body.rawId));

        const match = creds.find((c: any) => stripPad(String(c.id)) === incomingId || stripPad(String(c.id)) === incomingRaw);

        if (!match) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "Credencial no encontrada",
                    debug: { incomingId, incomingRaw, stored: creds.map((c: any) => c.id) },
                },
                { status: 401 }
            );
        }

        const verification = await verifyAuthenticationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin: origin,
            expectedRPID: rpID,
            credential: {
                id: anyToUint8((match as any).id),
                publicKey: anyToUint8((match as any).publicKey),
                counter: match.counter,
            },
        } as any);

        if (!verification.verified) {
            return NextResponse.json({ ok: false, message: "Verificación falló" }, { status: 401 });
        }

        const newCounter = (verification as any).authenticationInfo?.newCounter ?? match.counter;
        await setCreds(creds.map((c: any) => (c.id === match.id ? { ...c, counter: newCounter } : c)));
        await clearChallenge();

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
    } catch (e: any) {
        console.error("LOGIN VERIFY ERROR", e);
        return NextResponse.json({ ok: false, message: e?.message || "Error en login/verify" }, { status: 500 });
    }
}