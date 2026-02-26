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

function escCloudinaryValue(s: string) {
    // Cloudinary search query escaping básico para evitar romper expression
    return s.replace(/["\\]/g, "\\$&");
}

export async function GET(req: Request) {
    const guard = await requireAdmin(req);
    if (!guard.ok) return guard.res;

    const { searchParams } = new URL(req.url);

    const type = (searchParams.get("type") || "").toLowerCase();
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || "24"), 1), 100);
    const cursor = searchParams.get("cursor") || undefined;

    // filtros
    const media = (searchParams.get("media") || "all").toLowerCase(); // all|image|video
    const reelOnly = searchParams.get("reel") === "1";
    const tag = (searchParams.get("tag") || "").trim(); // cualquier tag
    const q = (searchParams.get("q") || "").trim();     // búsqueda por public_id

    const folder =
        type === "gallery"
            ? "caroline/galeria"
            : type === "services"
                ? "caroline/servicios"
                : null;

    if (!folder) {
        return NextResponse.json({ ok: false, message: "type inválido" }, { status: 400 });
    }

    // resource type base
    let resourceExpr =
        type === "gallery"
            ? "(resource_type:image OR resource_type:video)"
            : "resource_type:image";

    // media filter
    if (media === "image") resourceExpr = "resource_type:image";
    if (media === "video") resourceExpr = "resource_type:video";

    // base expression
    const parts: string[] = [];
    parts.push(resourceExpr);
    parts.push(`folder:${folder}`);

    // tags
    if (tag) parts.push(`tags:${escCloudinaryValue(tag)}`);
    if (reelOnly) parts.push("tags:reel");

    // search by public_id (contains)
    if (q) {
        // public_id:*texto*
        parts.push(`public_id:*${escCloudinaryValue(q)}*`);
    }

    const expression = parts.join(" AND ");

    let search = cloudinary.search
        .expression(expression)
        .with_field("tags")
        .sort_by("created_at", "desc")
        .max_results(limit);

    // pagination
    if (cursor) search = search.next_cursor(cursor);

    const res = await search.execute();

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
        { ok: true, images, nextCursor: res.next_cursor || null, expression },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
}