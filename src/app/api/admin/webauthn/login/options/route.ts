export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { getCreds, setChallenge } from "@/lib/webauthnStore";
import { isoBase64URL } from "@simplewebauthn/server/helpers";

export async function GET() {
    try {
        const rpID = process.env.WEBAUTHN_RP_ID;
        if (!rpID) {
            return NextResponse.json({ ok: false, message: "Falta WEBAUTHN_RP_ID" }, { status: 500 });
        }

        const creds = await getCreds();

        const options = await generateAuthenticationOptions({
            rpID,
            userVerification: "preferred",
            allowCredentials: creds.map((c) => ({
                id: isoBase64URL.toBuffer(c.id),
                type: "public-key",
            })),
        } as any);

        await setChallenge(options.challenge);
        return NextResponse.json(options);
    } catch (e: any) {
        console.error("LOGIN OPTIONS ERROR", e);
        // OJO: isoBase64URL.toBuffer explota si el string no es base64url válido
        return NextResponse.json(
            {
                ok: false,
                message: e?.message || "Error en login/options",
                debug: {
                    rpID: process.env.WEBAUTHN_RP_ID || null,
                    credsCount: (await getCreds()).length,
                    sampleId: (await getCreds())[0]?.id || null,
                },
            },
            { status: 500 }
        );
    }
}