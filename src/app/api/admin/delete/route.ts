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

// SOLO estas carpetas pueden borrarse
const ALLOWED_ROOTS = ["caroline/galeria", "caroline/servicios"];

function folderAllowed(folder?: string) {
    const f = folder || "";
    return ALLOWED_ROOTS.some((root) => f === root || f.startsWith(root + "/"));
}

// Fallback por si Cloudinary no devuelve folder pero el public_id sí trae carpeta
function publicIdAllowed(publicId: string) {
    return publicId.startsWith("caroline/galeria/") || publicId.startsWith("caroline/servicios/");
}

function normalizeFolder(info: { folder?: string | null; asset_folder?: string | null }) {
    // Cloudinary a veces usa folder, otras asset_folder
    return (info.folder || info.asset_folder || "") as string;
}

async function probeCloudinary(publicId: string, resourceType?: "image" | "video") {
    const tried: ("image" | "video")[] = [];
    const details: any[] = [];

    async function tryType(rt: "image" | "video") {
        tried.push(rt);
        const r: any = await cloudinary.api.resource(publicId, { resource_type: rt });

        const info = {
            resource_type: rt,
            public_id: r?.public_id ?? null,
            folder: r?.folder ?? null,
            asset_folder: r?.asset_folder ?? null,
            normalized_folder: normalizeFolder({ folder: r?.folder, asset_folder: r?.asset_folder }),
            type: r?.type ?? null,
            format: r?.format ?? null,
            created_at: r?.created_at ?? null,
        };

        details.push(info);
        return info;
    }

    const isInfoAllowed = (info: any) => {
        const nf = info?.normalized_folder || "";
        return folderAllowed(nf) || publicIdAllowed(publicId);
    };

    // Si viene resourceType, probamos ese primero
    if (resourceType) {
        try {
            const info = await tryType(resourceType);
            const allowed = isInfoAllowed(info);
            return { ok: true, allowed, tried, details, chosen: info };
        } catch (e: any) {
            return {
                ok: false,
                allowed: false,
                tried,
                details,
                error: {
                    message: e?.message || String(e),
                    name: e?.name,
                    http_code: e?.http_code,
                },
            };
        }
    }

    // Si no viene tipo, probamos image
    try {
        const infoImg = await tryType("image");
        if (isInfoAllowed(infoImg)) {
            return { ok: true, allowed: true, tried, details, chosen: infoImg };
        }
    } catch (e: any) {
        details.push({
            resource_type: "image",
            error: { message: e?.message || String(e), name: e?.name, http_code: e?.http_code },
        });
    }

    // Luego video
    try {
        const infoVid = await tryType("video");
        if (isInfoAllowed(infoVid)) {
            return { ok: true, allowed: true, tried, details, chosen: infoVid };
        }
    } catch (e: any) {
        details.push({
            resource_type: "video",
            error: { message: e?.message || String(e), name: e?.name, http_code: e?.http_code },
        });
    }

    // Existe o no, pero no permitido
    const allowed =
        publicIdAllowed(publicId) ||
        details.some((d) => folderAllowed(d?.normalized_folder));

    return {
        ok: true,
        allowed,
        tried,
        details,
        chosen: details.find((d) => d?.normalized_folder) ?? null,
    };
}

export async function POST(req: Request) {
    const guard = await requireAdmin(req);
    if (!guard.ok) return guard.res;

    const body = await req.json().catch(() => ({}));
    const publicId = body?.publicId;

    if (!publicId || typeof publicId !== "string") {
        return NextResponse.json({ ok: false, message: "publicId requerido" }, { status: 400 });
    }

    const resourceType: "image" | "video" | undefined =
        body?.resourceType === "video"
            ? "video"
            : body?.resourceType === "image"
                ? "image"
                : undefined;

    // 🔎 Debug: qué llega desde el cliente
    const clientDebug = {
        publicId,
        resourceType: resourceType ?? null,
        hasCookie: !!req.headers.get("cookie"),
    };

    const probe = await probeCloudinary(publicId, resourceType);

    // Si no se pudo consultar Cloudinary, devolvemos 500 con debug
    if (!probe.ok) {
        return NextResponse.json(
            {
                ok: false,
                message: "No se pudo consultar Cloudinary",
                clientDebug,
                probe,
            },
            { status: 500 }
        );
    }

    // Si Cloudinary existe pero no está permitido, devolvemos 403 con debug
    if (!probe.allowed) {
        return NextResponse.json(
            {
                ok: false,
                message: "No permitido",
                clientDebug,
                probe,
                allowedRoots: ALLOWED_ROOTS,
            },
            { status: 403 }
        );
    }

    // ✅ Ahora sí: borrar
    try {
        if (resourceType) {
            const result = await cloudinary.uploader.destroy(publicId, {
                resource_type: resourceType,
                invalidate: true,
            });

            return NextResponse.json(
                { ok: true, result, clientDebug, probe },
                { headers: { "Cache-Control": "no-store, max-age=0" } }
            );
        }

        // sin tipo: intenta image y si no existe, intenta video
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: "image",
            invalidate: true,
        });

        if (result?.result === "not found") {
            const result2 = await cloudinary.uploader.destroy(publicId, {
                resource_type: "video",
                invalidate: true,
            });

            return NextResponse.json(
                { ok: true, result: result2, clientDebug, probe },
                { headers: { "Cache-Control": "no-store, max-age=0" } }
            );
        }

        return NextResponse.json(
            { ok: true, result, clientDebug, probe },
            { headers: { "Cache-Control": "no-store, max-age=0" } }
        );
    } catch (e: any) {
        return NextResponse.json(
            {
                ok: false,
                message: e?.message || "Error eliminando",
                clientDebug,
                probe,
            },
            { status: 500 }
        );
    }
}