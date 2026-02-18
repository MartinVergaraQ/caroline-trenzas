import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const url = req.nextUrl;

    if (url.pathname.startsWith("/admin")) {
        const ok = req.cookies.get("admin_ok")?.value === "1";
        if (!ok) {
            // deja entrar al /admin, pero la pantalla pide login (ya lo hace)
            return NextResponse.next();
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*"],
};
