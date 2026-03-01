"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type RecentItem = {
    id: string;
    publicId: string;
    title: string;
    when: string;
    src: string;
    mediaType?: "image" | "video";
    tag: "Antes" | "Después" | "Reel";
};

type Filter = "all" | "image" | "video";
type ToastKind = "info" | "success" | "error";
type Toast = { id: string; kind: ToastKind; text: string };

function cn(...xs: Array<string | false | null | undefined>) {
    return xs.filter(Boolean).join(" ");
}

/** Cloudinary thumb/poster helpers */
function cloudinaryImageThumb(src: string, size = 520) {
    try {
        if (!src.includes("/upload/")) return src;
        const [a, b] = src.split("/upload/");
        const firstSeg = b.split("/")[0] || "";
        if (firstSeg.includes(",") || firstSeg.startsWith("c_") || firstSeg.startsWith("f_")) return src;
        const t = `f_auto,q_auto,c_fill,w_${size},h_${size}`;
        return `${a}/upload/${t}/${b}`;
    } catch {
        return src;
    }
}

function cloudinaryVideoPoster(src: string, size = 900) {
    try {
        if (!src.includes("/video/upload/")) return "";
        const [a, b] = src.split("/video/upload/");
        const clean = b.replace(/\.(mp4|mov|webm)(\?.*)?$/i, "");
        const t = `so_0,f_jpg,q_auto,c_fill,w_${size},h_${size}`;
        return `${a}/video/upload/${t}/${clean}.jpg`;
    } catch {
        return "";
    }
}

function fileNameFromPublicId(publicId: string, mediaType?: "image" | "video") {
    const safe = publicId
        .replace(/^.*\//, "")
        .replace(/[^a-zA-Z0-9-_]+/g, "_")
        .slice(0, 80);

    return `${safe || "media"}.${(mediaType ?? "image") === "video" ? "mp4" : "jpg"}`;
}

function isVideo(it: RecentItem) {
    return (it.mediaType ?? "image") === "video" || it.tag === "Reel";
}

function ToastStack({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[min(320px,calc(100vw-2rem))]">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={cn(
                        "rounded-2xl border shadow-sm p-3 text-sm font-semibold flex items-center justify-between gap-3",
                        t.kind === "success"
                            ? "border-green-200 bg-green-50 text-green-800"
                            : t.kind === "error"
                                ? "border-red-200 bg-red-50 text-red-800"
                                : "border-primary/10 bg-white text-slate-700"
                    )}
                >
                    <span className="min-w-0 truncate">{t.text}</span>
                    <button
                        type="button"
                        onClick={() => onClose(t.id)}
                        className="size-8 rounded-full hover:bg-black/5 flex items-center justify-center"
                        aria-label="Cerrar"
                    >
                        <span className="material-symbols-outlined text-slate-500 text-[18px]">close</span>
                    </button>
                </div>
            ))}
        </div>
    );
}

/**
 * ✅ Card clickeable sin ser <button> (evita nested button)
 * - Accesible: role="button", tabIndex, Enter/Espacio
 */
function RecentCard({
    it,
    onOpen,
    onDelete,
}: {
    it: RecentItem;
    onOpen: () => void;
    onDelete: () => void;
}) {
    const [broken, setBroken] = useState(false);
    const vid = isVideo(it);

    const thumb = useMemo(() => {
        if (broken) return "";
        if (vid) return cloudinaryVideoPoster(it.src, 800) || "";
        return cloudinaryImageThumb(it.src, 520);
    }, [it.src, vid, broken]);

    function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
        }
    }

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={onKeyDown}
            className={cn(
                "text-left rounded-2xl overflow-hidden relative group border border-primary/5 bg-white shadow-sm",
                "hover:shadow-xl hover:border-primary/20 transition-all",
                "focus:outline-none focus:ring-4 focus:ring-primary/10"
            )}
            aria-label={`Abrir ${it.publicId}`}
            title="Click para ver"
        >
            <div className="aspect-[4/5] bg-black/5 relative">
                {thumb ? (
                    <img
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        src={thumb}
                        alt={it.title}
                        loading="lazy"
                        onError={() => setBroken(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <span className="material-symbols-outlined text-5xl">{vid ? "movie" : "image"}</span>
                    </div>
                )}

                {/* Play overlay si es video */}
                {vid ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="size-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-3xl">play_arrow</span>
                        </div>
                    </div>
                ) : null}

                {/* Badge */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-primary text-[14px]">{vid ? "movie" : "image"}</span>
                    <span className="text-[10px] font-bold text-slate-800 uppercase tracking-tighter">{it.tag}</span>
                </div>

                {/* Corner info */}
                <div className="absolute top-3 right-3 px-2 py-1 bg-white/90 rounded-md text-[10px] font-bold text-slate-700">
                    {it.when}
                </div>

                {/* Hover actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <div className="flex items-end justify-between gap-2">
                        <div className="min-w-0">
                            <p className="text-white text-xs font-bold truncate">{it.publicId}</p>
                            <p className="text-white/70 text-[10px] truncate">Click para ver</p>
                        </div>

                        {/* ✅ botón real, NO anidado dentro de otro botón */}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            className="size-9 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                            aria-label="Eliminar"
                            title="Eliminar"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DashboardView({
    stats,
    onUploadPhoto,
    onUploadReel,
    recentItems,
    onDeleteRecent,
    onOpenBeforeAfter,
    onOpenTestimonials,
}: {
    stats: {
        beforeAfterCount: number;
        beforeAfterUpdatedText?: string;
        pendingTestimonials: number;
        publishedTestimonials: number;
    };
    onUploadPhoto: () => void;
    onUploadReel: () => void;
    recentItems: RecentItem[];
    onDeleteRecent: (id: string) => void;
    onOpenBeforeAfter: () => void;
    onOpenTestimonials: () => void;
}) {
    const [filter, setFilter] = useState<Filter>("all");
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);

    const counts = useMemo(() => {
        const v = recentItems.filter((x) => isVideo(x)).length;
        return { video: v, image: recentItems.length - v };
    }, [recentItems]);

    const visible = useMemo(() => {
        if (filter === "all") return recentItems;
        return recentItems.filter((x) => ((isVideo(x) ? "video" : "image") as Filter) === filter);
    }, [recentItems, filter]);

    const openItem = openIndex === null ? null : visible[openIndex] ?? null;
    const canPrev = openIndex !== null && openIndex > 0;
    const canNext = openIndex !== null && openIndex < visible.length - 1;

    function pushToast(kind: ToastKind, text: string) {
        const id = globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random());
        setToasts((p) => [{ id, kind, text }, ...p].slice(0, 3));
        window.setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), kind === "error" ? 3500 : 1800);
    }

    function close() {
        setOpenIndex(null);
    }
    function prev() {
        setOpenIndex((i) => (i === null ? null : Math.max(0, i - 1)));
    }
    function next() {
        setOpenIndex((i) => (i === null ? null : Math.min(visible.length - 1, i + 1)));
    }

    async function copyId() {
        if (!openItem?.publicId) return;
        try {
            await navigator.clipboard.writeText(openItem.publicId);
            pushToast("success", "ID copiado");
        } catch {
            pushToast("error", "No se pudo copiar (permiso del navegador)");
        }
    }

    function openNewTab() {
        if (!openItem?.src) return;
        window.open(openItem.src, "_blank", "noopener,noreferrer");
    }

    async function downloadCurrent() {
        if (!openItem?.src) return;
        const name = fileNameFromPublicId(openItem.publicId, openItem.mediaType);

        try {
            const r = await fetch(openItem.src, { mode: "cors" });
            if (!r.ok) throw new Error(String(r.status));
            const blob = await r.blob();

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

            pushToast("success", "Descarga iniciada");
        } catch {
            pushToast("info", "Abriendo archivo (descarga depende del navegador)");
            openNewTab();
        }
    }

    // lock body scroll when lightbox open
    useEffect(() => {
        if (openIndex === null) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, [openIndex]);

    // keyboard nav
    useEffect(() => {
        if (openIndex === null) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
            if (e.key.toLowerCase() === "c") copyId();
            if (e.key.toLowerCase() === "d") downloadCurrent();
            if (e.key.toLowerCase() === "o") openNewTab();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openIndex, openItem?.publicId, openItem?.src]);

    // preload neighbors
    useEffect(() => {
        if (openIndex === null) return;

        const neighbors = [openIndex - 1, openIndex + 1]
            .map((i) => visible[i])
            .filter(Boolean) as RecentItem[];

        neighbors.forEach((it) => {
            const vid = isVideo(it);
            if (vid) {
                const poster = cloudinaryVideoPoster(it.src, 900);
                if (poster) {
                    const img = new Image();
                    img.decoding = "async";
                    img.loading = "eager";
                    img.src = poster;
                }
                const v = document.createElement("video");
                v.preload = "metadata";
                v.src = it.src;
            } else {
                const thumb = cloudinaryImageThumb(it.src, 900);
                const img = new Image();
                img.decoding = "async";
                img.loading = "eager";
                img.src = thumb;
            }
        });
    }, [openIndex, visible]);

    function onTouchStart(e: React.TouchEvent) {
        const t = e.touches[0];
        touchStartX.current = t.clientX;
        touchStartY.current = t.clientY;
    }
    function onTouchEnd(e: React.TouchEvent) {
        if (touchStartX.current === null || touchStartY.current === null) return;

        const t = e.changedTouches[0];
        const dx = t.clientX - touchStartX.current;
        const dy = t.clientY - touchStartY.current;

        touchStartX.current = null;
        touchStartY.current = null;

        if (Math.abs(dy) > Math.abs(dx)) return;
        const threshold = 40;
        if (dx > threshold && canPrev) prev();
        if (dx < -threshold && canNext) next();
    }

    return (
        <div className="flex flex-col gap-8">
            <ToastStack toasts={toasts} onClose={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

            {/* Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Antes/Después */}
                <div className="bg-white p-8 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 size-32 bg-primary/5 rounded-full group-hover:scale-110 transition-transform" />
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-slate-500 font-bold text-sm mb-1 uppercase tracking-wide">Total Galería</p>
                            <h3 className="text-slate-900 text-4xl font-extrabold">Antes y Después</h3>
                            <div className="mt-6 flex items-baseline gap-2">
                                <span className="text-5xl font-black text-primary">{stats.beforeAfterCount}</span>
                                <span className="text-slate-400 text-sm font-medium">fotos publicadas</span>
                            </div>
                        </div>
                        <div className="bg-primary/10 p-3 rounded-2xl text-primary">
                            <span className="material-symbols-outlined text-[32px]">compare</span>
                        </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">
                            {stats.beforeAfterUpdatedText || "Actualizado recientemente"}
                        </span>
                        <button onClick={onOpenBeforeAfter} className="text-primary text-sm font-bold hover:underline" type="button">
                            Ver detalles
                        </button>
                    </div>
                </div>

                {/* Testimonios */}
                <div className="bg-white p-8 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-6 -top-6 size-32 bg-amber-500/5 rounded-full group-hover:scale-110 transition-transform" />
                    <div className="flex justify-between items-start relative z-10">
                        <div className="flex-1">
                            <p className="text-slate-500 font-bold text-sm mb-1 uppercase tracking-wide">Estado de Feedback</p>
                            <h3 className="text-slate-900 text-4xl font-extrabold">Testimonios</h3>
                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <div className="bg-background-light p-4 rounded-2xl border border-primary/5">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                                        <span className="text-xs font-bold text-slate-500">Pendientes</span>
                                    </div>
                                    <span className="text-3xl font-black text-slate-800">
                                        {String(stats.pendingTestimonials).padStart(2, "0")}
                                    </span>
                                </div>

                                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="size-2 rounded-full bg-primary" />
                                        <span className="text-xs font-bold text-primary">Publicados</span>
                                    </div>
                                    <span className="text-3xl font-black text-primary">{stats.publishedTestimonials}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-500/10 p-3 rounded-2xl text-amber-600">
                            <span className="material-symbols-outlined text-[32px]">reviews</span>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={onOpenTestimonials}
                            className="bg-amber-500 text-white px-4 py-2 rounded-full font-bold text-xs hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
                            type="button"
                        >
                            Revisar pendientes
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick actions */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end">
                <button
                    onClick={onUploadPhoto}
                    className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
                    type="button"
                >
                    <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
                    Subir Foto
                </button>

                <button
                    onClick={onUploadReel}
                    className="bg-white border border-primary/20 hover:border-primary text-primary px-6 py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all"
                    type="button"
                >
                    <span className="material-symbols-outlined text-[20px]">movie</span>
                    Subir Reel
                </button>
            </div>

            {/* Recent uploads */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-black text-slate-900">Subidas Recientes</h2>
                        <span className="bg-slate-200 text-slate-600 text-xs font-black px-2.5 py-1 rounded-full">
                            ESTA SEMANA
                        </span>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-2">
                        {(
                            [
                                { key: "all" as const, label: `Todo (${recentItems.length})` },
                                { key: "image" as const, label: `Fotos (${counts.image})` },
                                { key: "video" as const, label: `Videos (${counts.video})` },
                            ] as const
                        ).map((b) => (
                            <button
                                key={b.key}
                                type="button"
                                onClick={() => setFilter(b.key)}
                                className={cn(
                                    "px-4 py-2 rounded-full text-sm font-bold border transition",
                                    filter === b.key
                                        ? "bg-primary text-white border-primary"
                                        : "bg-white border-primary/20 text-slate-700 hover:bg-primary/5"
                                )}
                            >
                                {b.label}
                            </button>
                        ))}
                    </div>
                </div>

                {visible.length === 0 ? (
                    <div className="rounded-2xl border bg-white p-6 text-sm text-slate-500">
                        No hay subidas recientes en este filtro.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {visible.map((it, idx) => (
                            <RecentCard
                                key={it.id}
                                it={it}
                                onOpen={() => setOpenIndex(idx)}
                                onDelete={() => onDeleteRecent(it.publicId)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {openItem ? (
                <div className="fixed inset-0 z-[9999]" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
                    <div className="absolute inset-0 bg-black/55" onClick={close} />

                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div
                            className="w-full max-w-5xl rounded-2xl bg-white overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                            role="dialog"
                            aria-modal="true"
                            aria-label="Vista previa"
                        >
                            {/* Top bar */}
                            <div className="p-4 border-b flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-bold truncate">{openItem.publicId}</p>
                                    <p className="text-xs text-slate-500">
                                        {isVideo(openItem) ? "Video" : "Foto"} · {openItem.when}
                                        <span className="ml-2 text-slate-400">(← → · C copiar · D descargar · O abrir · Esc cerrar)</span>
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={!canPrev}
                                        onClick={prev}
                                        className={cn("size-10 rounded-full flex items-center justify-center border", canPrev ? "hover:bg-black/5" : "opacity-40 cursor-not-allowed")}
                                        aria-label="Anterior"
                                        title="Anterior"
                                    >
                                        <span className="material-symbols-outlined">chevron_left</span>
                                    </button>

                                    <button
                                        type="button"
                                        disabled={!canNext}
                                        onClick={next}
                                        className={cn("size-10 rounded-full flex items-center justify-center border", canNext ? "hover:bg-black/5" : "opacity-40 cursor-not-allowed")}
                                        aria-label="Siguiente"
                                        title="Siguiente"
                                    >
                                        <span className="material-symbols-outlined">chevron_right</span>
                                    </button>

                                    <button type="button" onClick={copyId} className="px-3 py-2 rounded-xl border font-bold text-sm hover:bg-black/5" title="Copiar ID (C)">
                                        Copiar ID
                                    </button>

                                    <button type="button" onClick={openNewTab} className="px-3 py-2 rounded-xl border font-bold text-sm hover:bg-black/5" title="Abrir (O)">
                                        Abrir
                                    </button>

                                    <button type="button" onClick={downloadCurrent} className="px-3 py-2 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90" title="Descargar (D)">
                                        Descargar
                                    </button>

                                    <button type="button" onClick={() => onDeleteRecent(openItem.publicId)} className="px-3 py-2 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600" title="Eliminar">
                                        Eliminar
                                    </button>

                                    <button type="button" onClick={close} className="size-10 rounded-full hover:bg-black/5 flex items-center justify-center" aria-label="Cerrar" title="Cerrar">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                            </div>

                            {/* Media */}
                            <div className="bg-black/5">
                                {isVideo(openItem) ? (
                                    <video src={openItem.src} controls playsInline className="w-full max-h-[78vh] object-contain bg-black" />
                                ) : (
                                    <img src={openItem.src} alt={openItem.publicId} className="w-full max-h-[78vh] object-contain" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}