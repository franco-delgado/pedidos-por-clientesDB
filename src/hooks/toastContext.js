import { createContext, useContext } from "react";

export const ToastContext = createContext({ mostrar: () => {} });

// const toast = useToast();  ->  toast.mostrar("Guardado", "ok" | "error" | "alerta")
export const useToast = () => useContext(ToastContext);
