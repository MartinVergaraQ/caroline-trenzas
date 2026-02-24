import crypto from "crypto";
import { Redis } from "@upstash/redis";

export const redis = new Redis({
    url: process.env.LOGIN_TRENZA_REDIS_REST_URL!,
    token: process.env.LOGIN_TRENZA_REDIS_REST_TOKEN!,
});
export const ADMIN_COOKIE = "admin_session";
export const SESSION_TTL_SEC = 60 * 60 * 6; // 6h (ajusta)

export function newToken() {
    return crypto.randomBytes(32).toString("hex"); // 64 chars
}

export function sessionKey(token: string) {
    return `admin:session:${token}`;
}