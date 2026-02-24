import crypto from "crypto";
import { Redis } from "@upstash/redis";

const url = process.env.KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN;

if (!url || !token) {
    throw new Error("Faltan KV_REST_API_URL o KV_REST_API_TOKEN en variables de entorno");
}

export const redis = new Redis({ url, token });

export const ADMIN_COOKIE = "admin_session";
export const SESSION_TTL_SEC = 60 * 60 * 6;

export function newToken() {
    return crypto.randomBytes(32).toString("hex");
}

export function sessionKey(token: string) {
    return `admin:session:${token}`;
}