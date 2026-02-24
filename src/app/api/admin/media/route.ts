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

export async function GET(req: Request) {
    const guard = await requireAdmin(req);
    if (!guard.ok) return guard.res;

    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") || "").toLowerCase();
    const limit = Math.min(Number(searchParams.get("limit") || "30"), 60);

    const folder =
        type === "gallery"
            ? "caroline/galeria"
            : type === "services"
                ? "caroline/servicios"
                : null;

    if (!folder) {
        return NextResponse.json({ ok: false, message: "type inválido" }, { status: 400 });
    }

    const expression =
        type === "gallery"
            ? `(resource_type:image OR resource_type:video) AND folder:${folder}`
            : `resource_type:image AND folder:${folder}`;

    const res = await cloudinary.search
        .expression(expression)
        .with_field("tags")
        .sort_by("created_at", "desc")
        .max_results(limit)
        .execute();

    const images = (res.resources || []).map((r: any) => ({
        publicId: r.public_id,
        src: r.secure_url,
        createdAt: r.created_at,
        bytes: r.bytes || 0,
        width: r.width || 0,
        height: r.height || 0,
        mediaType: r.resource_type as "image" | "video",
        tags: r.tags || [],
    }));

    return NextResponse.json(
        { ok: true, images },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
}