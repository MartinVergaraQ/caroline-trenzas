"use client";

import React, { useState } from "react";

type NavKey = "dashboard" | "gallery" | "services" | "beforeAfter" | "testimonials" | "settings";

const NAV: { key: NavKey; label: string; icon: string }[] = [
    { key: "dashboard", label: "Panel", icon: "dashboard" },
    { key: "gallery", label: "Galería", icon: "grid_view" },
    { key: "services", label: "Servicios", icon: "content_cut" },
    { key: "beforeAfter", label: "Antes/Después", icon: "compare" },
    { key: "testimonials", label: "Testimonios", icon: "chat_bubble" },
    { key: "settings", label: "Ajustes", icon: "settings" },
];

function clsx(...parts: Array<string | false | null | undefined>) {
    return parts.filter(Boolean).join(" ");
}

export default function AdminShell({
    active,
    onNavigate,
    onLogout,
    title,
    subtitle,
    titleIcon,
    search,
    rightActions,
    children,
    user,
}: {
    active: NavKey;
    onNavigate: (key: NavKey) => void;
    onLogout: () => void;

    title: string;
    subtitle?: string;
    titleIcon?: string; // material symbol name, ej: "settings"

    search?: {
        placeholder?: string;
        value: string;
        onChange: (v: string) => void;
    };

    rightActions?: React.ReactNode;
    children: React.ReactNode;

    user?: {
        name: string;
        email: string;
        avatarUrl?: string;
    };
}) {
    const [mobileOpen, setMobileOpen] = useState(false);

    const searchPlaceholder = search?.placeholder ?? "Buscar...";

    const Sidebar = ({ compact = false }: { compact?: boolean }) => (
        <aside
            className={clsx(
                "bg-white border-r border-primary/10 flex flex-col",
                compact ? "w-full" : "w-72",
            )}
        >
            {/* Brand */}
            <div className="p-6 flex items-center gap-3">
                <div className="bg-primary/20 p-2 rounded-full">
                    <span className="material-symbols-outlined text-primary">face_6</span>
                </div>
                <div className="min-w-0">
                    <h1 className="text-sm font-bold leading-tight truncate">Caroline Trenzas</h1>
                    <p className="text-xs text-slate-500">Admin Panel</p>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 space-y-1">
                {NAV.map((it) => {
                    const isActive = it.key === active;
                    return (
                        <button
                            key={it.key}
                            type="button"
                            onClick={() => {
                                onNavigate(it.key);
                                setMobileOpen(false);
                            }}
                            className={clsx(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-slate-600 hover:bg-primary/5 hover:text-primary",
                            )}
                        >
                            <span className="material-symbols-outlined">{it.icon}</span>
                            <span className="text-sm font-medium">{it.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* User footer (como en el mock) */}
            <div className="p-4 border-t border-primary/10">
                <div className="flex items-center gap-3 p-2 rounded-2xl hover:bg-black/5 transition">
                    <div className="size-10 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center">
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="material-symbols-outlined text-primary">person</span>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{user?.name ?? "Admin"}</p>
                        <p className="text-[10px] text-slate-500 truncate">{user?.email ?? "admin@caroline.com"}</p>
                    </div>

                    <button
                        type="button"
                        onClick={onLogout}
                        className="size-9 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 flex items-center justify-center"
                        aria-label="Cerrar sesión"
                        title="Cerrar sesión"
                    >
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                    </button>
                </div>
            </div>
        </aside>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-background-light">
            {/* Desktop Sidebar */}
            <div className="hidden lg:flex shrink-0">
                <Sidebar />
            </div>

            {/* Mobile Drawer */}
            {mobileOpen ? (
                <div className="lg:hidden fixed inset-0 z-[9999]">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setMobileOpen(false)}
                    />
                    <div className="absolute left-0 top-0 h-full w-[86vw] max-w-sm shadow-xl">
                        <Sidebar compact />
                    </div>
                </div>
            ) : null}

            {/* Main */}
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                {/* Topbar */}
                <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-primary/10">
                    <div className="px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                type="button"
                                className="lg:hidden size-10 rounded-full bg-background-light border border-primary/10 flex items-center justify-center"
                                aria-label="Menú"
                                onClick={() => setMobileOpen(true)}
                            >
                                <span className="material-symbols-outlined text-slate-600">menu</span>
                            </button>

                            <div className="min-w-0">
                                <div className="flex items-center gap-2 min-w-0">
                                    {titleIcon ? (
                                        <span className="material-symbols-outlined text-primary">{titleIcon}</span>
                                    ) : null}
                                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">{title}</h2>
                                </div>
                                {subtitle ? (
                                    <p className="text-xs sm:text-sm text-slate-500 truncate">{subtitle}</p>
                                ) : null}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            {/* Search (desktop) */}
                            {search ? (
                                <div className="hidden md:flex items-center bg-background-light rounded-full px-4 py-2 border border-primary/5">
                                    <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
                                    <input
                                        value={search.value}
                                        onChange={(e) => search.onChange(e.target.value)}
                                        className="bg-transparent border-none focus:ring-0 text-sm w-64 placeholder:text-slate-400"
                                        placeholder={searchPlaceholder}
                                        type="text"
                                    />
                                </div>
                            ) : null}

                            {rightActions}
                        </div>
                    </div>

                    {/* Search (mobile) */}
                    {search ? (
                        <div className="px-4 sm:px-8 pb-4 md:hidden">
                            <div className="flex items-center bg-background-light rounded-full px-4 py-2 border border-primary/5">
                                <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
                                <input
                                    value={search.value}
                                    onChange={(e) => search.onChange(e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400"
                                    placeholder={searchPlaceholder}
                                    type="text"
                                />
                            </div>
                        </div>
                    ) : null}
                </header>

                {/* Content */}
                <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">{children}</div>
            </main>
        </div>
    );
}