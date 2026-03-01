"use client";

import { useEffect, useMemo, useState } from "react";

export type TestimonialItem = {
    id: string;
    name: string;
    comuna: string;
    stars: number; // 1..5
    text: string;
    createdAt: string; // ISO
};

type Mode = "pending" | "approved";

function cn(...xs: Array<string | false | null | undefined>) {
    return xs.filter(Boolean).join(" ");
}

function timeAgo(iso: string) {
    const t = new Date(iso).getTime();
    const diff = Math.floor((Date.now() - t) / 1000);
    if (!Number.isFinite(diff)) return "";
    if (diff < 60) return "Hace 1 min";
    const min = Math.floor(diff / 60);
    if (min < 60) return `Hace ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `Hace ${h} horas`;
    const d = Math.floor(h / 24);
    return d === 1 ? "Ayer" : `Hace ${d} días`;
}

function clampStars(n: number) {
    return Math.max(0, Math.min(5, Math.round(n)));
}

function StarsSmall({ n }: { n: number }) {
    const filled = clampStars(n);
    return (
        <div className="flex text-amber-400 gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="material-symbols-outlined text-sm">
                    {i < filled ? "star" : "star"}
                </span>
            ))}
        </div>
    );
}

function StarsBig({ n }: { n: number }) {
    const filled = clampStars(n);
    return (
        <div className="flex text-amber-400 gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
                <span
                    key={i}
                    className={cn(
                        "material-symbols-outlined",
                        "text-3xl sm:text-4xl",
                        i < filled ? "opacity-100" : "opacity-25"
                    )}
                >
                    star
                </span>
            ))}
        </div>
    );
}

function initials(name: string) {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase()).join("") || "CT";
}

export default function TestimonialsModerationView({
    pending,
    approved,
    loading,
    onRefresh,
    onApprove,
    onReject,
    maxPublished = 3,
}: {
    pending: TestimonialItem[];
    approved: TestimonialItem[];
    loading: boolean;
    onRefresh: () => void;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    maxPublished?: number;
}) {
    const [mode, setMode] = useState<Mode>("pending");
    const [q, setQ] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const list = mode === "pending" ? pending : approved;

    const filtered = useMemo(() => {
        const qq = q.trim().toLowerCase();
        if (!qq) return list;
        return list.filter((t) => {
            const hay = `${t.name} ${t.comuna} ${t.text}`.toLowerCase();
            return hay.includes(qq);
        });
    }, [q, list]);

    // Mantener selección estable
    const selected = useMemo(() => {
        const stillExists = selectedId && filtered.some((x) => x.id === selectedId);
        const id = stillExists ? selectedId : filtered[0]?.id ?? null;
        return id ? filtered.find((x) => x.id === id) ?? null : null;
    }, [filtered, selectedId]);

    // Si cambia el filtro y la selección quedó inválida, corrige (sin drama visual)
    useEffect(() => {
        if (!filtered.length) {
            if (selectedId !== null) setSelectedId(null);
            return;
        }
        if (selectedId && !filtered.some((x) => x.id === selectedId)) {
            setSelectedId(filtered[0].id);
        }
        if (!selectedId) {
            setSelectedId(filtered[0].id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, q, filtered.length]);

    const pendingCount = pending.length;
    const approvedCount = approved.length;
    const publishedLimitReached = approvedCount >= maxPublished;
    const canApprove = mode === "pending" && !publishedLimitReached;

    // Mobile: panel detalle en “sheet”
    const [detailOpenMobile, setDetailOpenMobile] = useState(false);

    useEffect(() => {
        // si seleccionas algo en móvil, abre sheet
        // (sin detectar ancho por JS: el sheet está siempre, pero sólo visible en mobile)
        if (selected) setDetailOpenMobile(true);
    }, [selected?.id]); // ok

    return (
        <div className="relative">
            <div className="flex h-[calc(100vh-64px)] overflow-hidden rounded-2xl border border-primary/10 bg-white">
                {/* LEFT LIST */}
                <section className="w-full md:w-[420px] border-b md:border-b-0 md:border-r border-primary/10 flex flex-col bg-white">
                    {/* Header */}
                    <div className="p-4 sm:p-6 space-y-4 border-b border-primary/10 bg-white/80 backdrop-blur-md">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="material-symbols-outlined text-primary">rate_review</span>
                                <h2 className="text-lg font-black truncate">Moderación</h2>
                            </div>

                            <button
                                type="button"
                                onClick={onRefresh}
                                disabled={loading}
                                className={cn(
                                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black",
                                    "hover:bg-black/5 disabled:opacity-60"
                                )}
                            >
                                <span className="material-symbols-outlined text-[18px]">refresh</span>
                                {loading ? "Actualizando..." : "Actualizar"}
                            </button>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                search
                            </span>
                            <input
                                className="w-full pl-10 pr-10 py-3 bg-background-light border border-primary/10 rounded-2xl focus:ring-2 focus:ring-primary/30 text-sm"
                                placeholder="Buscar testimonios..."
                                type="text"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                            {q.trim() ? (
                                <button
                                    type="button"
                                    onClick={() => setQ("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 size-9 rounded-full hover:bg-black/5 flex items-center justify-center"
                                    aria-label="Limpiar"
                                    title="Limpiar"
                                >
                                    <span className="material-symbols-outlined text-slate-500">close</span>
                                </button>
                            ) : null}
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setMode("pending");
                                    setSelectedId(null);
                                }}
                                className={cn(
                                    "px-4 py-2 rounded-full text-xs font-black transition-all",
                                    mode === "pending"
                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                )}
                            >
                                Pendientes ({pendingCount})
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setMode("approved");
                                    setSelectedId(null);
                                }}
                                className={cn(
                                    "px-4 py-2 rounded-full text-xs font-black transition-all",
                                    mode === "approved"
                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                )}
                            >
                                Aprobados ({approvedCount})
                            </button>
                        </div>

                        {mode === "pending" && publishedLimitReached ? (
                            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-xs text-slate-700">
                                <span className="font-black">Límite alcanzado:</span> ya hay {approvedCount}/{maxPublished} publicados.
                                Rechaza uno para aprobar nuevos.
                            </div>
                        ) : null}
                    </div>

                    {/* Items */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                        {filtered.length === 0 ? (
                            <div className="rounded-2xl border bg-background-light p-4 text-sm text-slate-600">
                                No hay resultados.
                            </div>
                        ) : (
                            filtered.map((t) => {
                                const isSelected = selected?.id === t.id;

                                return (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedId(t.id);
                                            setDetailOpenMobile(true);
                                        }}
                                        className={cn(
                                            "w-full text-left p-4 rounded-2xl transition-all border bg-white shadow-sm",
                                            isSelected
                                                ? "border-primary ring-4 ring-primary/10"
                                                : "border-primary/10 hover:border-primary/30 hover:shadow-md"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-black text-slate-900 truncate">{t.name}</p>
                                                <p className="text-xs text-slate-500 truncate">{t.comuna}</p>
                                            </div>
                                            <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(t.createdAt)}</span>
                                        </div>

                                        <p className="mt-2 text-sm text-slate-600 line-clamp-2 italic">“{t.text}”</p>

                                        <div className="mt-3 flex items-center justify-between">
                                            <StarsSmall n={t.stars} />
                                            {mode === "pending" ? (
                                                <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] rounded-full font-black uppercase">
                                                    Nuevo
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] rounded-full font-black uppercase">
                                                    Publicado
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </section>

                {/* RIGHT DETAIL (desktop) */}
                <section className="hidden md:flex flex-1 bg-white overflow-hidden">
                    <DetailPanel
                        mode={mode}
                        selected={selected}
                        approvedCount={approvedCount}
                        maxPublished={maxPublished}
                        publishedLimitReached={publishedLimitReached}
                        canApprove={canApprove}
                        onApprove={onApprove}
                        onReject={onReject}
                    />
                </section>
            </div>

            {/* MOBILE DETAIL SHEET */}
            <div className={cn("md:hidden", detailOpenMobile ? "" : "pointer-events-none")}>
                <div
                    className={cn(
                        "fixed inset-0 z-[9999] transition-opacity",
                        detailOpenMobile ? "opacity-100" : "opacity-0"
                    )}
                >
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setDetailOpenMobile(false)}
                    />

                    <div
                        className={cn(
                            "absolute left-0 right-0 bottom-0 bg-white rounded-t-3xl shadow-2xl",
                            "transition-transform",
                            detailOpenMobile ? "translate-y-0" : "translate-y-full"
                        )}
                        style={{ maxHeight: "86vh" }}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Detalle del testimonio"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="material-symbols-outlined text-primary">forum</span>
                                <p className="font-black truncate">{selected?.name ?? "Detalle"}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDetailOpenMobile(false)}
                                className="size-10 rounded-full hover:bg-black/5 flex items-center justify-center"
                                aria-label="Cerrar"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="overflow-y-auto" style={{ maxHeight: "calc(86vh - 60px)" }}>
                            <DetailPanel
                                mode={mode}
                                selected={selected}
                                approvedCount={approvedCount}
                                maxPublished={maxPublished}
                                publishedLimitReached={publishedLimitReached}
                                canApprove={canApprove}
                                onApprove={(id) => {
                                    onApprove(id);
                                    setDetailOpenMobile(false);
                                }}
                                onReject={(id) => {
                                    onReject(id);
                                    setDetailOpenMobile(false);
                                }}
                                compact
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailPanel({
    mode,
    selected,
    approvedCount,
    maxPublished,
    publishedLimitReached,
    canApprove,
    onApprove,
    onReject,
    compact = false,
}: {
    mode: Mode;
    selected: TestimonialItem | null;
    approvedCount: number;
    maxPublished: number;
    publishedLimitReached: boolean;
    canApprove: boolean;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    compact?: boolean;
}) {
    if (!selected) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="rounded-2xl border bg-background-light p-8 text-center max-w-xl w-full">
                    <p className="text-slate-600">Selecciona un testimonio para ver el detalle.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("flex-1 overflow-hidden", compact ? "p-4" : "p-10")}>
            <div className={cn("max-w-3xl mx-auto", compact ? "" : "")}>
                {mode === "pending" && publishedLimitReached ? (
                    <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-start gap-3">
                        <span className="material-symbols-outlined text-primary mt-0.5">info</span>
                        <p className="text-sm text-slate-700">
                            <span className="font-black">Límite alcanzado:</span> tienes{" "}
                            <span className="text-primary font-black">{approvedCount}</span>/{maxPublished} publicados.
                            Para aprobar este, primero rechaza uno anterior.
                        </p>
                    </div>
                ) : null}

                {/* Header */}
                <div className="flex items-center gap-5 mb-8">
                    <div className="size-20 rounded-full bg-background-light border border-primary/10 flex items-center justify-center font-black text-slate-700">
                        {initials(selected.name)}
                    </div>

                    <div className="min-w-0">
                        <h3 className="text-2xl sm:text-3xl font-black truncate">{selected.name}</h3>

                        <div className="flex flex-wrap items-center gap-4 text-slate-500 mt-1">
                            <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">calendar_today</span>
                                <span className="text-sm">{new Date(selected.createdAt).toLocaleDateString()}</span>
                            </div>

                            <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">location_on</span>
                                <span className="text-sm">{selected.comuna}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="rounded-2xl border border-primary/10 bg-white shadow-sm p-6 sm:p-8">
                    <StarsBig n={selected.stars} />

                    <div className="relative mt-6">
                        <span className="material-symbols-outlined absolute -top-6 -left-6 text-primary/15 text-7xl">
                            format_quote
                        </span>
                        <p className="text-lg sm:text-2xl leading-relaxed text-slate-700 italic font-light">
                            “{selected.text}”
                        </p>
                    </div>

                    {/* Map placeholder */}
                    <div className="mt-8 rounded-2xl overflow-hidden h-44 bg-slate-100 border border-primary/10 relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-200/50 to-slate-100/50" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white/85 px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">location_on</span>
                                <span className="font-black text-sm">Ubicación de la reseña: {selected.comuna}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Actions */}
                <div
                    className={cn(
                        "mt-6 flex flex-col sm:flex-row gap-4",
                        compact ? "pb-6" : ""
                    )}
                >
                    {mode === "pending" ? (
                        <button
                            type="button"
                            onClick={() => onApprove(selected.id)}
                            disabled={!canApprove}
                            className={cn(
                                "flex-1 py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-xl transition",
                                canApprove
                                    ? "bg-primary text-white shadow-primary/25 hover:scale-[1.01] active:scale-[0.98]"
                                    : "bg-slate-200 text-slate-500 cursor-not-allowed"
                            )}
                            title={!canApprove ? "Ya hay 3 publicados. Rechaza uno para aprobar." : ""}
                        >
                            <span className="material-symbols-outlined">check_circle</span>
                            Aprobar Publicación
                        </button>
                    ) : (
                        <div className="flex-1 rounded-2xl border bg-background-light p-4 text-sm text-slate-600">
                            Este testimonio ya está publicado.
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => onReject(selected.id)}
                        className="flex-1 py-4 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-black text-base flex items-center justify-center gap-2 hover:bg-slate-50 transition"
                    >
                        <span className="material-symbols-outlined">cancel</span>
                        Rechazar
                    </button>
                </div>
            </div>
        </div>
    );
}