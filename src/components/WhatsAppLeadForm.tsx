"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { buildWhatsAppText, buildWhatsAppUrl } from "@/lib/whatsapp";

type Service = { id: string; title: string };

type Props = {
    onSent?: () => void;
    initialService?: string;
};

export default function WhatsAppLeadForm({ onSent, initialService }: Props) {
    const uid = useId();

    const [nombre, setNombre] = useState("");
    const [servicio, setServicio] = useState(initialService ?? "Trenzas");
    const [comuna, setComuna] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [msgLocal, setMsgLocal] = useState("");

    const [services, setServices] = useState<Service[]>([]);
    const [loadingServices, setLoadingServices] = useState(true);

    // Para no pisar el servicio si la usuaria ya cambió manualmente el select
    const [serviceTouched, setServiceTouched] = useState(false);

    const canSubmit = nombre.trim().length >= 2;

    const isInAppBrowser = () => {
        const ua = navigator.userAgent || "";
        // Instagram / Facebook in-app browsers suelen bloquear window.open o portarse raro
        return /Instagram|FBAN|FBAV|Facebook/i.test(ua);
    };

    // Estilos base
    const baseInput = useMemo(
        () =>
            [
                "w-full rounded-full",
                "border border-[#f4f0f2] bg-white",
                "px-5 py-3 text-sm text-[#181113]",
                "placeholder:text-[#89616f]/70",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary",
            ].join(" "),
        []
    );

    const baseTextarea = useMemo(
        () =>
            [
                "w-full rounded-2xl",
                "border border-[#f4f0f2] bg-white",
                "px-5 py-3 text-sm text-[#181113]",
                "placeholder:text-[#89616f]/70",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary",
            ].join(" "),
        []
    );

    // Si cambia el initialService (ej: abren el modal desde otra card),
    // lo aplicamos SOLO si la usuaria no tocó el select manualmente.
    useEffect(() => {
        if (!initialService?.trim()) return;
        if (serviceTouched) return;
        setServicio(initialService);
    }, [initialService, serviceTouched]);

    // Carga catálogo de servicios (para el select)
    useEffect(() => {
        let alive = true;
        setLoadingServices(true);

        fetch("/api/services", { cache: "no-store" })
            .then((r) => r.json())
            .then((data) => {
                if (!alive) return;

                const list: Service[] = (data.services || []).map((x: any) => ({
                    id: String(x.id ?? x.title),
                    title: String(x.title ?? x.id),
                }));

                setServices(list);
            })
            .catch(() => {
                if (!alive) return;
                setServices([]);
            })
            .finally(() => {
                if (!alive) return;
                setLoadingServices(false);
            });

        return () => {
            alive = false;
        };
    }, []);

    // Valida que el servicio actual exista en el catálogo.
    // Si no existe:
    // - si viene de initialService y la usuaria no tocó el select, NO lo pisamos (igual sirve para WhatsApp)
    // - si no, caemos al primer servicio del catálogo
    useEffect(() => {
        if (!services.length) return;

        const normalize = (s: string) => s.trim().toLowerCase();
        const exists = services.some((s) => normalize(s.title) === normalize(servicio));

        if (!exists) {
            if (!serviceTouched && initialService && normalize(initialService) === normalize(servicio)) return;
            setServicio(services[0].title);
        }
    }, [services, servicio, initialService, serviceTouched]);

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

        if (isInAppBrowser()) {
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
            setMsgLocal("Copiado ✅ Si Instagram molesta, abre WhatsApp y pega el mensaje.");
        } catch {
            window.prompt("Copia este mensaje y pégalo en WhatsApp:", text);
            setMsgLocal("Listo. Copia el mensaje del cuadro y pégalo en WhatsApp.");
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-3" noValidate>
            <div className="space-y-1">
                <label htmlFor={`${uid}-nombre`} className="text-sm font-semibold text-[#181113]">
                    Tu nombre <span className="text-primary">*</span>
                </label>

                <input
                    id={`${uid}-nombre`}
                    name="nombre"
                    type="text"
                    autoComplete="name"
                    inputMode="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Camila"
                    required
                    minLength={2}
                    maxLength={50}
                    aria-invalid={nombre.length > 0 && !canSubmit}
                    className={baseInput}
                />

                {nombre.length > 0 && !canSubmit ? (
                    <p className="text-xs text-primary">Ingresa tu nombre (mínimo 2 caracteres).</p>
                ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                    <label htmlFor={`${uid}-servicio`} className="text-sm font-semibold text-[#181113]">
                        Servicio
                    </label>

                    <select
                        id={`${uid}-servicio`}
                        name="servicio"
                        value={servicio}
                        onChange={(e) => {
                            setServicio(e.target.value);
                            setServiceTouched(true);
                        }}
                        className={baseInput}
                        disabled={loadingServices || services.length === 0}
                    >
                        {loadingServices ? (
                            <option value={servicio}>Cargando servicios…</option>
                        ) : services.length === 0 ? (
                            <option value={servicio}>Servicios no disponibles</option>
                        ) : (
                            services.map((s) => (
                                <option key={s.id} value={s.title}>
                                    {s.title}
                                </option>
                            ))
                        )}
                    </select>
                </div>

                <div className="space-y-1">
                    <label htmlFor={`${uid}-comuna`} className="text-sm font-semibold text-[#181113]">
                        Comuna
                    </label>

                    <input
                        id={`${uid}-comuna`}
                        name="comuna"
                        type="text"
                        autoComplete="address-level2"
                        value={comuna}
                        onChange={(e) => setComuna(e.target.value)}
                        placeholder="Ej: San Bernardo"
                        maxLength={60}
                        className={baseInput}
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label htmlFor={`${uid}-mensaje`} className="text-sm font-semibold text-[#181113]">
                    Mensaje
                </label>

                <textarea
                    id={`${uid}-mensaje`}
                    name="mensaje"
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Ej: Quiero agendar para el sábado en la tarde..."
                    rows={3}
                    maxLength={500}
                    className={baseTextarea}
                />
            </div>

            <button
                type="submit"
                disabled={!canSubmit}
                className="flex w-full items-center justify-center rounded-full h-12 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.99] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60 disabled:cursor-not-allowed"
            >
                Enviar por WhatsApp
            </button>

            <button
                type="button"
                onClick={copyMessage}
                className="flex w-full items-center justify-center rounded-full h-12 px-6 border border-primary/20 bg-white text-primary text-sm font-bold hover:bg-black/5 active:scale-[0.99] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
                Copiar mensaje (por si Instagram molesta)
            </button>

            {msgLocal ? <p className="text-xs text-[#89616f] text-center">{msgLocal}</p> : null}
        </form>
    );
}