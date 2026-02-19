import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

function isAuthed(req: Request) {
    const cookie = req.headers.get("cookie") || "";
    return cookie.includes("admin_ok=1");
}

const ALLOWED_PREFIXES = ["cornrows-", "boxer-", "dutch-", "twist-", "custom-"];
const ALLOWED_FOLDERS = ["caroline/galeria/", "caroline/servicios/"];

function allowedPublicId(publicId: string) {
    if (ALLOWED_FOLDERS.some((p) => publicId.startsWith(p))) return true;
    if (ALLOWED_PREFIXES.some((p) => publicId.startsWith(p))) return true;
    // si Cloudinary llegara a meter subcarpetas raras con el prefijo:
    if (ALLOWED_PREFIXES.some((p) => publicId.includes(`/${p}`))) return true;
    return false;
}

export async function POST(req: Request) {
    if (!isAuthed(req)) return NextResponse.json({ ok: false }, { status: 401 });

    const { publicId } = await req.json();

    if (!publicId || typeof publicId !== "string") {
        return NextResponse.json({ ok: false, message: "publicId requerido" }, { status: 400 });
    }

    if (!allowedPublicId(publicId)) {
        return NextResponse.json({ ok: false, message: "No permitido" }, { status: 403 });
    }

    const result = await cloudinary.uploader.destroy(publicId, { invalidate: true });
    return NextResponse.json({ ok: true, result });
}
