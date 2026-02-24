export function bufToB64url(buf: Uint8Array) {
    return Buffer.from(buf)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}

export function b64urlToBuf(s: string) {
    const pad = "=".repeat((4 - (s.length % 4)) % 4);
    const base64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
    return new Uint8Array(Buffer.from(base64, "base64"));
}

// ✅ convierte base64 normal -> base64url
export function b64ToB64url(s: string) {
    return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

// ✅ intenta “normalizar” cualquier id entrante a base64url
export function normalizeIdToB64url(maybe: any) {
    if (!maybe) return "";

    // si ya es string
    if (typeof maybe === "string") {
        // si tiene caracteres base64 normales, pásalo a base64url
        return b64ToB64url(maybe);
    }

    // si viene como ArrayBuffer/TypedArray (algunas serializaciones raras)
    try {
        if (maybe instanceof ArrayBuffer) return bufToB64url(new Uint8Array(maybe));
        if (ArrayBuffer.isView(maybe)) return bufToB64url(new Uint8Array(maybe.buffer));
    } catch { }

    return "";
}