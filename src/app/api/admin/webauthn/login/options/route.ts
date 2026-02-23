export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { getCreds, setChallenge } from "@/lib/webauthnStore";

export async function GET() {
    const rpID = process.env.WEBAUTHN_RP_ID || "localhost";
    const creds = await getCreds();

    const options = await generateAuthenticationOptions({
        rpID,
        userVerification: "preferred",
        // en tu versión: allowCredentials.id debe ser string ✅
        allowCredentials: creds.map((c) => ({
            id: c.id,
            type: "public-key",
        })),
    });

    await setChallenge(options.challenge);
    return NextResponse.json(options);
}