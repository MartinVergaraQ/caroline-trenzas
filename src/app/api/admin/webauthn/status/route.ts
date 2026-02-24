export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getCreds } from "@/lib/webauthnStore";

export async function GET() {
    const creds = await getCreds();

    const isProd = process.env.NODE_ENV === "production";

    return NextResponse.json({
        hasPasskey: creds.length > 0,
        count: creds.length,
        // Solo para debug, no lo expongas en prod si te da paranoia
        ...(isProd ? {} : { ids: creds.map(c => c.id) }),
    });
}