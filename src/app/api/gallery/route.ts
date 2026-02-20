import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function GET() {
    const res = await cloudinary.search
        .expression("(resource_type:image OR resource_type:video) AND tags:gallery")
        .with_field("tags")
        .sort_by("created_at", "desc")
        .max_results(120)
        .execute();

    const items = (res.resources || []).map((r: any) => ({
        publicId: r.public_id,
        src: r.secure_url,
        createdAt: r.created_at,
        mediaType: (r.resource_type as "image" | "video") ?? "image",
        tags: r.tags || [],
        width: r.width || 1200,
        height: r.height || 1600,
        format: r.format || "",
        alt: "Trabajo de trenzas",
    }));

    const reels = items
        .filter((x: any) => x.mediaType === "video" && x.tags.includes("reel"))
        .slice(0, 6);

    return NextResponse.json(
        { items, reels },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
}