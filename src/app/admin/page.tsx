"use client";

import { useMemo, useState } from "react";

declare global {
    interface Window {
        cloudinary: any;
    }
}

const SERVICES = [
    { id: "cornrows", title: "Cornrows" },
    { id: "boxer", title: "Boxeadoras" },
    { id: "dutch", title: "Holandesas" },
    { id: "twist", title: "Twist" },
    { id: "custom", title: "Diseños Personalizados" },
];

type UploadedItem = {
    publicId: string;
    src: string;
    type: "gallery" | "services";
    serviceId?: string;
    createdAt?: string; // 👈 lo agregamos para "Hace X min"
};

type MediaItem = {
    publicId: string;
    src: string;
    createdAt: string;
    bytes: number;
    width: number;
    height: number;
};

type Notice = null | {
    kind: "success" | "error" | "info";
    title: string;
    detail?: string;
};

type ConfirmDeleteState = null | {
    publicId: string;
    src?: string;
    contextLabel?: string; // "Galería" o "Servicio: boxer"
};

export default function AdminPage() {
    const [authed, setAuthed] = useState(false);
    const [pwd, setPwd] = useState("");

    const [notice, setNotice] = useState<Notice>(null);

    const [selectedServiceId, setSelectedServiceId] = useState(SERVICES[0].id);

    // Subidas de la sesión (para deshacer sin ir a Cloudinary)
    const [sessionUploads, setSessionUploads] = useState<UploadedItem[]>([]);

    // Últimas desde Cloudinary (sin recargar)
    const [galleryLatest, setGalleryLatest] = useState<MediaItem[]>([]);
    const [servicesLatest, setServicesLatest] = useState<MediaItem[]>([]);
    const [loadingLatest, setLoadingLatest] = useState(false);

    // Modal confirmación borrar
    const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteState>(null);
    const [deleting, setDeleting] = useState(false);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
    const presetGallery = process.env.NEXT_PUBLIC_CLOUDINARY_GALLERY_PRESET || "";
    const presetServices = process.env.NEXT_PUBLIC_CLOUDINARY_SERVICES_PRESET || "";

    const selectedTitle = useMemo(
        () => SERVICES.find((x) => x.id === selectedServiceId)?.title || "Servicio",
        [selectedServiceId]
    );

    // ---------- helpers ----------
    function formatTimeAgo(iso?: string) {
        if (!iso) return "";
        const t = new Date(iso).getTime();
        if (Number.isNaN(t)) return "";
        const diffSec = Math.floor((Date.now() - t) / 1000);
        if (diffSec < 0) return "recién";

        if (diffSec < 10) return "recién";
        if (diffSec < 60) return `hace ${diffSec}s`;

        const min = Math.floor(diffSec / 60);
        if (min < 60) return `hace ${min} min`;

        const h = Math.floor(min / 60);
        if (h < 24) return `hace ${h} h`;

        const d = Math.floor(h / 24);
        return `hace ${d} d`;
    }

    function shortId(id: string) {
        if (!id) return "";
        if (id.length <= 22) return id;
        return `${id.slice(0, 10)}…${id.slice(-10)}`;
    }

    // ---------- auth ----------
    async function login() {
        setNotice(null);

        const r = await fetch("/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: pwd }),
            credentials: "include",
            cache: "no-store",
        });

        if (!r.ok) {
            setNotice({ kind: "error", title: "Clave incorrecta", detail: "Intenta otra vez." });
            return;
        }

        setAuthed(true);
        setPwd("");
        setNotice({ kind: "success", title: "Listo", detail: "Ya puedes subir fotos." });
        await refreshLatest();
    }

    function logout() {
        setAuthed(false);
        setPwd("");
        setNotice(null);
        setSessionUploads([]);
        setGalleryLatest([]);
        setServicesLatest([]);
        setConfirmDelete(null);
    }

    function clearSessionUploads() {
        setSessionUploads([]);
        setNotice({
            kind: "info",
            title: "Sesión limpiada",
            detail: "Se vació la lista local (no borra en Cloudinary).",
        });
    }

    // ---------- data ----------
    async function refreshLatest() {
        setLoadingLatest(true);
        setNotice(null);

        try {
            const [rg, rs] = await Promise.all([
                fetch("/api/admin/media?type=gallery", { credentials: "include", cache: "no-store" }),
                fetch("/api/admin/media?type=services", { credentials: "include", cache: "no-store" }),
            ]);

            if (!rg.ok) throw new Error(`gallery ${rg.status}`);
            if (!rs.ok) throw new Error(`services ${rs.status}`);

            const [g, s] = await Promise.all([rg.json(), rs.json()]);
            setGalleryLatest(g.images || []);
            setServicesLatest(s.images || []);
        } catch (e: any) {
            setNotice({
                kind: "error",
                title: "No se pudo actualizar",
                detail: e?.message || "Revisa el log de Vercel o consola.",
            });
        } finally {
            setLoadingLatest(false);
        }
    }

    async function deleteByPublicId(publicId: string) {
        setDeleting(true);
        setNotice(null);

        try {
            const r = await fetch("/api/admin/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ publicId }),
                credentials: "include",
                cache: "no-store",
            });

            if (!r.ok) {
                const data = await r.json().catch(() => ({}));
                setNotice({
                    kind: "error",
                    title: "No se pudo eliminar",
                    detail: data?.message || `HTTP ${r.status}`,
                });
                return;
            }

            setSessionUploads((prev) => prev.filter((x) => x.publicId !== publicId));
            setGalleryLatest((prev) => prev.filter((x) => x.publicId !== publicId));
            setServicesLatest((prev) => prev.filter((x) => x.publicId !== publicId));

            setNotice({ kind: "success", title: "Eliminada", detail: "Puedes subir otra." });
        } catch (e: any) {
            setNotice({ kind: "error", title: "Error eliminando", detail: e?.message || "Mira consola." });
        } finally {
            setDeleting(false);
            setConfirmDelete(null);
        }
    }

    function requestDelete(input: { publicId: string; src?: string; contextLabel?: string }) {
        setConfirmDelete({
            publicId: input.publicId,
            src: input.src,
            contextLabel: input.contextLabel,
        });
    }

    // ---------- uploader ----------
    function openUploader(type: "gallery" | "services") {
        setNotice(null);

        if (!cloudName) {
            setNotice({
                kind: "error",
                title: "Faltan variables",
                detail: "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME no está en .env / Vercel.",
            });
            return;
        }

        const uploadPreset = type === "gallery" ? presetGallery : presetServices;
        if (!uploadPreset) {
            setNotice({
                kind: "error",
                title: "Falta preset",
                detail:
                    type === "gallery"
                        ? "NEXT_PUBLIC_CLOUDINARY_GALLERY_PRESET no está seteado."
                        : "NEXT_PUBLIC_CLOUDINARY_SERVICES_PRESET no está seteado.",
            });
            return;
        }

        if (!window.cloudinary) {
            setNotice({
                kind: "error",
                title: "No cargó el widget",
                detail: "Revisa que el Script del widget esté en layout.tsx.",
            });
            return;
        }

        const isGallery = type === "gallery";
        const folder = isGallery ? "caroline/galeria" : "caroline/servicios";

        const options: any = {
            cloudName,
            uploadPreset,
            folder,

            multiple: !isGallery,
            maxFiles: isGallery ? 1 : 30,

            sources: ["local", "camera", "google_drive"],
            clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
            cropping: false,
            showAdvancedOptions: false,
            resourceType: "image",

            showCompletedButton: true,
            singleUploadAutoClose: isGallery,

            tags: isGallery ? ["gallery"] : ["services", `service_${selectedServiceId}`],
            context: isGallery ? { album: "gallery" } : { album: "services", service: selectedServiceId },
        };

        if (!isGallery) options.public_id_prefix = `${selectedServiceId}-`;

        const widget = window.cloudinary.createUploadWidget(options, async (error: any, result: any) => {
            if (error) {
                console.error("CLOUDINARY ERROR:", error);
                setNotice({
                    kind: "error",
                    title: "Error subiendo",
                    detail: error?.message || "Mira consola.",
                });
                return;
            }

            if (result?.event === "success") {
                const info = result.info || {};
                const publicId = String(info.public_id || "");
                const src = String(info.secure_url || "");
                const createdAt = String(info.created_at || new Date().toISOString());

                setSessionUploads((prev) =>
                    [
                        {
                            publicId,
                            src,
                            type,
                            serviceId: type === "services" ? selectedServiceId : undefined,
                            createdAt,
                        },
                        ...prev,
                    ].slice(0, 24)
                );

                setNotice({
                    kind: "success",
                    title: "Subida OK",
                    detail: type === "services" ? `Se subió a Servicios (${selectedTitle}).` : "Se subió a Galería.",
                });

                await refreshLatest();
            }
        });

        widget.open();
    }

    // ---------- UI components ----------
    function SkeletonCard() {
        return (
            <div className="rounded-2xl border bg-white overflow-hidden shadow-sm">
                <div className="aspect-square bg-black/5 animate-pulse" />
                <div className="p-3">
                    <div className="h-3 w-3/4 bg-black/5 rounded animate-pulse" />
                    <div className="mt-3 h-8 w-full bg-black/5 rounded-xl animate-pulse" />
                </div>
            </div>
        );
    }

    function MediaCard({
        src,
        publicId,
        badge,
        timeAgo,
        onDelete,
    }: {
        src: string;
        publicId: string;
        badge: { label: string; cls: string };
        timeAgo?: string;
        onDelete: () => void;
    }) {
        return (
            <div className="group rounded-2xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="relative aspect-square bg-black/5">
                    <img
                        src={src}
                        alt={publicId}
                        className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform"
                        loading="lazy"
                    />

                    <div className={`absolute left-2 top-2 text-[11px] font-bold px-2 py-1 rounded-full ${badge.cls}`}>
                        {badge.label}
                    </div>

                    {timeAgo ? (
                        <div className="absolute right-2 top-2 text-[11px] font-bold px-2 py-1 rounded-full bg-white/90 text-black">
                            {timeAgo}
                        </div>
                    ) : null}

                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="p-3">
                    <p className="text-xs text-[#89616f] truncate" title={publicId}>
                        {publicId}
                    </p>

                    <button
                        onClick={onDelete}
                        className="mt-3 w-full rounded-xl border py-2 text-xs font-bold hover:bg-black/5 active:scale-[0.99] transition"
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        );
    }

    function ConfirmDeleteModal({ state }: { state: ConfirmDeleteState }) {
        if (!state) return null;

        return (
            <div className="fixed inset-0 z-50">
                {/* backdrop */}
                <div
                    className="absolute inset-0 bg-black/40"
                    onClick={() => (deleting ? null : setConfirmDelete(null))}
                />

                {/* dialog */}
                <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-2xl border bg-white shadow-lg overflow-hidden">
                        <div className="p-5 border-b bg-[#fdfafb]">
                            <p className="font-black text-lg">Confirmar eliminación</p>
                            <p className="text-sm text-[#89616f] mt-1">
                                Esto borra la imagen de Cloudinary. No hay “deshacer” mágico.
                            </p>
                        </div>

                        <div className="p-5">
                            <div className="flex gap-4">
                                <div className="h-20 w-20 rounded-2xl overflow-hidden bg-black/5 border">
                                    {state.src ? <img src={state.src} alt={state.publicId} className="h-full w-full object-cover" /> : null}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold">{state.contextLabel || "Imagen"}</p>
                                    <p className="text-xs text-[#89616f] mt-1 truncate" title={state.publicId}>
                                        {state.publicId}
                                    </p>
                                    <p className="text-xs text-[#89616f] mt-1">
                                        ID corto: <span className="font-mono">{shortId(state.publicId)}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 flex gap-2">
                                <button
                                    onClick={() => setConfirmDelete(null)}
                                    disabled={deleting}
                                    className="flex-1 rounded-xl border py-3 text-sm font-bold hover:bg-black/5 disabled:opacity-60"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => deleteByPublicId(state.publicId)}
                                    disabled={deleting}
                                    className="flex-1 rounded-xl bg-black text-white py-3 text-sm font-bold hover:opacity-90 disabled:opacity-60"
                                >
                                    {deleting ? "Eliminando..." : "Sí, eliminar"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ---------- UI ----------
    if (!authed) {
        return (
            <main className="min-h-screen flex items-center justify-center p-6 bg-[#fdfafb]">
                <div className="w-full max-w-md rounded-2xl border p-6 bg-white shadow-sm">
                    <h1 className="text-xl font-bold mb-2">Admin Caroline Trenzas</h1>
                    <p className="text-sm text-[#89616f] mb-4">Ingresa la clave para subir fotos.</p>

                    <input
                        type="password"
                        value={pwd}
                        onChange={(e) => setPwd(e.target.value)}
                        className="w-full border rounded-xl px-4 py-3 mb-3"
                        placeholder="Clave"
                    />

                    <button onClick={login} className="w-full rounded-xl bg-primary text-white font-bold py-3">
                        Entrar
                    </button>

                    {notice ? (
                        <div className="mt-4 rounded-xl border p-4">
                            <p className="font-bold">
                                {notice.kind === "error" ? "❌ " : notice.kind === "success" ? "✅ " : "ℹ️ "}
                                {notice.title}
                            </p>
                            {notice.detail ? <p className="text-sm text-[#89616f] mt-1">{notice.detail}</p> : null}
                        </div>
                    ) : null}
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen p-6 lg:p-12 bg-[#fdfafb]">
            <ConfirmDeleteModal state={confirmDelete} />

            <div className="max-w-5xl mx-auto bg-white border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black mb-1">Subir fotos</h1>
                        <p className="text-sm text-[#89616f]">
                            Sube, revisa y elimina si te equivocaste. Sin tener que mendigar en Cloudinary.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={refreshLatest}
                            className="rounded-full border px-4 py-2 text-sm font-bold hover:bg-black/5"
                            disabled={loadingLatest}
                        >
                            {loadingLatest ? "Actualizando..." : "Actualizar"}
                        </button>
                        <button onClick={logout} className="rounded-full border px-4 py-2 text-sm font-bold hover:bg-black/5">
                            Salir
                        </button>
                    </div>
                </div>

                <div className="mt-6 rounded-2xl border bg-[#fdfafb] p-4">
                    <p className="font-bold text-[#181113]">👇 En Servicios: primero elige el servicio, después sube fotos.</p>
                </div>

                {/* ACCIONES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="rounded-2xl border p-6">
                        <p className="font-bold">📸 Galería</p>
                        <p className="text-sm text-[#89616f] mt-1">Sube 1 foto por vez (para evitar duplicados por accidente).</p>

                        <button
                            onClick={() => openUploader("gallery")}
                            className="mt-4 w-full rounded-xl bg-primary text-white font-bold py-3"
                        >
                            Subir 1 foto a Galería
                        </button>
                    </div>

                    <div className="rounded-2xl border p-6">
                        <p className="font-bold">✨ Servicios</p>
                        <p className="text-sm text-[#89616f] mt-1">Estas fotos se asocian al servicio por el prefijo del nombre.</p>

                        <label className="block text-xs font-semibold text-[#89616f] mt-4 mb-2">
                            Servicio al que pertenece la foto
                        </label>

                        <select
                            value={selectedServiceId}
                            onChange={(e) => setSelectedServiceId(e.target.value)}
                            className="w-full rounded-xl border px-4 py-3 text-sm"
                        >
                            {SERVICES.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.title}
                                </option>
                            ))}
                        </select>

                        <button
                            onClick={() => openUploader("services")}
                            className="mt-4 w-full rounded-xl bg-primary text-white font-bold py-3"
                        >
                            Subir fotos de {selectedTitle}
                        </button>

                        <p className="mt-3 text-xs text-[#89616f]">
                            Quedan como <span className="font-mono">{selectedServiceId}-xxxxx</span>.
                        </p>
                    </div>
                </div>

                {/* NOTIFICATION */}
                {notice ? (
                    <div className="mt-6 rounded-2xl border p-5 bg-[#fdfafb]">
                        <p className="font-bold">
                            {notice.kind === "error" ? "❌ " : notice.kind === "success" ? "✅ " : "ℹ️ "}
                            {notice.title}
                        </p>
                        {notice.detail ? <p className="text-sm text-[#89616f] mt-1">{notice.detail}</p> : null}
                    </div>
                ) : null}

                {/* SUBIDAS DE LA SESIÓN */}
                <div className="mt-10">
                    <div className="flex items-end justify-between gap-3 mb-4">
                        <div>
                            <h2 className="text-lg font-bold">Subidas de esta sesión</h2>
                            <p className="text-sm text-[#89616f]">
                                {sessionUploads.length === 0
                                    ? "Lo que subas aquí aparece al tiro. Útil para deshacer sin entrar a Cloudinary."
                                    : `Tienes ${sessionUploads.length} subida(s) en esta sesión.`}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            {sessionUploads.length > 0 ? (
                                <button
                                    onClick={clearSessionUploads}
                                    className="rounded-full border px-4 py-2 text-sm font-bold hover:bg-black/5"
                                    title="Vacía la lista local (no borra en Cloudinary)"
                                >
                                    Limpiar sesión
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {sessionUploads.length === 0 ? (
                        <div className="rounded-2xl border bg-[#fdfafb] p-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-black/5 flex items-center justify-center">📦</div>
                                <div>
                                    <p className="font-bold">Sin subidas aún</p>
                                    <p className="text-sm text-[#89616f]">Cuando subas algo, saldrá aquí con botón de eliminar rápido.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {sessionUploads.map((img) => {
                                const badge =
                                    img.type === "gallery"
                                        ? { label: "Galería", cls: "bg-white/90 text-black" }
                                        : { label: `Servicio: ${img.serviceId}`, cls: "bg-black/80 text-white" };

                                return (
                                    <MediaCard
                                        key={img.publicId}
                                        src={img.src}
                                        publicId={img.publicId}
                                        badge={badge}
                                        timeAgo={formatTimeAgo(img.createdAt)}
                                        onDelete={() =>
                                            requestDelete({
                                                publicId: img.publicId,
                                                src: img.src,
                                                contextLabel: img.type === "gallery" ? "Galería" : `Servicio: ${img.serviceId}`,
                                            })
                                        }
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ÚLTIMAS DESDE CLOUDINARY */}
                <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Galería */}
                    <div className="rounded-2xl border p-5">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold">Últimas en Galería</h3>
                            <span className="text-xs text-[#89616f]">{galleryLatest.length} fotos</span>
                        </div>

                        {loadingLatest ? (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <SkeletonCard key={i} />
                                ))}
                            </div>
                        ) : galleryLatest.length === 0 ? (
                            <div className="mt-3 rounded-xl border bg-[#fdfafb] p-4 text-sm text-[#89616f]">No hay fotos todavía.</div>
                        ) : (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {galleryLatest.slice(0, 12).map((img) => (
                                    <MediaCard
                                        key={img.publicId}
                                        src={img.src}
                                        publicId={img.publicId}
                                        badge={{ label: "Galería", cls: "bg-white/90 text-black" }}
                                        timeAgo={formatTimeAgo(img.createdAt)}
                                        onDelete={() =>
                                            requestDelete({
                                                publicId: img.publicId,
                                                src: img.src,
                                                contextLabel: "Galería",
                                            })
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Servicios */}
                    <div className="rounded-2xl border p-5">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold">Últimas en Servicios</h3>
                            <span className="text-xs text-[#89616f]">{servicesLatest.length} fotos</span>
                        </div>

                        {loadingLatest ? (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <SkeletonCard key={i} />
                                ))}
                            </div>
                        ) : servicesLatest.length === 0 ? (
                            <div className="mt-3 rounded-xl border bg-[#fdfafb] p-4 text-sm text-[#89616f]">
                                No hay fotos todavía.
                            </div>
                        ) : (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {servicesLatest.slice(0, 12).map((img) => (
                                    <MediaCard
                                        key={img.publicId}
                                        src={img.src}
                                        publicId={img.publicId}
                                        badge={{ label: "Servicios", cls: "bg-black/80 text-white" }}
                                        timeAgo={formatTimeAgo(img.createdAt)}
                                        onDelete={() =>
                                            requestDelete({
                                                publicId: img.publicId,
                                                src: img.src,
                                                contextLabel: "Servicios",
                                            })
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
