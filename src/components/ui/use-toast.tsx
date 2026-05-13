"use client";

import * as React from "react";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastProps,
} from "./toast";

type ToastEntry = {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastProps["variant"];
};

type ToastContextValue = {
  toast: (entry: Omit<ToastEntry, "id">) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastRoot({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastEntry[]>([]);

  const toast = React.useCallback((entry: Omit<ToastEntry, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...entry, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastProvider>
        {children}
        {toasts.map((t) => (
          <Toast key={t.id} variant={t.variant}>
            <div className="grid gap-1">
              {t.title && <ToastTitle>{t.title}</ToastTitle>}
              {t.description && <ToastDescription>{t.description}</ToastDescription>}
            </div>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    return {
      toast: (entry: Omit<ToastEntry, "id">) => {
        if (typeof window !== "undefined") {
          console.warn("Toast outside provider", entry);
        }
      },
    } satisfies ToastContextValue;
  }
  return ctx;
}
