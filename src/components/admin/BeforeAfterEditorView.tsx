"use client";

import { useMemo, useState } from "react";

type BAEntry = {
    serviceId: string;
    title: string;
    before?: { publicId: string; src: string };
    after?: { publicId: string; src: string };
    updatedAt?: string;
};

export default function BeforeAfterEditorView({
    services,
    ba,
    loadingBA,
    onRefresh,
    onUploadSlot,
    onDeleteSlot,
}: {
    services: { id: string; title: string }[];
    ba: BAEntry[];
    loadingBA: boolean;
    onRefresh: () => void;
    onUploadSlot: (serviceId: string, title: string, slot: "before" | "after") => void;
    onDeleteSlot: (serviceId: string, slot: "before" | "after") => void;
}) {
    const [active, setActive] = useState(services[0]?.id ?? "");

    const activeTitle = useMemo(
        () => services.find((s) => s.id === active)?.title ?? "Servicio",
        [services, active]
    );

    const row = useMemo(() => ba.find((x) => x.serviceId === active), [ba, active]);

    const isComplete = !!(row?.before?.src && row?.after?.src);

    return (
        <div className="flex flex-col gap-6">
            {/* Header row */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Editor Antes y Después</h2>
                    <p className="text-sm text-slate-500">Sube y reemplaza fotos por servicio.</p>
                </div>

                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={loadingBA}
                    className="rounded-full border px-4 py-2 text-sm font-bold hover:bg-black/5 disabled:opacity-60"
                >
                    {loadingBA ? "Actualizando..." : "Actualizar"}
                </button>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-primary/10 overflow-hidden">
                <div className="px-4 sm:px-8 border-b border-primary/10">
                    <div className="flex gap-6 overflow-x-auto no-scrollbar">
                        {services.map((s) => {
                            const isActive = s.id === active;
                            return (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setActive(s.id)}
                                    className={[
                                        "py-4 font-bold text-sm whitespace-nowrap border-b-4 transition-colors",
                                        isActive ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600",
                                    ].join(" ")}
                                >
                                    {s.title}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-8 bg-background-light">
                    {/* Title + Status */}
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div className="space-y-1">
                            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Servicio: {activeTitle}</h3>
                            <p className="text-slate-500 text-sm">Gestiona el progreso visual para este estilo.</p>
                        </div>

                        <div className="flex bg-primary/5 p-1.5 rounded-full border border-primary/10 w-fit">
                            <div
                                className={[
                                    "px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider",
                                    !isComplete ? "bg-white text-slate-900 shadow-sm" : "text-slate-400",
                                ].join(" ")}
                            >
                                Incompleto
                            </div>
                            <div
                                className={[
                                    "px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider",
                                    isComplete ? "bg-white text-slate-900 shadow-sm" : "text-slate-400",
                                ].join(" ")}
                            >
                                Completo
                            </div>
                        </div>
                    </div>

                    {/* Side-by-side */}
                    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* BEFORE */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-lg font-bold flex items-center gap-2">
                                    <span className="w-2 h-8 bg-primary rounded-full" />
                                    ANTES
                                </h4>
                                <span className="text-xs font-bold text-slate-400 uppercase">{row?.before?.src ? "Cargado" : "Sin imagen"}</span>
                            </div>

                            {row?.before?.src ? (
                                <div className="relative aspect-square w-full rounded-xl overflow-hidden group border border-primary/10 bg-white">
                                    <img
                                        src={row.before.src}
                                        alt={`Antes ${activeTitle}`}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => onUploadSlot(active, activeTitle, "before")}
                                                className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                                                title="Reemplazar"
                                            >
                                                <span className="material-symbols-outlined">refresh</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteSlot(active, "before")}
                                                className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                                                title="Eliminar"
                                            >
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => onUploadSlot(active, activeTitle, "before")}
                                    className="aspect-square w-full rounded-xl bg-white border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-4 hover:border-primary/40 transition-all group"
                                >
                                    <div className="w-16 h-16 rounded-full bg-primary/5 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-4xl">add_a_photo</span>
                                    </div>
                                    <div className="text-center px-6">
                                        <p className="font-bold text-slate-700">Subir foto de Antes</p>
                                        <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP</p>
                                    </div>
                                    <div className="px-6 py-2 rounded-full border border-primary/20 text-primary text-sm font-bold hover:bg-primary hover:text-white transition-all">
                                        Seleccionar archivo
                                    </div>
                                </button>
                            )}
                        </div>

                        {/* AFTER */}
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-lg font-bold flex items-center gap-2">
                                    <span className="w-2 h-8 bg-green-400 rounded-full" />
                                    DESPUÉS
                                </h4>
                                {row?.after?.src ? (
                                    <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase">
                                        Cargado
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold text-slate-400 uppercase">Sin imagen</span>
                                )}
                            </div>

                            {row?.after?.src ? (
                                <div className="relative aspect-square w-full rounded-xl overflow-hidden group border border-primary/10 bg-white">
                                    <img
                                        src={row.after.src}
                                        alt={`Después ${activeTitle}`}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => onUploadSlot(active, activeTitle, "after")}
                                                className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                                                title="Reemplazar"
                                            >
                                                <span className="material-symbols-outlined">refresh</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteSlot(active, "after")}
                                                className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                                                title="Eliminar"
                                            >
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => onUploadSlot(active, activeTitle, "after")}
                                    className="aspect-square w-full rounded-xl bg-white border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-4 hover:border-primary/40 transition-all group"
                                >
                                    <div className="w-16 h-16 rounded-full bg-primary/5 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-4xl">add_a_photo</span>
                                    </div>
                                    <div className="text-center px-6">
                                        <p className="font-bold text-slate-700">Subir foto de Después</p>
                                        <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP</p>
                                    </div>
                                    <div className="px-6 py-2 rounded-full border border-primary/20 text-primary text-sm font-bold hover:bg-primary hover:text-white transition-all">
                                        Seleccionar archivo
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tip */}
                    <div className="mt-8 bg-primary/5 rounded-xl p-6 border border-primary/10 flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary">lightbulb</span>
                        </div>
                        <div>
                            <h5 className="font-bold text-primary mb-1">Consejo Pro</h5>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Toma ambas fotos desde el mismo ángulo e iluminación para que el comparador se vea pro.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}