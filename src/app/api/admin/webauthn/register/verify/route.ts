export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { clearChallenge, getChallenge, getCreds, setCreds } from "@/lib/webauthnStore";
import { requireAdmin } from "@/lib/requireAdmin";
import { toB64url } from "@/lib/b64url";

export async function POST(req: Request) {
    const guard = await requireAdmin(req);
    if (!guard.ok) return guard.res;

    const body = await req.json();

    const expectedChallenge = await getChallenge();
    if (!expectedChallenge) {
        return NextResponse.json({ ok: false, message: "Challenge expirado" }, { status: 400 });
    }

    const rpID = process.env.WEBAUTHN_RP_ID!;
    const origin = process.env.WEBAUTHN_ORIGIN!;

    const verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
    } as any);

    if (!verification.verified) {
        return NextResponse.json({ ok: false, message: "Verificación falló" }, { status: 401 });
    }

    const info: any = (verification as any).registrationInfo;
    if (!info) {
        return NextResponse.json({ ok: false, message: "registrationInfo vacío" }, { status: 500 });
    }

    // Compat: nombres cambian según versión
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

    // Normaliza a base64url (string)
    const idB64url = toB64url(credentialID);
    const pkB64url = toB64url(credentialPublicKey);

    if (!idB64url || !pkB64url) {
        return NextResponse.json(
            {
                ok: false,
                message: "No pude normalizar credenciales",
                debug: { keys: Object.keys(info || {}), hasId: !!credentialID, hasPk: !!credentialPublicKey },
            },
            { status: 500 }
        );
    }

    const creds = await getCreds();

    // evita duplicados
    const exists = creds.some((c) => c.id === idB64url);
    if (!exists) {
        creds.push({ id: idB64url, publicKey: pkB64url, counter });
        await setCreds(creds);
    }

    await clearChallenge();
    return NextResponse.json({ ok: true });
}