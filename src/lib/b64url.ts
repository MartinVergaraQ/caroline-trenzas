// src/lib/b64url.ts

// Uint8Array -> base64url string
export function bufToB64url(buf: Uint8Array) {
    return Buffer.from(buf)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

// base64url string -> Uint8Array
export function b64urlToBuf(s: string) {
    const pad = "=".repeat((4 - (s.length % 4)) % 4);
    const base64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
    return new Uint8Array(Buffer.from(base64, "base64"));
}

// base64 (o base64url) string -> base64url string
export function b64ToB64url(s: string) {
    return String(s)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

/**
 * Normaliza cualquier cosa "parecida" a ID (string base64/base64url o bytes)
 * a base64url string, para comparar contra lo que guardaste en Redis.
 */
export function normalizeIdToB64url(maybe: any) {
    if (!maybe) return "";

    // ya viene string (base64 o base64url)
    if (typeof maybe === "string") return b64ToB64url(maybe);

    try {
        // ArrayBuffer
        if (maybe instanceof ArrayBuffer) {
            return bufToB64url(new Uint8Array(maybe));
        }

        // TypedArray / DataView / etc
        if (ArrayBuffer.isView(maybe)) {
            return bufToB64url(
                new Uint8Array(maybe.buffer, maybe.byteOffset, maybe.byteLength)
            );
        }
    } catch { }

    return "";
}

/**
 * Helper para "guardar bien" credentialID/credentialPublicKey en register/verify,
 * porque dependiendo de versión puede venir como string o como bytes.
 */
export function toB64url(input: any) {
    return normalizeIdToB64url(input);
}