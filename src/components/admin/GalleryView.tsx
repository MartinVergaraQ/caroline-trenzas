"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type MediaItem = {
    publicId: string;
    src: string;
    createdAt: string;
    bytes: number;
    width: number;
    height: number;
    mediaType?: "image" | "video";
};

type Filter = "all" | "image" | "video";

function cn(...xs: Array<string | false | null | undefined>) {
    return xs.filter(Boolean).join(" ");
}

/**
 * Cloudinary helpers:
 * - Image thumb: /image/upload/<transforms>/...
 * - Video poster: /video/upload/so_0/<public_id>.jpg
 *
 * If the URL isn't Cloudinary, fallback gracefully.
 */
function cloudinaryImageThumb(src: string, size = 520) {
    try {
        if (!src.includes("/upload/")) return src;

        // Insert transform segment right after /upload/
        const [a, b] = src.split("/upload/");
        const firstSeg = b.split("/")[0] || "";

        // If it already seems transformed, keep it.
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
        .replace(/^.*\//, "") // last segment
        .replace(/[^a-zA-Z0-9-_]+/g, "_")
        .slice(0, 80);

    return `${safe || "media"}.${(mediaType ?? "image") === "video" ? "mp4" : "jpg"}`;
}

type ToastKind = "info" | "success" | "error";
type Toast = { id: string; kind: ToastKind; text: string };

export default function GalleryView({
    items,
    loading,
    onDelete,
    formatTimeAgo,
    query,
}: {
    items: MediaItem[];
    loading: boolean;
    onDelete: (item: { publicId: string; src: string; mediaType?: "image" | "video"; contextLabel: string }) => void;
    formatTimeAgo: (iso?: string) => string;
    query: string;
}) {
    const [filter, setFilter] = useState<Filter>("all");
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    // mini toasts internos
    const [toasts, setToasts] = useState<Toast[]>([]);

    // swipe tracking
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);

    const counts = useMemo(() => {
        const v = items.filter((x) => (x.mediaType ?? "image") === "video").length;
        return { video: v, image: items.length - v };
    }, [items]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return items.filter((x) => {
            const t = (x.mediaType ?? "image") as "image" | "video";
            if (filter !== "all" && t !== filter) return false;
            if (!q) return true;
            return x.publicId.toLowerCase().includes(q);
        });
    }, [items, query, filter]);

    const openItem = openIndex === null ? null : visible[openIndex] ?? null;
    const canPrev = openIndex !== null && openIndex > 0;
    const canNext = openIndex !== null && openIndex < visible.length - 1;

    function pushToast(kind: ToastKind, text: string) {
        const id = (globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random()));
        setToasts((p) => [{ id, kind, text }, ...p].slice(0, 3));
        window.setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), kind === "error" ? 3500 : 1800);
    }

    function openByIndex(i: number) {
        setOpenIndex(i);
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
            // Intento “pro”: fetch blob para forzar nombre
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
            // Fallback: abrir en nueva pestaña
            pushToast("info", "Abriendo archivo (descarga depende del navegador)");
            openNewTab();
        }
    }

    // Lock body scroll when modal open
    useEffect(() => {
        if (openIndex === null) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, [openIndex]);

    // Keyboard nav (Esc, ←, →, C copy, D download, O open)
    useEffect(() => {
        if (openIndex === null) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") close();
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();

            // shortcuts
            if (e.key.toLowerCase() === "c") copyId();
            if (e.key.toLowerCase() === "d") downloadCurrent();
            if (e.key.toLowerCase() === "o") openNewTab();
        };

        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openIndex, openItem?.publicId, openItem?.src]);

    // Preload next/prev when modal open
    useEffect(() => {
        if (openIndex === null) return;

        const neighbors = [openIndex - 1, openIndex + 1]
            .map((i) => visible[i])
            .filter(Boolean) as MediaItem[];

        neighbors.forEach((it) => {
            const isVideo = (it.mediaType ?? "image") === "video";
            if (isVideo) {
                // preload poster
                const poster = cloudinaryVideoPoster(it.src, 900);
                if (poster) {
                    const img = new Image();
                    img.decoding = "async";
                    img.loading = "eager";
                    img.src = poster;
                }
                // preload metadata (best effort, no autoplay)
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

        if (Math.abs(dy) > Math.abs(dx)) return; // ignore vertical scroll gestures
        const threshold = 40;
        if (dx > threshold && canPrev) prev();
        if (dx < -threshold && canNext) next();
    }

    const ToastStack = () => (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[min(320px,calc(100vw-2rem))]">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={cn(
                        "rounded-2xl border shadow-sm p-3 text-sm font-semibold",
                        t.kind === "success"
                            ? "border-green-200 bg-green-50 text-green-800"
                            : t.kind === "error"
                                ? "border-red-200 bg-red-50 text-red-800"
                                : "border-primary/10 bg-white text-slate-700"
                    )}
                >
                    {t.text}
                </div>
            ))}
        </div>
    );

    if (loading) {
        return <div className="rounded-2xl border bg-white p-6 text-sm text-slate-500">Cargando...</div>;
    }

    return (
        <div className="space-y-6">
            <ToastStack />

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
                {(
                    [
                        { key: "all" as const, label: `Todo (${items.length})` },
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

                <div className="ml-auto text-xs text-slate-500">
                    Mostrando: <span className="font-bold">{visible.length}</span>
                </div>
            </div>

            {/* Empty */}
            {visible.length === 0 ? (
                <div className="rounded-2xl border bg-white p-6 text-sm text-slate-500">No hay resultados.</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {visible.map((it, idx) => {
                        const isVideo = (it.mediaType ?? "image") === "video";
                        const thumb = isVideo ? cloudinaryVideoPoster(it.src, 520) : cloudinaryImageThumb(it.src, 520);

                        return (
                            <button
                                key={it.publicId}
                                type="button"
                                onClick={() => openByIndex(idx)}
                                className={cn(
                                    "group text-left relative bg-white rounded-2xl overflow-hidden shadow-sm",
                                    "hover:shadow-xl transition-all border border-transparent hover:border-primary/20"
                                )}
                            >
                                <div className="aspect-square relative overflow-hidden bg-black/5">
                                    {thumb ? (
                                        <img
                                            src={thumb}
                                            alt={it.publicId}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-black/30">
                                            <span className="material-symbols-outlined text-5xl">{isVideo ? "play_circle" : "image"}</span>
                                        </div>
                                    )}

                                    {isVideo ? (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="size-14 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                                                <span className="material-symbols-outlined text-white text-3xl">play_arrow</span>
                                            </div>
                                        </div>
                                    ) : null}

                                    <div className="absolute top-3 left-3 flex gap-2">
                                        {isVideo ? (
                                            <span className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
                                                VIDEO
                                            </span>
                                        ) : null}
                                        <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-slate-800 text-[10px] font-bold rounded-md">
                                            {formatTimeAgo(it.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate" title={it.publicId}>
                                        ID: {it.publicId}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

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
                                        {(openItem.mediaType ?? "image") === "video" ? "Video" : "Foto"} · {formatTimeAgo(openItem.createdAt)}
                                        <span className="ml-2 text-slate-400">
                                            (← → navegar · C copiar · D descargar · O abrir · Esc cerrar)
                                        </span>
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={!canPrev}
                                        onClick={prev}
                                        className={cn(
                                            "size-10 rounded-full flex items-center justify-center border",
                                            canPrev ? "hover:bg-black/5" : "opacity-40 cursor-not-allowed"
                                        )}
                                        aria-label="Anterior"
                                        title="Anterior"
                                    >
                                        <span className="material-symbols-outlined">chevron_left</span>
                                    </button>

                                    <button
                                        type="button"
                                        disabled={!canNext}
                                        onClick={next}
                                        className={cn(
                                            "size-10 rounded-full flex items-center justify-center border",
                                            canNext ? "hover:bg-black/5" : "opacity-40 cursor-not-allowed"
                                        )}
                                        aria-label="Siguiente"
                                        title="Siguiente"
                                    >
                                        <span className="material-symbols-outlined">chevron_right</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={copyId}
                                        className="px-3 py-2 rounded-xl border font-bold text-sm hover:bg-black/5"
                                        title="Copiar ID (C)"
                                    >
                                        Copiar ID
                                    </button>

                                    <button
                                        type="button"
                                        onClick={openNewTab}
                                        className="px-3 py-2 rounded-xl border font-bold text-sm hover:bg-black/5"
                                        title="Abrir (O)"
                                    >
                                        Abrir
                                    </button>

                                    <button
                                        type="button"
                                        onClick={downloadCurrent}
                                        className="px-3 py-2 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90"
                                        title="Descargar (D)"
                                    >
                                        Descargar
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            onDelete({
                                                publicId: openItem.publicId,
                                                src: openItem.src,
                                                mediaType: openItem.mediaType,
                                                contextLabel: "Galería",
                                            })
                                        }
                                        className="px-3 py-2 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600"
                                        title="Eliminar"
                                    >
                                        Eliminar
                                    </button>

                                    <button
                                        type="button"
                                        onClick={close}
                                        className="size-10 rounded-full hover:bg-black/5 flex items-center justify-center"
                                        aria-label="Cerrar"
                                        title="Cerrar"
                                    >
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>
                            </div>

                            {/* Media */}
                            <div className="bg-black/5">
                                {(openItem.mediaType ?? "image") === "video" ? (
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