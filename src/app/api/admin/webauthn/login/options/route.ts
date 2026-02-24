export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { setChallenge } from "@/lib/webauthnStore";
import { redis } from "@/lib/adminSession";

const CREDS_KEY = "admin:webauthn:creds";

function parseCreds(raw: any): any[] {
    if (!raw) return [];
    if (typeof raw === "string") {
        try { return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : []; } catch { return []; }
    }
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "object") return Object.values(raw);
    return [];
}

// ✅ base64url -> Uint8Array (acepta string y objetos tipo Buffer serializado)
function b64urlToU8(v: any): Uint8Array {
    if (!v) throw new Error("id vacío");

    // Buffer serializado { data:[...] }
    if (typeof v === "object" && Array.isArray(v.data)) {
        return new Uint8Array(v.data);
    }

    // Uint8Array/ArrayBuffer
    if (v instanceof Uint8Array) return v;
    if (v instanceof ArrayBuffer) return new Uint8Array(v);

    // string base64url
    const s = String(v).replace(/=+$/g, "");
    const pad = "=".repeat((4 - (s.length % 4)) % 4);
    const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");

    // Node: Buffer.from es confiable
    return new Uint8Array(Buffer.from(b64, "base64"));
}

export async function GET() {
    try {
        const rpID = process.env.WEBAUTHN_RP_ID;
        if (!rpID) {
            return NextResponse.json({ ok: false, message: "Falta WEBAUTHN_RP_ID" }, { status: 500 });
        }

        const raw = await redis.get(CREDS_KEY);
        const creds = parseCreds(raw);

        // filtra solo los que tengan id usable
        const usable = creds.filter((c: any) => c && c.id);

        if (!usable.length) {
            return NextResponse.json(
                { ok: false, message: "No hay passkey registrada en el servidor", debug: { rawType: typeof raw } },
                { status: 400 }
            );
        }

        // DEBUG seguro para ver el tipo real que te estaba rompiendo
        console.log("LOGIN OPTIONS CREDS TYPES", {
            rawType: typeof raw,
            firstIdType: typeof usable[0]?.id,
            firstIdIsObjData: !!usable[0]?.id?.data,
        });

        const options = await generateAuthenticationOptions({
            rpID,
            userVerification: "preferred",
            allowCredentials: usable.map((c: any) => ({
                id: b64urlToU8(c.id),
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