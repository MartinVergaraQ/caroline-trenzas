import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";

export async function GET(req: Request) {
    const guard = await requireAdmin(req);
    if (!guard.ok) return guard.res;

    return NextResponse.json({ ok: true });
}