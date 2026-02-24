export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { clearChallenge, getChallenge, getCreds, setCreds } from "@/lib/webauthnStore";
import { requireAdmin } from "@/lib/requireAdmin";
import { redis } from "@/lib/adminSession";

const CREDS_KEY = "admin:webauthn:creds";

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
        const cred: any = info?.credential;

        // ✅ ID REAL: del body (browser)
        const idB64url = String(body?.id || "").replace(/=+$/g, "");
        if (!idB64url) {
            return NextResponse.json(
                { ok: false, message: "body.id vacío (no llegó el credential id)" },
                { status: 500 }
            );
        }

        // ✅ PublicKey: de registrationInfo
        const publicKeyRaw =
            info?.credentialPublicKey ??
            cred?.publicKey ??
            cred?.credentialPublicKey ??
            cred?.credentialPublicKeyBytes;

        if (!publicKeyRaw) {
            return NextResponse.json(
                {
                    ok: false,
                    message: "No vino credentialPublicKey",
                    debug: { infoKeys: Object.keys(info || {}), credKeys: Object.keys(cred || {}) },
                },
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
        await clearChallenge(); // ✅ ahora sí se ejecuta siempre

        // ✅ PRUEBA BRUTAL: lee Redis directo
        const raw = await redis.get(CREDS_KEY);

        return NextResponse.json({
            ok: true,
            count: next.length,
            debug: {
                vercelEnv: process.env.VERCEL_ENV || null,
                commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || null,
                redisUrlHint: (process.env.KV_REST_API_URL || "").slice(0, 35),
                wroteId: idB64url,
                rawType: typeof raw,
                rawPreview: typeof raw === "string" ? raw.slice(0, 220) : raw,
            },
        });
    } catch (e: any) {
        console.error("REGISTER VERIFY ERROR", e);
        return NextResponse.json(
            { ok: false, message: e?.message || "Error register/verify" },
            { status: 500 }
        );
    }
}