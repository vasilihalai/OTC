import { create } from 'zustand';

interface TransferModalStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useTransferModalStore = create<TransferModalStore>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
