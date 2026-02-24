export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { getCreds, setChallenge } from "@/lib/webauthnStore";
import { b64urlToBuf } from "@/lib/b64url";

export async function GET() {
    const rpID = process.env.WEBAUTHN_RP_ID || "localhost";
    const creds = await getCreds();

    const options = await generateAuthenticationOptions({
        rpID,
        userVerification: "preferred",
        allowCredentials: creds.map((c) => ({
            id: b64urlToBuf(c.id), // ✅ Uint8Array
            type: "public-key",
        })),
    } as any);

    await setChallenge(options.challenge);
    return NextResponse.json(options);
}