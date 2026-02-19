import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import servicesMeta from "@/data/services.json";

export const dynamic = "force-dynamic";
export const revalidate = 0;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function GET() {
    const res = await cloudinary.search
        .expression("tags:services")
        .with_field("tags") // 🔥 importante
        .sort_by("created_at", "desc")
        .max_results(200)
        .execute();

    const resources = res.resources || [];

    const services = (servicesMeta as any[]).map((s) => {
        const id = String(s.id).toLowerCase();
        const requiredTag = `service_${id}`;

        const match = resources.find((r: any) => (r.tags || []).includes(requiredTag));

        return { ...s, image: match?.secure_url || "" };
    });

    return NextResponse.json(
        { services },
        { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
}
