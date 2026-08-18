import { create } from 'zustand';

interface ModalStore {
  isVerificationModalOpen: boolean;
  openVerificationModal: () => void;
  closeVerificationModal: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  isVerificationModalOpen: false,
  openVerificationModal: () => set({ isVerificationModalOpen: true }),
  closeVerificationModal: () => set({ isVerificationModalOpen: false }),
}));
