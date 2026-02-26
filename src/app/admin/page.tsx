"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";

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
        const t = setTimeout(() => {
            setCanPasskey((v) => (v === null ? false : v));
        }, 1200);
        return () => clearTimeout(t);
    }, []);

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

        try {
            const or = await fetch("/api/admin/webauthn/login/options", {
                cache: "no-store",
                credentials: "include",
            });

            const opts = await or.json().catch(() => ({}));
            if (!or.ok) {
                pushToast("error", "No se pudo iniciar",
                    (opts?.message || `HTTP ${or.status}`) +
                    (opts?.debug ? ` | debug: ${JSON.stringify(opts.debug)}` : ""));
                return;
            }

            const cred = await startAuthentication(opts);

            const vr = await fetch("/api/admin/webauthn/login/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cred),
                credentials: "include",
                cache: "no-store",
            });

            const data = await vr.json().catch(() => ({}));

            if (!vr.ok) {
                pushToast("error", "No se pudo ingresar",
                    (data?.message || `HTTP ${vr.status}`) +
                    (data?.debug ? ` | debug: ${JSON.stringify(data.debug)}` : ""));
                return;
            }

            setAuthed(true);
            pushToast("success", "Listo", "Entraste con Face ID / Huella.");
            await refreshLatest();
        } catch (e: any) {
            console.error("PASSKEY LOGIN ERROR", e);
            pushToast("error", "Error con Passkey", `${e?.name || "Error"}: ${e?.message || e}`);
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
    function BeforeAfterModal() {
        if (!openBA) return null;

        return (
            <div className="fixed inset-0 z-[9999]">
                <div className="absolute inset-0 bg-black/40" onClick={() => setOpenBA(false)} />
                <div className="absolute inset-0 flex items-start justify-center p-4 pt-10 md:items-center md:pt-4">
                    <div
                        className="w-full max-w-4xl rounded-2xl border bg-white shadow-lg overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-5 border-b bg-[#fdfafb] flex items-center justify-between">
                            <div>
                                <p className="font-black text-lg">Antes y Después</p>
                                <p className="text-sm text-[#89616f]">Sube 2 fotos por servicio (antes y después).</p>
                            </div>
                            <button
                                type="button"
                                className="rounded-full size-10 hover:bg-black/5 flex items-center justify-center"
                                onClick={() => setOpenBA(false)}
                                aria-label="Cerrar"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="p-5 max-h-[75vh] overflow-auto space-y-4">
                            {SERVICES.map((s) => {
                                const row = getBAFor(s.id);
                                return (
                                    <div key={s.id} className="rounded-2xl border p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="font-bold text-[#181113]">{s.title}</p>
                                            <p className="text-xs text-[#89616f]">
                                                {row?.before ? "✅ Antes" : "— Antes"} · {row?.after ? "✅ Después" : "— Después"}
                                            </p>
                                        </div>

                                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="rounded-2xl border bg-[#fdfafb] p-3">
                                                <p className="text-xs font-bold text-[#89616f] mb-2">ANTES</p>
                                                {row?.before?.src ? (
                                                    <img src={row.before.src} className="w-full aspect-[4/5] object-cover rounded-xl border" />
                                                ) : (
                                                    <div className="w-full aspect-[4/5] rounded-xl border bg-white flex items-center justify-center text-sm text-[#89616f]">
                                                        Sin foto
                                                    </div>
                                                )}
                                                <div className="mt-3 flex gap-2">
                                                    <button
                                                        type="button"
                                                        className="flex-1 rounded-xl bg-primary text-white font-bold py-2.5"
                                                        onClick={() => openBAUploader(s.id, s.title, "before")}
                                                    >
                                                        Subir ANTES
                                                    </button>

                                                    {row?.before?.src ? (
                                                        <button
                                                            type="button"
                                                            className="flex-1 rounded-xl border font-bold py-2.5 hover:bg-black/5"
                                                            onClick={() => deleteBA(s.id, "before")}
                                                        >
                                                            Quitar
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border bg-[#fdfafb] p-3">
                                                <p className="text-xs font-bold text-[#89616f] mb-2">DESPUÉS</p>
                                                {row?.after?.src ? (
                                                    <img src={row.after.src} className="w-full aspect-[4/5] object-cover rounded-xl border" />
                                                ) : (
                                                    <div className="w-full aspect-[4/5] rounded-xl border bg-white flex items-center justify-center text-sm text-[#89616f]">
                                                        Sin foto
                                                    </div>
                                                )}
                                                <div className="mt-3 flex gap-2">
                                                    <button
                                                        type="button"
                                                        className="flex-1 rounded-xl bg-primary text-white font-bold py-2.5"
                                                        onClick={() => openBAUploader(s.id, s.title, "after")}
                                                    >
                                                        Subir DESPUÉS
                                                    </button>

                                                    {row?.after?.src ? (
                                                        <button
                                                            type="button"
                                                            className="flex-1 rounded-xl border font-bold py-2.5 hover:bg-black/5"
                                                            onClick={() => deleteBA(s.id, "after")}
                                                        >
                                                            Quitar
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-4 border-t bg-white flex justify-end">
                            <button
                                type="button"
                                className="rounded-xl border px-4 py-2 text-sm font-bold hover:bg-black/5"
                                onClick={() => setOpenBA(false)}
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
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
        return (
            <main className="min-h-screen flex items-center justify-center p-6 bg-[#fdfafb]">
                <ToastStack />
                <div className="w-full max-w-md rounded-2xl border bg-white shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b bg-white">
                        <h1 className="text-xl font-black text-[#181113]">Admin Caroline Trenzas</h1>
                        <p className="text-sm text-[#89616f] mt-1">
                            Acceso privado para subir fotos y reels.
                        </p>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-4">
                        {/* Passkey CTA */}
                        {canPasskey === null ? (
                            <div className="w-full rounded-xl border border-[#f4f0f2] bg-[#fdfafb] py-3 text-center text-sm text-[#89616f]">
                                Comprobando Face ID / Huella…
                            </div>
                        ) : !canPasskey ? (
                            <div className="w-full rounded-xl border border-[#f4f0f2] bg-[#fdfafb] py-3 px-4 text-sm text-[#89616f]">
                                Face ID / Huella no disponible en este navegador.
                            </div>
                        ) : hasPasskey ? (
                            <button
                                onClick={passkeyLogin}
                                disabled={loadingPasskey}
                                className="w-full rounded-xl bg-[#181113] text-white font-bold py-3 hover:opacity-90 disabled:opacity-60"
                            >
                                {loadingPasskey ? "Abriendo Face ID / Huella..." : "Entrar con Face ID / Huella"}
                            </button>
                        ) : (
                            <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                                <p className="text-sm font-bold text-[#181113]">Activa Face ID / Huella</p>
                                <p className="text-sm text-[#89616f] mt-1">
                                    Este dispositivo aún no está registrado. Regístralo una vez y después podrás entrar con un toque.
                                </p>
                            </div>
                        )}
                        {/* Divider */}
                        <div className="flex items-center gap-3 py-2">
                            <div className="h-px flex-1 bg-[#f4f0f2]" />
                            <span className="text-xs text-[#89616f]">o con clave</span>
                            <div className="h-px flex-1 bg-[#f4f0f2]" />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-[#181113]">Clave</label>

                            <div className="relative">
                                <input
                                    type={showPwd ? "text" : "password"}
                                    value={pwd}
                                    onChange={(e) => setPwd(e.target.value)}
                                    placeholder="Escribe la clave"
                                    autoComplete="current-password"
                                    className="w-full h-12 appearance-none rounded-full border border-[#f4f0f2] bg-white px-5 pr-14 text-[16px] leading-5
      focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") login();
                                    }}
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPwd((v) => !v)}
                                    className="absolute inset-y-0 right-3 my-auto size-9 rounded-full hover:bg-black/5 flex items-center justify-center"
                                    aria-label={showPwd ? "Ocultar clave" : "Mostrar clave"}
                                >
                                    <span className="material-symbols-outlined text-xl text-[#89616f]">
                                        {showPwd ? "visibility_off" : "visibility"}
                                    </span>
                                </button>
                            </div>

                            <button
                                onClick={login}
                                disabled={loadingLogin || !pwd.trim()}
                                className="w-full rounded-xl bg-primary text-white font-bold py-3 hover:bg-primary/90 disabled:opacity-60"
                            >
                                {loadingLogin ? "Entrando..." : "Entrar con clave"}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen p-6 lg:p-12 bg-[#fdfafb]">
            <ToastStack />
            <BeforeAfterModal />
            <ConfirmDeleteModal state={confirmDelete} />
            <TestimonialsModal
                open={openT}
                onClose={closeTestimonials}
                pending={pending}
                approved={approved}
                loading={loadingT}
                onRefresh={loadTestimonialsAdmin}
                onApprove={approveTestimonial}
                onReject={rejectTestimonial}
            />
            <div className="max-w-5xl mx-auto bg-white border rounded-2xl p-6 shadow-sm">
                {isUploading ? (
                    <div className="mb-4 rounded-2xl border bg-primary/5 p-4 flex items-center gap-3">
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border border-primary/30 border-t-primary" />
                        <p className="text-sm font-bold text-[#181113]">{uploadingLabel || "Subiendo…"}</p>
                        <button
                            type="button"
                            onClick={() => {
                                pushToast("info", "Subida en curso", "Si cerraste el widget, presiona 'Reset' para desbloquear.");
                            }}
                            className="ml-auto rounded-full border px-4 py-2 text-xs font-bold hover:bg-black/5"
                        >
                            ¿Qué pasa?
                        </button>
                    </div>
                ) : null}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black mb-1">Subir fotos</h1>
                        <p className="text-sm text-[#89616f]">
                            Sube, revisa y elimina si te equivocaste. Sin tener que mendigar en Cloudinary.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        {canPasskey ? (
                            hasPasskey ? (
                                <button
                                    type="button"
                                    disabled
                                    className="rounded-full border px-4 py-2 text-sm font-bold opacity-60 cursor-not-allowed"
                                    title="Ya hay una passkey registrada"
                                >
                                    ✅ Face ID / Huella activa
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={passkeyRegister}
                                    disabled={loadingPasskey}
                                    className="rounded-full border px-4 py-2 text-sm font-bold hover:bg-black/5 disabled:opacity-60"
                                >
                                    {loadingPasskey ? "Registrando..." : "Registrar Face ID / Huella"}
                                </button>
                            )
                        ) : null}
                        <button
                            onClick={refreshLatest}
                            disabled={loadingLatest || isUploading}
                            className="rounded-full border px-4 py-2 text-sm font-bold hover:bg-black/5 disabled:opacity-60"
                        >
                            {loadingLatest ? "Actualizando..." : "Actualizar"}
                        </button>
                        <button
                            onClick={logout}
                            disabled={isUploading}
                            className="rounded-full border px-4 py-2 text-sm font-bold hover:bg-black/5 disabled:opacity-60"
                        >
                            Salir
                        </button>
                        {isUploading ? (
                            <button
                                type="button"
                                disabled={!canReset}
                                onClick={() => {
                                    stopUpload();
                                    pushToast("info", "Estado reiniciado", "Se desbloquearon los botones.");
                                }}
                                className="rounded-full border px-4 py-2 text-sm font-bold hover:bg-black/5 disabled:opacity-50"
                                title={!canReset ? "Espera 20s por si la subida está en curso" : "Úsalo si quedó pegado"}
                            >
                                Reset
                            </button>
                        ) : null}
                    </div>
                </div>
                <div className="mt-6 rounded-2xl border bg-white p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="font-black text-[#181113]">Antes y Después</p>
                        <p className="text-sm text-[#89616f]">
                            {ba.length} servicio(s) configurado(s)
                        </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={loadBeforeAfter}
                            disabled={loadingBA}
                            className="rounded-full border px-4 py-2 text-sm font-bold hover:bg-black/5 disabled:opacity-60"
                        >
                            {loadingBA ? "Actualizando..." : "Actualizar"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setOpenBA(true)}
                            className="rounded-full bg-primary text-white px-4 py-2 text-sm font-bold hover:bg-primary/90"
                        >
                            Editar
                        </button>
                    </div>
                </div>
                {/* TESTIMONIOS - RESUMEN ARRIBA */}
                <div className="mt-6 rounded-2xl border bg-white p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="font-black text-[#181113]">Testimonios</p>
                        <p className="text-sm text-[#89616f]">
                            Pendientes: <span className="font-bold">{pending.length}</span> · Publicados:{" "}
                            <span className="font-bold">{approved.length}</span>/3
                        </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={loadTestimonialsAdmin}
                            disabled={loadingT}
                            className="rounded-full border px-4 py-2 text-sm font-bold hover:bg-black/5 disabled:opacity-60"
                        >
                            {loadingT ? "Actualizando..." : "Actualizar"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setOpenT(true)}
                            className="rounded-full bg-primary text-white px-4 py-2 text-sm font-bold hover:bg-primary/90"
                        >
                            Revisar
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
                            disabled={isUploading}
                            className="mt-4 w-full rounded-xl bg-primary text-white font-bold py-3 disabled:opacity-60"
                        >
                            {uploading === "gallery" ? "Subiendo..." : "Subir 1 foto a Galería"}
                        </button>

                        <button
                            onClick={() => openVideoUploader(true)}
                            disabled={isUploading}
                            className="mt-2 w-full rounded-xl border py-3 font-bold hover:bg-black/5 disabled:opacity-60"
                            title="Estos aparecen arriba como Reels en la landing"
                        >
                            {uploading === "reel" ? "Subiendo..." : "⭐ Subir Reel (destacado)"}
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
                            disabled={uploading === "services"}
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
                            disabled={disableServicesButton || uploading === "services"}
                            title={
                                disableServicesButton
                                    ? "Ya hay otra subida en curso. Termínala primero."
                                    : uploading === "services"
                                        ? "Subiendo fotos…"
                                        : ""
                            }
                            className="mt-4 w-full rounded-xl bg-primary text-white font-bold py-3 disabled:opacity-60"
                        >
                            {uploading === "services" ? "Subiendo fotos…" : `Subir fotos de ${selectedTitle}`}
                        </button>

                        <p className="mt-3 text-xs text-[#89616f]">
                            Quedan como <span className="font-mono">{selectedServiceId}-xxxxx</span>.
                        </p>
                    </div>
                </div>

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
                                        mediaType={img.mediaType}
                                        onDelete={() =>
                                            requestDelete({
                                                publicId: img.publicId,
                                                src: img.src,
                                                mediaType: img.mediaType,
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
                            <span className="text-xs text-[#89616f]">
                                {galleryImages} fotos · {galleryVideos} videos
                            </span>
                        </div>

                        {loadingLatest ? (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <SkeletonCard key={i} />
                                ))}
                            </div>
                        ) : galleryLatest.length === 0 ? (
                            <div className="mt-3 rounded-xl border bg-[#fdfafb] p-4 text-sm text-[#89616f]">
                                No hay contenido todavía.
                            </div>
                        ) : (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {galleryLatest.slice(0, 12).map((img) => (
                                    <MediaCard
                                        key={img.publicId}
                                        src={img.src}
                                        mediaType={img.mediaType}
                                        publicId={img.publicId}
                                        badge={{ label: "Galería", cls: "bg-white/90 text-black" }}
                                        timeAgo={formatTimeAgo(img.createdAt)}
                                        onDelete={() =>
                                            requestDelete({
                                                publicId: img.publicId,
                                                src: img.src,
                                                mediaType: img.mediaType,
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
                                        mediaType={img.mediaType}
                                        badge={{ label: "Servicios", cls: "bg-black/80 text-white" }}
                                        timeAgo={formatTimeAgo(img.createdAt)}
                                        onDelete={() =>
                                            requestDelete({
                                                publicId: img.publicId,
                                                src: img.src,
                                                mediaType: img.mediaType,
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
