import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDonationModalStore } from '../useDonationModalStore';

// Reset the store's state before each test
beforeEach(() => {
  useDonationModalStore.setState({ isOpen: false });
  // Ensure we use fake timers
  vi.useFakeTimers();
});

// Restore real timers after each test
afterEach(() => {
  vi.useRealTimers();
});

describe('useDonationModalStore', () => {
  it('should open the modal', () => {
    useDonationModalStore.getState().openModal();
    expect(useDonationModalStore.getState().isOpen).toBe(true);
  });

  it('should close the modal', () => {
    // First, open the modal to ensure we can close it
    useDonationModalStore.setState({ isOpen: true });
    useDonationModalStore.getState().closeModal();
    expect(useDonationModalStore.getState().isOpen).toBe(false);
  });

  it('should reopen the modal after 30 minutes', () => {
    // Close the modal, which should start the timer
    useDonationModalStore.getState().closeModal();
    expect(useDonationModalStore.getState().isOpen).toBe(false);

    // Advance time by 30 minutes
    vi.advanceTimersByTime(30 * 60 * 1000);

    // The modal should now be open
    expect(useDonationModalStore.getState().isOpen).toBe(true);
  });

  it('should not reopen the modal if it is opened manually before the timer fires', () => {
    // Close the modal to start the timer
    useDonationModalStore.getState().closeModal();
    expect(useDonationModalStore.getState().isOpen).toBe(false);

    // Manually open the modal before the timer completes
    useDonationModalStore.getState().openModal();
    expect(useDonationModalStore.getState().isOpen).toBe(true);

    // Advance time by 30 minutes
    vi.advanceTimersByTime(30 * 60 * 1000);

    // The modal should remain open, not affected by a second timer
    expect(useDonationModalStore.getState().isOpen).toBe(true);
  });

  it('should cancel the timer when opened manually', () => {
    // Close the modal to start the timer
    useDonationModalStore.getState().closeModal();
    expect(useDonationModalStore.getState().isOpen).toBe(false);

    // Manually open the modal, which should clear the timer
    useDonationModalStore.getState().openModal();
    expect(useDonationModalStore.getState().isOpen).toBe(true);

    // Close it again
    useDonationModalStore.getState().closeModal();
    expect(useDonationModalStore.getState().isOpen).toBe(false);

    // Advance time by just less than 30 minutes to ensure no premature firing
    vi.advanceTimersByTime(29 * 60 * 1000);
    expect(useDonationModalStore.getState().isOpen).toBe(false); // Should still be closed

    // Now advance past the 30-minute mark from the *second* closing
    vi.advanceTimersByTime(2 * 60 * 1000);
    expect(useDonationModalStore.getState().isOpen).toBe(true); // Should now be open
  });
});
