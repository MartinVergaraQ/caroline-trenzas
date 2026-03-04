// src/lib/alerts.ts
import { toast } from "sonner";

type Kind = "success" | "error" | "info";

export const alerts = {
    success(title: string, detail?: string) {
        toast.success(title, detail ? { description: detail } : undefined);
    },

    error(title: string, detail?: string) {
        toast.error(title, detail ? { description: detail } : undefined);
    },

    info(title: string, detail?: string) {
        toast(title, detail ? { description: detail } : undefined);
    },

    // opcional: para promesas (subidas, deletes)
    promise<T>(p: Promise<T>, msgs: { loading: string; success: string; error: string }) {
        return toast.promise(p, {
            loading: msgs.loading,
            success: msgs.success,
            error: msgs.error,
        });
    },
};