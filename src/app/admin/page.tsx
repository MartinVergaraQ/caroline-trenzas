"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import AdminShell from "@/components/admin/AdminShell";
import BeforeAfterEditorView from "@/components/admin/BeforeAfterEditorView";
import DashboardView from "@/components/admin/DashboardView";
import TestimonialsModerationView from "@/components/admin/TestimonialsModerationView";
import GalleryView from "@/components/admin/GalleryView";
import ServicesView from "@/components/admin/ServicesView";
import SettingsView from "@/components/admin/SettingsView";

declare global {
    interface Window {
        cloudinary: any;
    }
}

const SERVICES = [
    { id: "cornrows", title: "Cornrows" },
    { id: "boxer", title: "Boxeadoras" },
    { id: "peinados", title: "Peinados" },
    { id: "rulos", title: "Rulos" },
    { id: "custom", title: "Diseños Personalizados" },
];

type UploadedItem = {
    publicId: string;
    src: string;
    type: "gallery" | "services";
    mediaType?: "image" | "video";
    serviceId?: string;
    createdAt?: string;
};

type MediaItem = {
    publicId: string;
    src: string;
    createdAt: string;
    bytes: number;
    width: number;
    height: number;
    mediaType?: "image" | "video";
};

type ConfirmDeleteState = null | {
    publicId: string;
    src?: string;
    mediaType?: "image" | "video";
    contextLabel?: string;
};
type ToastKind = "success" | "error" | "info";

type Toast = {
    id: string;
    kind: ToastKind;
    title: string;
    detail?: string;
};

type UploadingKind = null | "gallery" | "services" | "reel" | "video";

type PendingTestimonial = {
    id: string;
    name: string;
    comuna: string;
    stars: number;
    text: string;
    createdAt: string;
};

type BAEntry = {
    serviceId: string;
    title: string;
    before?: { publicId: string; src: string };
    after?: { publicId: string; src: string };
    updatedAt?: string;
};

type AdminView = "dashboard" | "gallery" | "services" | "beforeafter" | "testimonials" | "settings";

type PasskeyStatus = "idle" | "checking" | "ready" | "working" | "ok" | "fail";

export default function AdminPage() {
    const [authed, setAuthed] = useState(false);
    const [pwd, setPwd] = useState("");
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
    const presetGalleryVideo = process.env.NEXT_PUBLIC_CLOUDINARY_GALLERY_VIDEO_PRESET || "";

    const [uploading, setUploading] = useState<UploadingKind>(null);
    const isUploading = uploading !== null;
    const galleryVideos = galleryLatest.filter(x => (x.mediaType ?? "image") === "video").length;
    const galleryImages = galleryLatest.length - galleryVideos;
    const [loadingLogin, setLoadingLogin] = useState(false);
    const [showPwd, setShowPwd] = useState(false);
    const [canPasskey, setCanPasskey] = useState<boolean | null>(null);
    const [loadingPasskey, setLoadingPasskey] = useState(false);
    const [hasPasskey, setHasPasskey] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const uploadTimeoutRef = useRef<number | null>(null);
    const [uploadStartedAt, setUploadStartedAt] = useState<number | null>(null);
    const canReset = isUploading && uploadStartedAt && Date.now() - uploadStartedAt > 20000;
    const disableServicesButton = uploading !== null && uploading !== "services";
    const [pending, setPending] = useState<PendingTestimonial[]>([]);
    const [approved, setApproved] = useState<PendingTestimonial[]>([]);
    const [loadingT, setLoadingT] = useState(false);
    const [openT, setOpenT] = useState(false);
    const closeTestimonials = useCallback(() => setOpenT(false), []);
    const [ba, setBa] = useState<BAEntry[]>([]);
    const [loadingBA, setLoadingBA] = useState(false);
    const [openBA, setOpenBA] = useState(false);
    const [view, setView] = useState<AdminView>("dashboard");
    const [qGallery, setQGallery] = useState("");
    const [qServices, setQServices] = useState("");
    const [qGlobal, setQGlobal] = useState(""); // opcional, para dashboard/otros
    const [passkeyStatus, setPasskeyStatus] = useState<PasskeyStatus>("checking");
    const resetPasskeyTimer = useRef<number | null>(null);

    const viewMeta = useMemo(() => {
        const user = { name: "Caroline T.", email: "caroline@trenzas.com" };

        if (view === "gallery") {
            return {
                active: "gallery" as const,
                title: "Galería",
                titleIcon: "image",
                subtitle: `${galleryImages} fotos · ${galleryVideos} videos`,
                search: { value: qGallery, onChange: setQGallery, placeholder: "Buscar en galería..." },
                rightActions: (
                    <>
                        <button
                            type="button"
                            onClick={refreshLatest}
                            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-primary/20 rounded-full text-sm font-bold text-slate-700 shadow-sm hover:shadow-md transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[20px]">refresh</span>
                            {loadingLatest ? "Actualizando..." : "Actualizar"}
                        </button>

                        <button
                            type="button"
                            onClick={() => openUploader("gallery")}
                            className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
                        >
                            <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
                            <span className="hidden sm:inline">Subir Foto</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => openVideoUploader(true)}
                            className="bg-white border border-primary/20 hover:border-primary text-primary px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-all"
                        >
                            <span className="material-symbols-outlined text-[20px]">movie</span>
                            <span className="hidden sm:inline">Subir Reel</span>
                        </button>

                        <button
                            type="button"
                            className="ml-1 size-10 rounded-full bg-background-light border border-primary/10 flex items-center justify-center text-slate-600 relative"
                            aria-label="Notificaciones"
                        >
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-2 right-2 size-2 bg-primary rounded-full" />
                        </button>
                    </>
                ),
                user,
            };
        }

        if (view === "services") {
            return {
                active: "services" as const,
                title: "Servicios",
                titleIcon: "brush",
                subtitle: "Gestión de Galería",
                search: { value: qServices, onChange: setQServices, placeholder: "Buscar fotos o estilos..." },
                rightActions: (
                    <>
                        <button
                            type="button"
                            className="size-10 rounded-full bg-background-light border border-primary/10 flex items-center justify-center text-slate-600 relative"
                            aria-label="Notificaciones"
                        >
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-2 right-2 size-2 bg-primary rounded-full" />
                        </button>

                        <button
                            type="button"
                            onClick={refreshLatest}
                            className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-primary/25 hover:scale-[1.03] transition-transform"
                        >
                            Actualizar
                        </button>
                    </>
                ),
                user,
            };
        }

        if (view === "settings") {
            return {
                active: "settings" as const,
                title: "Ajustes",
                titleIcon: "settings",
                subtitle: "Configuración del acceso y sesión",
                search: { value: qGlobal, onChange: setQGlobal, placeholder: "Buscar..." },
                rightActions: (
                    <>
                        <button
                            type="button"
                            className="size-10 rounded-full bg-background-light border border-primary/10 flex items-center justify-center text-slate-600"
                            aria-label="Notificaciones"
                        >
                            <span className="material-symbols-outlined">notifications</span>
                        </button>
                        <div className="size-10 rounded-full bg-primary/20 border border-primary/20" />
                    </>
                ),
                user,
            };
        }

        // default
        return {
            active:
                view === "dashboard" ? ("dashboard" as const)
                    : view === "beforeafter" ? ("beforeAfter" as const)
                        : ("testimonials" as const),
            title:
                view === "dashboard" ? "Panel de Control"
                    : view === "beforeafter" ? "Antes/Después"
                        : "Moderación",
            titleIcon:
                view === "dashboard" ? "dashboard"
                    : view === "beforeafter" ? "compare"
                        : "chat_bubble",
            subtitle: undefined,
            search: { value: qGlobal, onChange: setQGlobal, placeholder: "Buscar..." },
            rightActions: (
                <button
                    type="button"
                    className="size-10 rounded-full bg-background-light border border-primary/10 flex items-center justify-center text-slate-600"
                    aria-label="Notificaciones"
                >
                    <span className="material-symbols-outlined">notifications</span>
                </button>
            ),
            user,
        };
    }, [view, qGallery, qServices, qGlobal, galleryImages, galleryVideos, loadingLatest]);

    function resetPasskeyStatus(delay = 2200) {
        if (resetPasskeyTimer.current) window.clearTimeout(resetPasskeyTimer.current);
        resetPasskeyTimer.current = window.setTimeout(() => setPasskeyStatus("ready"), delay);
    }

    useEffect(() => {
        return () => {
            if (resetPasskeyTimer.current) window.clearTimeout(resetPasskeyTimer.current);
        };
    }, []);

    async function loadBeforeAfter() {
        setLoadingBA(true);
        try {
            const r = await fetch("/api/admin/before-after", { credentials: "include", cache: "no-store" });
            const d = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(d?.message || `HTTP ${r.status}`);
            setBa(d.items || []);
        } catch (e: any) {
            pushToast("error", "No se pudo cargar Antes/Después", e?.message || "Mira consola.");
        } finally {
            setLoadingBA(false);
        }
    }

    function TestimonialsModal({
        open,
        onClose,
        pending,
        approved,
        loading,
        onRefresh,
        onApprove,
        onReject,
    }: {
        open: boolean;
        onClose: () => void;
        pending: PendingTestimonial[];
        approved: PendingTestimonial[];
        loading: boolean;
        onRefresh: () => void;
        onApprove: (id: string) => void;
        onReject: (id: string) => void;
    }) {
        // Bloquea scroll body (solo cuando modal abierto)
        useEffect(() => {
            if (!open) return;
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = prev;
            };
        }, [open]);

        // Escape para cerrar
        useEffect(() => {
            if (!open) return;
            const onKeyDown = (e: KeyboardEvent) => {
                if (e.key === "Escape") onClose();
            };
            window.addEventListener("keydown", onKeyDown);
            return () => window.removeEventListener("keydown", onKeyDown);
        }, [open, onClose]);

        if (!open) return null;

        return (
            <div className="fixed inset-0 z-[9999]">
                <div className="absolute inset-0 bg-black/40" onClick={onClose} />

                <div className="absolute inset-0 flex items-start justify-center p-4 pt-10 md:items-center md:pt-4">
                    <div
                        className="w-full max-w-3xl rounded-2xl border bg-white shadow-lg overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Testimonios"
                    >
                        <div className="p-5 border-b bg-[#fdfafb] flex items-center justify-between">
                            <div>
                                <p className="font-black text-lg">Testimonios</p>
                                <p className="text-sm text-[#89616f]">
                                    Pendientes: {pending.length} · Publicados: {approved.length}/3
                                </p>
                            </div>

                            <button
                                className="rounded-full size-10 hover:bg-black/5 flex items-center justify-center"
                                onClick={onClose}
                                aria-label="Cerrar"
                                type="button"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-5 max-h-[75vh] overflow-auto space-y-8">
                            {/* Pendientes */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="font-bold">Pendientes</p>
                                    <button
                                        type="button"
                                        onClick={onRefresh}
                                        disabled={loading}
                                        className="rounded-full border px-3 py-1.5 text-xs font-bold hover:bg-black/5 disabled:opacity-60"
                                    >
                                        {loading ? "Actualizando..." : "Actualizar"}
                                    </button>
                                </div>

                                {pending.length === 0 ? (
                                    <div className="rounded-xl border bg-[#fdfafb] p-4 text-sm text-[#89616f]">
                                        No hay testimonios pendientes.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {pending.map((t) => (
                                            <div key={t.id} className="rounded-2xl border bg-[#fdfafb] p-4">
                                                <p className="font-bold text-[#181113]">
                                                    {t.name}{" "}
                                                    <span className="text-sm text-[#89616f] font-medium">· {t.comuna}</span>
                                                </p>

                                                <p className="text-yellow-600 text-sm">
                                                    {"★★★★★".slice(0, t.stars)}{" "}
                                                    <span className="text-black/10">{"★★★★★".slice(0, 5 - t.stars)}</span>
                                                </p>

                                                <p className="mt-2 text-sm text-[#181113]">“{t.text}”</p>
                                                <p className="mt-2 text-xs text-[#89616f]">
                                                    {new Date(t.createdAt).toLocaleString()}
                                                </p>

                                                <div className="mt-3 flex gap-2">
                                                    <button
                                                        className="rounded-xl bg-primary text-white px-4 py-2 text-sm font-bold hover:bg-primary/90 disabled:opacity-50"
                                                        onClick={() => onApprove(t.id)}
                                                        disabled={approved.length >= 3}
                                                        title={approved.length >= 3 ? "Ya hay 3 publicados. Rechaza uno primero." : ""}
                                                        type="button"
                                                    >
                                                        Aprobar
                                                    </button>

                                                    <button
                                                        className="rounded-xl border px-4 py-2 text-sm font-bold hover:bg-black/5"
                                                        onClick={() => onReject(t.id)}
                                                        type="button"
                                                    >
                                                        Rechazar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Publicados */}
                            <div>
                                <p className="font-bold mb-3">Publicados (máx 3)</p>

                                {approved.length === 0 ? (
                                    <div className="rounded-xl border bg-[#fdfafb] p-4 text-sm text-[#89616f]">
                                        No hay testimonios publicados.
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {approved.map((t) => (
                                            <div key={t.id} className="rounded-2xl border bg-white p-4">
                                                <p className="font-bold text-[#181113]">{t.name}</p>
                                                <p className="text-xs text-[#89616f]">{t.comuna}</p>
                                                <p className="text-yellow-600 text-sm mt-1">{"★★★★★".slice(0, t.stars)}</p>
                                                <p className="text-sm text-[#181113] mt-2 line-clamp-4">“{t.text}”</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t bg-white flex justify-end">
                            <button
                                className="rounded-xl border px-4 py-2 text-sm font-bold hover:bg-black/5"
                                onClick={onClose}
                                type="button"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    async function loadTestimonialsAdmin() {
        setLoadingT(true);
        try {
            const r = await fetch("/api/admin/testimonials", { credentials: "include", cache: "no-store" });
            const d = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(d?.message || `HTTP ${r.status}`);
            setPending(d.pending || []);
            setApproved(d.approved || []);
            // NO abrir automático
            // setOpenT((prev) => (d.pending?.length ? true : prev));
        } catch (e: any) {
            pushToast("error", "No se pudieron cargar testimonios", e?.message || "Mira consola.");
        } finally {
            setLoadingT(false);
        }
    }

    async function approveTestimonial(id: string) {
        try {
            const r = await fetch("/api/admin/testimonials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                cache: "no-store",
                body: JSON.stringify({ id }),
            });
            const d = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(d?.message || `HTTP ${r.status}`);
            pushToast("success", "Aprobado", "Ya está en la landing (máx 3).");
            await loadTestimonialsAdmin();
        } catch (e: any) {
            pushToast("error", "No se pudo aprobar", e?.message || "Mira consola.");
        }
    }

    async function rejectTestimonial(id: string) {
        try {
            const r = await fetch(`/api/admin/testimonials?id=${encodeURIComponent(id)}`, {
                method: "DELETE",
                credentials: "include",
                cache: "no-store",
            });
            const d = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(d?.message || `HTTP ${r.status}`);
            pushToast("success", "Eliminado", "Se quitó de pendientes.");
            await loadTestimonialsAdmin();
        } catch (e: any) {
            pushToast("error", "No se pudo eliminar", e?.message || "Mira consola.");
        }
    }
    function pushToast(kind: ToastKind, title: string, detail?: string) {
        const id = (globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random()));
        setToasts((prev) => [{ id, kind, title, detail }, ...prev].slice(0, 4));
        window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), kind === "error" ? 6000 : 3200);
    }

    function ToastStack() {
        return (
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]">
                {toasts.map((t) => {
                    const styles =
                        t.kind === "success"
                            ? "border-green-200 bg-green-50"
                            : t.kind === "error"
                                ? "border-red-200 bg-red-50"
                                : "border-[#f4f0f2] bg-white";

                    const icon = t.kind === "success" ? "✅" : t.kind === "error" ? "❌" : "ℹ️";

                    return (
                        <div key={t.id} className={`rounded-2xl border shadow-sm p-4 ${styles}`}>
                            <div className="flex items-start gap-3">
                                <div className="text-lg leading-none mt-[2px]">{icon}</div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-[#181113]">{t.title}</p>
                                    {t.detail ? <p className="text-sm text-[#89616f] mt-1 break-words">{t.detail}</p> : null}
                                </div>
                                <button
                                    onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                                    className="ml-2 rounded-full size-8 hover:bg-black/5 flex items-center justify-center"
                                    aria-label="Cerrar"
                                >
                                    <span className="material-symbols-outlined text-xl text-[#89616f]">close</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    useEffect(() => {
        return () => {
            if (uploadTimeoutRef.current) window.clearTimeout(uploadTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        let alive = true;

        fetch("/api/admin/me", { credentials: "include", cache: "no-store" })
            .then((r) => (r.ok ? r.json() : { ok: false }))
            .then(async (data) => {
                if (!alive) return;
                if (data?.ok) {
                    setAuthed(true);
                    await refreshLatest();
                    await loadTestimonialsAdmin();
                    await loadBeforeAfter();
                }
            })
            .catch(() => { });

        // 2) hay passkey registrada en el server
        fetch("/api/admin/webauthn/status", { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : { hasPasskey: false }))
            .then((d) => alive && setHasPasskey(!!d?.hasPasskey))
            .catch(() => alive && setHasPasskey(false));
        // 3) este dispositivo soporta passkeys?
        (async () => {
            try {
                if (
                    !window.PublicKeyCredential ||
                    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== "function"
                ) {
                    if (alive) setCanPasskey(false);
                    return;
                }
                const ok = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                if (alive) setCanPasskey(!!ok);
            } catch (e) {
                console.error("canPasskey check failed", e);
                if (alive) setCanPasskey(false);
            }
        })();

        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (canPasskey === null) {
            setPasskeyStatus("checking");
            return;
        }
        if (!canPasskey || !hasPasskey) {
            setPasskeyStatus("fail");
            return;
        }
        setPasskeyStatus("ready");
    }, [canPasskey, hasPasskey]);

    function startUpload(kind: UploadingKind) {
        setUploading(kind);
        setUploadStartedAt(Date.now());
        if (uploadTimeoutRef.current) window.clearTimeout(uploadTimeoutRef.current);

        uploadTimeoutRef.current = window.setTimeout(() => {
            setUploading((cur) => (cur === kind ? null : cur));
            uploadTimeoutRef.current = null;
        }, 10 * 60 * 1000);
    }

    function stopUpload(kind?: UploadingKind) {
        setUploading((cur) => (kind && cur !== kind ? cur : null));
        setUploadStartedAt(null);
        if (uploadTimeoutRef.current) {
            window.clearTimeout(uploadTimeoutRef.current);
            uploadTimeoutRef.current = null;
        }
    }

    const selectedTitle = useMemo(
        () => SERVICES.find((x) => x.id === selectedServiceId)?.title || "Servicio",
        [selectedServiceId]
    );

    const uploadingLabel = useMemo(() => {
        if (uploading === "gallery") return "Subiendo foto a Galería…";
        if (uploading === "services") return `Subiendo fotos de ${selectedTitle}…`;
        if (uploading === "reel") return "Subiendo Reel…";
        if (uploading === "video") return "Subiendo video…";
        return "";
    }, [uploading, selectedTitle]);

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
        setLoadingLogin(true);

        try {
            const r = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: pwd }),
                credentials: "include",
                cache: "no-store",
            });

            const data = await r.json().catch(() => ({}));

            if (!r.ok) {
                pushToast("error", data?.message || "No se pudo entrar", r.status === 429 ? "Demasiados intentos. Espera un rato." : "Intenta otra vez.");
                return;
            }

            setAuthed(true);
            setPwd("");
            pushToast("success", "Listo", "Ya puedes subir fotos");
            await refreshLatest();
        } finally {
            setLoadingLogin(false);
        }
    }

    async function logout() {
        try {
            await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
        } catch { }

        setAuthed(false);
        setPwd("");
        setSessionUploads([]);
        setGalleryLatest([]);
        setServicesLatest([]);
        setConfirmDelete(null);
        stopUpload();
        setOpenT(false);
    }

    async function passkeyLogin() {
        setLoadingPasskey(true);
        setPasskeyStatus("working");

        try {
            const or = await fetch("/api/admin/webauthn/login/options", {
                cache: "no-store",
                credentials: "include",
            });

            const opts = await or.json().catch(() => ({}));
            if (!or.ok) throw new Error(opts?.message || `HTTP ${or.status}`);

            const cred = await startAuthentication(opts);

            const vr = await fetch("/api/admin/webauthn/login/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cred),
                credentials: "include",
                cache: "no-store",
            });

            const data = await vr.json().catch(() => ({}));
            if (!vr.ok) throw new Error(data?.message || `HTTP ${vr.status}`);

            setPasskeyStatus("ok");
            setAuthed(true);
            pushToast("success", "Listo", "Entraste con Face ID / Huella.");
            await refreshLatest();
        } catch (e: any) {
            console.error("PASSKEY LOGIN ERROR", e);
            setPasskeyStatus("fail");
            pushToast("error", "Falló Face ID", e?.message || "Intenta otra vez.");
            resetPasskeyStatus(); // vuelve a "ready" después de un rato
        } finally {
            setLoadingPasskey(false);
        }
    }

    async function passkeyRegister() {
        setLoadingPasskey(true);

        try {
            const ro = await fetch("/api/admin/webauthn/register/options", {
                cache: "no-store",
                credentials: "include",
            });

            const opts = await ro.json().catch(() => ({}));

            if (!ro.ok) {
                pushToast("error", "No se pudo iniciar el registro", opts?.message || `HTTP ${ro.status} (debes entrar con clave primero)`)
                return;
            }

            const cred = await startRegistration(opts);

            const rv = await fetch("/api/admin/webauthn/register/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cred),
                cache: "no-store",
                credentials: "include",
            });

            const data = await rv.json().catch(() => ({}));

            if (!rv.ok) {
                pushToast("error", "No se pudo registrar",
                    (data?.message || `HTTP ${rv.status}`) +
                    (data?.debug ? ` | debug: ${JSON.stringify(data.debug)}` : ""));
                return;
            }

            setHasPasskey(true);

            const total = data?.afterLen ?? data?.nextLen ?? "?";
            pushToast("success", "Passkey registrada", `Guardada en servidor. Total: ${data?.count ?? "?"}`);

            // opcional pero recomendable: refresca status desde el server
            fetch("/api/admin/webauthn/status", { cache: "no-store" })
                .then((r) => r.json())
                .then((s) => setHasPasskey(!!s?.hasPasskey))
                .catch(() => setHasPasskey(false));

        } catch (e: any) {
            console.error("PASSKEY REGISTER ERROR", e);
            pushToast("error", "No se pudo registrar", `${e?.name || "Error"}: ${e?.message || e}`);
        } finally {
            setLoadingPasskey(false);
        }
    }
    function clearSessionUploads() {
        setSessionUploads([]);
        pushToast("info", "Sesión limpiada", "Se vació la lista local (no borra en Cloudinary).");
    }

    // ---------- data ----------
    async function refreshLatest() {
        setLoadingLatest(true);
        try {
            const [rg, rs] = await Promise.all([
                fetch("/api/admin/media?type=gallery", {
                    credentials: "include",
                    cache: "no-store",
                    headers: { "Cache-Control": "no-store" },
                }),
                fetch("/api/admin/media?type=services", { credentials: "include", cache: "no-store" }),
            ]);

            if (rg.status === 401 || rs.status === 401) {
                setAuthed(false);
                pushToast("error", "Sesión expirada", "Vuelve a entrar con Face ID o clave.");
                return;
            }
            if (!rg.ok) throw new Error(`gallery ${rg.status}`);
            if (!rs.ok) throw new Error(`services ${rs.status}`);

            const [g, s] = await Promise.all([rg.json(), rs.json()]);
            setGalleryLatest(g.images || []);
            setServicesLatest(s.images || []);
        } catch (e: any) {
            pushToast("error", "No se pudo actualizar", e?.message || "Revisa el log de Vercel o consola.");
        } finally {
            setLoadingLatest(false);
        }
    }

    async function deleteByPublicId(publicId: string, resourceType?: "image" | "video") {
        setDeleting(true);
        try {
            const r = await fetch("/api/admin/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ publicId, resourceType }),
                credentials: "include",
                cache: "no-store",
            });

            if (!r.ok) {
                const data = await r.json().catch(() => ({}));
                pushToast("error", "No se pudo eliminar", data?.message || `HTTP ${r.status}`);
                return;
            }

            setSessionUploads((prev) => prev.filter((x) => x.publicId !== publicId));
            setGalleryLatest((prev) => prev.filter((x) => x.publicId !== publicId));
            setServicesLatest((prev) => prev.filter((x) => x.publicId !== publicId));

            pushToast("success", "Eliminada", "Puedes subir otra.");
        } catch (e: any) {
            pushToast("error", "Error eliminando", e?.message || "Mira consola.");
        } finally {
            setDeleting(false);
            setConfirmDelete(null);
        }
    }

    function requestDelete(input: { publicId: string; src?: string; mediaType?: "image" | "video"; contextLabel?: string }) {
        setConfirmDelete({
            publicId: input.publicId,
            src: input.src,
            mediaType: input.mediaType,
            contextLabel: input.contextLabel,
        });
    }

    function openVideoUploader(asReel = false) {
        const kind: UploadingKind = asReel ? "reel" : "video";

        if (isUploading) {
            pushToast("info", "Ya se está subiendo", "Espera a que termine la subida actual.");
            return;
        }
        if (!cloudName) {
            pushToast("error", "Faltan variables", "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME no está en .env / Vercel.");
            return;
        }
        if (!presetGalleryVideo) {
            pushToast("error", "Falta preset de video", "NEXT_PUBLIC_CLOUDINARY_GALLERY_VIDEO_PRESET no está seteado.");
            return;
        }
        if (!window.cloudinary) {
            pushToast("error", "No cargó el widget", "Revisa que el Script del widget esté en layout.tsx.");
            return;
        }

        const options: any = {
            cloudName,
            uploadPreset: presetGalleryVideo,
            folder: "caroline/galeria",
            multiple: true,
            maxFiles: 10,
            sources: ["local", "camera", "google_drive"],
            clientAllowedFormats: ["mp4", "mov", "webm"],
            cropping: false,
            showAdvancedOptions: false,
            resourceType: "video",
            showCompletedButton: true,
            singleUploadAutoClose: false,
            tags: asReel ? ["gallery", "video", "reel"] : ["gallery", "video"],
            context: { album: "gallery", kind: asReel ? "reel" : "video" },
        };

        startUpload(kind);

        let successCount = 0;

        const widget = window.cloudinary.createUploadWidget(options, async (error: any, result: any) => {
            if (error) {
                console.error("CLOUDINARY VIDEO ERROR:", error);
                pushToast("error", "Error subiendo video", error?.message || "Mira consola.");
                stopUpload(kind);
                return;
            }

            if (result?.event === "abort") {
                stopUpload(kind);
                return;
            }

            if (result?.event === "queues-start") {
                pushToast("info", "Subida iniciada", "No cierres la pestaña.");
                return;
            }

            if (result?.event === "success") {
                successCount += 1;

                const info = result.info ?? {};
                const publicId = String(info.public_id ?? "");
                const src = String(info.secure_url ?? "");
                const createdAt = String(info.created_at ?? new Date().toISOString());

                setSessionUploads((prev) => {
                    const next: UploadedItem[] = [
                        { publicId, src, type: "gallery", mediaType: "video", createdAt },
                        ...prev,
                    ];
                    return next.slice(0, 24);
                });

                // NO refreshLatest aquí (si subes 10, no queremos 10 refresh)
                pushToast("success", asReel ? "Reel subido" : "Video subido", "Se subió a Galería.");
                return;
            }

            if (result?.event === "queues-end") {
                if (successCount > 0) await refreshLatest();
                stopUpload(kind);
                pushToast("success", "Listo", `Se subieron ${successCount} video(s).`);
                return;
            }

            if (result?.event === "close") {
                // Si hubo subidas, espera queues-end (a veces llega después)
                if (successCount > 0) return;
                stopUpload(kind);
                return;
            }
        });

        widget.open();
    }
    function getBAFor(serviceId: string) {
        return ba.find((x) => x.serviceId === serviceId);
    }

    async function saveBA(serviceId: string, title: string, slot: "before" | "after", publicId: string, src: string) {
        const r = await fetch("/api/admin/before-after", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            cache: "no-store",
            body: JSON.stringify({ serviceId, title, slot, publicId, src }),
        });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d?.message || `HTTP ${r.status}`);
        setBa(d.items || []);
    }

    async function deleteBA(serviceId: string, slot: "before" | "after") {
        try {
            const r = await fetch(
                `/api/admin/before-after?serviceId=${encodeURIComponent(serviceId)}&slot=${slot}`,
                { method: "DELETE", credentials: "include", cache: "no-store" }
            );
            const d = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(d?.message || `HTTP ${r.status}`);
            setBa(d.items || []);
            pushToast("success", "Eliminado", `Se quitó ${slot === "before" ? "ANTES" : "DESPUÉS"} de la web.`);
        } catch (e: any) {
            pushToast("error", "No se pudo eliminar", e?.message || "Mira consola.");
        }
    }

    function openBAUploader(serviceId: string, title: string, slot: "before" | "after") {
        if (!cloudName) return pushToast("error", "Falta cloudName");
        if (!presetServices) return pushToast("error", "Falta preset", "Usa el mismo preset de imágenes o crea uno nuevo.");
        if (!window.cloudinary) return pushToast("error", "No cargó widget", "Revisa el script en layout.tsx");

        const options: any = {
            cloudName,
            uploadPreset: presetServices, // o un preset dedicado BEFORE_AFTER_PRESET
            folder: "caroline/before-after",
            multiple: false,
            maxFiles: 1,
            sources: ["local", "camera", "google_drive"],
            clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
            cropping: false,
            resourceType: "image",
            showCompletedButton: true,
            singleUploadAutoClose: true,
            tags: ["beforeafter", `service_${serviceId}`, `slot_${slot}`],
            context: { album: "beforeafter", service: serviceId, slot },
            public_id_prefix: `${serviceId}-${slot}-`,
        };

        const widget = window.cloudinary.createUploadWidget(options, async (error: any, result: any) => {
            if (error) {
                console.error("BA UPLOAD ERROR", error);
                pushToast("error", "Error subiendo", error?.message || "Mira consola");
                return;
            }
            if (result?.event === "success") {
                const info = result.info || {};
                const publicId = String(info.public_id || "");
                const src = String(info.secure_url || "");
                try {
                    await saveBA(serviceId, title, slot, publicId, src);
                    pushToast("success", "Guardado", `Se guardó ${slot === "before" ? "ANTES" : "DESPUÉS"} de ${title}.`);
                } catch (e: any) {
                    pushToast("error", "No se pudo guardar", e?.message || "Mira consola.");
                }
            }
        });

        widget.open();
    }

    // ---------- uploader ----------
    function openUploader(type: "gallery" | "services") {
        if (isUploading) {
            pushToast("info", "Ya se está subiendo", "Espera a que termine la subida actual.");
            return;
        }

        if (!cloudName) {
            pushToast("error", "Faltan variables", "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME no está en .env / Vercel.");
            return;
        }

        const uploadPreset = type === "gallery" ? presetGallery : presetServices;
        if (!uploadPreset) {
            pushToast(
                "error",
                "Falta preset",
                type === "gallery"
                    ? "NEXT_PUBLIC_CLOUDINARY_GALLERY_PRESET no está seteado."
                    : "NEXT_PUBLIC_CLOUDINARY_SERVICES_PRESET no está seteado."
            );
            return;
        }

        if (!window.cloudinary) {
            pushToast("error", "No cargó el widget", "Revisa que el Script del widget esté en layout.tsx.");
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

        // Solo aquí marcamos "subiendo": ya validaste todo
        startUpload(type);

        let successCount = 0;
        const widget = window.cloudinary.createUploadWidget(options, async (error: any, result: any) => {
            if (error) {
                console.error("CLOUDINARY ERROR:", error);
                pushToast("error", "Error subiendo", error?.message || "Mira consola.");
                stopUpload(type);
                return;
            }

            if (result?.event === "abort") {
                stopUpload(type);
                return;
            }

            if (result?.event === "close") {
                // Si es multi y ya hubo uploads, espera queues-end (más confiable)
                if (!isGallery && successCount > 0) return;
                stopUpload(type);
                return;
            }

            if (result?.event === "queues-start") {
                pushToast("info", "Subida iniciada", "No cierres la pestaña.");
            }

            if (result?.event === "queues-end") {
                // Para services: refresca una vez al final
                if (!isGallery && successCount > 0) {
                    await refreshLatest();
                    pushToast("success", "Listo", `Se subieron ${successCount} foto(s) a Servicios (${selectedTitle}).`);
                }
                stopUpload(type);
                return;
            }

            if (result?.event === "success") {
                successCount += 1;

                const info = result.info || {};
                const publicId = String(info.public_id || "");
                const src = String(info.secure_url || "");
                const createdAt = String(info.created_at || new Date().toISOString());

                setSessionUploads((prev) => {
                    const next: UploadedItem[] = [
                        {
                            publicId,
                            src,
                            type,
                            mediaType: "image",
                            serviceId: type === "services" ? selectedServiceId : undefined,
                            createdAt,
                        },
                        ...prev,
                    ];
                    return next.slice(0, 24);
                });

                // Toast por cada success está OK (pero si subes 30, podría ser spam; tú limitas a 4 toasts)
                if (isGallery) {
                    pushToast("success", "Subida OK", "Se subió a Galería.");
                }

                // Para galería (1 foto): refresca al tiro
                if (isGallery) {
                    await refreshLatest();
                    stopUpload(type);
                }
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
        mediaType = "image",
        onDelete,
    }: {
        src: string;
        publicId: string;
        badge: { label: string; cls: string };
        timeAgo?: string;
        mediaType?: "image" | "video";
        onDelete: () => void;
    }) {

        return (
            <div className="group rounded-2xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="relative aspect-square bg-black/5">
                    {mediaType === "video" ? (
                        <video
                            src={src}
                            controls
                            playsInline
                            preload="metadata"
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <img
                            src={src}
                            alt={publicId}
                            className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform"
                            loading="lazy"
                        />
                    )}

                    <div
                        className={`absolute left-2 top-2 text-[11px] font-bold px-2 py-1 rounded-full ${badge.cls}`}
                    >
                        {badge.label}
                    </div>

                    {mediaType === "video" ? (
                        <div className="absolute left-2 bottom-2 text-[11px] font-bold px-2 py-1 rounded-full bg-white/90 text-black">
                            VIDEO
                        </div>
                    ) : null}

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
                <div className="absolute inset-0 flex items-start justify-center p-4 pt-10">
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
                                    {state.src ? (
                                        state.mediaType === "video" ? (
                                            <video
                                                src={state.src}
                                                className="h-full w-full object-cover"
                                                controls
                                                playsInline
                                                preload="metadata"
                                            />
                                        ) : (
                                            <img src={state.src} alt={state.publicId} className="h-full w-full object-cover" />
                                        )
                                    ) : null}
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
                                    onClick={() => deleteByPublicId(state.publicId, state.mediaType)}
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
        const faceIdLabel = (() => {
            if (passkeyStatus === "checking") return "Comprobando Face ID…";
            if (passkeyStatus === "working") return "Abriendo Face ID…";
            if (passkeyStatus === "ok") return "✅ Listo";
            if (passkeyStatus === "fail") return hasPasskey ? "Falló. Intenta otra vez" : "Face ID no activado";
            return "Entrar con Face ID";
        })();

        const faceIdIcon = (() => {
            if (passkeyStatus === "ok") return "check_circle";
            if (passkeyStatus === "fail") return hasPasskey ? "error" : "lock";
            if (passkeyStatus === "working") return "fingerprint";
            return "face";
        })();

        const faceIdBoxCls = (() => {
            if (!hasPasskey || !canPasskey) return "border-primary/15 bg-primary/5";
            if (passkeyStatus === "fail") return "border-red-300 bg-red-50";
            if (passkeyStatus === "ok") return "border-green-300 bg-green-50";
            return "border-primary/20 hover:border-primary/50 hover:bg-primary/5";
        })();

        return (
            <main className="min-h-screen bg-white font-display text-slate-900">
                <ToastStack />

                <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden p-4">
                    {/* Decoration */}
                    <div className="pointer-events-none absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
                    <div className="pointer-events-none absolute bottom-0 right-0 w-[520px] h-[520px] bg-primary/15 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />

                    <div className="w-full max-w-[440px] z-10">
                        {/* Brand */}
                        <div className="flex flex-col items-center mb-8 gap-4">
                            <div className="size-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined !text-4xl">auto_awesome</span>
                            </div>
                            <div className="text-center">
                                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                                    Caroline Trenzas
                                </h1>
                                <p className="text-slate-500 mt-1 font-medium">Panel de Administración</p>
                            </div>
                        </div>

                        {/* Card (animación sutil) */}
                        <div
                            className={[
                                "bg-white/90 backdrop-blur-md rounded-2xl shadow-xl shadow-primary/10 border border-primary/10 p-8",
                                "transition-transform duration-300 will-change-transform",
                                "hover:-translate-y-[2px] hover:shadow-2xl hover:shadow-primary/15",
                                "animate-cardFloat",
                            ].join(" ")}
                        >
                            {/* Passkey / Face ID */}
                            <div className="mb-10">
                                {canPasskey === null ? (
                                    <div className="w-full p-6 rounded-2xl border border-slate-200 bg-slate-50 text-center">
                                        <p className="text-sm font-semibold text-slate-600">
                                            Comprobando Face ID / Huella…
                                        </p>
                                    </div>
                                ) : !canPasskey ? (
                                    <div className="w-full p-6 rounded-2xl border border-slate-200 bg-slate-50 text-center">
                                        <p className="text-sm font-semibold text-slate-600">
                                            Face ID / Huella no disponible en este navegador.
                                        </p>
                                    </div>
                                ) : hasPasskey ? (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            // si venía fallado, lo dejamos volver a “ready”
                                            if (passkeyStatus === "fail") setPasskeyStatus("ready");
                                            try {
                                                await passkeyLogin();
                                            } catch {
                                                // el toast ya lo manejas en passkeyLogin
                                            }
                                        }}
                                        disabled={loadingPasskey || passkeyStatus === "checking"}
                                        className={[
                                            "w-full group flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed",
                                            "transition-all duration-300 disabled:opacity-60",
                                            faceIdBoxCls,
                                        ].join(" ")}
                                    >
                                        <span
                                            className={[
                                                "material-symbols-outlined !text-5xl mb-3",
                                                passkeyStatus === "fail"
                                                    ? "text-red-500"
                                                    : passkeyStatus === "ok"
                                                        ? "text-green-600"
                                                        : "text-primary",
                                                loadingPasskey ? "animate-pulse" : "",
                                            ].join(" ")}
                                        >
                                            {faceIdIcon}
                                        </span>

                                        <span className="text-sm font-semibold text-slate-800">
                                            {faceIdLabel}
                                        </span>

                                        {passkeyStatus === "fail" ? (
                                            <span className="mt-1 text-xs text-slate-500">
                                                Si sigue fallando, entra con clave.
                                            </span>
                                        ) : null}
                                    </button>
                                ) : (
                                    <div className="w-full p-6 rounded-2xl border border-primary/15 bg-primary/5">
                                        <p className="text-sm font-bold text-slate-900">Face ID / Huella aún no activada</p>
                                        <p className="text-sm text-slate-600 mt-1">
                                            Entra con clave una vez y registra el dispositivo en el panel.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="relative flex py-3 items-center mb-6">
                                <div className="flex-grow border-t border-slate-200" />
                                <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">
                                    o con credenciales
                                </span>
                                <div className="flex-grow border-t border-slate-200" />
                            </div>

                            {/* Form */}
                            <form
                                className="space-y-5"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    login();
                                }}
                            >
                                {/* Email (decorativo) */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Correo electrónico</label>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 !text-xl">
                                            alternate_email
                                        </span>
                                        <input
                                            disabled
                                            className="w-full pl-12 pr-4 h-14 rounded-2xl border border-slate-200 bg-slate-50/70 text-slate-500 outline-none"
                                            placeholder="admin@carolinetrenzas.com"
                                            type="email"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="flex flex-col gap-2">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-sm font-bold text-slate-700">Contraseña</label>
                                        <span className="text-xs font-semibold text-primary/70 select-none"> </span>
                                    </div>

                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 !text-xl">
                                            lock
                                        </span>

                                        <input
                                            type={showPwd ? "text" : "password"}
                                            value={pwd}
                                            onChange={(e) => setPwd(e.target.value)}
                                            placeholder="••••••••"
                                            autoComplete="current-password"
                                            inputMode="text"
                                            className="w-full pl-12 pr-12 h-14 rounded-2xl border border-slate-200 bg-slate-50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-900 caret-slate-900"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowPwd((v) => !v)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary"
                                            aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                                        >
                                            <span className="material-symbols-outlined !text-xl">
                                                {showPwd ? "visibility_off" : "visibility"}
                                            </span>
                                        </button>
                                    </div>
                                </div>


                                <button
                                    type="submit"
                                    disabled={loadingLogin || !pwd.trim()}
                                    className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                                >
                                    {loadingLogin ? "Entrando..." : "Acceder al Panel"}
                                    <span className="material-symbols-outlined">login</span>
                                </button>
                            </form>
                        </div>

                        {/* Footer */}
                        <p className="mt-8 text-center text-slate-500 text-sm font-medium">
                            © 2024 Caroline Trenzas. Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <>
            <ToastStack />
            <ConfirmDeleteModal state={confirmDelete} />

            <AdminShell
                active={viewMeta.active}
                onNavigate={(key) => {
                    if (key === "dashboard") setView("dashboard");
                    if (key === "gallery") setView("gallery");
                    if (key === "services") setView("services");
                    if (key === "beforeAfter") setView("beforeafter");
                    if (key === "testimonials") setView("testimonials");
                    if (key === "settings") setView("settings");
                }}
                onLogout={logout}
                title={viewMeta.title}
                subtitle={viewMeta.subtitle}
                titleIcon={viewMeta.titleIcon}
                search={viewMeta.search}
                rightActions={viewMeta.rightActions}
                user={viewMeta.user}
            >
                {view === "dashboard" ? (
                    <DashboardView
                        stats={{
                            beforeAfterCount: ba.reduce(
                                (acc, x) => acc + (x.before?.src ? 1 : 0) + (x.after?.src ? 1 : 0),
                                0
                            ),
                            beforeAfterUpdatedText: "Actualizado recientemente",
                            pendingTestimonials: pending.length,
                            publishedTestimonials: approved.length,
                        }}
                        onUploadPhoto={() => openUploader("gallery")}
                        onUploadReel={() => openVideoUploader(true)}
                        recentItems={galleryLatest.slice(0, 12).map((m, idx) => ({
                            id: m.publicId || String(idx),
                            publicId: m.publicId || String(idx),
                            title: "Galería",
                            when: formatTimeAgo(m.createdAt),
                            src: m.src,
                            mediaType: (m.mediaType ?? "image") as "image" | "video",
                            tag: (m.mediaType === "video" ? "Reel" : "Después") as "Reel" | "Después" | "Antes",
                        }))}
                        onDeleteRecent={(id) =>
                            requestDelete({
                                publicId: id,
                                src: galleryLatest.find((x) => x.publicId === id)?.src,
                                mediaType: galleryLatest.find((x) => x.publicId === id)?.mediaType,
                                contextLabel: "Galería",
                            })
                        }
                        onOpenBeforeAfter={() => setView("beforeafter")}
                        onOpenTestimonials={() => setView("testimonials")}
                    />
                ) : view === "gallery" ? (
                    <GalleryView
                        items={galleryLatest}
                        loading={loadingLatest}
                        formatTimeAgo={formatTimeAgo}
                        onDelete={(item) => requestDelete(item)}
                        query={qGallery}
                    />
                ) : view === "services" ? (
                    <ServicesView
                        services={SERVICES}
                        selectedServiceId={selectedServiceId}
                        setSelectedServiceId={setSelectedServiceId}
                        items={servicesLatest}
                        loading={loadingLatest}
                        onRefresh={refreshLatest}
                        onUpload={() => openUploader("services")}
                        onDelete={(item) => requestDelete(item)}
                        formatTimeAgo={formatTimeAgo}
                        query={qServices}
                        setQuery={setQServices}
                        onEditCategory={() => pushToast("info", "Próximamente", "Editar categoría lo dejamos para la siguiente vuelta.")}
                    />
                ) : view === "beforeafter" ? (
                    <BeforeAfterEditorView
                        services={SERVICES}
                        ba={ba}
                        loadingBA={loadingBA}
                        onRefresh={loadBeforeAfter}
                        onUploadSlot={(serviceId, title, slot) => openBAUploader(serviceId, title, slot)}
                        onDeleteSlot={(serviceId, slot) => deleteBA(serviceId, slot)}
                    />
                ) : view === "settings" ? (
                    <SettingsView
                        canPasskey={canPasskey}
                        hasPasskey={hasPasskey}
                        loadingPasskey={loadingPasskey}
                        onRegisterPasskey={passkeyRegister}
                        onLogout={logout}
                    />
                ) : (
                    <TestimonialsModerationView
                        pending={pending}
                        approved={approved}
                        loading={loadingT}
                        onRefresh={loadTestimonialsAdmin}
                        onApprove={approveTestimonial}
                        onReject={rejectTestimonial}
                    />
                )}
            </AdminShell>
        </>
    );
}
