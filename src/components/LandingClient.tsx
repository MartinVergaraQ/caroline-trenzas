"use client";

import Modal from "@/components/modal";
import WhatsAppLeadForm from "@/components/WhatsAppLeadForm";
import Image from "next/image";
import { useEffect, useState } from "react";

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

export default function LandingClient() {
    const [open, setOpen] = useState(false);

    const [gallery, setGallery] = useState<GalleryItem[]>([]);
    const [reels, setReels] = useState<GalleryItem[]>([]);

    useEffect(() => {
        fetch("/api/gallery", { cache: "no-store" })
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
            });
    }, []);

    const [services, setServices] = useState<
        { id: string; title: string; description: string; image: string }[]
    >([]);

    useEffect(() => {
        fetch("/api/services", { cache: "no-store" })
            .then((r) => r.json())
            .then((data) => setServices(data.services || []))
            .catch(() => setServices([]));
    }, []);

    return (
        <>
            {/* Modal */}
            <Modal open={open} onClose={() => setOpen(false)} title="Cotizar por WhatsApp">
                <WhatsAppLeadForm onSent={() => setOpen(false)} />
            </Modal>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#f4f0f2] px-6 lg:px-40 py-4">
                <div className="max-w-[1200px] mx-auto flex items-center justify-between">
                    <a href="#" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                        <div className="text-primary">
                            <span className="material-symbols-outlined text-3xl">auto_awesome</span>
                        </div>
                        <span className="text-[#181113] text-xl font-extrabold leading-tight tracking-tight font-display">
                            Caroline Trenzas
                        </span>
                    </a>


                    <div className="flex items-center gap-4">
                        <a
                            className="hidden md:flex items-center gap-2 text-sm font-semibold text-[#89616f] hover:text-primary transition-colors px-4"
                            href="#servicios"
                        >
                            Servicios
                        </a>
                        <a
                            className="hidden md:flex items-center gap-2 text-sm font-semibold text-[#89616f] hover:text-primary transition-colors px-4"
                            href="#galeria"
                        >
                            Galería
                        </a>

                        <button
                            onClick={() => setOpen(true)}
                            className="flex min-w-[140px] cursor-pointer items-center justify-center rounded-full h-11 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                            type="button"
                        >
                            <span>Cotizar por WhatsApp</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="pt-20">
                {/* HERO */}
                <section className="px-6 lg:px-40 py-10">
                    <div className="relative w-full min-h-[500px] lg:min-h-[600px] rounded-[48px] overflow-hidden">
                        <Image
                            src="/hero.jpg"
                            alt="Caroline Trenzas"
                            fill
                            priority
                            className="object-cover"
                            style={{ objectPosition: "60% 35%" }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-black/15" />

                        <div className="relative z-10 flex min-h-[500px] lg:min-h-[600px] items-center p-8 lg:p-20">
                            <div className="max-w-2xl text-white space-y-6">
                                <span className="inline-block bg-primary/90 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                                    Servicio Profesional
                                </span>
                                <h1 className="text-4xl lg:text-6xl font-black leading-tight tracking-tight">
                                    Trenzas a domicilio en San Bernardo
                                </h1>
                                <p className="text-lg lg:text-xl font-medium opacity-90">
                                    Fines de semana disponibles. Luce un estilo único y duradero sin salir de casa.
                                </p>

                                <div className="flex flex-wrap gap-4 pt-4">
                                    <button
                                        onClick={() => setOpen(true)}
                                        className="flex items-center justify-center rounded-full h-14 px-8 bg-primary text-white text-base font-bold shadow-xl md:hover:scale-105 transition-transform"
                                        type="button"
                                    >
                                        Cotizar por WhatsApp
                                    </button>

                                    <a
                                        className="flex items-center justify-center rounded-full h-14 px-8 bg-white/20 backdrop-blur-sm text-white text-base font-bold border border-white/30 hover:bg-white/30 transition-all"
                                        href="#galeria"
                                    >
                                        Ver catálogo
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
                            <h2 className="text-3xl lg:text-4xl font-bold text-[#181113]">Nuestros Servicios</h2>
                            <div className="h-1.5 w-20 bg-primary mx-auto rounded-full"></div>
                            <p className="text-[#89616f] max-w-xl mx-auto">
                                Elegancia y técnica en cada tejido. Selecciona el estilo que mejor se adapte a tu
                                personalidad.
                            </p>

                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {services.map((s) => (
                                <div
                                    key={s.id}
                                    className="group bg-background-light p-4 rounded-xl hover:shadow-xl transition-all duration-300 border border-transparent hover:border-primary/10"
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
                                            Pronto subimos fotos reales ✨
                                        </div>
                                    )}

                                    <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                                    <p className="text-[#89616f] text-sm leading-relaxed">{s.description}</p>
                                </div>
                            ))}
                        </div>


                        {services.length === 0 && (
                            <div className="mt-10 rounded-xl border border-primary/10 bg-background-light p-10 text-center">
                                <p className="text-[#89616f]">Estamos preparando el catálogo de servicios.</p>
                            </div>
                        )}


                    </div>
                </section>

                {/* Process Section */}
                <section className="px-6 lg:px-40 py-20 bg-background-light">
                    <div className="max-w-[1200px] mx-auto">
                        <h2 className="text-2xl lg:text-3xl font-bold text-[#181113] mb-12 text-center">
                            Nuestro Proceso
                        </h2>

                        <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative">
                            {/* Connector line for desktop */}
                            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-primary/20 -translate-y-8 z-0"></div>

                            <div className="flex flex-col items-center text-center space-y-4 z-10 bg-background-light px-4">
                                <div className="size-16 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                                    <span className="material-symbols-outlined text-3xl">chat_bubble</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">1. Cotiza</h4>
                                    <p className="text-[#89616f] text-sm max-w-[200px]">
                                        Envíanos una foto de tu cabello y el estilo que deseas.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center text-center space-y-4 z-10 bg-background-light px-4">
                                <div className="size-16 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                                    <span className="material-symbols-outlined text-3xl">calendar_month</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">2. Reserva</h4>
                                    <p className="text-[#89616f] text-sm max-w-[200px]">
                                        Agendamos tu cita para el fin de semana que prefieras.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center text-center space-y-4 z-10 bg-background-light px-4">
                                <div className="size-16 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                                    <span className="material-symbols-outlined text-3xl">home</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">3. Visita</h4>
                                    <p className="text-[#89616f] text-sm max-w-[200px]">
                                        Llegamos a tu domicilio con todo lo necesario.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center text-center space-y-4 z-10 bg-background-light px-4">
                                <div className="size-16 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                                    <span className="material-symbols-outlined text-3xl">face_retouching_natural</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">4. ¡Lista!</h4>
                                    <p className="text-[#89616f] text-sm max-w-[200px]">
                                        Disfruta de tus trenzas con un acabado profesional.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Home Service Section */}
                <section className="px-6 lg:px-40 py-20 bg-white">
                    <div className="max-w-[1200px] mx-auto flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1 space-y-6">
                            <div className="inline-flex items-center gap-2 text-primary font-bold">
                                <span className="material-symbols-outlined">location_on</span>
                                <span>Cobertura Exclusiva</span>
                            </div>
                            <h2 className="text-3xl lg:text-4xl font-bold">Servicio en San Bernardo</h2>
                            <p className="text-[#89616f] text-lg leading-relaxed">
                                Entendemos que tu tiempo es valioso. Por eso, llevamos el salón de belleza a la
                                comodidad de tu hogar. Cubrimos todos los sectores de San Bernardo sin costo de
                                traslado adicional.
                            </p>

                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-[#181113] font-medium">
                                    <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                    Puntualidad garantizada
                                </li>
                                <li className="flex items-center gap-3 text-[#181113] font-medium">
                                    <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                    Higiene y materiales de calidad
                                </li>
                                <li className="flex items-center gap-3 text-[#181113] font-medium">
                                    <span className="material-symbols-outlined text-primary text-xl">check_circle</span>
                                    Atención personalizada
                                </li>
                            </ul>
                        </div>

                        <div className="flex-1 w-full max-w-md lg:max-w-none">
                            <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-sm aspect-square">
                                <a
                                    href="https://www.google.com/maps?q=San%20Bernardo%2C%20Chile"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-4 py-2 text-sm font-bold text-[#181113] shadow hover:bg-white"
                                >
                                    Ver en Google Maps
                                </a>

                                <iframe
                                    title="Mapa de San Bernardo, Chile"
                                    className="absolute inset-0 h-full w-full"
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    src="https://www.google.com/maps?q=San%20Bernardo%2C%20Chile&z=13&output=embed"
                                />
                                {/* capa sutil para que combine con el diseño */}
                                <div className="pointer-events-none absolute inset-0 bg-primary/5" />
                            </div>
                        </div>

                    </div>
                </section>

                {/* Policies Section */}
                <section className="px-6 lg:px-40 py-16 bg-[#fdfafb]">
                    <div className="max-w-3xl mx-auto bg-white p-8 lg:p-12 rounded-xl border border-primary/10 shadow-sm">
                        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">info</span>
                            Nuestras Políticas
                        </h2>

                        <div className="space-y-6 text-[#89616f]">
                            <div className="space-y-2">
                                <p className="font-bold text-[#181113]">Preparación:</p>
                                <p className="flex gap-2">
                                    <span className="text-primary">•</span> El cabello debe estar limpio y desenredado
                                    antes de la cita.
                                </p>
                                <p className="flex gap-2">
                                    <span className="text-primary">•</span> Recomendamos lavar el cabello el día
                                    anterior.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <p className="font-bold text-[#181113]">Citas y Cancelaciones:</p>
                                <p className="flex gap-2">
                                    <span className="text-primary">•</span> Confirmar con al menos 24 horas de
                                    anticipación.
                                </p>
                                <p className="flex gap-2">
                                    <span className="text-primary">•</span> Se solicita un abono previo para asegurar
                                    tu cupo.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <p className="font-bold text-[#181113]">Tiempo Estimado:</p>
                                <p className="flex gap-2">
                                    <span className="text-primary">•</span> La duración varía según el diseño (de 1 a
                                    4 horas).
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Gallery Section */}
                <section id="galeria" className="scroll-mt-24 px-6 lg:px-40 py-20 bg-white">
                    <div className="max-w-[1200px] mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4">Galería de Trabajos</h2>
                            <p className="text-[#89616f]">Resultados reales de nuestras clientas satisfechas.</p>
                        </div>

                        {/* --- REELS / VIDEOS DESTACADOS --- */}
                        {reels?.length ? (
                            <div className="mb-14">
                                <div className="flex items-end justify-between gap-3 mb-5">
                                    <div>
                                        <h3 className="text-xl font-black text-[#181113]">Reels / Videos</h3>
                                        <p className="text-sm text-[#89616f]">
                                            Movimiento real. Brillo real. Decisión de compra más rápida.
                                        </p>
                                    </div>
                                    <span className="text-xs font-bold text-[#89616f]">{reels.length} videos</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {reels.slice(0, 6).map((v) => (
                                        <div key={v.publicId || v.src} className="group rounded-2xl border bg-background-light overflow-hidden hover:shadow-xl transition-all">
                                            <div className="relative aspect-[9/16] bg-black">
                                                <video
                                                    src={v.src}
                                                    controls
                                                    playsInline
                                                    preload="metadata"
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                            <div className="p-4 flex items-center justify-between">
                                                <p className="text-xs text-[#89616f] truncate max-w-[70%]">{v.publicId || "Video"}</p>
                                                <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-black/80 text-white">VIDEO</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {/* --- GALERÍA COMPLETA (MIXTA) --- */}
                        {gallery?.length === 0 ? (
                            <div className="rounded-xl border border-primary/10 bg-background-light p-10 text-center">
                                <p className="text-[#89616f]">Pronto subiremos fotos reales de nuestros trabajos.</p>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-end justify-between gap-3 mb-5">
                                    <div>
                                        <h3 className="text-xl font-black text-[#181113]">Galería completa</h3>
                                        <p className="text-sm text-[#89616f]">Fotos y videos, todo junto.</p>
                                    </div>
                                    <span className="text-xs font-bold text-[#89616f]">{gallery.length} items</span>
                                </div>

                                <div className="masonry">
                                    {gallery.map((item) => (
                                        <div key={item.publicId || item.src} className="masonry-item">
                                            {item.mediaType === "video" ? (
                                                <div className="relative rounded-xl overflow-hidden border bg-black">
                                                    <div className="relative w-full aspect-[9/16] bg-black">
                                                        <video
                                                            src={item.src}
                                                            controls={false}
                                                            muted
                                                            autoPlay
                                                            loop
                                                            playsInline
                                                            preload="metadata"

                                                            poster={item.src.replace("/upload/", "/upload/so_0/").replace(/\.\w+$/, ".jpg")}
                                                            className="absolute inset-0 h-full w-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="absolute left-3 top-3 text-[11px] font-bold px-2 py-1 rounded-full bg-white/90 text-black">
                                                        VIDEO
                                                    </div>
                                                </div>
                                            ) : (
                                                <Image
                                                    src={item.src}
                                                    alt={item.alt || "Trabajo de trenzas"}
                                                    width={item.width || 1200}
                                                    height={item.height || 1600}
                                                    className="w-full h-auto rounded-xl"
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
                            <h2 className="text-xl font-extrabold font-display">Caroline Trenzas</h2>
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed max-w-xs">
                            Especialista en trenzas y peinados profesionales a domicilio. Llevamos el estilo y la
                            elegancia a tu hogar en San Bernardo.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-lg font-bold">Contacto</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-white/80">
                                <span className="material-symbols-outlined text-primary">call</span>
                                <span>+56 9 7401 1961</span>
                            </div>
                            <div className="flex items-center gap-3 text-white/80">
                                <span className="material-symbols-outlined text-primary">location_on</span>
                                <span>San Bernardo, Región Metropolitana</span>
                            </div>
                            <div className="flex items-center gap-3 text-white/80">
                                <span className="material-symbols-outlined text-primary">schedule</span>
                                <span>Sábados y Domingos: 09:00 - 19:00</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-lg font-bold">Síguenos</h3>
                        <div className="flex gap-4">
                            <a
                                className="size-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
                                href="https://www.instagram.com/caroline_trenzas_/"
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
                    <p>© 2026 Caroline Trenzas. San Bernardo, RM. Todos los derechos reservados.</p>
                </div>
            </footer>

            {/* Botón flotante ahora también abre modal */}
            <button
                onClick={() => setOpen(true)}
                className="fixed bottom-6 right-6 z-50 size-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                type="button"
                aria-label="WhatsApp"
            >
                <svg className="size-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
                </svg>
            </button>

        </>
    );
}
