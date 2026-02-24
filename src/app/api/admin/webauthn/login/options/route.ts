export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { getCreds, setChallenge } from "@/lib/webauthnStore";
import { isoBase64URL } from "@simplewebauthn/server/helpers";

export async function GET() {
    const rpID = process.env.WEBAUTHN_RP_ID;
    if (!rpID) {
        return NextResponse.json(
            { ok: false, message: "Falta WEBAUTHN_RP_ID" },
            { status: 500 }
        );
    }

    const creds = await getCreds();

    const options = await generateAuthenticationOptions({
        rpID,
        userVerification: "preferred",
        allowCredentials: creds.map((c) => ({
            id: isoBase64URL.toBuffer(c.id), // ✅ correcto
            type: "public-key",
        })),
    } as any);

    await setChallenge(options.challenge);
    return NextResponse.json(options);
}