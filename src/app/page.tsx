import WhatsAppLeadForm from "@/components/WhatsAppLeadForm";
import { site } from "@/config/site";

export default function Home() {
  return (
    <main className="min-h-dvh bg-gradient-to-b from-rose-50 via-white to-white">
      <div className="mx-auto max-w-lg px-5 py-10">
        <header className="space-y-3">
          <p className="inline-flex w-fit rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
            Agenda por WhatsApp
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
            {site.name}
          </h1>
          <p className="text-base leading-relaxed text-neutral-600">
            Trenzas y peinados con acabado profesional. Reserva rápido y sin vueltas.
          </p>
        </header>

        <section className="mt-8 rounded-3xl border border-rose-100 bg-white/60 p-5 backdrop-blur">
          <h2 className="text-lg font-semibold text-neutral-900">Agenda tu hora</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Completa lo mínimo y envíalo directo a WhatsApp.
          </p>

          <div className="mt-5">
            <WhatsAppLeadForm />
          </div>
        </section>

        <footer className="mt-8 text-center text-xs text-neutral-400">
          © {new Date().getFullYear()} {site.name}
        </footer>
      </div>
    </main>
  );
}
