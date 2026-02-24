export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { clearChallenge, getChallenge, getCreds, setCreds } from "@/lib/webauthnStore";
import { requireAdmin } from "@/lib/requireAdmin";

export async function POST(req: Request) {
    try {
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
        const cred = info.credential;

        // En esta versión, viene dentro de registrationInfo.credential
        const credId =
            cred?.id ??
            cred?.credentialID ??
            cred?.credentialId;

        const credPk =
            cred?.publicKey ??
            cred?.credentialPublicKey ??
            cred?.credentialPublicKeyBytes;

        const counter =
            info.counter ??
            cred?.counter ??
            0;

        if (!credId || !credPk) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "registrationInfo incompleto",
                    debug: {
                        keys: Object.keys(info || {}),
                        credKeys: Object.keys(cred || {}),
                        hasId: !!credId,
                        hasPk: !!credPk,
                    },
                },
                { status: 500 }
            );
        }

        const idB64url = isoBase64URL.fromBuffer(credId);
        const pkB64url = isoBase64URL.fromBuffer(credPk);

        const creds = await getCreds();
        if (!creds.some((c) => c.id === idB64url)) {
            creds.push({ id: idB64url, publicKey: pkB64url, counter });
            await setCreds(creds);
        }

        await clearChallenge();
        const after = await getCreds();
        return NextResponse.json({ ok: true, count: after.length });
    } catch (e: any) {
        console.error("REGISTER VERIFY ERROR", e);
        return NextResponse.json({ ok: false, message: e?.message || "Error register/verify" }, { status: 500 });
    }
}