type Lead = {
    nombre?: string;
    servicio?: string;
    fecha?: string;
    hora?: string;
    comuna?: string;
    mensaje?: string;
};

export const WHATSAPP_PHONE = "56974011961"; // sin +

function clean(s: string) {
    return s
        .replace(/\u00A0/g, " ")                 // NBSP
        .replace(/[\u200B-\u200D\uFEFF]/g, "")   // zero-width + BOM
        .trim();
}

export function buildWhatsAppText(data?: Lead) {
    const lines: string[] = [];

    // 1ra línea sin emoji (más estable en IG iOS)
    lines.push("Hola Caroline");

    // 2da línea con emoji
    lines.push("👋");

    if (data?.nombre) lines.push(`Soy ${clean(data.nombre)}.`);
    if (data?.servicio) lines.push(`Servicio: ${clean(data.servicio)}`);
    if (data?.fecha) lines.push(`Fecha: ${clean(data.fecha)}`);
    if (data?.hora) lines.push(`Hora: ${clean(data.hora)}`);
    if (data?.comuna) lines.push(`Comuna: ${clean(data.comuna)}`);
    if (data?.mensaje) lines.push(`Detalle: ${clean(data.mensaje)}`);

    lines.push("Enviado desde la web");

    return lines.join("\r\n");
}


export function buildWhatsAppUrl(data?: Lead) {
    const text = encodeURIComponent(buildWhatsAppText(data));
    // api.whatsapp.com suele funcionar mejor que wa.me en in-app browsers
    return `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${text}`;
}
