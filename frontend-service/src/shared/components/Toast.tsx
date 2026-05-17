"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export interface ToastProps {
  id: string;
  title: string;
  description?: string;
  type?: "success" | "error" | "info" | "brand";
}

interface ToastContextType {
  toast: (props: Omit<ToastProps, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = useCallback(({ title, description, type = "info" }: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastProps; onDismiss: () => void }) {
  const typeStyles = {
    success: "border-success bg-surface",
    error: "border-danger bg-surface",
    info: "border-info bg-surface",
    brand: "border-brand-500 bg-surface",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      drag="x"
      dragConstraints={{ left: 0, right: 300 }}
      onDragEnd={(e, { offset, velocity }) => {
        if (offset.x > 100 || velocity.x > 500) {
          onDismiss();
        }
      }}
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg w-80 ${typeStyles[toast.type || "info"]}`}
    >
      <div className="flex-1">
        <h4 className="text-sm font-semibold themed-text">{toast.title}</h4>
        {toast.description && <p className="text-sm themed-text-3 mt-1">{toast.description}</p>}
      </div>
      <button onClick={onDismiss} className="themed-text-3 hover:themed-text transition-colors">
        <X size={16} />
      </button>
    </motion.div>
  );
}
