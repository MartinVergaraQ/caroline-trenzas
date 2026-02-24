export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { getCreds, setChallenge } from "@/lib/webauthnStore";
import { isoBase64URL } from "@simplewebauthn/server/helpers";

export async function GET() {
    try {
        const rpID = process.env.WEBAUTHN_RP_ID!;
        const creds = await getCreds();

        if (!creds.length) {
            return NextResponse.json({ ok: false, message: "No hay passkey registrada en el servidor" }, { status: 400 });
        }

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
        return NextResponse.json({ ok: false, message: e?.message || "Error login/options" }, { status: 500 });
    }
}