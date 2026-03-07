"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type MutableRefObject,
    type ReactNode,
} from "react";
import { defaultLandingContent, type LandingContent } from "@/lib/landing-content";

declare global {
    interface Window {
        cloudinary: any;
    }
}

type SectionKey = keyof LandingContent;

const SECTION_TABS: { key: SectionKey; label: string }[] = [
    { key: "header", label: "Header" },
    { key: "hero", label: "Hero" },
    { key: "services", label: "Servicios" },
    { key: "beforeAfter", label: "Antes/Después" },
    { key: "process", label: "Proceso" },
    { key: "coverage", label: "Cobertura" },
    { key: "policies", label: "Políticas" },
    { key: "reviewForm", label: "Formulario" },
    { key: "testimonials", label: "Testimonios" },
    { key: "gallery", label: "Galería" },
    { key: "faq", label: "FAQ" },
    { key: "footer", label: "Footer" },
    { key: "modals", label: "Modales" },
];

type SectionCardProps = {
    title: string;
    subtitle?: string;
    children: ReactNode;
};

function SectionCard({ title, subtitle, children }: SectionCardProps) {
    return (
        <section className="space-y-5 rounded-2xl border border-primary/10 bg-white p-6 shadow-sm">
            <div>
                <h3 className="text-xl font-black text-[#181113]">{title}</h3>
                {subtitle ? <p className="mt-1 text-sm text-[#89616f]">{subtitle}</p> : null}
            </div>
            {children}
        </section>
    );
}

function SectionAnchor({
    sectionKey,
    sectionRefs,
    children,
}: {
    sectionKey: SectionKey;
    sectionRefs: MutableRefObject<Record<SectionKey, HTMLElement | null>>;
    children: ReactNode;
}) {
    return (
        <div
            ref={(el) => {
                sectionRefs.current[sectionKey] = el;
            }}
            data-section-key={sectionKey}
            className="scroll-mt-40"
        >
            {children}
        </div>
    );
}

type FieldProps = {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
};

function TextField({ label, value, onChange, placeholder }: FieldProps) {
    return (
        <label className="block space-y-2">
            <span className="text-sm font-bold text-[#181113]">{label}</span>
            <input
                type="text"
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-2xl border border-[#f4f0f2] bg-[#fdfafb] px-4 py-3 text-sm
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary"
            />
        </label>
    );
}

function TextAreaField({ label, value, onChange, placeholder }: FieldProps) {
    return (
        <label className="block space-y-2">
            <span className="text-sm font-bold text-[#181113]">{label}</span>
            <textarea
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-[#f4f0f2] bg-[#fdfafb] px-4 py-3 text-sm
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary"
            />
        </label>
    );
}

function ArrayStringEditor({
    label,
    items,
    onChange,
    addLabel = "Agregar item",
}: {
    label: string;
    items: string[];
    onChange: (items: string[]) => void;
    addLabel?: string;
}) {
    function updateItem(index: number, value: string) {
        const next = [...items];
        next[index] = value;
        onChange(next);
    }

    function removeItem(index: number) {
        onChange(items.filter((_, i) => i !== index));
    }

    function addItem() {
        onChange([...items, ""]);
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-[#181113]">{label}</p>
                <button
                    type="button"
                    onClick={addItem}
                    className="rounded-full border border-primary/20 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/5"
                >
                    {addLabel}
                </button>
            </div>

            <div className="space-y-3">
                {items.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                        <input
                            type="text"
                            value={item}
                            onChange={(e) => updateItem(index, e.target.value)}
                            className="flex-1 rounded-2xl border border-[#f4f0f2] bg-[#fdfafb] px-4 py-3 text-sm
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary"
                        />
                        <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="shrink-0 rounded-full border border-red-200 px-4 py-3 text-xs font-bold text-red-600 hover:bg-red-50"
                        >
                            Eliminar
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function ContentView() {
    const [content, setContent] = useState<LandingContent>(defaultLandingContent);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savedMessage, setSavedMessage] = useState("");
    const [lastSavedContent, setLastSavedContent] = useState<LandingContent>(defaultLandingContent);
    const [activeSection, setActiveSection] = useState<SectionKey>("header");
    const [uploadingHero, setUploadingHero] = useState(false);

    const sectionRefs = useRef<Record<SectionKey, HTMLElement | null>>({
        header: null,
        hero: null,
        services: null,
        beforeAfter: null,
        process: null,
        coverage: null,
        policies: null,
        reviewForm: null,
        testimonials: null,
        gallery: null,
        faq: null,
        footer: null,
        modals: null,
    });

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
    const heroPreset =
        process.env.NEXT_PUBLIC_CLOUDINARY_HERO_PRESET ||
        process.env.NEXT_PUBLIC_CLOUDINARY_SERVICES_PRESET ||
        "";

    const isDefaultContent = useMemo(
        () => JSON.stringify(content) === JSON.stringify(defaultLandingContent),
        [content]
    );

    const hasUnsavedChanges = useMemo(
        () => JSON.stringify(content) !== JSON.stringify(lastSavedContent),
        [content, lastSavedContent]
    );

    const updateSection = useCallback(
        <K extends keyof LandingContent>(section: K, patch: Partial<LandingContent[K]>) => {
            setContent((prev) => ({
                ...prev,
                [section]: {
                    ...prev[section],
                    ...patch,
                },
            }));
        },
        []
    );

    const scrollToSection = useCallback((key: SectionKey) => {
        const el = sectionRefs.current[key];
        if (!el) return;

        setActiveSection(key);

        el.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    }, []);

    function openHeroUploader() {
        if (uploadingHero) return;

        if (!cloudName) {
            window.alert("Falta NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME");
            return;
        }

        if (!heroPreset) {
            window.alert("Falta NEXT_PUBLIC_CLOUDINARY_HERO_PRESET");
            return;
        }

        if (!window.cloudinary) {
            window.alert("No cargó el widget de Cloudinary");
            return;
        }

        setUploadingHero(true);

        const widget = window.cloudinary.createUploadWidget(
            {
                cloudName,
                uploadPreset: heroPreset,
                folder: "caroline/hero",
                multiple: false,
                maxFiles: 1,
                sources: ["local", "camera", "google_drive"],
                clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
                cropping: false,
                showAdvancedOptions: false,
                resourceType: "image",
                showCompletedButton: true,
                singleUploadAutoClose: true,
                tags: ["hero", "landing"],
                context: { section: "hero" },
            },
            (error: any, result: any) => {
                if (error) {
                    console.error("HERO UPLOAD ERROR:", error);
                    setUploadingHero(false);
                    return;
                }

                if (result?.event === "success") {
                    const info = result.info || {};
                    const secureUrl = String(info.secure_url || "");
                    const publicId = String(info.public_id || "");

                    if (!secureUrl) {
                        setUploadingHero(false);
                        return;
                    }

                    setContent((prev) => ({
                        ...prev,
                        hero: {
                            ...prev.hero,
                            imageSrc: secureUrl,
                            imagePublicId: publicId,
                        },
                    }));

                    setSavedMessage("Portada cargada. Falta guardar cambios.");
                    window.setTimeout(() => setSavedMessage(""), 2500);
                    setUploadingHero(false);
                    return;
                }

                if (result?.event === "close" || result?.event === "abort") {
                    setUploadingHero(false);
                }
            }
        );

        widget.open();
    }

    function restoreDefaults() {
        const ok = window.confirm(
            "¿Restaurar todo el contenido a los valores por defecto? Esto no guarda automáticamente."
        );

        if (!ok) return;

        setContent(defaultLandingContent);
        setSavedMessage("Se restauraron los valores por defecto en pantalla. Falta guardar.");
        window.setTimeout(() => setSavedMessage(""), 3000);
    }

    useEffect(() => {
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!hasUnsavedChanges) return;
            e.preventDefault();
            e.returnValue = "";
        };

        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, [hasUnsavedChanges]);

    function discardChanges() {
        const ok = window.confirm("¿Descartar los cambios no guardados y volver al último contenido guardado?");
        if (!ok) return;

        setContent(lastSavedContent);
        setSavedMessage("Se descartaron los cambios no guardados.");
        window.setTimeout(() => setSavedMessage(""), 2500);
    }

    function downloadBackup() {
        const blob = new Blob([JSON.stringify(content, null, 2)], {
            type: "application/json",
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "landing-content-backup.json";
        a.click();
        URL.revokeObjectURL(url);
    }

    useEffect(() => {
        let alive = true;

        fetch("/api/admin/content", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
        })
            .then(async (r) => {
                const data = await r.json().catch(() => ({}));
                if (!alive) return;

                if (!r.ok) {
                    throw new Error(data?.message || `HTTP ${r.status}`);
                }

                const initialContent = data?.content ?? defaultLandingContent;
                setContent(initialContent);
                setLastSavedContent(initialContent);
            })
            .catch((error) => {
                if (!alive) return;
                console.error("No se pudo cargar el contenido:", error);
                setContent(defaultLandingContent);
                setLastSavedContent(defaultLandingContent);
            })
            .finally(() => {
                if (!alive) return;
                setLoading(false);
            });

        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => {
        if (loading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visibleEntries = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

                if (visibleEntries.length === 0) return;

                const nextKey = visibleEntries[0].target.getAttribute("data-section-key") as SectionKey | null;
                if (nextKey) setActiveSection(nextKey);
            },
            {
                root: null,
                rootMargin: "-130px 0px -55% 0px",
                threshold: [0.15, 0.3, 0.45, 0.6],
            }
        );

        const elements = Object.values(sectionRefs.current).filter(Boolean) as HTMLElement[];
        elements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [loading]);

    async function saveContent() {
        setSaving(true);
        setSavedMessage("");

        try {
            const r = await fetch("/api/admin/content", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(content),
            });

            const data = await r.json().catch(() => ({}));

            if (!r.ok) {
                throw new Error(data?.message || `HTTP ${r.status}`);
            }

            const savedContent = data?.content ?? content;
            setContent(savedContent);
            setLastSavedContent(savedContent);

            setSavedMessage("Cambios guardados correctamente.");
            window.setTimeout(() => setSavedMessage(""), 2500);
        } catch (error: any) {
            setSavedMessage(error?.message || "No se pudo guardar el contenido.");
            window.setTimeout(() => setSavedMessage(""), 3500);
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="rounded-2xl border border-primary/10 bg-white p-8 shadow-sm">
                <p className="text-sm text-[#89616f]">Cargando contenido del landing...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="sticky top-0 z-10 rounded-2xl border border-primary/10 bg-white/95 px-4 py-4 shadow-sm backdrop-blur md:px-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-2xl font-black text-[#181113] sm:text-3xl">
                                Contenido del Landing
                            </h2>

                            {!hasUnsavedChanges ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                    <span className="material-symbols-outlined text-base">check_circle</span>
                                    Todo guardado
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                                    <span className="material-symbols-outlined text-base">edit</span>
                                    Cambios sin guardar
                                </span>
                            )}
                        </div>

                        <p className="mt-2 text-sm text-[#89616f]">
                            Aquí la clienta puede editar los textos del sitio sin tocar código.
                        </p>

                        {savedMessage ? (
                            <p className="mt-2 text-sm font-semibold text-primary" aria-live="polite">
                                {savedMessage}
                            </p>
                        ) : null}

                        {isDefaultContent ? (
                            <p className="mt-1 text-xs text-[#89616f]">
                                Actualmente estás viendo el contenido por defecto.
                            </p>
                        ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                        <button
                            type="button"
                            onClick={restoreDefaults}
                            disabled={saving}
                            className="rounded-full border border-red-200 px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Restaurar
                        </button>

                        <button
                            type="button"
                            onClick={downloadBackup}
                            disabled={saving}
                            className="rounded-full border border-primary/20 px-5 py-3 text-sm font-bold text-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Descargar JSON
                        </button>

                        <button
                            type="button"
                            onClick={discardChanges}
                            disabled={saving || !hasUnsavedChanges}
                            className="rounded-full border border-amber-200 px-5 py-3 text-sm font-bold text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Descartar cambios
                        </button>

                        <button
                            type="button"
                            onClick={saveContent}
                            disabled={saving || !hasUnsavedChanges}
                            className="rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </div>
                </div>

                <div className="mt-4 overflow-hidden">
                    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                        {SECTION_TABS.map((tab) => {
                            const isActive = activeSection === tab.key;

                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => scrollToSection(tab.key)}
                                    className={[
                                        "shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-xs font-bold transition-all",
                                        isActive
                                            ? "border-primary bg-primary text-white shadow-sm"
                                            : "border-[#eadfe3] bg-white text-[#6b5b63] hover:border-primary/40 hover:text-primary",
                                    ].join(" ")}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <SectionAnchor sectionKey="header" sectionRefs={sectionRefs}>
                <SectionCard title="Header" subtitle="Textos del menú superior">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <TextField
                            label="Marca"
                            value={content.header.brand}
                            onChange={(value) => updateSection("header", { brand: value })}
                        />
                        <TextField
                            label="Texto botón"
                            value={content.header.cta}
                            onChange={(value) => updateSection("header", { cta: value })}
                        />
                        <TextField
                            label="Menú servicios"
                            value={content.header.navServices}
                            onChange={(value) => updateSection("header", { navServices: value })}
                        />
                        <TextField
                            label="Menú galería"
                            value={content.header.navGallery}
                            onChange={(value) => updateSection("header", { navGallery: value })}
                        />
                    </div>
                </SectionCard>
            </SectionAnchor>

            <SectionAnchor sectionKey="hero" sectionRefs={sectionRefs}>
                <SectionCard title="Hero" subtitle="Primera sección visible del landing">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-3 md:col-span-2">
                            <p className="text-sm font-bold text-[#181113]">Imagen de portada</p>

                            <div className="rounded-2xl border border-primary/10 bg-[#fdfafb] p-4">
                                <div className="flex flex-col gap-4 md:flex-row md:items-start">
                                    <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-primary/10 bg-white md:w-72">
                                        {content.hero.imageSrc ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={content.hero.imageSrc}
                                                alt={content.hero.imageAlt || "Portada"}
                                                className="h-full w-full object-cover"
                                                style={{ objectPosition: content.hero.imagePosition || "60% 35%" }}
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-sm text-[#89616f]">
                                                Sin imagen de portada
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                type="button"
                                                onClick={openHeroUploader}
                                                disabled={uploadingHero || saving}
                                                className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {uploadingHero ? "Subiendo..." : "Subir portada"}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setContent((prev) => ({
                                                        ...prev,
                                                        hero: {
                                                            ...prev.hero,
                                                            imageSrc: "/hero.jpg",
                                                            imagePublicId: "",
                                                        },
                                                    }))
                                                }
                                                disabled={uploadingHero || saving}
                                                className="rounded-full border border-red-200 px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                Restaurar portada base
                                            </button>
                                        </div>

                                        <TextField
                                            label="Alt imagen portada"
                                            value={content.hero.imageAlt}
                                            onChange={(value) => updateSection("hero", { imageAlt: value })}
                                            placeholder="Ej: Trenzas africanas en primer plano"
                                        />

                                        <TextField
                                            label="Posición imagen (object-position)"
                                            value={content.hero.imagePosition}
                                            onChange={(value) => updateSection("hero", { imagePosition: value })}
                                            placeholder="Ej: 60% 35%"
                                        />

                                        <TextField
                                            label="URL imagen portada"
                                            value={content.hero.imageSrc}
                                            onChange={(value) => updateSection("hero", { imageSrc: value })}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <TextField
                            label="Badge"
                            value={content.hero.badge}
                            onChange={(value) => updateSection("hero", { badge: value })}
                        />
                        <TextField
                            label="Botón principal"
                            value={content.hero.primaryCta}
                            onChange={(value) => updateSection("hero", { primaryCta: value })}
                        />
                        <div className="md:col-span-2">
                            <TextField
                                label="Título principal"
                                value={content.hero.title}
                                onChange={(value) => updateSection("hero", { title: value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <TextAreaField
                                label="Subtítulo"
                                value={content.hero.subtitle}
                                onChange={(value) => updateSection("hero", { subtitle: value })}
                            />
                        </div>
                        <TextField
                            label="Botón secundario"
                            value={content.hero.secondaryCta}
                            onChange={(value) => updateSection("hero", { secondaryCta: value })}
                        />
                    </div>
                </SectionCard>
            </SectionAnchor>

            <SectionAnchor sectionKey="services" sectionRefs={sectionRefs}>
                <SectionCard title="Servicios" subtitle="Título de sección y textos comunes de tarjetas">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <TextField
                            label="Título sección"
                            value={content.services.title}
                            onChange={(value) => updateSection("services", { title: value })}
                        />
                        <TextField
                            label="Prefijo botón cotizar"
                            value={content.services.quotePrefix}
                            onChange={(value) => updateSection("services", { quotePrefix: value })}
                        />
                        <div className="md:col-span-2">
                            <TextAreaField
                                label="Introducción"
                                value={content.services.intro}
                                onChange={(value) => updateSection("services", { intro: value })}
                            />
                        </div>
                        <TextField
                            label="Texto sin imagen"
                            value={content.services.missingImageText}
                            onChange={(value) => updateSection("services", { missingImageText: value })}
                        />
                        <TextField
                            label="Texto sin servicios"
                            value={content.services.emptyText}
                            onChange={(value) => updateSection("services", { emptyText: value })}
                        />
                    </div>
                </SectionCard>
            </SectionAnchor>

            <SectionAnchor sectionKey="beforeAfter" sectionRefs={sectionRefs}>
                <SectionCard title="Antes / Después">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <TextField
                            label="Título sección"
                            value={content.beforeAfter.title}
                            onChange={(value) => updateSection("beforeAfter", { title: value })}
                        />
                        <TextField
                            label="Badge tarjeta"
                            value={content.beforeAfter.cardBadge}
                            onChange={(value) => updateSection("beforeAfter", { cardBadge: value })}
                        />
                        <div className="md:col-span-2">
                            <TextAreaField
                                label="Introducción"
                                value={content.beforeAfter.intro}
                                onChange={(value) => updateSection("beforeAfter", { intro: value })}
                            />
                        </div>
                        <TextField
                            label="Texto cargando"
                            value={content.beforeAfter.loadingText}
                            onChange={(value) => updateSection("beforeAfter", { loadingText: value })}
                        />
                        <TextField
                            label="Texto vacío"
                            value={content.beforeAfter.emptyText}
                            onChange={(value) => updateSection("beforeAfter", { emptyText: value })}
                        />
                        <TextField
                            label="Texto sin imagen"
                            value={content.beforeAfter.missingImageText}
                            onChange={(value) => updateSection("beforeAfter", { missingImageText: value })}
                        />
                        <TextField
                            label="Etiqueta antes"
                            value={content.beforeAfter.beforeLabel}
                            onChange={(value) => updateSection("beforeAfter", { beforeLabel: value })}
                        />
                        <TextField
                            label="Etiqueta después"
                            value={content.beforeAfter.afterLabel}
                            onChange={(value) => updateSection("beforeAfter", { afterLabel: value })}
                        />
                        <TextAreaField
                            label="Tip en tarjeta"
                            value={content.beforeAfter.cardTip}
                            onChange={(value) => updateSection("beforeAfter", { cardTip: value })}
                        />
                        <TextAreaField
                            label="Tip final de sección"
                            value={content.beforeAfter.sectionTip}
                            onChange={(value) => updateSection("beforeAfter", { sectionTip: value })}
                        />
                    </div>
                </SectionCard>
            </SectionAnchor>

            <SectionAnchor sectionKey="process" sectionRefs={sectionRefs}>
                <SectionCard title="Proceso">
                    <div className="space-y-6">
                        <TextField
                            label="Título de sección"
                            value={content.process.title}
                            onChange={(value) => updateSection("process", { title: value })}
                        />

                        {content.process.steps.map((step, index) => (
                            <div key={index} className="space-y-4 rounded-2xl border border-primary/10 bg-[#fdfafb] p-4">
                                <div className="flex items-center justify-between">
                                    <p className="font-bold text-[#181113]">Paso {index + 1}</p>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setContent((prev) => ({
                                                ...prev,
                                                process: {
                                                    ...prev.process,
                                                    steps: prev.process.steps.filter((_, i) => i !== index),
                                                },
                                            }))
                                        }
                                        className="rounded-full border border-red-200 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                                    >
                                        Eliminar paso
                                    </button>
                                </div>

                                <TextField
                                    label="Título"
                                    value={step.title}
                                    onChange={(value) =>
                                        setContent((prev) => ({
                                            ...prev,
                                            process: {
                                                ...prev.process,
                                                steps: prev.process.steps.map((item, i) =>
                                                    i === index ? { ...item, title: value } : item
                                                ),
                                            },
                                        }))
                                    }
                                />

                                <TextAreaField
                                    label="Texto"
                                    value={step.text}
                                    onChange={(value) =>
                                        setContent((prev) => ({
                                            ...prev,
                                            process: {
                                                ...prev.process,
                                                steps: prev.process.steps.map((item, i) =>
                                                    i === index ? { ...item, text: value } : item
                                                ),
                                            },
                                        }))
                                    }
                                />

                                <ArrayStringEditor
                                    label="Bullets"
                                    items={step.bullets ?? []}
                                    onChange={(items) =>
                                        setContent((prev) => ({
                                            ...prev,
                                            process: {
                                                ...prev.process,
                                                steps: prev.process.steps.map((item, i) =>
                                                    i === index ? { ...item, bullets: items } : item
                                                ),
                                            },
                                        }))
                                    }
                                    addLabel="Agregar bullet"
                                />
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() =>
                                setContent((prev) => ({
                                    ...prev,
                                    process: {
                                        ...prev.process,
                                        steps: [...prev.process.steps, { title: "", text: "", bullets: [] }],
                                    },
                                }))
                            }
                            className="rounded-full border border-primary/20 px-5 py-3 text-sm font-bold text-primary hover:bg-primary/5"
                        >
                            Agregar paso
                        </button>
                    </div>
                </SectionCard>
            </SectionAnchor>

            <SectionAnchor sectionKey="coverage" sectionRefs={sectionRefs}>
                <SectionCard title="Cobertura">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <TextField
                            label="Badge"
                            value={content.coverage.badge}
                            onChange={(value) => updateSection("coverage", { badge: value })}
                        />
                        <TextField
                            label="Título"
                            value={content.coverage.title}
                            onChange={(value) => updateSection("coverage", { title: value })}
                        />
                        <TextField
                            label="Label cubrimos"
                            value={content.coverage.coveredLabel}
                            onChange={(value) => updateSection("coverage", { coveredLabel: value })}
                        />
                        <TextField
                            label="Badge zona"
                            value={content.coverage.zoneBadge}
                            onChange={(value) => updateSection("coverage", { zoneBadge: value })}
                        />
                        <div className="md:col-span-2">
                            <TextAreaField
                                label="Texto cercanía"
                                value={content.coverage.nearbyText}
                                onChange={(value) => updateSection("coverage", { nearbyText: value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <TextAreaField
                                label="Descripción"
                                value={content.coverage.description}
                                onChange={(value) => updateSection("coverage", { description: value })}
                            />
                        </div>
                        <TextField
                            label="Texto botón mapa"
                            value={content.coverage.mapButton}
                            onChange={(value) => updateSection("coverage", { mapButton: value })}
                        />
                        <TextField
                            label="URL Google Maps"
                            value={content.coverage.mapHref}
                            onChange={(value) => updateSection("coverage", { mapHref: value })}
                        />
                        <div className="md:col-span-2">
                            <TextAreaField
                                label="Embed del mapa"
                                value={content.coverage.mapEmbedSrc}
                                onChange={(value) => updateSection("coverage", { mapEmbedSrc: value })}
                            />
                        </div>
                    </div>

                    <ArrayStringEditor
                        label="Zonas"
                        items={content.coverage.zones}
                        onChange={(items) => updateSection("coverage", { zones: items })}
                        addLabel="Agregar zona"
                    />

                    <ArrayStringEditor
                        label="Beneficios"
                        items={content.coverage.benefits}
                        onChange={(items) => updateSection("coverage", { benefits: items })}
                        addLabel="Agregar beneficio"
                    />
                </SectionCard>
            </SectionAnchor>

            <SectionAnchor sectionKey="policies" sectionRefs={sectionRefs}>
                <SectionCard title="Políticas">
                    <div className="space-y-6">
                        <TextField
                            label="Título"
                            value={content.policies.title}
                            onChange={(value) => updateSection("policies", { title: value })}
                        />

                        {content.policies.groups.map((group, groupIndex) => (
                            <div key={groupIndex} className="space-y-4 rounded-2xl border border-primary/10 bg-[#fdfafb] p-4">
                                <div className="flex items-center justify-between">
                                    <p className="font-bold text-[#181113]">Grupo {groupIndex + 1}</p>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setContent((prev) => ({
                                                ...prev,
                                                policies: {
                                                    ...prev.policies,
                                                    groups: prev.policies.groups.filter((_, i) => i !== groupIndex),
                                                },
                                            }))
                                        }
                                        className="rounded-full border border-red-200 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                                    >
                                        Eliminar grupo
                                    </button>
                                </div>

                                <TextField
                                    label="Título grupo"
                                    value={group.title}
                                    onChange={(value) =>
                                        setContent((prev) => ({
                                            ...prev,
                                            policies: {
                                                ...prev.policies,
                                                groups: prev.policies.groups.map((item, i) =>
                                                    i === groupIndex ? { ...item, title: value } : item
                                                ),
                                            },
                                        }))
                                    }
                                />

                                <ArrayStringEditor
                                    label="Items"
                                    items={group.items}
                                    onChange={(items) =>
                                        setContent((prev) => ({
                                            ...prev,
                                            policies: {
                                                ...prev.policies,
                                                groups: prev.policies.groups.map((item, i) =>
                                                    i === groupIndex ? { ...item, items } : item
                                                ),
                                            },
                                        }))
                                    }
                                    addLabel="Agregar item"
                                />
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() =>
                                setContent((prev) => ({
                                    ...prev,
                                    policies: {
                                        ...prev.policies,
                                        groups: [...prev.policies.groups, { title: "", items: [""] }],
                                    },
                                }))
                            }
                            className="rounded-full border border-primary/20 px-5 py-3 text-sm font-bold text-primary hover:bg-primary/5"
                        >
                            Agregar grupo
                        </button>
                    </div>
                </SectionCard>
            </SectionAnchor>

            <SectionAnchor sectionKey="reviewForm" sectionRefs={sectionRefs}>
                <SectionCard title="Formulario de testimonios">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <TextField
                            label="Título"
                            value={content.reviewForm.title}
                            onChange={(value) => updateSection("reviewForm", { title: value })}
                        />
                        <TextField
                            label="Badge tiempo"
                            value={content.reviewForm.timeBadge}
                            onChange={(value) => updateSection("reviewForm", { timeBadge: value })}
                        />
                        <div className="md:col-span-2">
                            <TextAreaField
                                label="Subtítulo"
                                value={content.reviewForm.subtitle}
                                onChange={(value) => updateSection("reviewForm", { subtitle: value })}
                            />
                        </div>

                        <TextField
                            label="Label nombre"
                            value={content.reviewForm.nameLabel}
                            onChange={(value) => updateSection("reviewForm", { nameLabel: value })}
                        />
                        <TextField
                            label="Placeholder nombre"
                            value={content.reviewForm.namePlaceholder}
                            onChange={(value) => updateSection("reviewForm", { namePlaceholder: value })}
                        />

                        <TextField
                            label="Label comuna"
                            value={content.reviewForm.comunaLabel}
                            onChange={(value) => updateSection("reviewForm", { comunaLabel: value })}
                        />
                        <TextField
                            label="Placeholder comuna"
                            value={content.reviewForm.comunaPlaceholder}
                            onChange={(value) => updateSection("reviewForm", { comunaPlaceholder: value })}
                        />

                        <TextField
                            label="Label estrellas"
                            value={content.reviewForm.starsLabel}
                            onChange={(value) => updateSection("reviewForm", { starsLabel: value })}
                        />
                        <TextField
                            label="Label comentario"
                            value={content.reviewForm.textLabel}
                            onChange={(value) => updateSection("reviewForm", { textLabel: value })}
                        />

                        <div className="md:col-span-2">
                            <TextAreaField
                                label="Placeholder comentario"
                                value={content.reviewForm.textPlaceholder}
                                onChange={(value) => updateSection("reviewForm", { textPlaceholder: value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <TextAreaField
                                label="Nota moderación"
                                value={content.reviewForm.moderationNote}
                                onChange={(value) => updateSection("reviewForm", { moderationNote: value })}
                            />
                        </div>

                        <TextField
                            label="Texto botón"
                            value={content.reviewForm.submit}
                            onChange={(value) => updateSection("reviewForm", { submit: value })}
                        />
                        <TextField
                            label="Texto botón enviando"
                            value={content.reviewForm.submitSending}
                            onChange={(value) => updateSection("reviewForm", { submitSending: value })}
                        />

                        <div className="md:col-span-2">
                            <TextAreaField
                                label="Texto ayuda"
                                value={content.reviewForm.helper}
                                onChange={(value) => updateSection("reviewForm", { helper: value })}
                            />
                        </div>

                        <TextField
                            label="Título éxito"
                            value={content.reviewForm.successTitle}
                            onChange={(value) => updateSection("reviewForm", { successTitle: value })}
                        />
                        <TextAreaField
                            label="Texto éxito"
                            value={content.reviewForm.successText}
                            onChange={(value) => updateSection("reviewForm", { successText: value })}
                        />
                    </div>
                </SectionCard>
            </SectionAnchor>

            <SectionAnchor sectionKey="testimonials" sectionRefs={sectionRefs}>
                <SectionCard title="Testimonios publicados">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <TextField
                            label="Título"
                            value={content.testimonials.title}
                            onChange={(value) => updateSection("testimonials", { title: value })}
                        />
                        <TextField
                            label="Texto cargando"
                            value={content.testimonials.loadingText}
                            onChange={(value) => updateSection("testimonials", { loadingText: value })}
                        />
                        <div className="md:col-span-2">
                            <TextAreaField
                                label="Introducción"
                                value={content.testimonials.intro}
                                onChange={(value) => updateSection("testimonials", { intro: value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <TextAreaField
                                label="Texto vacío"
                                value={content.testimonials.emptyText}
                                onChange={(value) => updateSection("testimonials", { emptyText: value })}
                            />
                        </div>
                    </div>
                </SectionCard>
            </SectionAnchor>

            <SectionAnchor sectionKey="gallery" sectionRefs={sectionRefs}>
                <SectionCard title="Galería">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <TextField
                            label="Título"
                            value={content.gallery.title}
                            onChange={(value) => updateSection("gallery", { title: value })}
                        />
                        <TextField
                            label="Texto cargando"
                            value={content.gallery.loadingText}
                            onChange={(value) => updateSection("gallery", { loadingText: value })}
                        />
                        <div className="md:col-span-2">
                            <TextAreaField
                                label="Introducción"
                                value={content.gallery.intro}
                                onChange={(value) => updateSection("gallery", { intro: value })}
                            />
                        </div>

                        <TextField
                            label="Título reels"
                            value={content.gallery.reelsTitle}
                            onChange={(value) => updateSection("gallery", { reelsTitle: value })}
                        />
                        <TextField
                            label="Texto reels"
                            value={content.gallery.reelsIntro}
                            onChange={(value) => updateSection("gallery", { reelsIntro: value })}
                        />

                        <TextField
                            label="Texto tocar reel"
                            value={content.gallery.reelsTapText}
                            onChange={(value) => updateSection("gallery", { reelsTapText: value })}
                        />
                        <TextField
                            label="Alt por defecto imagen"
                            value={content.gallery.defaultImageAlt}
                            onChange={(value) => updateSection("gallery", { defaultImageAlt: value })}
                        />

                        <TextField
                            label="Título fotos"
                            value={content.gallery.photosTitle}
                            onChange={(value) => updateSection("gallery", { photosTitle: value })}
                        />
                        <TextField
                            label="Texto fotos"
                            value={content.gallery.photosIntro}
                            onChange={(value) => updateSection("gallery", { photosIntro: value })}
                        />

                        <TextField
                            label="Texto vacío"
                            value={content.gallery.emptyText}
                            onChange={(value) => updateSection("gallery", { emptyText: value })}
                        />
                        <TextField
                            label="Texto botón cargar más"
                            value={content.gallery.loadMore}
                            onChange={(value) => updateSection("gallery", { loadMore: value })}
                        />

                        <div className="md:col-span-2">
                            <TextAreaField
                                label="Texto todo cargado"
                                value={content.gallery.allLoadedText}
                                onChange={(value) => updateSection("gallery", { allLoadedText: value })}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <TextAreaField
                                label="Tip modal foto"
                                value={content.gallery.modalTip}
                                onChange={(value) => updateSection("gallery", { modalTip: value })}
                            />
                        </div>
                    </div>
                </SectionCard>
            </SectionAnchor>

            <SectionAnchor sectionKey="faq" sectionRefs={sectionRefs}>
                <SectionCard title="FAQ">
                    <div className="space-y-6">
                        <TextField
                            label="Título"
                            value={content.faq.title}
                            onChange={(value) => updateSection("faq", { title: value })}
                        />

                        {content.faq.items.map((item, index) => (
                            <div key={index} className="space-y-4 rounded-2xl border border-primary/10 bg-[#fdfafb] p-4">
                                <div className="flex items-center justify-between">
                                    <p className="font-bold text-[#181113]">Pregunta {index + 1}</p>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setContent((prev) => ({
                                                ...prev,
                                                faq: {
                                                    ...prev.faq,
                                                    items: prev.faq.items.filter((_, i) => i !== index),
                                                },
                                            }))
                                        }
                                        className="rounded-full border border-red-200 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                                    >
                                        Eliminar
                                    </button>
                                </div>

                                <TextField
                                    label="Pregunta"
                                    value={item.q}
                                    onChange={(value) =>
                                        setContent((prev) => ({
                                            ...prev,
                                            faq: {
                                                ...prev.faq,
                                                items: prev.faq.items.map((faqItem, i) =>
                                                    i === index ? { ...faqItem, q: value } : faqItem
                                                ),
                                            },
                                        }))
                                    }
                                />

                                <TextAreaField
                                    label="Respuesta"
                                    value={item.a}
                                    onChange={(value) =>
                                        setContent((prev) => ({
                                            ...prev,
                                            faq: {
                                                ...prev.faq,
                                                items: prev.faq.items.map((faqItem, i) =>
                                                    i === index ? { ...faqItem, a: value } : faqItem
                                                ),
                                            },
                                        }))
                                    }
                                />
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={() =>
                                setContent((prev) => ({
                                    ...prev,
                                    faq: {
                                        ...prev.faq,
                                        items: [...prev.faq.items, { q: "", a: "" }],
                                    },
                                }))
                            }
                            className="rounded-full border border-primary/20 px-5 py-3 text-sm font-bold text-primary hover:bg-primary/5"
                        >
                            Agregar pregunta
                        </button>
                    </div>
                </SectionCard>
            </SectionAnchor>

            <SectionAnchor sectionKey="footer" sectionRefs={sectionRefs}>
                <SectionCard title="Footer">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <TextField
                            label="Marca"
                            value={content.footer.brand}
                            onChange={(value) => updateSection("footer", { brand: value })}
                        />
                        <TextField
                            label="Título contacto"
                            value={content.footer.contactTitle}
                            onChange={(value) => updateSection("footer", { contactTitle: value })}
                        />
                        <div className="md:col-span-2">
                            <TextAreaField
                                label="Descripción"
                                value={content.footer.description}
                                onChange={(value) => updateSection("footer", { description: value })}
                            />
                        </div>
                        <TextField
                            label="Teléfono"
                            value={content.footer.phone}
                            onChange={(value) => updateSection("footer", { phone: value })}
                        />
                        <TextField
                            label="WhatsApp phone (solo número o con +)"
                            value={content.footer.whatsappPhone}
                            onChange={(value) => updateSection("footer", { whatsappPhone: value })}
                        />
                        <TextField
                            label="Ubicación"
                            value={content.footer.location}
                            onChange={(value) => updateSection("footer", { location: value })}
                        />
                        <TextField
                            label="Horario"
                            value={content.footer.schedule}
                            onChange={(value) => updateSection("footer", { schedule: value })}
                        />
                        <TextField
                            label="Título redes"
                            value={content.footer.socialTitle}
                            onChange={(value) => updateSection("footer", { socialTitle: value })}
                        />
                        <TextField
                            label="Instagram URL"
                            value={content.footer.instagramUrl}
                            onChange={(value) => updateSection("footer", { instagramUrl: value })}
                        />
                        <div className="md:col-span-2">
                            <TextAreaField
                                label="Copyright"
                                value={content.footer.copyright}
                                onChange={(value) => updateSection("footer", { copyright: value })}
                            />
                        </div>
                    </div>
                </SectionCard>
            </SectionAnchor>

            <SectionAnchor sectionKey="modals" sectionRefs={sectionRefs}>
                <SectionCard title="Modales">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <TextField
                            label="Modal WhatsApp título"
                            value={content.modals.whatsappTitle}
                            onChange={(value) => updateSection("modals", { whatsappTitle: value })}
                        />
                        <TextField
                            label="Modal WhatsApp subtítulo"
                            value={content.modals.whatsappSubtitle}
                            onChange={(value) => updateSection("modals", { whatsappSubtitle: value })}
                        />
                        <TextField
                            label="Modal reel título"
                            value={content.modals.reelTitle}
                            onChange={(value) => updateSection("modals", { reelTitle: value })}
                        />
                        <TextField
                            label="Modal reel subtítulo"
                            value={content.modals.reelSubtitle}
                            onChange={(value) => updateSection("modals", { reelSubtitle: value })}
                        />
                        <TextField
                            label="Modal foto título"
                            value={content.modals.photoTitle}
                            onChange={(value) => updateSection("modals", { photoTitle: value })}
                        />
                    </div>
                </SectionCard>
            </SectionAnchor>
        </div>
    );
}