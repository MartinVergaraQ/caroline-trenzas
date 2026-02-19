import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function GET() {
    const res = await cloudinary.search
        .expression("tags:gallery")
        .sort_by("created_at", "desc")
        .max_results(60)
        .execute();

    const images = (res.resources || []).map((r: any) => ({
        src: r.secure_url,
        alt: "Trabajo de trenzas",
        width: r.width || 1200,
        height: r.height || 1600,
        publicId: r.public_id,
    }));

    return NextResponse.json({ images });
}
