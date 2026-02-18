import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const cookie = req.headers.get("cookie") || "";
    const ok = cookie.includes("admin_ok=1");
    return NextResponse.json({ ok });
}
