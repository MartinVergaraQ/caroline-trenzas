import crypto from "crypto";
import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();

export const ADMIN_COOKIE = "admin_session";
export const SESSION_TTL_SEC = 60 * 60 * 6; // 6h (ajusta)

export function newToken() {
    return crypto.randomBytes(32).toString("hex"); // 64 chars
}

export function sessionKey(token: string) {
    return `admin:session:${token}`;
}