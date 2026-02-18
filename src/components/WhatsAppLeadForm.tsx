"use client";

import { useMemo, useState } from "react";
import { site } from "@/config/site";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type FormState = {
    nombre: string;
    servicio: string;
    fecha: string;
    hora: string;
    comuna: string;
    mensaje: string;
};

const initialState: FormState = {
    nombre: "",
    servicio: "Trenzas",
    fecha: "",
    hora: "",
    comuna: "",
    mensaje: "",
};

const servicios = ["Trenzas", "Box Braids", "Peinados", "Consulta"];

export default function WhatsAppLeadForm() {
    const [form, setForm] = useState<FormState>(initialState);
    const [touched, setTouched] = useState<{ nombre?: boolean }>({});

    const nombreError = useMemo(() => {
        const v = form.nombre.trim();
        if (!touched.nombre) return "";
        if (v.length < 2) return "Ingresa tu nombre (mínimo 2 caracteres).";
        return "";
    }, [form.nombre, touched.nombre]);

    const canSubmit = form.nombre.trim().length >= 2;

    function onChange<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setTouched({ nombre: true });
        if (!canSubmit) return;

        const url = buildWhatsAppUrl(site.whatsappE164, {
            nombre: form.nombre.trim(),
            servicio: form.servicio || undefined,
            fecha: form.fecha || undefined,
            hora: form.hora || undefined,
            comuna: form.comuna.trim() || undefined,
            mensaje: form.mensaje.trim() || undefined,
        });

        window.open(url, "_blank", "noopener,noreferrer");
    }

    return (
        <form onSubmit={onSubmit} className="w-full space-y-3">
            <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-800">
                    Tu nombre <span className="text-rose-500">*</span>
                </label>
                <input
                    value={form.nombre}
                    onChange={(e) => onChange("nombre", e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, nombre: true }))}
                    placeholder="Ej: Camila"
                    className="w-full rounded-2xl border border-rose-100 bg-white/80 px-4 py-3 text-base outline-none placeholder:text-neutral-400 focus:border-rose-300"
                />
                {nombreError ? <p className="text-xs text-rose-600">{nombreError}</p> : null}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-neutral-800">Servicio</label>
                    <select
                        value={form.servicio}
                        onChange={(e) => onChange("servicio", e.target.value)}
                        className="w-full rounded-2xl border border-rose-100 bg-white/80 px-4 py-3 text-base outline-none focus:border-rose-300"
                    >
                        {servicios.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-neutral-800">Comuna</label>
                    <input
                        value={form.comuna}
                        onChange={(e) => onChange("comuna", e.target.value)}
                        placeholder="Ej: Providencia"
                        className="w-full rounded-2xl border border-rose-100 bg-white/80 px-4 py-3 text-base outline-none placeholder:text-neutral-400 focus:border-rose-300"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-neutral-800">Fecha</label>
                    <input
                        type="date"
                        value={form.fecha}
                        onChange={(e) => onChange("fecha", e.target.value)}
                        className="w-full rounded-2xl border border-rose-100 bg-white/80 px-4 py-3 text-base outline-none focus:border-rose-300"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-neutral-800">Hora</label>
                    <input
                        type="time"
                        value={form.hora}
                        onChange={(e) => onChange("hora", e.target.value)}
                        className="w-full rounded-2xl border border-rose-100 bg-white/80 px-4 py-3 text-base outline-none focus:border-rose-300"
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-neutral-800">Mensaje</label>
                <textarea
                    value={form.mensaje}
                    onChange={(e) => onChange("mensaje", e.target.value)}
                    placeholder="Ej: Quiero trenzas para este sábado, tengo el pelo largo…"
                    rows={4}
                    className="w-full resize-none rounded-2xl border border-rose-100 bg-white/80 px-4 py-3 text-base outline-none placeholder:text-neutral-400 focus:border-rose-300"
                />
            </div>

            <button
                type="submit"
                disabled={!canSubmit}
                className="w-full rounded-2xl bg-rose-500 px-5 py-3 text-base font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
                Reservar por WhatsApp
            </button>

            <p className="text-xs text-neutral-500">
                Se abrirá WhatsApp con tu solicitud prellenada.
            </p>
        </form>
    );
}
