import { create } from 'zustand';

interface ToastStore {
  message: string | null;
  show: (message: string) => void;
  hide: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  message: null,
  show: (message) => set({ message }),
  hide: () => set({ message: null }),
}));
