export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { setChallenge } from "@/lib/webauthnStore";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { redis } from "@/lib/adminSession";

const CREDS_KEY = "admin:webauthn:creds";

function parseCreds(raw: any): Array<{ id: string }> {
    if (!raw) return [];

    if (typeof raw === "string") {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    if (Array.isArray(raw)) return raw;

    if (typeof raw === "object") return Object.values(raw);

    return [];
}

export async function GET() {
    try {
        const rpID = process.env.WEBAUTHN_RP_ID;
        if (!rpID) {
            return NextResponse.json({ ok: false, message: "Falta WEBAUTHN_RP_ID" }, { status: 500 });
        }

        // ✅ Lee Redis directo (misma key que ves en Upstash)
        const raw = await redis.get(CREDS_KEY);
        const creds = parseCreds(raw).filter((c: any) => typeof c?.id === "string" && c.id.length > 0);

        if (!creds.length) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "No hay passkey registrada en el servidor",
                    debug: {
                        rawType: typeof raw,
                        rawPreview: typeof raw === "string" ? raw.slice(0, 200) : raw,
                    },
                },
                { status: 400 }
            );
        }

        const options = await generateAuthenticationOptions({
            rpID,
            userVerification: "preferred",
            allowCredentials: creds.map((c: any) => ({
                id: isoBase64URL.toBuffer(String(c.id).replace(/=+$/g, "")),
                type: "public-key",
            })),
        } as any);

        await setChallenge(options.challenge);
        return NextResponse.json(options);
    } catch (e: any) {
        console.error("LOGIN OPTIONS ERROR", e);
        return NextResponse.json(
            { ok: false, message: e?.message || "Error login/options" },
            { status: 500 }
        );
    }
}