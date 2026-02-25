import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export const runtime = "nodejs";
export const revalidate = 300; // 5 min

type MediaType = "image" | "video";

type GalleryItem = {
    publicId: string;
    src: string;
    createdAt?: string;
    mediaType: MediaType;
    tags: string[];
    width: number;
    height: number;
    format: string;
    alt: string;
};

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function GET() {
    try {
        const res = await cloudinary.search
            .expression("(resource_type:image OR resource_type:video) AND tags:gallery")
            .with_field("tags")
            .sort_by("created_at", "desc")
            .max_results(120)
            .execute();

        const items: GalleryItem[] = (res.resources || []).map((r: any) => ({
            publicId: r.public_id,
            src: r.secure_url,
            createdAt: r.created_at,
            mediaType: (r.resource_type as MediaType) ?? "image",
            tags: (r.tags || []) as string[],
            width: r.width || 1200,
            height: r.height || 1600,
            format: r.format || "",
            alt: "Trabajo de trenzas",
        }));

        const reels = items
            .filter((x) => x.mediaType === "video" && x.tags.includes("reel"))
            .slice(0, 6);

        return NextResponse.json(
            { items, reels },
            {
                headers: {
                    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
                    "Vary": "Accept-Encoding",
                },
            }
        );
    } catch {
        return NextResponse.json(
            { items: [], reels: [] },
            {
                headers: {
                    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
                    "Vary": "Accept-Encoding",
                },
            }
        );
    }
}