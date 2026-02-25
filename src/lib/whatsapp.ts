// src/lib/whatsapp.ts

export type Lead = {
    nombre?: string;
    servicio?: string;
    duracion?: string;
    comuna?: string;
    mensaje?: string;
};

// sin "+" y sin espacios
export const WHATSAPP_PHONE = "56974011961";

function clean(s: unknown) {
    return String(s ?? "")
        .replace(/\u00A0/g, " ")
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .trim();
}

export function buildWhatsAppText(data?: Lead) {
    const lines: string[] = [];

    // Manténlo simple: IG in-app browser a veces se pone mañoso con emojis al inicio.
    lines.push("Hola Caroline");
    if (data?.nombre) lines.push(`Soy ${clean(data.nombre)}.`);
    if (data?.servicio) lines.push(`Me interesa: ${clean(data.servicio)}`);
    if (data?.comuna) lines.push(`Comuna: ${clean(data.comuna)}`);
    if (data?.mensaje) lines.push(`Detalle: ${clean(data.mensaje)}`);
    if (data?.duracion) lines.push(`⏱ Duración aprox: ${clean(data.duracion)}`);
    lines.push("¿Me ayudas con disponibilidad y valor?");

    // Microcopy “qué enviar” (cumple Word y mejora lead quality)
    lines.push("");
    lines.push("Para cotizar mejor puedo enviar:");
    lines.push("• Foto de mi pelo (opcional)");
    lines.push("• Largo (corto/medio/largo o foto)");
    lines.push("• Foto referencia / idea");
    lines.push("• Fecha ideal");

    return lines.join("\n");
}

export function buildWhatsAppUrl(data?: Lead) {
    const text = encodeURIComponent(buildWhatsAppText(data));
    // api.whatsapp.com suele funcionar mejor en browsers in-app (Instagram/Facebook)
    return `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${text}`;
}