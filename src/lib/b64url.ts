export function bufToB64url(buf: any) {
    if (!buf) throw new TypeError("bufToB64url recibió vacío");

    // si viene como ArrayBuffer
    if (buf instanceof ArrayBuffer) buf = new Uint8Array(buf);

    // si viene como Uint8Array/Buffer, ok
    return Buffer.from(buf)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "");
}