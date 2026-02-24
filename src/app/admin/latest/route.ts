import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAdmin } from "@/lib/requireAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

type Img = {
    src: string;
    publicId: string;
    createdAt: string;
    folder: string;
};

function mapRes(res: any): Img[] {
    return (res?.resources || []).map((r: any) => ({
        src: r.secure_url,
        publicId: r.public_id,
        createdAt: r.created_at,
        folder: r.asset_folder || "",
    }));
}

export async function GET(req: Request) {
    const guard = await requireAdmin(req);
    if (!guard.ok) return guard.res;

    const [galleryRes, servicesRes] = await Promise.all([
        cloudinary.search
            .expression(`resource_type:image AND asset_folder="caroline/galeria"`)
            .sort_by("created_at", "desc")
            .max_results(12)
            .execute(),
        cloudinary.search
            .expression(`resource_type:image AND asset_folder="caroline/servicios"`)
            .sort_by("created_at", "desc")
            .max_results(12)
            .execute(),
    ]);

    return NextResponse.json({
        ok: true,
        gallery: mapRes(galleryRes),
        services: mapRes(servicesRes),
    });
}