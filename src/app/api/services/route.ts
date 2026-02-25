import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import servicesMeta from "@/data/services.json";

export const runtime = "nodejs";
export const revalidate = 300; // 5 min

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function GET() {
    try {
        const res = await cloudinary.search
            .expression("tags:services")
            .with_field("tags")
            .sort_by("created_at", "desc")
            .max_results(200)
            .execute();

        const resources = res.resources || [];

        // Map tag -> secure_url (O(n))
        const byTag = new Map<string, string>();
        for (const r of resources) {
            const url = r.secure_url as string | undefined;
            const tags = (r.tags || []) as string[];
            if (!url) continue;
            for (const t of tags) if (t.startsWith("service_")) byTag.set(t, url);
        }

        const services = (servicesMeta as any[]).map((s) => {
            const id = String(s.id).toLowerCase();
            const requiredTag = `service_${id}`;
            return { ...s, image: byTag.get(requiredTag) || "" };
        });

        return NextResponse.json(
            { services },
            {
                headers: {
                    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
                    "Vary": "Accept-Encoding",
                },
            }
        );
    } catch {
        // fallback suave si Cloudinary está caído
        const services = (servicesMeta as any[]).map((s) => ({ ...s, image: "" }));
        return NextResponse.json(
            { services },
            {
                headers: {
                    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
                    "Vary": "Accept-Encoding",
                },
            }
        );
    }
}