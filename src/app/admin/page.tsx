"use client";

import { useState } from "react";

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

export default function AdminPage() {
    const [authed, setAuthed] = useState(false);
    const [pwd, setPwd] = useState("");
    const [msg, setMsg] = useState("");
    const [selectedServiceId, setSelectedServiceId] = useState(SERVICES[0].id);

    // PUBLIC envs (browser)
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
    const presetGallery = process.env.NEXT_PUBLIC_CLOUDINARY_GALLERY_PRESET || "";
    const presetServices = process.env.NEXT_PUBLIC_CLOUDINARY_SERVICES_PRESET || "";

    async function login() {
        setMsg("");
        const r = await fetch("/api/admin/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: pwd }),
        });

        if (r.ok) setAuthed(true);
        else setMsg("Clave incorrecta.");
    }

    function logout() {
        setAuthed(false);
        setPwd("");
        setMsg("");
    }

    function openUploader(type: "gallery" | "services") {
        setMsg("");

        if (!cloudName) return setMsg("Falta NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME en .env.local");

        const uploadPreset = type === "gallery" ? presetGallery : presetServices;
        if (!uploadPreset) {
            return setMsg(
                `Falta ${type === "gallery"
                    ? "NEXT_PUBLIC_CLOUDINARY_GALLERY_PRESET"
                    : "NEXT_PUBLIC_CLOUDINARY_SERVICES_PRESET"
                } en .env.local`
            );
        }

        if (!window.cloudinary) {
            return setMsg("Cloudinary widget no cargó. Revisa el Script del widget en tu layout.tsx.");
        }

        const isGallery = type === "gallery";
        const folder = isGallery ? "caroline/galeria" : "caroline/servicios";

        // Estrategia robusta:
        // - NO dependemos del nombre del archivo.
        // - Marcamos con TAGS qué es cada cosa.
        // - Luego el backend busca por tags (service_boxer, etc).
        const tags = isGallery
            ? ["gallery"]
            : ["services", `service_${selectedServiceId}`];

        const context = isGallery
            ? { album: "gallery" }
            : { album: "services", service: selectedServiceId };

        const options: any = {
            cloudName,
            uploadPreset,
            folder,

            multiple: !isGallery,
            maxFiles: isGallery ? 1 : 50,

            sources: ["local", "camera", "google_drive"],
            clientAllowedFormats: ["png", "jpg", "jpeg", "webp"],
            cropping: false,
            showAdvancedOptions: false,
            resourceType: "image",

            // UX: galería de a 1 para evitar duplicados por accidente
            singleUploadAutoClose: isGallery,
            showCompletedButton: true,

            tags,
            context,

            styles: {
                palette: {
                    window: "#ffffff",
                    windowBorder: "#f0e7ea",
                    tabIcon: "#89616f",
                    menuIcons: "#89616f",
                    textDark: "#181113",
                    textLight: "#ffffff",
                    link: "#d61f69",
                    action: "#d61f69",
                    inactiveTabIcon: "#89616f",
                    error: "#c0392b",
                    inProgress: "#d61f69",
                    complete: "#2ecc71",
                    sourceBg: "#fdfafb",
                },
            },
        };

        const widget = window.cloudinary.createUploadWidget(options, (error: any, result: any) => {
            if (error) {
                console.error("CLOUDINARY ERROR:", error);
                setMsg(`❌ Error subiendo: ${error?.message || "mira consola"}`);
                return;
            }

            if (result?.event === "success") {
                const info = result.info || {};
                const publicId = info.public_id || "(sin public_id)";
                const secureUrl = info.secure_url || "(sin url)";
                const detectedFolder =
                    publicId.includes("/") ? publicId.split("/").slice(0, -1).join("/") : "(sin carpeta)";

                console.log("UPLOAD OK:", { type, folder_sent: folder, tags, context, info });

                setMsg(
                    `✅ Subida OK.\n` +
                    `• public_id: ${publicId}\n` +
                    `• carpeta detectada: ${detectedFolder}\n` +
                    `• tags: ${(info.tags || tags).join(", ")}\n` +
                    `• url: ${secureUrl}\n`
                );
            }
        });

        widget.open();
    }

    if (!authed) {
        return (
            <main className="min-h-screen flex items-center justify-center p-6 bg-[#fdfafb]">
                <div className="w-full max-w-md rounded-2xl border p-6 bg-white shadow-sm">
                    <h1 className="text-xl font-bold mb-3">Admin Caroline Trenzas</h1>
                    <p className="text-sm text-[#89616f] mb-4">Ingresa la clave para subir fotos.</p>

                    <input
                        type="password"
                        value={pwd}
                        onChange={(e) => setPwd(e.target.value)}
                        className="w-full border rounded-xl px-4 py-3 mb-3"
                        placeholder="Clave"
                    />

                    <button
                        onClick={login}
                        className="w-full rounded-xl bg-primary text-white font-bold py-3"
                    >
                        Entrar
                    </button>

                    {msg && <p className="mt-3 text-sm text-red-600 whitespace-pre-line">{msg}</p>}
                </div>
            </main>
        );
    }

    const selectedTitle = SERVICES.find((x) => x.id === selectedServiceId)?.title || "Servicio";

    return (
        <main className="min-h-screen p-6 lg:p-12 bg-[#fdfafb]">
            <div className="max-w-3xl mx-auto bg-white border rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black mb-1">Subir fotos</h1>
                        <p className="text-sm text-[#89616f]">Sube fotos y se verán automáticamente en la landing.</p>
                    </div>

                    <button
                        onClick={logout}
                        className="rounded-full border px-4 py-2 text-sm font-bold hover:bg-black/5"
                    >
                        Salir
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {/* GALERÍA */}
                    <div className="rounded-2xl border p-6">
                        <p className="font-bold">📸 Galería</p>
                        <p className="text-sm text-[#89616f] mt-1">
                            Se guarda en <span className="font-mono">caroline/galeria</span>
                        </p>

                        <button
                            onClick={() => openUploader("gallery")}
                            className="mt-4 w-full rounded-xl bg-primary text-white font-bold py-3"
                        >
                            Subir 1 foto a Galería
                        </button>

                        <p className="mt-3 text-xs text-[#89616f]">
                            Consejo no solicitado: subir de a 1 evita la clásica tragedia humana del duplicado.
                        </p>
                    </div>

                    {/* SERVICIOS */}
                    <div className="rounded-2xl border p-6">
                        <p className="font-bold">✨ Servicios</p>
                        <p className="text-sm text-[#89616f] mt-1">
                            Se guarda en <span className="font-mono">caroline/servicios</span>
                        </p>

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
                            Estas fotos quedan taggeadas como <span className="font-mono">service_{selectedServiceId}</span>.
                            Eso es lo que el backend debe usar para asignarlas.
                        </p>
                    </div>
                </div>

                {msg && (
                    <div className="mt-6 rounded-xl border border-primary/10 bg-[#fdfafb] p-4">
                        <p className="text-sm text-[#181113] whitespace-pre-line">{msg}</p>
                    </div>
                )}
            </div>
        </main>
    );
}
