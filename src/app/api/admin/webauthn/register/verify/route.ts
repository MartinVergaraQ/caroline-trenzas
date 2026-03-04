export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { clearChallenge, getChallenge, getCreds, setCreds } from "@/lib/webauthnStore";
import { requireAdmin } from "@/lib/requireAdmin";
import { redis } from "@/lib/adminSession";

const CREDS_KEY = "admin:webauthn:creds";

function isIOSUA(ua: string) {
    return /iPhone|iPad|iPod/i.test(ua);
}

export async function POST(req: Request) {
    try {
        const guard = await requireAdmin(req);
        if (!guard.ok) return guard.res;

        const ua = req.headers.get("user-agent") || "";
        if (!isIOSUA(ua)) {
            return NextResponse.json(
                { ok: false, message: "El registro de Face ID se hace desde iPhone/iPad." },
                { status: 400 }
            );
        }

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
        const cred: any = info?.credential;

        const idB64url = String(body?.id || "").replace(/=+$/g, "");
        if (!idB64url) {
            return NextResponse.json({ ok: false, message: "body.id vacío" }, { status: 500 });
        }

        const publicKeyRaw =
            info?.credentialPublicKey ??
            cred?.publicKey ??
            cred?.credentialPublicKey ??
            cred?.credentialPublicKeyBytes;

        if (!publicKeyRaw) {
            return NextResponse.json(
                { ok: false, message: "No vino credentialPublicKey" },
                { status: 500 }
            );
        }

        const pkB64url = isoBase64URL.fromBuffer(publicKeyRaw);
        const counter = info?.counter ?? cred?.counter ?? 0;

        const creds = await getCreds();
        const next = creds.some((c) => c.id === idB64url)
            ? creds
            : [...creds, { id: idB64url, publicKey: pkB64url, counter }];

        await setCreds(next);
        await clearChallenge();

        const raw = await redis.get(CREDS_KEY);

        return NextResponse.json({
            ok: true,
            count: next.length,
            debug: {
                wroteId: idB64url,
                rawType: typeof raw,
                rawPreview: typeof raw === "string" ? raw.slice(0, 220) : raw,
            },
        });
    } catch (e: any) {
        const msg = String(e?.message || "");
        // ✅ Este error es "normal" cuando el dispositivo no puede hacer UV
        const isUv = msg.includes("User verification was required");

        if (isUv) {
            return NextResponse.json(
                { ok: false, message: "No se pudo verificar al usuario. Activa Face ID/Touch ID/Windows Hello o registra desde iPhone." },
                { status: 400 }
            );
        }

        console.error("REGISTER VERIFY ERROR", e);
        return NextResponse.json(
            { ok: false, message: msg || "Error register/verify" },
            { status: 500 }
        );
    }
}