import crypto from "crypto";
import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv(); // usa KV_REST_API_URL y KV_REST_API_TOKEN

export const ADMIN_COOKIE = "admin_session";
export const SESSION_TTL_SEC = 60 * 60 * 6;

export function newToken() {
    return crypto.randomBytes(32).toString("hex");
}

export function sessionKey(token: string) {
    return `admin:session:${token}`;
}