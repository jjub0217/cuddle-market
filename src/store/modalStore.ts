import { create } from 'zustand'

interface ConfirmModalState {
  isOpen: boolean
  modalType: 'login' | 'logout'
  onConfirm: (() => void) | null

  openLoginModal: () => void
  openLogoutModal: (onConfirm: () => void) => void
  closeModal: () => void
}

export const useLoginModalStore = create<ConfirmModalState>((set) => ({
  isOpen: false,
  modalType: 'login',
  onConfirm: null,

  openLoginModal: () =>
    set({
      isOpen: true,
      modalType: 'login',
      onConfirm: null,
    }),

  openLogoutModal: (onConfirm) =>
    set({
      isOpen: true,
      modalType: 'logout',
      onConfirm,
    }),

  closeModal: () =>
    set({
      isOpen: false,
      onConfirm: null,
    }),
}))
