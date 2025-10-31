import { create } from 'zustand';

// Use a module-level variable to hold the timer ID.
// This avoids storing implementation details in the state itself.
let timer: NodeJS.Timeout | number;

interface DonationModalState {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useDonationModalStore = create<DonationModalState>((set, get) => ({
  isOpen: false,
  openModal: () => {
    // When the modal is opened (manually or by timer), clear any existing timer.
    if (timer) {
      clearTimeout(timer);
    }
    set({ isOpen: true });
  },
  closeModal: () => {
    set({ isOpen: false });
    // Set a timer to reopen the modal after 30 minutes.
    timer = setTimeout(() => {
      get().openModal();
    }, 30 * 60 * 1000); // 30 minutes
  },
}));
