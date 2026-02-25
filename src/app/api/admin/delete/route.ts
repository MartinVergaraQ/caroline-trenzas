import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// Solo se puede borrar contenido dentro de estas carpetas
const ALLOWED_ROOTS = ["caroline/galeria", "caroline/servicios"];

function folderAllowed(folder?: string) {
    const f = folder || "";
    return ALLOWED_ROOTS.some((root) => f === root || f.startsWith(root + "/"));
}

async function fetchResourceFolder(publicId: string, resource_type: "image" | "video") {
    const r = await cloudinary.api.resource(publicId, { resource_type });
    return (r?.folder as string | undefined) || "";
}

async function isAllowedByCloudinary(publicId: string, resourceType?: "image" | "video") {
    // Si el cliente nos dijo el tipo, probamos solo ese
    if (resourceType) {
        try {
            const folder = await fetchResourceFolder(publicId, resourceType);
            return folderAllowed(folder);
        } catch {
            return false;
        }
    }

    // Si no, probamos image y luego video
    try {
        const folder = await fetchResourceFolder(publicId, "image");
        if (folderAllowed(folder)) return true;
    } catch {
        // ignore
    }

    try {
        const folder = await fetchResourceFolder(publicId, "video");
        if (folderAllowed(folder)) return true;
    } catch {
        // ignore
    }

    return false;
}

export async function POST(req: Request) {
    const guard = await requireAdmin(req);
    if (!guard.ok) return guard.res;

    const body = await req.json().catch(() => ({}));
    const publicId = body?.publicId;

    if (!publicId || typeof publicId !== "string") {
        return NextResponse.json({ ok: false, message: "publicId requerido" }, { status: 400 });
    }

    const resourceType: "image" | "video" | undefined =
        body?.resourceType === "video"
            ? "video"
            : body?.resourceType === "image"
                ? "image"
                : undefined;

    // ✅ Validación REAL por carpeta en Cloudinary
    const allowed = await isAllowedByCloudinary(publicId, resourceType);
    if (!allowed) {
        return NextResponse.json(
            { ok: false, message: "No permitido", publicId },
            { status: 403 }
        );
    }

    try {
        // Si viene tipo, destruimos directo
        if (resourceType) {
            const result = await cloudinary.uploader.destroy(publicId, {
                resource_type: resourceType,
                invalidate: true,
            });

            return NextResponse.json(
                { ok: true, result },
                { headers: { "Cache-Control": "no-store, max-age=0" } }
            );
        }

        // Si no viene tipo, probamos image y si no existe, probamos video
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
            invalidate: true,
        });

        if (result?.result === "not found") {
            const result2 = await cloudinary.uploader.destroy(publicId, {
                resource_type: "video",
                invalidate: true,
            });

            return NextResponse.json(
                { ok: true, result: result2 },
                { headers: { "Cache-Control": "no-store, max-age=0" } }
            );
        }

        return NextResponse.json(
            { ok: true, result },
            { headers: { "Cache-Control": "no-store, max-age=0" } }
        );
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, message: e?.message || "Error eliminando" },
            { status: 500 }
        );
    }
}