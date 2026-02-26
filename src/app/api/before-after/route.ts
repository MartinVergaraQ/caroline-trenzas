import { NextResponse } from "next/server";
import { redis } from "@/lib/adminSession";

export const runtime = "nodejs";

const BA_KEY = "public:beforeafter:v1";

function coerceArray(raw: any): any[] {
    if (!raw) return [];

    // Si Upstash está deserializando automáticamente:
    if (Array.isArray(raw)) return raw;

    // A veces viene como objeto que contiene items (depende cómo guardaste)
    if (typeof raw === "object") {
        if (Array.isArray(raw.items)) return raw.items;
        return [];
    }

    // Caso string normal
    if (typeof raw === "string") {
        // Basura típica cuando guardaron objetos sin stringify
        if (raw === "[object Object]" || raw === "undefined" || raw === "null") return [];

        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : Array.isArray(parsed?.items) ? parsed.items : [];
        } catch {
            return [];
        }
    }

    return [];
}

export async function GET() {
    const raw = await redis.get(BA_KEY);
    const items = coerceArray(raw);

    return NextResponse.json(
        { items },
        {
            headers: {
                "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
                Vary: "Accept-Encoding",
            },
        }
    );
}