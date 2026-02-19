"use client";

import { useState } from "react";
import { buildWhatsAppText, buildWhatsAppUrl } from "@/lib/whatsapp";

export default function WhatsAppLeadForm({ onSent }: { onSent?: () => void }) {
    const [nombre, setNombre] = useState("");
    const [servicio, setServicio] = useState("Trenzas");
    const [comuna, setComuna] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [msgLocal, setMsgLocal] = useState("");

    const canSubmit = nombre.trim().length >= 2;

    const isInstagramInApp = () => {
        const ua = navigator.userAgent || "";
        return /Instagram/i.test(ua);
    };

    function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMsgLocal("");
        if (!canSubmit) return;

        const payload = {
            nombre: nombre.trim(),
            servicio,
            comuna: comuna.trim() || undefined,
            mensaje: mensaje.trim() || undefined,
        };

        const url = buildWhatsAppUrl(payload);

        // Instagram iOS: mejor navegación directa
        if (isInstagramInApp()) {
            window.location.href = url;
        } else {
            window.open(url, "_blank", "noopener,noreferrer");
        }

        onSent?.();
    }

    async function copyMessage() {
        setMsgLocal("");

        const payload = {
            nombre: nombre.trim(),
            servicio,
            comuna: comuna.trim() || undefined,
            mensaje: mensaje.trim() || undefined,
        };

        const text = buildWhatsAppText(payload);

        try {
            await navigator.clipboard.writeText(text);
            setMsgLocal("Copiado ✅ Si WhatsApp se pone raro, pega el mensaje allá.");
        } catch {
            // fallback: selecciona el texto en un prompt (sí, es feo, pero funciona)
            window.prompt("Copia este mensaje y pégalo en WhatsApp:", text);
            setMsgLocal("Listo. Copia el mensaje del cuadro y pégalo en WhatsApp.");
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1">
                <label className="text-sm font-semibold text-[#181113]">
                    Tu nombre <span className="text-primary">*</span>
                </label>
                <input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Camila"
                    className="w-full rounded-full border-[#f4f0f2] bg-white px-5 py-3 text-sm focus:border-primary focus:ring-primary"
                />
                {!canSubmit && nombre.length > 0 ? (
                    <p className="text-xs text-primary">
                        Ingresa tu nombre (mínimo 2 caracteres).
                    </p>
                ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-sm font-semibold text-[#181113]">Servicio</label>
                    <select
                        value={servicio}
                        onChange={(e) => setServicio(e.target.value)}
                        className="w-full rounded-full border-[#f4f0f2] bg-white px-5 py-3 text-sm focus:border-primary focus:ring-primary"
                    >
                        {[
                            "Trenzas",
                            "Cornrows",
                            "Boxeadoras",
                            "Holandesas",
                            "Twist",
                            "Diseños personalizados",
                        ].map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-semibold text-[#181113]">Comuna</label>
                    <input
                        value={comuna}
                        onChange={(e) => setComuna(e.target.value)}
                        placeholder="Ej: San Bernardo"
                        className="w-full rounded-full border-[#f4f0f2] bg-white px-5 py-3 text-sm focus:border-primary focus:ring-primary"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-semibold text-[#181113]">Mensaje</label>
                <textarea
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Ej: Quiero agendar para el sábado en la tarde..."
                    rows={3}
                    className="w-full rounded-2xl border-[#f4f0f2] bg-white px-5 py-3 text-sm focus:border-primary focus:ring-primary"
                />
            </div>

            <button
                type="submit"
                disabled={!canSubmit}
                className="flex w-full items-center justify-center rounded-full h-12 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
                Enviar por WhatsApp
            </button>

            <button
                type="button"
                onClick={copyMessage}
                className="flex w-full items-center justify-center rounded-full h-12 px-6 border border-primary/20 bg-white text-primary text-sm font-bold hover:bg-black/5"
            >
                Copiar mensaje (por si Instagram molesta)
            </button>

            {msgLocal ? (
                <p className="text-xs text-[#89616f] text-center">{msgLocal}</p>
            ) : null}
        </form>
    );
}
