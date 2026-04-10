import { useUIStore } from "@/lib/store";

export function useUI() {
  const {
    globalLoading,
    globalLoadingMessage,
    toasts,
    modal,
    setGlobalLoading,
    showToast,
    hideToast,
    clearToasts,
    showModal,
    hideModal,
  } = useUIStore();

  return {
    globalLoading,
    globalLoadingMessage,
    toasts,
    modal,
    setGlobalLoading,
    showToast,
    hideToast,
    clearToasts,
    showModal,
    hideModal,
  };
}
