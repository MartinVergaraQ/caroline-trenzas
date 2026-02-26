import { NextResponse } from "next/server";
import { redis } from "@/lib/adminSession";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const BA_KEY = "public:beforeafter:v1";

function coerceArray(raw: any): any[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;

    if (typeof raw === "object") {
        // por si alguien guardó { items: [...] }
        if (Array.isArray((raw as any).items)) return (raw as any).items;
        return [];
    }

    if (typeof raw === "string") {
        // basura típica
        if (raw === "[object Object]" || raw === "undefined" || raw === "null") return [];
        try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) return parsed;
            if (Array.isArray(parsed?.items)) return parsed.items;
            return [];
        } catch {
            return [];
        }
    }

    return [];
}

async function readAll() {
    const raw = await redis.get(BA_KEY);
    return coerceArray(raw);
}

async function writeAll(items: any[]) {
    await redis.set(BA_KEY, JSON.stringify(items));
}

// ✅ GET: devuelve todo para admin
export async function GET(req: Request) {
    const guard = await requireAdmin(req);
    if (!guard.ok) return guard.res;

    const items = await readAll();
    return NextResponse.json({ ok: true, items }, { headers: { "Cache-Control": "no-store" } });
}

// ✅ POST: guarda/reemplaza BEFORE o AFTER para un servicio
export async function POST(req: Request) {
    const guard = await requireAdmin(req);
    if (!guard.ok) return guard.res;

    const body = await req.json().catch(() => ({}));

    const serviceId = String(body?.serviceId || "");
    const title = String(body?.title || "Servicio");
    const slot = String(body?.slot || "before"); // "before" | "after"
    const publicId = String(body?.publicId || "");
    const src = String(body?.src || "");

    if (!serviceId || !publicId || !src) {
        return NextResponse.json({ ok: false, message: "Faltan datos (serviceId/publicId/src)" }, { status: 400 });
    }
    if (slot !== "before" && slot !== "after") {
        return NextResponse.json({ ok: false, message: "slot inválido" }, { status: 400 });
    }

    const items = await readAll();
    const idx = items.findIndex((x) => x?.serviceId === serviceId);

    const base =
        idx >= 0
            ? items[idx]
            : {
                serviceId,
                title,
            };

    const next = {
        ...base,
        serviceId,
        title,
        updatedAt: new Date().toISOString(),
        [slot]: { publicId, src },
    };

    const out = idx >= 0 ? items.map((x, i) => (i === idx ? next : x)) : [next, ...items];

    await writeAll(out);

    return NextResponse.json({ ok: true, items: out }, { headers: { "Cache-Control": "no-store" } });
}

// ✅ DELETE: borra BEFORE o AFTER
export async function DELETE(req: Request) {
    const guard = await requireAdmin(req);
    if (!guard.ok) return guard.res;

    const { searchParams } = new URL(req.url);
    const serviceId = String(searchParams.get("serviceId") || "");
    const slot = String(searchParams.get("slot") || "");

    if (!serviceId) return NextResponse.json({ ok: false, message: "serviceId requerido" }, { status: 400 });
    if (slot !== "before" && slot !== "after") {
        return NextResponse.json({ ok: false, message: "slot inválido" }, { status: 400 });
    }

    const items = await readAll();
    const idx = items.findIndex((x) => x?.serviceId === serviceId);
    if (idx < 0) {
        return NextResponse.json({ ok: true, items }, { headers: { "Cache-Control": "no-store" } });
    }

    const current = items[idx] || {};
    const next = { ...current };
    delete next[slot];
    next.updatedAt = new Date().toISOString();

    const out = items.map((x, i) => (i === idx ? next : x));
    await writeAll(out);

    return NextResponse.json({ ok: true, items: out }, { headers: { "Cache-Control": "no-store" } });
}