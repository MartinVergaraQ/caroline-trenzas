import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { defaultLandingContent, type LandingContent } from "@/lib/landing-content";
import { requireAdmin } from "@/lib/requireAdmin";

const CONTENT_KEY = "caroline:landing:content";

function sanitizeLandingContent(input: any): LandingContent {
    return {
        header: {
            brand: input?.header?.brand ?? defaultLandingContent.header.brand,
            navServices: input?.header?.navServices ?? defaultLandingContent.header.navServices,
            navGallery: input?.header?.navGallery ?? defaultLandingContent.header.navGallery,
            cta: input?.header?.cta ?? defaultLandingContent.header.cta,
        },

        hero: {
            badge: input?.hero?.badge ?? defaultLandingContent.hero.badge,
            title: input?.hero?.title ?? defaultLandingContent.hero.title,
            subtitle: input?.hero?.subtitle ?? defaultLandingContent.hero.subtitle,
            primaryCta: input?.hero?.primaryCta ?? defaultLandingContent.hero.primaryCta,
            secondaryCta: input?.hero?.secondaryCta ?? defaultLandingContent.hero.secondaryCta,
            imageSrc: input?.hero?.imageSrc ?? defaultLandingContent.hero.imageSrc,
            imageAlt: input?.hero?.imageAlt ?? defaultLandingContent.hero.imageAlt,
            imagePosition: input?.hero?.imagePosition ?? defaultLandingContent.hero.imagePosition,
            imagePublicId: input?.hero?.imagePublicId ?? defaultLandingContent.hero.imagePublicId ?? "",
        },

        services: {
            title: input?.services?.title ?? defaultLandingContent.services.title,
            intro: input?.services?.intro ?? defaultLandingContent.services.intro,
            emptyText: input?.services?.emptyText ?? defaultLandingContent.services.emptyText,
            missingImageText:
                input?.services?.missingImageText ?? defaultLandingContent.services.missingImageText,
            quotePrefix: input?.services?.quotePrefix ?? defaultLandingContent.services.quotePrefix,
        },

        beforeAfter: {
            title: input?.beforeAfter?.title ?? defaultLandingContent.beforeAfter.title,
            intro: input?.beforeAfter?.intro ?? defaultLandingContent.beforeAfter.intro,
            loadingText:
                input?.beforeAfter?.loadingText ?? defaultLandingContent.beforeAfter.loadingText,
            emptyText: input?.beforeAfter?.emptyText ?? defaultLandingContent.beforeAfter.emptyText,
            cardBadge: input?.beforeAfter?.cardBadge ?? defaultLandingContent.beforeAfter.cardBadge,
            missingImageText:
                input?.beforeAfter?.missingImageText ?? defaultLandingContent.beforeAfter.missingImageText,
            beforeLabel:
                input?.beforeAfter?.beforeLabel ?? defaultLandingContent.beforeAfter.beforeLabel,
            afterLabel:
                input?.beforeAfter?.afterLabel ?? defaultLandingContent.beforeAfter.afterLabel,
            cardTip: input?.beforeAfter?.cardTip ?? defaultLandingContent.beforeAfter.cardTip,
            sectionTip:
                input?.beforeAfter?.sectionTip ?? defaultLandingContent.beforeAfter.sectionTip,
        },

        process: {
            title: input?.process?.title ?? defaultLandingContent.process.title,
            steps:
                Array.isArray(input?.process?.steps) && input.process.steps.length > 0
                    ? input.process.steps.map((step: any, i: number) => ({
                        title: step?.title ?? defaultLandingContent.process.steps[i]?.title ?? "",
                        text: step?.text ?? defaultLandingContent.process.steps[i]?.text ?? "",
                        bullets: Array.isArray(step?.bullets) ? step.bullets.map(String) : [],
                    }))
                    : defaultLandingContent.process.steps,
        },

        coverage: {
            badge: input?.coverage?.badge ?? defaultLandingContent.coverage.badge,
            title: input?.coverage?.title ?? defaultLandingContent.coverage.title,
            coveredLabel:
                input?.coverage?.coveredLabel ?? defaultLandingContent.coverage.coveredLabel,
            zoneBadge: input?.coverage?.zoneBadge ?? defaultLandingContent.coverage.zoneBadge,
            zones: Array.isArray(input?.coverage?.zones)
                ? input.coverage.zones.map(String)
                : defaultLandingContent.coverage.zones,
            nearbyText:
                input?.coverage?.nearbyText ?? defaultLandingContent.coverage.nearbyText,
            description:
                input?.coverage?.description ?? defaultLandingContent.coverage.description,
            benefits: Array.isArray(input?.coverage?.benefits)
                ? input.coverage.benefits.map(String)
                : defaultLandingContent.coverage.benefits,
            mapButton: input?.coverage?.mapButton ?? defaultLandingContent.coverage.mapButton,
            mapHref: input?.coverage?.mapHref ?? defaultLandingContent.coverage.mapHref,
            mapEmbedSrc:
                input?.coverage?.mapEmbedSrc ?? defaultLandingContent.coverage.mapEmbedSrc,
        },

        policies: {
            title: input?.policies?.title ?? defaultLandingContent.policies.title,
            groups:
                Array.isArray(input?.policies?.groups) && input.policies.groups.length > 0
                    ? input.policies.groups.map((group: any) => ({
                        title: String(group?.title ?? ""),
                        items: Array.isArray(group?.items) ? group.items.map(String) : [],
                    }))
                    : defaultLandingContent.policies.groups,
        },

        reviewForm: {
            title: input?.reviewForm?.title ?? defaultLandingContent.reviewForm.title,
            subtitle: input?.reviewForm?.subtitle ?? defaultLandingContent.reviewForm.subtitle,
            timeBadge: input?.reviewForm?.timeBadge ?? defaultLandingContent.reviewForm.timeBadge,
            nameLabel: input?.reviewForm?.nameLabel ?? defaultLandingContent.reviewForm.nameLabel,
            comunaLabel:
                input?.reviewForm?.comunaLabel ?? defaultLandingContent.reviewForm.comunaLabel,
            starsLabel:
                input?.reviewForm?.starsLabel ?? defaultLandingContent.reviewForm.starsLabel,
            textLabel: input?.reviewForm?.textLabel ?? defaultLandingContent.reviewForm.textLabel,
            textPlaceholder:
                input?.reviewForm?.textPlaceholder ?? defaultLandingContent.reviewForm.textPlaceholder,
            moderationNote:
                input?.reviewForm?.moderationNote ?? defaultLandingContent.reviewForm.moderationNote,
            submit: input?.reviewForm?.submit ?? defaultLandingContent.reviewForm.submit,
            submitSending:
                input?.reviewForm?.submitSending ?? defaultLandingContent.reviewForm.submitSending,
            helper: input?.reviewForm?.helper ?? defaultLandingContent.reviewForm.helper,
            successTitle:
                input?.reviewForm?.successTitle ?? defaultLandingContent.reviewForm.successTitle,
            successText:
                input?.reviewForm?.successText ?? defaultLandingContent.reviewForm.successText,
            namePlaceholder:
                input?.reviewForm?.namePlaceholder ?? defaultLandingContent.reviewForm.namePlaceholder,
            comunaPlaceholder:
                input?.reviewForm?.comunaPlaceholder ?? defaultLandingContent.reviewForm.comunaPlaceholder,
        },

        testimonials: {
            title: input?.testimonials?.title ?? defaultLandingContent.testimonials.title,
            intro: input?.testimonials?.intro ?? defaultLandingContent.testimonials.intro,
            loadingText:
                input?.testimonials?.loadingText ?? defaultLandingContent.testimonials.loadingText,
            emptyText:
                input?.testimonials?.emptyText ?? defaultLandingContent.testimonials.emptyText,
        },

        gallery: {
            title: input?.gallery?.title ?? defaultLandingContent.gallery.title,
            intro: input?.gallery?.intro ?? defaultLandingContent.gallery.intro,
            reelsTitle: input?.gallery?.reelsTitle ?? defaultLandingContent.gallery.reelsTitle,
            reelsIntro: input?.gallery?.reelsIntro ?? defaultLandingContent.gallery.reelsIntro,
            reelsTapText:
                input?.gallery?.reelsTapText ?? defaultLandingContent.gallery.reelsTapText,
            photosTitle: input?.gallery?.photosTitle ?? defaultLandingContent.gallery.photosTitle,
            photosIntro: input?.gallery?.photosIntro ?? defaultLandingContent.gallery.photosIntro,
            loadingText:
                input?.gallery?.loadingText ?? defaultLandingContent.gallery.loadingText,
            emptyText: input?.gallery?.emptyText ?? defaultLandingContent.gallery.emptyText,
            loadMore: input?.gallery?.loadMore ?? defaultLandingContent.gallery.loadMore,
            allLoadedText:
                input?.gallery?.allLoadedText ?? defaultLandingContent.gallery.allLoadedText,
            modalTip: input?.gallery?.modalTip ?? defaultLandingContent.gallery.modalTip,
            defaultImageAlt:
                input?.gallery?.defaultImageAlt ?? defaultLandingContent.gallery.defaultImageAlt,
        },

        faq: {
            title: input?.faq?.title ?? defaultLandingContent.faq.title,
            items:
                Array.isArray(input?.faq?.items) && input.faq.items.length > 0
                    ? input.faq.items.map((item: any) => ({
                        q: String(item?.q ?? ""),
                        a: String(item?.a ?? ""),
                    }))
                    : defaultLandingContent.faq.items,
        },

        footer: {
            brand: input?.footer?.brand ?? defaultLandingContent.footer.brand,
            description:
                input?.footer?.description ?? defaultLandingContent.footer.description,
            contactTitle:
                input?.footer?.contactTitle ?? defaultLandingContent.footer.contactTitle,
            phone: input?.footer?.phone ?? defaultLandingContent.footer.phone,
            location: input?.footer?.location ?? defaultLandingContent.footer.location,
            schedule: input?.footer?.schedule ?? defaultLandingContent.footer.schedule,
            socialTitle:
                input?.footer?.socialTitle ?? defaultLandingContent.footer.socialTitle,
            copyright:
                input?.footer?.copyright ?? defaultLandingContent.footer.copyright,
            instagramUrl:
                input?.footer?.instagramUrl ?? defaultLandingContent.footer.instagramUrl,
            whatsappPhone:
                input?.footer?.whatsappPhone ?? defaultLandingContent.footer.whatsappPhone,
        },

        modals: {
            whatsappTitle:
                input?.modals?.whatsappTitle ?? defaultLandingContent.modals.whatsappTitle,
            whatsappSubtitle:
                input?.modals?.whatsappSubtitle ?? defaultLandingContent.modals.whatsappSubtitle,
            reelTitle: input?.modals?.reelTitle ?? defaultLandingContent.modals.reelTitle,
            reelSubtitle:
                input?.modals?.reelSubtitle ?? defaultLandingContent.modals.reelSubtitle,
            photoTitle: input?.modals?.photoTitle ?? defaultLandingContent.modals.photoTitle,
        },
    };
}

export async function GET(req: NextRequest) {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    try {
        const content = await redis.get(CONTENT_KEY);

        return NextResponse.json({
            ok: true,
            content: content ?? defaultLandingContent,
        });
    } catch {
        return NextResponse.json({
            ok: true,
            content: defaultLandingContent,
        });
    }
}

export async function PUT(req: NextRequest) {
    const auth = await requireAdmin(req);
    if (!auth.ok) return auth.res;

    try {
        const body = await req.json();
        const clean = sanitizeLandingContent(body);

        await redis.set(CONTENT_KEY, clean);

        return NextResponse.json({
            ok: true,
            content: clean,
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                ok: false,
                message: error?.message || "No se pudo guardar el contenido",
            },
            { status: 500 }
        );
    }
}