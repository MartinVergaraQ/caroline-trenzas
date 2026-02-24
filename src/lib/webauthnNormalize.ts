import { bufToB64url } from "@/lib/b64url";

export function toB64url(input: any): string {
    if (!input) throw new Error("toB64url: input vacío");

    // Ya viene como base64url string (pasa en algunas versiones)
    if (typeof input === "string") return input;

    // Buffer
    if (typeof Buffer !== "undefined" && Buffer.isBuffer(input)) {
        return bufToB64url(new Uint8Array(input));
    }

    // ArrayBuffer
    if (input instanceof ArrayBuffer) {
        return bufToB64url(new Uint8Array(input));
    }

    // Uint8Array / TypedArray
    if (input?.buffer instanceof ArrayBuffer) {
        return bufToB64url(new Uint8Array(input));
    }

    throw new Error(`toB64url: tipo no soportado (${typeof input})`);
}