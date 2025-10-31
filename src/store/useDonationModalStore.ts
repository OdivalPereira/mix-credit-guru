import { create } from 'zustand';

interface DonationModalState {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useDonationModalStore = create<DonationModalState>((set) => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
}));
