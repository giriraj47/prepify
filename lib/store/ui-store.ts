import { create } from "zustand";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
}

export interface ModalState {
  isOpen: boolean;
  title?: string;
  content?: React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface UIState {
  globalLoading: boolean;
  globalLoadingMessage: string | null;
  toasts: Toast[];
  modal: ModalState | null;

  // Actions
  setGlobalLoading: (loading: boolean, message?: string | null) => void;
  showToast: (message: string, type?: Toast["type"], duration?: number) => void;
  hideToast: (id: string) => void;
  clearToasts: () => void;
  showModal: (modal: Omit<ModalState, "isOpen">) => void;
  hideModal: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  globalLoading: false,
  globalLoadingMessage: null,
  toasts: [],
  modal: null,

  setGlobalLoading: (loading: boolean, message: string | null = null) => {
    set({ globalLoading: loading, globalLoadingMessage: message });
  },

  showToast: (
    message: string,
    type: Toast["type"] = "info",
    duration = 4000,
  ) => {
    const id = Date.now().toString();
    const toast: Toast = { id, message, type, duration };

    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    // Auto-hide toast
    if (duration > 0) {
      setTimeout(() => {
        get().hideToast(id);
      }, duration);
    }
  },

  hideToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },

  showModal: (modalData) => {
    set({
      modal: {
        isOpen: true,
        ...modalData,
      },
    });
  },

  hideModal: () => {
    set({ modal: null });
  },
}));
