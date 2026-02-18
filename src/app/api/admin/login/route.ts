import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const { password } = await req.json();
    const ok = password && password === process.env.ADMIN_PASSWORD;

    if (!ok) return NextResponse.json({ ok: false }, { status: 401 });

    const res = NextResponse.json({ ok: true });
    // Cookie simple. Para algo serio usarías NextAuth, pero esto sirve.
    res.cookies.set("admin_ok", "1", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 6, // 6 horas
    });
    return res;
}
