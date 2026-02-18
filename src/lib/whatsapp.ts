type Lead = {
    nombre?: string;
    servicio?: string;
    fecha?: string;
    hora?: string;
    comuna?: string;
    mensaje?: string;
};

export const WHATSAPP_PHONE = "56974011961"; // sin + para wa.me

export function buildWhatsAppUrl(data?: Lead) {
    const lines: string[] = ["Hola Caroline 👋"];

    if (data?.nombre) lines.push(`Soy ${data.nombre}.`);
    if (data?.servicio) lines.push(`Servicio: ${data.servicio}`);
    if (data?.fecha) lines.push(`Fecha: ${data.fecha}`);
    if (data?.hora) lines.push(`Hora: ${data.hora}`);
    if (data?.comuna) lines.push(`Comuna: ${data.comuna}`);
    if (data?.mensaje) lines.push(`Detalle: ${data.mensaje}`);

    lines.push("(Enviado desde la web)");

    const text = encodeURIComponent(lines.join("\n"));
    return `https://wa.me/${WHATSAPP_PHONE}?text=${text}`;
}
