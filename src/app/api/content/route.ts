import { NextResponse } from "next/server";
import { defaultLandingContent } from "@/lib/landing-content";
import { redis } from "@/lib/redis";

const CONTENT_KEY = "caroline:landing:content";

export async function GET() {
    try {
        const content = await redis.get(CONTENT_KEY);

        return NextResponse.json({
            ok: true,
            content: content ?? defaultLandingContent,
        });
    } catch (error) {
        console.error("GET /api/content error:", error);

        return NextResponse.json({
            ok: true,
            content: defaultLandingContent,
        });
    }
}