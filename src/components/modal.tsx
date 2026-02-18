"use client";

import { useEffect } from "react";

type ModalProps = {
    open: boolean;
    title?: string;
    onClose: () => void;
    children: React.ReactNode;
};

export default function Modal({ open, title, onClose, children }: ModalProps) {
    useEffect(() => {
        if (!open) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        document.addEventListener("keydown", onKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100]">
            {/* Backdrop */}
            <button
                aria-label="Cerrar"
                onClick={onClose}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            {/* Panel (bottom sheet en mobile, centrado en md+) */}
            <div className="absolute inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center p-4">
                <div className="w-full md:max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#f4f0f2]">
                        <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">chat</span>
                            </div>
                            <div>
                                <p className="font-extrabold text-[#181113] leading-tight">
                                    {title ?? "Cotizar por WhatsApp"}
                                </p>
                                <p className="text-xs text-[#89616f]">Respuesta rápida, sin vueltas.</p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="size-10 rounded-full hover:bg-black/5 flex items-center justify-center"
                            aria-label="Cerrar modal"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="px-6 py-5">{children}</div>
                </div>
            </div>
        </div>
    );
}
