export type LandingContent = {
    header: {
        brand: string;
        navServices: string;
        navGallery: string;
        cta: string;
    };

    hero: {
        badge: string;
        title: string;
        subtitle: string;
        primaryCta: string;
        secondaryCta: string;
        imageSrc: string;
        imageAlt: string;
        imagePosition: string;
        imagePublicId?: string;
    };

    services: {
        title: string;
        intro: string;
        emptyText: string;
        missingImageText: string;
        quotePrefix: string;
    };

    beforeAfter: {
        title: string;
        intro: string;
        loadingText: string;
        emptyText: string;
        cardBadge: string;
        missingImageText: string;
        beforeLabel: string;
        afterLabel: string;
        cardTip: string;
        sectionTip: string;
    };

    process: {
        title: string;
        steps: {
            title: string;
            text: string;
            bullets?: string[];
        }[];
    };

    coverage: {
        badge: string;
        title: string;
        coveredLabel: string;
        zoneBadge: string;
        zones: string[];
        nearbyText: string;
        description: string;
        benefits: string[];
        mapButton: string;
        mapHref: string;
        mapEmbedSrc: string;
    };

    policies: {
        title: string;
        groups: {
            title: string;
            items: string[];
        }[];
    };

    reviewForm: {
        title: string;
        subtitle: string;
        timeBadge: string;
        nameLabel: string;
        comunaLabel: string;
        starsLabel: string;
        textLabel: string;
        textPlaceholder: string;
        moderationNote: string;
        submit: string;
        submitSending: string;
        helper: string;
        successTitle: string;
        successText: string;
        namePlaceholder: string;
        comunaPlaceholder: string;
    };

    testimonials: {
        title: string;
        intro: string;
        loadingText: string;
        emptyText: string;
    };

    gallery: {
        title: string;
        intro: string;
        reelsTitle: string;
        reelsIntro: string;
        reelsTapText: string;
        photosTitle: string;
        photosIntro: string;
        loadingText: string;
        emptyText: string;
        loadMore: string;
        allLoadedText: string;
        modalTip: string;
        defaultImageAlt: string;
    };

    faq: {
        title: string;
        items: {
            q: string;
            a: string;
        }[];
    };

    footer: {
        brand: string;
        description: string;
        contactTitle: string;
        phone: string;
        location: string;
        schedule: string;
        socialTitle: string;
        copyright: string;
        instagramUrl: string;
        whatsappPhone: string;
    };

    modals: {
        whatsappTitle: string;
        whatsappSubtitle: string;
        reelTitle: string;
        reelSubtitle: string;
        photoTitle: string;
    };
};

export const defaultLandingContent: LandingContent = {
    header: {
        brand: "Caroline Trenzas",
        navServices: "Servicios",
        navGallery: "Galería",
        cta: "Cotizar por WhatsApp",
    },

    hero: {
        badge: "Servicio Profesional",
        title: "Trenzas a domicilio en San Bernardo",
        subtitle: "Fines de semana disponibles. Luce un estilo único y duradero sin salir de casa.",
        primaryCta: "Cotizar por WhatsApp",
        secondaryCta: "Ver trabajos",
        imageSrc: "/hero.jpg",
        imageAlt: "Caroline Trenzas",
        imagePosition: "60% 35%",
        imagePublicId: "",
    },

    services: {
        title: "Nuestros Servicios",
        intro: "Elegancia y técnica en cada tejido. Selecciona el estilo que mejor se adapte a tu personalidad.",
        emptyText: "Estamos preparando el catálogo de servicios.",
        missingImageText: "Pronto subimos fotos reales ✨",
        quotePrefix: "Cotizar",
    },

    beforeAfter: {
        title: "Antes y Después",
        intro: "Cambios reales. Sin promesas raras.",
        loadingText: "Cargando Antes y Después…",
        emptyText: "Pronto subiremos Antes y Después reales ✨",
        cardBadge: "Antes / Después",
        missingImageText: "Pronto subimos fotos reales ✨",
        beforeLabel: "ANTES",
        afterLabel: "DESPUÉS",
        cardTip: "Tip: mándanos foto + referencia por WhatsApp y te cotizamos rápido.",
        sectionTip: "Tip: si quieres un resultado similar, mándanos una foto y una referencia por WhatsApp.",
    },

    process: {
        title: "Nuestro Proceso",
        steps: [
            {
                title: "1. Cotiza",
                text: "Escríbenos por WhatsApp con tu idea (y ojalá una foto).",
                bullets: [
                    "⏱ Respondemos lo antes posible (máximo 2 horas)",
                    "📷 Qué enviar: foto + largo + idea",
                    "📍 Fecha y comuna",
                ],
            },
            {
                title: "2. Reserva",
                text: "Te proponemos horario y dejamos tu cupo confirmado.",
                bullets: [
                    "💳 Abono para reservar",
                    "✅ Confirmación por WhatsApp",
                ],
            },
            {
                title: "3. Visita",
                text: "Llegamos a tu domicilio con todo lo necesario.",
            },
            {
                title: "4. ¡Lista!",
                text: "Disfruta de tus trenzas con un acabado profesional.",
            },
        ],
    },

    coverage: {
        badge: "Cobertura Exclusiva",
        title: "Servicio en San Bernardo",
        coveredLabel: "Cubrimos",
        zoneBadge: "San Bernardo",
        zones: [
            "San Bernardo Centro",
            "Nos",
            "Lo Herrera",
            "La Vara",
            "El Mariscal",
            "Sector Hospital",
        ],
        nearbyText: "Si estás cerca y no apareces aquí, pregunta igual por WhatsApp.",
        description:
            "Entendemos que tu tiempo es valioso. Por eso, llevamos el salón de belleza a la comodidad de tu hogar. Cubrimos todos los sectores de San Bernardo sin costo de traslado adicional.",
        benefits: [
            "Puntualidad garantizada",
            "Higiene y materiales de calidad",
            "Atención personalizada",
        ],
        mapButton: "Ver en Google Maps",
        mapHref: "https://www.google.com/maps?q=San%20Bernardo%2C%20Chile",
        mapEmbedSrc: "https://www.google.com/maps?q=San%20Bernardo%2C%20Chile&z=13&output=embed",
    },

    policies: {
        title: "Nuestras Políticas",
        groups: [
            {
                title: "Preparación:",
                items: [
                    "El cabello debe estar limpio y desenredado antes de la cita.",
                    "Recomendamos lavar el cabello el día anterior.",
                ],
            },
            {
                title: "Citas y Cancelaciones:",
                items: [
                    "Confirmar con al menos 24 horas de anticipación.",
                    "Se solicita un abono previo para asegurar tu cupo.",
                ],
            },
            {
                title: "Tiempo Estimado:",
                items: [
                    "La duración varía según el diseño (de 1 a 4 horas).",
                ],
            },
        ],
    },

    reviewForm: {
        title: "Deja tu testimonio",
        subtitle: "Nos ayuda muchísimo. En la página mostramos máximo 3.",
        timeBadge: "1 minuto",
        nameLabel: "Tu nombre",
        comunaLabel: "Comuna",
        starsLabel: "Calificación",
        textLabel: "¿Cómo fue tu experiencia?",
        textPlaceholder: "Cuéntanos en 1–2 frases cómo te fue 😊",
        moderationNote: "Por seguridad, los testimonios se revisan antes de publicarse.",
        submit: "Enviar testimonio",
        submitSending: "Enviando...",
        helper: "Tip: escribe tu nombre y un comentario un poquito más largo para habilitar el envío.",
        successTitle: "¡Gracias!",
        successText: "Tu testimonio quedó enviado 💛 Lo revisamos antes de publicarlo.",
        namePlaceholder: "Ej: Martina",
        comunaPlaceholder: "Ej: San Bernardo",
    },

    testimonials: {
        title: "Testimonios",
        intro: "Mostramos máximo 3, elegidos y revisados.",
        loadingText: "Cargando testimonios…",
        emptyText: "Todavía no hay testimonios publicados ✨",
    },

    gallery: {
        title: "Galería de Trabajos",
        intro: "Resultados reales de nuestras clientas satisfechas.",
        reelsTitle: "Reels / Videos",
        reelsIntro: "Clips cortos desde Instagram.",
        reelsTapText: "Toca para ver con sonido",
        photosTitle: "Galería de fotos",
        photosIntro: "Algunos resultados reales.",
        loadingText: "Cargando galería…",
        emptyText: "Pronto subiremos fotos reales de nuestros trabajos.",
        loadMore: "Cargar más fotos",
        allLoadedText: "Eso es todo por ahora.",
        modalTip: "Tip: flechas del teclado para navegar. Click en la foto para zoom.",
        defaultImageAlt: "Trabajo de trenzas",
    },

    faq: {
        title: "Preguntas frecuentes",
        items: [
            {
                q: "¿Cuánto dura el servicio?",
                a: "Depende del diseño y el largo. En general entre 1 y 4 horas. Te confirmamos al cotizar.",
            },
            {
                q: "¿Se pide abono para reservar?",
                a: "Sí. El abono asegura tu cupo y se descuenta del total el día del servicio.",
            },
            {
                q: "¿Qué debo enviar por WhatsApp?",
                a: "Ideal: foto de tu pelo, largo (o foto), referencia del estilo, fecha y comuna.",
            },
            {
                q: "¿Qué sectores cubres?",
                a: "San Bernardo y sectores cercanos. Si estás cerca, pregunta igual por WhatsApp.",
            },
        ],
    },

    footer: {
        brand: "Caroline Trenzas",
        description: "Especialista en trenzas y peinados profesionales a domicilio. Llevamos el estilo y la elegancia a tu hogar en San Bernardo.",
        contactTitle: "Contacto",
        phone: "+56 9 7401 1961",
        location: "San Bernardo, Región Metropolitana",
        schedule: "Sábados y Domingos: 09:00 - 19:00",
        socialTitle: "Síguenos",
        copyright: "© 2026 Caroline Trenzas. San Bernardo, RM. Todos los derechos reservados.",
        instagramUrl: "https://www.instagram.com/caroline_trenzas_/",
        whatsappPhone: "+56974011961",
    },

    modals: {
        whatsappTitle: "Cotizar por WhatsApp",
        whatsappSubtitle: "Respuesta rápida, sin vueltas.",
        reelTitle: "Reel / Video",
        reelSubtitle: "Toca play y súbele el volumen.",
        photoTitle: "Foto",
    },
};