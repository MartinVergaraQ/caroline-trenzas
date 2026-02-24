export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { clearChallenge, getChallenge, getCreds, setCreds } from "@/lib/webauthnStore";
import { bufToB64url } from "@/lib/b64url";
import { requireAdmin } from "@/lib/requireAdmin";

export async function POST(req: Request) {
    const guard = await requireAdmin(req);
    if (!guard.ok) return guard.res;

    const body = await req.json();

    const expectedChallenge = await getChallenge();
    if (!expectedChallenge) {
        return NextResponse.json({ ok: false, message: "Challenge expirado" }, { status: 400 });
    }

    const rpID = process.env.WEBAUTHN_RP_ID || "localhost";
    const origin = process.env.WEBAUTHN_ORIGIN || "http://localhost:3000";

    const verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
    });

    if (!verification.verified) {
        return NextResponse.json({ ok: false }, { status: 401 });
    }

    const info: any = verification.registrationInfo;
    if (!info) {
        return NextResponse.json(
            { ok: false, message: "registrationInfo vacío" },
            { status: 500 }
        );
    }

    // ✅ compat: nombres cambian según versión de simplewebauthn
    const credentialID =
        info.credentialID ??
        info.credentialId ??
        info.credential?.id ??
        info.credential?.credentialID ??
        info.credential?.credentialId;

    const credentialPublicKey =
        info.credentialPublicKey ??
        info.credentialPublicKeyBytes ??
        info.credential?.publicKey ??
        info.credential?.credentialPublicKey ??
        info.credential?.credentialPublicKeyBytes;

    const counter = info.counter ?? info.credential?.counter ?? 0;

    if (!credentialID || !credentialPublicKey) {
        // 🔍 esto te dirá exactamente qué está llegando en Vercel
        return NextResponse.json(
            {
                ok: false,
                message: "No pude extraer credentialID/publicKey",
                debug: {
                    registrationInfoKeys: Object.keys(info || {}),
                    registrationInfo: info,
                },
            },
            { status: 500 }
        );
    }

    const creds = await getCreds();
    creds.push({
        id: bufToB64url(credentialID as any),
        publicKey: bufToB64url(credentialPublicKey as any),
        counter,
    });

    await setCreds(creds);
    await clearChallenge();

    return NextResponse.json({ ok: true });
}