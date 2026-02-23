export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getCreds } from "@/lib/webauthnStore";

export async function GET() {
    const creds = await getCreds();
    return NextResponse.json({ hasPasskey: creds.length > 0, count: creds.length });
}