export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { getCreds, setChallenge } from "@/lib/webauthnStore";
import { isoBase64URL } from "@simplewebauthn/server/helpers";

function anyToUint8(v: any): Uint8Array {
    if (!v) throw new Error("cred value vacío");

    // string base64url
    if (typeof v === "string") {
        const canon = v.replace(/=+$/g, "");
        return isoBase64URL.toBuffer(canon); // <- Uint8Array
    }

    // Buffer serializado: { type:"Buffer", data:[...] }
    if (typeof v === "object" && Array.isArray(v.data)) {
        return new Uint8Array(v.data);
    }

    // Uint8Array / ArrayBuffer
    if (v instanceof Uint8Array) return v;
    if (v instanceof ArrayBuffer) return new Uint8Array(v);

    throw new Error("Tipo de credencial no soportado: " + typeof v);
}

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
            allowCredentials: creds.map((c: any) => ({
                id: anyToUint8(c.id),
                type: "public-key",
            })),
        } as any);

        await setChallenge(options.challenge);
        return NextResponse.json(options);
    } catch (e: any) {
        console.error("LOGIN OPTIONS ERROR", e);

        let creds: any[] = [];
        try { creds = await getCreds(); } catch { }

        return NextResponse.json(
            {
                ok: false,
                message: e?.message || "Error en login/options",
                debug: {
                    rpID: process.env.WEBAUTHN_RP_ID || null,
                    credsCount: creds.length,
                    sampleIdType: creds[0]?.id ? typeof creds[0].id : null,
                },
            },
            { status: 500 }
        );
    }
}