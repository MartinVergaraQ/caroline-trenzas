"use client";

import Modal from "@/components/modal";
import WhatsAppLeadForm from "@/components/WhatsAppLeadForm";
import { alerts } from "@/lib/alerts";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { defaultLandingContent, type LandingContent } from "@/lib/landing-content";

type GalleryItem = {
    publicId: string;
    src: string;
    createdAt?: string;
    mediaType: "image" | "video";
    alt?: string;
    width?: number;
    height?: number;
    tags?: string[];
};

type Testimonial = { id: string; name: string; comuna: string; stars: number; text: string; createdAt: string };
type BAEntry = {
    serviceId: string;
    title: string;
    before?: { publicId: string; src: string };
    after?: { publicId: string; src: string };
};

const buildWhatsAppText = (service?: string) => {
    const s = service ? `Hola! Quiero cotizar ${service}.` : "Hola! Quiero cotizar un servicio.";
    const extra = service ? `\n\nSi puedes, envíame una foto del estilo de ${service} que te gustaría.` : "";
    return (
        `${s}${extra}\n\nPara cotizar, te envío:` +
        `\n• Foto de mi cabello (opcional, pero ayuda mucho)` +
        `\n• Largo (corto/medio/largo o foto)` +
        `\n• Idea / referencia` +
        `\n• Fecha y comuna` +
        `\n\n⏱ Respondemos lo antes posible (máximo 2 horas).` +
        `\n💳 Se pide abono para reservar (te explico monto y datos).`
    );
};

const waLink = (phone: string, text: string) =>
    `https://wa.me/${phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(text)}`;

function ReviewForm({
    onSent,
    content,
}: {
    onSent: () => void;
    content: LandingContent["reviewForm"];
}) {
    const [name, setName] = useState("");
    const [comuna, setComuna] = useState("San Bernardo");
    const [stars, setStars] = useState(5);
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [done, setDone] = useState(false);
    const SENT_KEY = "ct_testimonial_sent_at";
    const isDev = process.env.NODE_ENV !== "production";
    const COOLDOWN_MS = isDev ? 10 * 1000 : 12 * 60 * 60 * 1000;
    const [website, setWebsite] = useState("");

    const canSend = name.trim().length >= 2 && text.trim().length >= 6 && !sending;

    useEffect(() => {
        if (isDev) return;
        try {
            const raw = localStorage.getItem(SENT_KEY);
            if (!raw) return;
            const sentAt = Number(raw);
            if (!Number.isFinite(sentAt)) return;

            const age = Date.now() - sentAt;
            if (age >= 0 && age < COOLDOWN_MS) {
                setDone(true);
            } else {
                localStorage.removeItem(SENT_KEY);
            }
        } catch {
            // ignore
        }
    }, [isDev, COOLDOWN_MS]);

    async function submit() {
        if (!canSend) return;
        setSending(true);
        try {
            const r = await fetch("/api/testimonials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, comuna, stars, text, website }),
            });
            const data = await r.json().catch(() => ({}));

            if (!r.ok) {
                if (r.status === 429) {
                    alerts.info("Gracias 💛", data?.message || "Ya recibimos tu testimonio.");
                    if (!isDev) {
                        try { localStorage.setItem(SENT_KEY, String(Date.now())); } catch { }
                    }
                    setDone(true);
                    return;
                }

                alerts.error("No se pudo enviar", data?.message || `HTTP ${r.status}`);
                return;
            }

            if (!isDev) {
                try { localStorage.setItem(SENT_KEY, String(Date.now())); } catch { }
            }

            setDone(true);
            onSent();
        } finally {
            setSending(false);
        }
    }

    if (done) {
        return (
            <div className="overflow-hidden rounded-[26px] border border-primary/10 bg-white shadow-[0_14px_44px_-28px_rgba(236,72,153,0.22)]">
                <div className="bg-[linear-gradient(180deg,#fff5f9_0%,#ffffff_100%)] px-6 py-8 text-center">
                    <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10">
                        <span className="material-symbols-outlined text-primary">favorite</span>
                    </div>
                    <p className="text-xl md:text-2xl font-black tracking-tight text-[#181113]">
                        {content.successTitle}
                    </p>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#89616f]">
                        {content.successText}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-[26px] border border-primary/10 bg-white shadow-[0_14px_44px_-28px_rgba(236,72,153,0.22)]">
            <div className="border-b border-primary/10 bg-[linear-gradient(180deg,#fff5f9_0%,#ffffff_100%)] px-5 py-5 md:px-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">
                    <span className="material-symbols-outlined text-[15px]">rate_review</span>
                    Opinión real
                </div>

                <h3 className="mt-3 text-[30px] leading-tight font-black tracking-tight text-[#181113]">
                    {content.title}
                </h3>
                <p className="mt-2 text-sm text-[#89616f]">
                    {content.subtitle}
                </p>
            </div>

            <div className="p-5 md:p-6">
                <div className="mb-5 grid gap-2.5 md:grid-cols-3">
                    <div className="rounded-2xl border border-primary/10 bg-[#fffafb] px-4 py-2.5">
                        <p className="text-sm font-black text-[#181113]">1 minuto</p>
                        <p className="text-xs text-[#89616f]">Deja tu opinión rápido.</p>
                    </div>

                    <div className="rounded-2xl border border-primary/10 bg-[#fffafb] px-4 py-2.5">
                        <p className="text-sm font-black text-[#181113]">Revisión previa</p>
                        <p className="text-xs text-[#89616f]">Se valida antes de publicarse.</p>
                    </div>

                    <div className="rounded-2xl border border-primary/10 bg-[#fffafb] px-4 py-2.5">
                        <p className="text-sm font-black text-[#181113]">Máximo 3 visibles</p>
                        <p className="text-xs text-[#89616f]">Mostramos solo las mejores.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[#89616f]">
                            {content.nameLabel}
                        </label>
                        <input
                            className="w-full rounded-2xl border border-[#f1e6eb] bg-[#fffafb] px-4 py-3 text-sm text-[#181113] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                            placeholder={content.namePlaceholder}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoComplete="name"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[#89616f]">
                            {content.comunaLabel}
                        </label>
                        <input
                            className="w-full rounded-2xl border border-[#f1e6eb] bg-[#fffafb] px-4 py-3 text-sm text-[#181113] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                            placeholder={content.comunaPlaceholder}
                            value={comuna}
                            onChange={(e) => setComuna(e.target.value)}
                            autoComplete="address-level2"
                        />
                    </div>
                </div>

                <div className="mt-5">
                    <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[#89616f]">
                        {content.starsLabel}
                    </label>

                    <div className="grid grid-cols-5 gap-2">
                        {Array.from({ length: 5 }).map((_, i) => {
                            const n = i + 1;
                            const active = n <= stars;

                            return (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setStars(n)}
                                    aria-label={`${n} estrellas`}
                                    className={[
                                        "rounded-2xl border px-2 py-2.5 text-center text-sm font-black transition",
                                        active
                                            ? "border-primary bg-primary text-white shadow-lg shadow-primary/20"
                                            : "border-primary/15 bg-white text-[#181113] hover:bg-primary/5",
                                    ].join(" ")}
                                >
                                    <div className="text-base">★</div>
                                    <div className="mt-1 text-[11px]">{n}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-5">
                    <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[#89616f]">
                        {content.textLabel}
                    </label>
                    <textarea
                        className="min-h-[128px] w-full rounded-[22px] border border-[#f1e6eb] bg-[#fffafb] px-4 py-4 text-sm text-[#181113] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
                        rows={4}
                        placeholder={content.textPlaceholder}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="text-xs text-[#89616f]">{content.moderationNote}</p>
                        <p className="text-xs font-semibold text-[#89616f]">
                            {Math.min(text.length, 240)} / 240
                        </p>
                    </div>
                </div>

                <input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                />

                <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-[22px] border border-primary/10 bg-[#fff7fa] p-3.5">
                    <div>
                        <p className="text-sm font-black text-[#181113]">¿Nos dejas tu experiencia?</p>
                        <p className="text-xs text-[#89616f]">
                            Tu comentario ayuda a otras clientas a confiar y elegir mejor.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={submit}
                        disabled={!canSend}
                        className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-black text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
                    >
                        {sending ? content.submitSending : content.submit}
                    </button>
                </div>

                {!canSend ? (
                    <p className="mt-3 text-center text-xs text-[#89616f]">
                        {content.helper}
                    </p>
                ) : null}
            </div>
        </div>
    );
}

function Stars({ n }: { n: number }) {
    const full = "★★★★★".slice(0, Math.max(0, Math.min(5, n)));
    const empty = "★★★★★".slice(0, 5 - Math.max(0, Math.min(5, n)));
    return (
        <p className="text-yellow-600 text-sm">
            {full} <span className="text-black/10">{empty}</span>
        </p>
    );
}
function PoliciesPremiumSection({
    content,
}: {
    content: LandingContent["policies"];
}) {
    const icons = ["spa", "event_busy", "schedule"];

    return (
        <section className="px-6 lg:px-40 py-14 bg-[linear-gradient(180deg,#fffbfd_0%,#fff7fa_100%)]">
            <div className="max-w-[1100px] mx-auto">
                <div className="overflow-hidden rounded-[32px] border border-primary/10 bg-white shadow-[0_24px_80px_-36px_rgba(236,72,153,0.24)]">
                    <div className="border-b border-primary/10 bg-[linear-gradient(180deg,#fff4f8_0%,#ffffff_100%)] px-6 py-6 md:px-8">
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">
                            <span className="material-symbols-outlined text-[15px]">verified_user</span>
                            Información importante
                        </div>

                        <h2 className="mt-4 text-3xl font-black tracking-tight text-[#181113]">
                            {content.title}
                        </h2>

                        <p className="mt-2 max-w-2xl text-sm text-[#89616f]">
                            Todo claro antes de reservar: preparación, confirmación y tiempos estimados.
                        </p>
                    </div>

                    <div className="grid gap-4 p-6 md:grid-cols-3 md:p-8">
                        {content.groups.map((group, i) => (
                            <div
                                key={`${group.title}-${i}`}
                                className="rounded-[24px] border border-primary/10 bg-[#fffafb] p-5"
                            >
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        <span className="material-symbols-outlined">
                                            {icons[i] ?? "info"}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-black tracking-tight text-[#181113]">
                                        {group.title}
                                    </h3>
                                </div>

                                <div className="space-y-3">
                                    {group.items.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 border border-primary/10"
                                        >
                                            <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                <span className="material-symbols-outlined text-[14px]">check</span>
                                            </span>
                                            <p className="text-sm leading-relaxed text-[#6f5861]">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function BeforeAfterPremiumCard({
    item,
    badge,
    beforeLabel,
    afterLabel,
    missingImageText,
    onQuote,
}: {
    item: BAEntry;
    badge: string;
    beforeLabel: string;
    afterLabel: string;
    missingImageText: string;
    onQuote: (service: string) => void;
}) {
    return (
        <article className="group overflow-hidden rounded-[30px] border border-primary/10 bg-white shadow-[0_18px_50px_-28px_rgba(236,72,153,0.24)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_-24px_rgba(236,72,153,0.30)]">
            <div className="p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="text-[30px] leading-tight font-black tracking-tight text-[#181113]">
                            {item.title}
                        </h3>
                        <p className="mt-1 text-sm text-[#89616f]">
                            Resultado real y acabado prolijo.
                        </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                        {badge}
                    </span>
                </div>

                <div className="relative grid grid-cols-2 gap-3">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-[#faf7f8]">
                        {item.before?.src ? (
                            <Image
                                src={item.before.src}
                                alt={`Antes - ${item.title}`}
                                fill
                                sizes="(max-width: 768px) 50vw, 25vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs font-semibold text-[#89616f]">
                                {missingImageText}
                            </div>
                        )}

                        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#181113] shadow-sm">
                            {beforeLabel}
                        </span>
                    </div>

                    <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-[#faf7f8]">
                        {item.after?.src ? (
                            <Image
                                src={item.after.src}
                                alt={`Después - ${item.title}`}
                                fill
                                sizes="(max-width: 768px) 50vw, 25vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs font-semibold text-[#89616f]">
                                {missingImageText}
                            </div>
                        )}

                        <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                            {afterLabel}
                        </span>
                    </div>

                    <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-primary/10 bg-white shadow-md">
                        <span className="material-symbols-outlined text-primary text-[16px]">
                            compare_arrows
                        </span>
                    </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-[#89616f]">
                    Envíanos una foto de tu cabello y una referencia para cotizar algo similar.
                </p>

                <button
                    type="button"
                    onClick={() => onQuote(item.title)}
                    className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
                >
                    Cotizar {item.title}
                </button>
            </div>
        </article>
    );
}

function TestimonialsSection({
    loading,
    testimonials,
    content,
}: {
    loading: boolean;
    testimonials: Testimonial[];
    content: LandingContent["testimonials"];
}) {
    const items = testimonials.slice(0, 3);

    return (
        <section className="px-6 lg:px-40 py-8 lg:py-10 bg-white">
            <div className="max-w-[980px] mx-auto">
                <div className="mb-7 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">
                        <span className="material-symbols-outlined text-[15px]">favorite</span>
                        Opiniones reales
                    </div>

                    <h2 className="mt-4 text-3xl lg:text-4xl font-black tracking-tight text-[#181113]">
                        {content.title}
                    </h2>
                    <p className="mt-3 text-sm md:text-base text-[#89616f]">
                        {content.intro}
                    </p>
                </div>

                {loading ? (
                    <div className="rounded-[26px] border border-primary/10 bg-[#fffafb] p-8 text-center">
                        <p className="text-[#89616f]">{content.loadingText}</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="rounded-[26px] border border-primary/10 bg-[#fffafb] p-8 text-center">
                        <p className="text-[#89616f]">{content.emptyText}</p>
                    </div>
                ) : items.length === 1 ? (
                    <div className="mx-auto max-w-[680px]">
                        <article className="overflow-hidden rounded-[28px] border border-primary/10 bg-white shadow-[0_18px_52px_-30px_rgba(236,72,153,0.24)]">
                            <div className="border-b border-primary/10 bg-[linear-gradient(180deg,#fff5f9_0%,#ffffff_100%)] p-5 md:p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-lg md:text-xl font-black tracking-tight text-[#181113]">
                                            {items[0].name}
                                        </p>
                                        <p className="mt-1 text-sm text-[#89616f]">{items[0].comuna}</p>
                                    </div>

                                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">
                                        {new Date(items[0].createdAt).toLocaleDateString("es-CL")}
                                    </span>
                                </div>

                                <div className="mt-4">
                                    <Stars n={items[0].stars} />
                                </div>
                            </div>

                            <div className="p-5 md:p-6">
                                <span className="material-symbols-outlined mb-3 text-3xl text-primary/20">
                                    format_quote
                                </span>
                                <p className="text-base md:text-lg leading-relaxed text-[#181113]">
                                    “{items[0].text}”
                                </p>
                            </div>
                        </article>
                    </div>
                ) : items.length === 2 ? (
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {items.map((t) => (
                            <article
                                key={t.id}
                                className="overflow-hidden rounded-[26px] border border-primary/10 bg-white shadow-[0_16px_42px_-28px_rgba(236,72,153,0.20)]"
                            >
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-lg font-black tracking-tight text-[#181113]">
                                                {t.name}
                                            </p>
                                            <p className="text-sm text-[#89616f]">{t.comuna}</p>
                                        </div>

                                        <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">
                                            {new Date(t.createdAt).toLocaleDateString("es-CL")}
                                        </span>
                                    </div>

                                    <div className="mt-3">
                                        <Stars n={t.stars} />
                                    </div>

                                    <p className="mt-4 text-sm leading-relaxed text-[#181113]">
                                        “{t.text}”
                                    </p>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr,0.95fr,0.95fr]">
                        {items.map((t, idx) => {
                            const featured = idx === 0;

                            return (
                                <article
                                    key={t.id}
                                    className={[
                                        "overflow-hidden rounded-[26px] border border-primary/10 bg-white",
                                        featured
                                            ? "shadow-[0_20px_56px_-28px_rgba(236,72,153,0.24)]"
                                            : "shadow-sm",
                                    ].join(" ")}
                                >
                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-lg font-black tracking-tight text-[#181113]">
                                                    {t.name}
                                                </p>
                                                <p className="text-sm text-[#89616f]">{t.comuna}</p>
                                            </div>

                                            <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">
                                                {new Date(t.createdAt).toLocaleDateString("es-CL")}
                                            </span>
                                        </div>

                                        <div className="mt-3">
                                            <Stars n={t.stars} />
                                        </div>

                                        <p className={featured ? "mt-4 text-base leading-relaxed text-[#181113]" : "mt-4 text-sm leading-relaxed text-[#181113]"}>
                                            “{t.text}”
                                        </p>

                                        {featured ? (
                                            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">
                                                <span className="material-symbols-outlined text-[15px]">verified</span>
                                                Cliente satisfecha
                                            </div>
                                        ) : null}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}

function FAQAccordion({ items }: { items: { q: string; a: string }[] }) {
    const [open, setOpen] = useState<number | null>(0);

    return (
        <div className="space-y-2">
            {items.map((it, i) => {
                const isOpen = open === i;
                return (
                    <div key={it.q} className="rounded-2xl border border-primary/10 bg-white">
                        <button
                            type="button"
                            onClick={() => setOpen(isOpen ? null : i)}
                            className="w-full px-5 py-4 text-left flex items-center justify-between gap-4"
                        >
                            <span className="font-bold text-[#181113]">{it.q}</span>
                            <span className="text-[#89616f] text-lg">{isOpen ? "–" : "+"}</span>
                        </button>

                        {isOpen && (
                            <div className="px-5 pb-5 text-sm text-[#89616f] leading-relaxed">
                                {it.a}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function LandingClient() {
    const [open, setOpen] = useState(false);
    const [beforeAfter, setBeforeAfter] = useState<BAEntry[]>([]);
    const [loadingBA, setLoadingBA] = useState(true);

    useEffect(() => {
        let alive = true;
        setLoadingBA(true);

        fetch("/api/before-after", { cache: "no-store" })
            .then((r) => r.json())
            .then((d) => {
                if (!alive) return;
                setBeforeAfter(d.items || []);
            })
            .catch(() => {
                if (!alive) return;
                setBeforeAfter([]);
            })
            .finally(() => {
                if (!alive) return;
                setLoadingBA(false);
            });

        return () => {
            alive = false;
        };
    }, []);

    const [gallery, setGallery] = useState<GalleryItem[]>([]);
    const [reels, setReels] = useState<GalleryItem[]>([]);
    const [loadingGallery, setLoadingGallery] = useState(true);
    const [loadingServices, setLoadingServices] = useState(true);
    const [visiblePhotos, setVisiblePhotos] = useState(10);
    const [openReel, setOpenReel] = useState(false);
    const [activeReel, setActiveReel] = useState<GalleryItem | null>(null);
    const [selectedService, setSelectedService] = useState<string | undefined>(undefined);
    const [openPhoto, setOpenPhoto] = useState(false);
    const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
    const [zoom, setZoom] = useState(false);

    const photos = gallery
        .filter((x) => x.mediaType !== "video")
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

    const openAt = (idx: number) => {
        setActivePhotoIndex(idx);
        setZoom(false);
        setOpenPhoto(true);
    };

    const closePhoto = () => {
        setOpenPhoto(false);
        setZoom(false);
    };

    const prevPhoto = () => {
        if (photos.length === 0) return;
        setActivePhotoIndex((i) => (i - 1 + photos.length) % photos.length);
        setZoom(false);
    };

    const nextPhoto = () => {
        if (photos.length === 0) return;
        setActivePhotoIndex((i) => (i + 1) % photos.length);
        setZoom(false);
    };

    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [loadingTestimonials, setLoadingTestimonials] = useState(true);
    const [content, setContent] = useState<LandingContent | null>(null);
    const safeContent = content ?? defaultLandingContent;
    const processIcons = [
        "chat_bubble",
        "calendar_month",
        "home",
        "face_retouching_natural",
    ];
    const waHref = waLink(
        safeContent.footer.whatsappPhone,
        buildWhatsAppText(selectedService)
    );

    useEffect(() => {
        fetch("/api/content", { cache: "no-store" })
            .then((r) => r.json())
            .then((d) => setContent(d.content))
            .catch(() => setContent(null))
    }, []);

    useEffect(() => {
        refreshTestimonials();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!openPhoto) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closePhoto();
            if (e.key === "ArrowLeft") prevPhoto();
            if (e.key === "ArrowRight") nextPhoto();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openPhoto, photos.length]);

    const photoIndexByKey = useMemo(() => {
        const m = new Map<string, number>();
        photos.forEach((p, i) => m.set(p.publicId || p.src, i));
        return m;
    }, [photos]);

    useEffect(() => {
        setLoadingGallery(true);
        fetch("/api/gallery")
            .then((r) => r.json())
            .then((data) => {
                const items = (data.items || []).map((x: any) => ({
                    ...x,
                    mediaType: x.mediaType === "video" ? "video" : "image",
                }));
                const reels = (data.reels || []).map((x: any) => ({
                    ...x,
                    mediaType: "video",
                }));

                setGallery(items);
                setReels(reels);
            })
            .catch(() => {
                setGallery([]);
                setReels([]);
            })
            .finally(() => setLoadingGallery(false));
    }, []);

    const [services, setServices] = useState<
        { id: string; title: string; description: string; image: string; duration?: string }[]
    >([]);

    useEffect(() => {
        setLoadingServices(true);
        fetch("/api/services", { cache: "no-store" })
            .then((r) => r.json())
            .then((data) => setServices(data.services || []))
            .catch(() => setServices([]))
            .finally(() => setLoadingServices(false));
    }, []);

    const visible = photos.slice(0, visiblePhotos);
    const hasMore = visiblePhotos < photos.length;

    async function refreshTestimonials() {
        setLoadingTestimonials(true);
        try {
            const r = await fetch(`/api/testimonials?t=${Date.now()}`, { cache: "no-store" });
            const d = await r.json().catch(() => ({}));
            setTestimonials(d.testimonials || []);
        } catch {
            setTestimonials([]);
        } finally {
            setLoadingTestimonials(false);
        }
    }
    return (
        <>
            {/* Modal */}
            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title={safeContent.modals.whatsappTitle}
                subtitle={safeContent.modals.whatsappSubtitle}
                icon="chat"
            >
                <WhatsAppLeadForm initialService={selectedService} onSent={() => setOpen(false)} />
            </Modal>
            {/* Modal para Reels */}
            <Modal
                open={openReel}
                onClose={() => { setOpenReel(false); setActiveReel(null); }}
                title={safeContent.modals.reelTitle}
                subtitle={safeContent.modals.reelSubtitle}
                icon="play_circle"
            >
                {activeReel ? (
                    <div className="space-y-3">
                        <div className="relative mx-auto w-full max-w-[360px] aspect-[9/16] max-h-[70vh] overflow-hidden rounded-2xl bg-black">
                            <video
                                src={activeReel.src}
                                controls
                                playsInline
                                autoPlay
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                        </div>
                    </div>
                ) : null}
            </Modal>
            <Modal
                open={openPhoto}
                onClose={closePhoto}
                title={safeContent.modals.photoTitle}
                subtitle={`${activePhotoIndex + 1} / ${photos.length}`}
                icon="photo"
            >
                {photos.length ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                            <button
                                type="button"
                                onClick={prevPhoto}
                                className="h-10 px-4 rounded-full border border-primary/15 bg-white text-[#181113] text-sm font-bold hover:bg-black/5"
                            >
                                ← Anterior
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setZoom((z) => !z)}
                                    className="h-10 px-4 rounded-full border border-primary/15 bg-white text-[#181113] text-sm font-bold hover:bg-black/5"
                                >
                                    {zoom ? "Zoom −" : "Zoom +"}
                                </button>

                                <button
                                    type="button"
                                    onClick={nextPhoto}
                                    className="h-10 px-4 rounded-full border border-primary/15 bg-white text-[#181113] text-sm font-bold hover:bg-black/5"
                                >
                                    Siguiente →
                                </button>
                            </div>
                        </div>

                        <div className="relative w-full overflow-hidden rounded-2xl bg-black/90">
                            {/* contenedor con ratio flexible */}
                            <div className="relative w-full h-[60vh]">
                                <Image
                                    src={photos[activePhotoIndex]?.src}
                                    alt={photos[activePhotoIndex]?.alt || "Trabajo de trenzas"}
                                    fill
                                    sizes="100vw"
                                    className={[
                                        "object-contain select-none transition-transform duration-200",
                                        zoom ? "scale-125 cursor-zoom-out" : "scale-100 cursor-zoom-in",
                                    ].join(" ")}
                                    onClick={() => setZoom((z) => !z)}
                                    priority
                                />
                            </div>
                        </div>

                        <p className="text-xs text-[#89616f] text-center">
                            {safeContent.gallery.modalTip}
                        </p>
                    </div>
                ) : null}
            </Modal>
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#f4f0f2] px-6 lg:px-40 py-4">
                <div className="max-w-[1200px] mx-auto flex items-center justify-between">
                    <a
                        href="#inicio"
                        className="flex items-center gap-3 hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-lg"
                    >                        <div className="text-primary">
                            <span className="material-symbols-outlined text-3xl">auto_awesome</span>
                        </div>
                        <span className="text-[#181113] text-xl font-extrabold leading-tight tracking-tight font-display">
                            {safeContent.header.brand}
                        </span>
                    </a>


                    <div className="flex items-center gap-4">
                        <a
                            className="hidden md:flex items-center gap-2 text-sm font-semibold text-[#89616f] hover:text-primary transition-colors px-4"
                            href="#servicios"
                        >
                            {safeContent.header.navServices}
                        </a>
                        <a
                            className="hidden md:flex items-center gap-2 text-sm font-semibold text-[#89616f] hover:text-primary transition-colors px-4"
                            href="#galeria"
                        >
                            {safeContent.header.navGallery}
                        </a>

                        <button
                            onClick={() => { setSelectedService(undefined); setOpen(true); }}
                            className="flex min-w-[140px] cursor-pointer items-center justify-center rounded-full h-11 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                            type="button"
                        >
                            <span>{safeContent.header.cta}</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="pt-20">
                {/* HERO */}
                <section className="px-6 lg:px-40 py-10">
                    <div className="relative w-full min-h-[500px] lg:min-h-[600px] rounded-[48px] overflow-hidden">
                        <Image
                            src={safeContent.hero.imageSrc || "/hero.jpg"}
                            alt={safeContent.hero.imageAlt || "Caroline Trenzas"}
                            fill
                            priority
                            className="object-cover"
                            style={{ objectPosition: safeContent.hero.imagePosition || "60% 35%" }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-black/15" />

                        <div className="relative z-10 flex min-h-[500px] lg:min-h-[600px] items-center p-8 lg:p-20">
                            <div className="max-w-2xl text-white space-y-6">
                                <span className="inline-block bg-primary/90 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                                    {safeContent.hero.badge}
                                </span>
                                <h1 className="text-4xl lg:text-6xl font-black leading-tight tracking-tight">
                                    {safeContent.hero.title}
                                </h1>
                                <p className="text-lg lg:text-xl font-medium opacity-90">
                                    {safeContent.hero.subtitle}
                                </p>

                                <div className="flex flex-wrap gap-4 pt-4">
                                    <button
                                        onClick={() => { setSelectedService(undefined); setOpen(true); }}
                                        className="flex items-center justify-center rounded-full h-14 px-8 bg-primary text-white text-base font-bold shadow-xl md:hover:scale-105 transition-transform"
                                        type="button"
                                    >
                                        {safeContent.hero.primaryCta}
                                    </button>

                                    <a
                                        className="flex items-center justify-center rounded-full h-14 px-8 bg-white/20 backdrop-blur-sm text-white text-base font-bold border border-white/30 hover:bg-white/30 transition-all"
                                        href="#galeria"
                                    >
                                        {safeContent.hero.secondaryCta}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Services Section */}
                <section id="servicios" className="scroll-mt-24 px-6 lg:px-40 py-20 bg-white">
                    <div className="max-w-[1200px] mx-auto">
                        <div className="text-center mb-16 space-y-4">
                            <h2 className="text-3xl lg:text-4xl font-bold text-[#181113]">{safeContent.services.title}</h2>
                            <div className="h-1.5 w-20 bg-primary mx-auto rounded-full"></div>
                            <p className="text-[#89616f] max-w-xl mx-auto">
                                {safeContent.services.intro}
                            </p>

                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {services.map((s) => (
                                <div
                                    key={s.id}
                                    className="group bg-background-light p-4 rounded-xl hover:shadow-xl transition-all duration-300 border border-transparent hover:border-primary/10 h-full flex flex-col"
                                >
                                    {s.image ? (
                                        <Image
                                            src={s.image}
                                            alt={s.title}
                                            width={1200}
                                            height={1200}
                                            className="w-full aspect-square object-cover rounded-lg mb-6"
                                        />
                                    ) : (
                                        <div className="w-full aspect-square rounded-lg mb-6 bg-white/60 border border-primary/10 flex items-center justify-center text-sm text-[#89616f]">
                                            {safeContent.services.missingImageText}
                                        </div>
                                    )}

                                    {/* Título + duración */}
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <h3 className="text-xl font-bold line-clamp-1">{s.title}</h3>
                                        {s.duration ? (
                                            <span className="shrink-0 text-[11px] font-bold px-2 py-1 rounded-full bg-primary/10 text-primary">
                                                ⏱ {s.duration}
                                            </span>
                                        ) : null}
                                    </div>

                                    <p className="text-[#89616f] text-sm leading-relaxed line-clamp-3">{s.description}</p>

                                    {/* Botón al fondo */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedService(s.title);
                                            setOpen(true);
                                        }}
                                        className="mt-auto pt-5 w-full"
                                    >
                                        <div className="w-full rounded-full h-11 bg-primary text-white text-sm font-bold hover:bg-primary/90 flex items-center justify-center">
                                            {safeContent.services.quotePrefix} {s.title}
                                        </div>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {services.length === 0 && (
                            <div className="mt-10 rounded-xl border border-primary/10 bg-background-light p-10 text-center">
                                <p className="text-[#89616f]">{safeContent.services.emptyText}</p>
                            </div>
                        )}
                    </div>
                </section>
                {/* Before / After */}
                <section
                    id="antes-despues"
                    className="scroll-mt-24 px-6 lg:px-40 py-24 bg-[linear-gradient(180deg,#ffffff_0%,#fff7fa_100%)]"
                >
                    <div className="max-w-[1200px] mx-auto">
                        <div className="mb-14 text-center">
                            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">
                                <span className="material-symbols-outlined text-[15px]">compare</span>
                                Resultado real
                            </div>

                            <h2 className="mt-4 text-3xl lg:text-4xl font-black tracking-tight text-[#181113]">
                                {safeContent.beforeAfter.title}
                            </h2>

                            <p className="mt-3 max-w-2xl mx-auto text-sm md:text-base text-[#89616f]">
                                {safeContent.beforeAfter.intro}
                            </p>
                        </div>

                        {loadingBA ? (
                            <div className="rounded-[28px] border border-primary/10 bg-white p-10 text-center shadow-sm">
                                <p className="text-[#89616f]">{safeContent.beforeAfter.loadingText}</p>
                            </div>
                        ) : beforeAfter.length === 0 ? (
                            <div className="rounded-[28px] border border-primary/10 bg-white p-10 text-center shadow-sm">
                                <p className="text-[#89616f]">{safeContent.beforeAfter.emptyText}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {beforeAfter
                                    .slice()
                                    .sort((a, b) => {
                                        const aa = (a.before?.src ? 1 : 0) + (a.after?.src ? 1 : 0);
                                        const bb = (b.before?.src ? 1 : 0) + (b.after?.src ? 1 : 0);
                                        return bb - aa;
                                    })
                                    .slice(0, 3)
                                    .map((it) => (
                                        <BeforeAfterPremiumCard
                                            key={it.serviceId}
                                            item={it}
                                            badge={safeContent.beforeAfter.cardBadge}
                                            beforeLabel={safeContent.beforeAfter.beforeLabel}
                                            afterLabel={safeContent.beforeAfter.afterLabel}
                                            missingImageText={safeContent.beforeAfter.missingImageText}
                                            onQuote={(service) => {
                                                setSelectedService(service);
                                                setOpen(true);
                                            }}
                                        />
                                    ))}
                            </div>
                        )}

                        <p className="mt-8 text-center text-sm text-[#89616f]">
                            ¿Te gustó algún resultado? Escríbenos por WhatsApp y te orientamos según tu cabello, largo y estilo.
                        </p>
                    </div>
                </section>

                {/* Process Section */}
                <section className="px-6 lg:px-40 py-20 bg-background-light">
                    <div className="max-w-[1200px] mx-auto">
                        <h2 className="text-2xl lg:text-3xl font-bold text-[#181113] mb-12 text-center">
                            {safeContent.process.title}
                        </h2>

                        <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative">
                            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-primary/20 -translate-y-8 z-0" />

                            {safeContent.process.steps.map((step, i) => (
                                <div
                                    key={`${step.title}-${i}`}
                                    className="flex flex-col items-center text-center space-y-4 z-10 bg-background-light px-4"
                                >
                                    <div className="size-16 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                                        <span className="material-symbols-outlined text-3xl">
                                            {processIcons[i] ?? "task_alt"}
                                        </span>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-lg">{step.title}</h4>
                                        <p className="text-[#89616f] text-sm max-w-[220px]">{step.text}</p>

                                        {step.bullets?.length ? (
                                            <ul className="mt-3 text-xs text-[#89616f] space-y-1">
                                                {step.bullets.map((bullet, idx) => (
                                                    <li key={idx}>{bullet}</li>
                                                ))}
                                            </ul>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Home Service Section */}
                <section className="px-6 lg:px-40 py-20 bg-white">
                    <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1 space-y-6">
                            <div className="inline-flex items-center gap-2 text-primary font-bold">
                                <span className="material-symbols-outlined">location_on</span>
                                <span>{safeContent.coverage.badge}</span>
                            </div>
                            <h2 className="text-3xl lg:text-4xl font-bold">{safeContent.coverage.title}</h2>
                            {/* Coberturas */}
                            <div className="rounded-2xl border border-primary/10 bg-background-light p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                                        <p className="font-black text-[#181113]">{safeContent.coverage.coveredLabel}</p>
                                    </div>

                                    <span className="shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                                        {safeContent.coverage.zoneBadge}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    {safeContent.coverage.zones.map((x) => (
                                        <div
                                            key={x}
                                            className="flex items-center gap-2 rounded-xl border border-primary/10 bg-white px-3 py-2"
                                        >
                                            <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                <span className="material-symbols-outlined text-[18px]">check</span>
                                            </span>
                                            <span className="text-sm font-medium text-[#181113] leading-tight">{x}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 rounded-xl border border-primary/10 bg-white px-4 py-3">
                                    <p className="text-xs text-[#89616f]">
                                        {safeContent.coverage.nearbyText}
                                    </p>
                                </div>
                            </div>
                            <p className="text-[#89616f] text-lg leading-relaxed">
                                {safeContent.coverage.description}
                            </p>

                            <ul className="space-y-3">
                                {safeContent.coverage.benefits.map((benefit, i) => (
                                    <li key={`${benefit}-${i}`} className="flex items-center gap-3 text-[#181113] font-medium">
                                        <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                        {benefit}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex-1 w-full max-w-md lg:max-w-none">
                            <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-sm aspect-square">
                                <a
                                    href={safeContent.coverage.mapHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-[#181113] shadow hover:bg-white"
                                >
                                    {safeContent.coverage.mapButton}
                                </a>

                                <iframe
                                    title="Mapa de San Bernardo, Chile"
                                    className="absolute inset-0 h-full w-full"
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    src={safeContent.coverage.mapEmbedSrc}
                                />
                                {/* capa sutil para que combine con el diseño */}
                                <div className="pointer-events-none absolute inset-0 bg-primary/5" />
                            </div>
                        </div>

                    </div>
                </section>

                {/* Policies Section */}
                <PoliciesPremiumSection content={safeContent.policies} />

                <TestimonialsSection
                    loading={loadingTestimonials}
                    testimonials={testimonials}
                    content={safeContent.testimonials}
                />

                <section className="px-6 lg:px-40 pt-2 pb-10 bg-white">
                    <div className="max-w-[860px] mx-auto">
                        <ReviewForm
                            onSent={refreshTestimonials}
                            content={safeContent.reviewForm}
                        />
                    </div>
                </section>
                {/* Gallery Section */}
                <section id="galeria" className="scroll-mt-24 px-6 lg:px-40 pt-8 pb-20 bg-white">
                    <div className="max-w-[1200px] mx-auto">
                        <div className="mb-10 flex flex-col items-center text-center">
                            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">
                                <span className="material-symbols-outlined text-[15px]">photo_library</span>
                                Trabajos reales
                            </div>
                            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#181113]">
                                {safeContent.gallery.title}
                            </h2>
                            <p className="mt-3 max-w-2xl text-[#89616f]">
                                {safeContent.gallery.intro}
                            </p>
                        </div>

                        {/* --- REELS / VIDEOS DESTACADOS --- */}
                        {reels?.length ? (
                            <div className="mb-14">
                                <div className="flex items-end justify-between gap-3 mb-5">
                                    <div>
                                        <h3 className="text-xl font-black text-[#181113]">{safeContent.gallery.reelsTitle}</h3>
                                        <p className="text-sm text-[#89616f]">{safeContent.gallery.reelsIntro}</p>
                                    </div>
                                    <span className="text-xs font-bold text-[#89616f]">{reels.length} videos</span>
                                </div>

                                {/* Si hay pocos, que no se vea gigante */}
                                <div
                                    className={
                                        reels.length === 1
                                            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                                            : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                                    }
                                >
                                    {reels.slice(0, 6).map((v) => {
                                        const poster = v.src
                                            .replace("/upload/", "/upload/so_0/")
                                            .replace(/\.\w+$/, ".jpg");

                                        return (
                                            <button
                                                key={v.publicId || v.src}
                                                type="button"
                                                onClick={() => {
                                                    setActiveReel(v);
                                                    setOpenReel(true);
                                                }}
                                                className="group text-left rounded-2xl border border-primary/10 bg-background-light overflow-hidden hover:shadow-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 flex flex-col h-full"
                                                aria-label="Abrir video"
                                            >
                                                <div className="relative bg-black h-[360px] sm:h-[420px] lg:h-[460px]">
                                                    <video
                                                        src={v.src}
                                                        muted
                                                        loop
                                                        playsInline
                                                        preload="metadata"
                                                        poster={poster}
                                                        className="absolute inset-0 w-full h-full object-cover"
                                                        // autoplay preview (sin controles)
                                                        autoPlay
                                                    />

                                                    {/* Overlay play */}
                                                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="absolute left-3 top-3 text-[11px] font-bold px-2 py-1 rounded-full bg-white/90 text-black">
                                                        REEL
                                                    </div>

                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="size-12 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm opacity-90 group-hover:scale-105 transition-transform">
                                                            <span className="material-symbols-outlined">play_arrow</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Pie limpio, sin filenames */}
                                                <div className="px-4 py-3 flex items-center justify-between">
                                                    <p className="text-xs text-[#89616f]">{safeContent.gallery.reelsTapText}</p>
                                                    <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-black/80 text-white">
                                                        VIDEO
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : null}

                        {/* --- GALERÍA (SOLO FOTOS) --- */}
                        {loadingGallery ? (
                            <div className="rounded-xl border border-primary/10 bg-background-light p-10 text-center">
                                <p className="text-[#89616f]">{safeContent.gallery.loadingText}</p>                            </div>
                        ) : photos.length === 0 ? (
                            <div className="rounded-xl border border-primary/10 bg-background-light p-10 text-center">
                                <p className="text-[#89616f]">{safeContent.gallery.emptyText}</p>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-end justify-between gap-3 mb-5">
                                    <div>
                                        <h3 className="text-xl font-black text-[#181113]">{safeContent.gallery.photosTitle}</h3>
                                        <p className="text-sm text-[#89616f]">{safeContent.gallery.photosIntro}</p>
                                    </div>
                                    <span className="text-xs font-bold text-[#89616f]">
                                        {Math.min(visiblePhotos, photos.length)} / {photos.length}
                                    </span>
                                </div>

                                <div className="masonry">
                                    {visible.map((item) => {
                                        const key = item.publicId || item.src;
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                className="masonry-item text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
                                                onClick={() => openAt(photoIndexByKey.get(key) ?? 0)}
                                                aria-label="Abrir foto"
                                            >
                                                <Image
                                                    src={item.src}
                                                    alt={safeContent.gallery.defaultImageAlt}
                                                    width={item.width || 1200}
                                                    height={item.height || 1600}
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                    className="w-full h-auto rounded-xl hover:opacity-95 transition-opacity"
                                                    loading="lazy"
                                                />
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Cargar más */}
                                {hasMore ? (
                                    <div className="mt-10 flex flex-col items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setVisiblePhotos((v) => v + 10)}
                                            className="h-12 px-7 rounded-full bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.99] transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                        >
                                            {safeContent.gallery.loadMore}
                                        </button>

                                        <p className="text-xs text-[#89616f]">
                                            Mostrando {Math.min(visiblePhotos, photos.length)} de {photos.length}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mt-10 text-center text-xs text-[#89616f]">
                                        {safeContent.gallery.allLoadedText}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>
                <section className="px-6 lg:px-40 py-20 bg-white">
                    <div className="max-w-[900px] mx-auto">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold mb-3">{safeContent.faq.title}</h2>
                        </div>

                        <FAQAccordion items={safeContent.faq.items} />
                    </div>
                </section>

            </main>

            {/* Footer */}
            <footer className="bg-background-dark text-white py-16 px-6 lg:px-40">
                <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="text-primary">
                                <span className="material-symbols-outlined text-3xl">auto_awesome</span>
                            </div>
                            <h2 className="text-xl font-extrabold font-display">{safeContent.footer.brand}</h2>
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed max-w-xs">
                            {safeContent.footer.description}
                        </p>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-lg font-bold">{safeContent.footer.contactTitle}</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-white/80">
                                <span className="material-symbols-outlined text-primary">call</span>
                                <span>{safeContent.footer.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-white/80">
                                <span className="material-symbols-outlined text-primary">location_on</span>
                                <span>{safeContent.footer.location}</span>
                            </div>
                            <div className="flex items-center gap-3 text-white/80">
                                <span className="material-symbols-outlined text-primary">schedule</span>
                                <span>{safeContent.footer.schedule}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-lg font-bold">{safeContent.footer.socialTitle}</h3>
                        <div className="flex gap-4">
                            <a
                                className="size-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
                                href={safeContent.footer.instagramUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Instagram"
                                aria-label="Instagram"
                            >
                                <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.247 2.242 1.308 3.607.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.332 2.633-1.308 3.608-.975.975-2.242 1.247-3.607 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.975-.975-1.247-2.242-1.308-3.607-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.247 3.607-1.308 1.266-.058 1.646-.07 4.85-.07zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.355 2.618 6.778 6.98 6.978 1.28.058 1.688.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.058-1.28.072-1.688.072-4.948 0-3.259-.014-3.668-.072-4.948-.199-4.359-2.612-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"></path>
                                </svg>
                            </a>

                        </div>
                    </div>
                </div>

                <div className="max-w-[1200px] mx-auto border-t border-white/10 mt-12 pt-8 text-center text-white/40 text-sm">
                    <p>{safeContent.footer.copyright}</p>
                </div>
            </footer>

            {/* Botón flotante ahora también abre modal */}
            <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-50 size-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                aria-label="WhatsApp"
                title={selectedService ? `Cotizar ${selectedService}` : "Cotizar por WhatsApp"}
            >
                <svg className="size-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
                </svg>
            </a>
        </>
    );
}
