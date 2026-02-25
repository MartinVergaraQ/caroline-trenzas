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

const ALLOWED_FOLDERS = ["caroline/galeria", "caroline/servicios"];

function allowedPublicId(publicId: string) {
    return ALLOWED_FOLDERS.some((f) => publicId === f || publicId.startsWith(f + "/"));
}

export async function POST(req: Request) {
    const guard = await requireAdmin(req);
    if (!guard.ok) return guard.res;

    const body = await req.json().catch(() => ({}));
    const publicId = body?.publicId;

    if (!publicId || typeof publicId !== "string") {
        return NextResponse.json({ ok: false, message: "publicId requerido" }, { status: 400 });
    }

    if (!allowedPublicId(publicId)) {
        return NextResponse.json({ ok: false, message: "No permitido" }, { status: 403 });
    }

    const resourceType =
        body?.resourceType === "video" ? "video" :
            body?.resourceType === "image" ? "image" :
                null;

    try {
        const result = resourceType
            ? await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true })
            : await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true });

        if (!resourceType && result?.result === "not found") {
            const result2 = await cloudinary.uploader.destroy(publicId, { resource_type: "video", invalidate: true });
            return NextResponse.json({ ok: true, result: result2 }, { headers: { "Cache-Control": "no-store" } });
        }

        return NextResponse.json({ ok: true, result }, { headers: { "Cache-Control": "no-store" } });
    } catch (e: any) {
        return NextResponse.json({ ok: false, message: e?.message || "Error eliminando" }, { status: 500 });
    }
}