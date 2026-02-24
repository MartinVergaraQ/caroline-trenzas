export function bufToB64url(buf: any) {
    if (!buf) throw new TypeError("bufToB64url recibió vacío");
    if (buf instanceof ArrayBuffer) buf = new Uint8Array(buf);

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