import { NextResponse } from "next/server";
import { redis } from "@/lib/adminSession";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const PENDING_KEY = "public:testimonials:pending:v1";
const APPROVED_KEY = "public:testimonials:approved:v1";

type PendingRow = {
    raw: string; // el valor EXACTO que está en Redis (string)
    item: any;   // parseado a objeto
};

function safeParseJson(raw: unknown): { ok: true; item: any; rawStr: string } | { ok: false; rawStr: string } {
    // Normaliza a string para poder hacer lrem si toca limpiar
    const rawStr =
        typeof raw === "string"
            ? raw
            : raw == null
                ? ""
                : typeof raw === "object"
                    ? JSON.stringify(raw)
                    : String(raw);

    // Intenta parsear JSON si parece JSON
    try {
        const trimmed = rawStr.trim();
        if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) {
            return { ok: false, rawStr };
        }
        return { ok: true, item: JSON.parse(trimmed), rawStr };
    } catch {
        return { ok: false, rawStr };
    }
}

async function readPending(limit = 50): Promise<PendingRow[]> {
    const items = await redis.lrange(PENDING_KEY, 0, limit - 1);

    const out: PendingRow[] = [];

    for (const raw of items) {
        const parsed = safeParseJson(raw);

        // Si es basura tipo "[object Object]" o JSON roto, lo limpiamos para que no siga rompiendo
        if (!parsed.ok) {
            if (parsed.rawStr) {
                // intenta eliminar 1 ocurrencia
                await redis.lrem(PENDING_KEY, 1, parsed.rawStr);
            }
            continue;
        }

        out.push({ raw: parsed.rawStr, item: parsed.item });
    }

    return out;
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

    // si redis te devuelve objeto raro
    try {
        const v = JSON.parse(JSON.stringify(raw));
        return Array.isArray(v) ? v : [];
    } catch {
        return [];
    }
}

export async function GET(req: Request) {
    const guard = await requireAdmin(req);
    if (!guard.ok) return guard.res;

    const [pendingRows, approvedRaw] = await Promise.all([
        readPending(50),
        redis.get(APPROVED_KEY),
    ]);

    const pending = pendingRows.map((x) => x.item);
    const approved = safeParseArray(approvedRaw);

    return NextResponse.json(
        { ok: true, pending, approved },
        { headers: { "Cache-Control": "no-store" } }
    );
}

export async function POST(req: Request) {
    const guard = await requireAdmin(req);
    if (!guard.ok) return guard.res;

    const body = await req.json().catch(() => ({}));
    const id = String(body?.id || "");
    if (!id) return NextResponse.json({ ok: false, message: "id requerido" }, { status: 400 });

    const pendingRows = await readPending(50);
    const hit = pendingRows.find((x) => String(x.item?.id) === id);
    if (!hit) return NextResponse.json({ ok: false, message: "No encontrado" }, { status: 404 });

    await redis.lrem(PENDING_KEY, 1, hit.raw);

    const approvedRaw = await redis.get(APPROVED_KEY);
    const approved = safeParseArray(approvedRaw);

    const nextApproved = [{ ...hit.item, status: "approved" }, ...approved].slice(0, 3);
    await redis.set(APPROVED_KEY, JSON.stringify(nextApproved));

    return NextResponse.json(
        { ok: true, approved: nextApproved },
        { headers: { "Cache-Control": "no-store" } }
    );
}

export async function DELETE(req: Request) {
    const guard = await requireAdmin(req);
    if (!guard.ok) return guard.res;

    const { searchParams } = new URL(req.url);
    const id = String(searchParams.get("id") || "");
    if (!id) return NextResponse.json({ ok: false, message: "id requerido" }, { status: 400 });

    const pendingRows = await readPending(50);
    const hit = pendingRows.find((x) => String(x.item?.id) === id);
    if (hit) {
        await redis.lrem(PENDING_KEY, 1, hit.raw);
    }

    return NextResponse.json(
        { ok: true },
        { headers: { "Cache-Control": "no-store" } }
    );
}