"use client";

export default function SettingsView({
    canPasskey,
    hasPasskey,
    loadingPasskey,
    onRegisterPasskey,
    onLogout,
}: {
    canPasskey: boolean | null;
    hasPasskey: boolean;
    loadingPasskey: boolean;
    onRegisterPasskey: () => void;
    onLogout: () => void;
}) {
    const statusText =
        canPasskey === null
            ? "Comprobando compatibilidad…"
            : !canPasskey
                ? "Este navegador no soporta passkeys."
                : hasPasskey
                    ? "Passkey registrada"
                    : "No hay passkey registrada todavía.";

    const badge =
        canPasskey && hasPasskey
            ? { label: "ACTIVO", cls: "bg-green-100 text-green-700" }
            : { label: "INACTIVO", cls: "bg-primary/10 text-primary" };

    return (
        <div className="space-y-8">
            {/* Cards top */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* FaceID */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/10 flex flex-col justify-between">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-3 rounded-2xl">
                                <span className="material-symbols-outlined text-primary">fingerprint</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Face ID / Huella</h3>
                                <p className="text-xs text-slate-500">Seguridad biométrica</p>
                            </div>
                        </div>

                        <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${badge.cls}`}>
                            {badge.label}
                        </span>
                    </div>

                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center py-2 border-b border-primary/5">
                            <span className="text-sm text-slate-500">Estado</span>
                            <span className="text-sm font-semibold">{canPasskey ? "Disponible" : "No disponible"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-primary/5">
                            <span className="text-sm text-slate-500">Passkey</span>
                            <span className="text-sm font-semibold">{hasPasskey ? "Registrada" : "No registrada"}</span>
                        </div>
                        <p className="text-sm text-slate-500">{statusText}</p>
                    </div>

                    {canPasskey && !hasPasskey ? (
                        <button
                            type="button"
                            onClick={onRegisterPasskey}
                            disabled={loadingPasskey}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            <span className="material-symbols-outlined text-sm">passkey</span>
                            {loadingPasskey ? "Registrando..." : "Registrar Face ID / Huella"}
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onRegisterPasskey}
                            disabled={!canPasskey || loadingPasskey}
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60"
                            title={!canPasskey ? "Este navegador no soporta passkeys" : ""}
                        >
                            <span className="material-symbols-outlined text-sm">sync</span>
                            {loadingPasskey ? "Procesando..." : "Volver a registrar"}
                        </button>
                    )}
                </div>

                {/* Sesión */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-primary/10 flex flex-col justify-between">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-slate-100 p-3 rounded-2xl">
                                <span className="material-symbols-outlined text-slate-600">devices</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Sesión</h3>
                                <p className="text-xs text-slate-500">Gestión de cuenta</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center items-center py-4 px-8 text-center bg-background-light rounded-2xl mb-6">
                        <span className="material-symbols-outlined text-primary/40 text-4xl mb-2">shield_person</span>
                        <p className="text-xs text-slate-500">
                            Si algo se queda pegado, cerrar sesión y volver suele “arreglarlo”.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onLogout}
                        className="w-full border-2 border-primary/20 hover:bg-primary/5 text-primary font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">logout</span>
                        Cerrar sesión
                    </button>
                </div>
            </div>

            {/* Footer tag */}
            <div className="text-center pt-4">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    Caroline Trenzas Admin Panel
                </p>
            </div>
        </div>
    );
}