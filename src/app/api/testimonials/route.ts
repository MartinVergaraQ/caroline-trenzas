import { NextResponse } from "next/server";
import { redis } from "@/lib/adminSession";

export const runtime = "nodejs";
// no hace falta force-dynamic; este endpoint puede cachearse en CDN
export const revalidate = 300; // 5 min (coincide con s-maxage)

const APPROVED_KEY = "public:testimonials:approved:v1";
const PENDING_KEY = "public:testimonials:pending:v1";
const RATE_KEY_PREFIX = "ratelimit:testimonial:";
const MAX_PENDING = 50;

function getIP(req: Request) {
    const xff = req.headers.get("x-forwarded-for");
    if (xff) return xff.split(",")[0].trim();
    const real = req.headers.get("x-real-ip");
    if (real) return real.trim();
    return "unknown";
}

function sanitize(body: any) {
    const name = String(body?.name || "").trim().slice(0, 40);
    const comuna = String(body?.comuna || "").trim().slice(0, 40);
    const stars = Math.max(1, Math.min(5, Number(body?.stars || 5)));
    const text = String(body?.text || "").trim().slice(0, 240);
    return { name, comuna, stars, text };
}

function safeParseArray(raw: unknown): any[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;

    if (typeof raw === "string") {
        try {
            const v = JSON.parse(raw);
            return Array.isArray(v) ? v : [];
        } catch {
            return [];
        }
    }

    // caso raro: redis devuelve objeto, lo normalizamos
    try {
        const v = JSON.parse(JSON.stringify(raw));
        return Array.isArray(v) ? v : [];
    } catch {
        return [];
    }
}

export async function GET() {
    const raw = await redis.get(APPROVED_KEY);
    const list = safeParseArray(raw);
    const top3 = list.slice(0, 3);

    return NextResponse.json(
        { testimonials: top3 },
        {
            headers: {
                "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
                "Vary": "Accept-Encoding",
            },
        }
    );
}

export async function POST(req: Request) {
    const ip = getIP(req);
    const rateKey = `${RATE_KEY_PREFIX}${ip}`;

    const isDev = process.env.NODE_ENV !== "production";

    if (isDev) {
        // En dev no rate-limit (para probar)
    } else {
        const already = await redis.get(rateKey);
        if (already) {
            return NextResponse.json(
                { ok: false, message: "Ya recibimos tu testimonio. Gracias 💛" },
                { status: 429 }
            );
        }
    }

    const body = await req.json().catch(() => ({}));

    // honeypot
    if (body?.website) return NextResponse.json({ ok: true });

    const { name, comuna, stars, text } = sanitize(body);
    if (!name || !text) {
        return NextResponse.json(
            { ok: false, message: "Falta nombre y comentario." },
            { status: 400 }
        );
    }

    const item = {
        id: globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random()),
        name,
        comuna,
        stars,
        text,
        createdAt: new Date().toISOString(),
        status: "pending",
    };

    // siempre stringified
    await redis.lpush(PENDING_KEY, JSON.stringify(item));
    await redis.ltrim(PENDING_KEY, 0, MAX_PENDING - 1);

    if (!isDev) {
        await redis.set(rateKey, "1", { ex: 60 * 60 * 12 });
    }

    // Tip: si quieres que la landing “vea” al tiro los cambios al aprobar,
    // lo correcto es revalidar /api/testimonials (o el path donde consumes).
    // (Esto lo haces en el admin cuando apruebas.)

    return NextResponse.json({ ok: true });
}