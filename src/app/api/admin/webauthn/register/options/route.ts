export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { getCreds, setChallenge } from "@/lib/webauthnStore";
import { requireAdmin } from "@/lib/requireAdmin";

function isIOSUA(ua: string) {
    return /iPhone|iPad|iPod/i.test(ua);
}

export async function GET(req: Request) {
    const guard = await requireAdmin(req);
    if (!guard.ok) return guard.res;

    const ua = req.headers.get("user-agent") || "";
    if (!isIOSUA(ua)) {
        return NextResponse.json(
            { ok: false, message: "El registro de Face ID se hace desde iPhone/iPad." },
            { status: 400 }
        );
    }

    const rpName = process.env.WEBAUTHN_RP_NAME || "Caroline Trenzas Admin";
    const rpID = process.env.WEBAUTHN_RP_ID || "localhost";

    const existing = await getCreds();
    const userID = new TextEncoder().encode("admin");

    const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userID,
        userName: "admin",
        attestationType: "none",
        excludeCredentials: existing.map((c) => ({
            id: c.id,
            type: "public-key",
        })),
        authenticatorSelection: {
            residentKey: "required",
            userVerification: "preferred",
        },
    });

    await setChallenge(options.challenge);
    return NextResponse.json(options);
}