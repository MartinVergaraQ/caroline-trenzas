import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import servicesMeta from "@/data/services.json";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function GET() {
    try {
        const services = await Promise.all(
            (servicesMeta as any[]).map(async (s) => {
                // Buscamos 1 imagen (la más reciente) marcada con el tag del servicio
                // y en el folder correcto.
                const tag = `service_${String(s.id).toLowerCase()}`;

                const res = await cloudinary.search
                    .expression(`folder:caroline/servicios AND tags=${tag}`)
                    .sort_by("created_at", "desc")
                    .max_results(1)
                    .execute();

                const first = res?.resources?.[0];

                return {
                    ...s,
                    image: first?.secure_url || "",
                };
            })
        );

        return NextResponse.json({ services });
    } catch (err: any) {
        console.error("API /services error:", err);
        return NextResponse.json(
            { services: [], error: err?.message || "Cloudinary error" },
            { status: 500 }
        );
    }
}
