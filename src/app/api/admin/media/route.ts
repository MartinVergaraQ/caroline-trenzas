import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

function isAuthed(req: Request) {
    const cookie = req.headers.get("cookie") || "";
    return cookie.includes("admin_ok=1");
}

export async function GET(req: Request) {
    if (!isAuthed(req)) return NextResponse.json({ ok: false }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") || "").toLowerCase();
    const limit = Math.min(Number(searchParams.get("limit") || "30"), 60);

    const assetFolder =
        type === "gallery"
            ? "caroline/galeria"
            : type === "services"
                ? "caroline/servicios"
                : null;

    if (!assetFolder) {
        return NextResponse.json({ ok: false, message: "type inválido" }, { status: 400 });
    }

    const res = await cloudinary.search
        .expression(`resource_type:image AND asset_folder="${assetFolder}"`)
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
    }));

    return NextResponse.json({ ok: true, images });
}
