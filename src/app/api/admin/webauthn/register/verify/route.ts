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

    // Tipos varían por versión; extraemos “a prueba de TS”
    const info: any = verification.registrationInfo;
    if (!info) return NextResponse.json({ ok: false }, { status: 401 });

    const credentialID: Uint8Array = info.credentialID;
    const credentialPublicKey: Uint8Array = info.credentialPublicKey;
    const counter: number = info.counter ?? 0;

    const creds = await getCreds();
    creds.push({
        id: bufToB64url(credentialID),             // guardamos como base64url string
        publicKey: bufToB64url(credentialPublicKey),
        counter,
    });

    await setCreds(creds);
    await clearChallenge();

    return NextResponse.json({ ok: true });
}