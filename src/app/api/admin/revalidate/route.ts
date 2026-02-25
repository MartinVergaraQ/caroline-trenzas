import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/requireAdmin";

export async function POST(req: Request) {
    const guard = await requireAdmin(req);
    if (!guard.ok) return guard.res;

    revalidatePath("/api/gallery");
    revalidatePath("/api/services");

    return NextResponse.json({ ok: true });
}