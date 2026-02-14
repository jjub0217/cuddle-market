import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { User } from '@/types'

interface UserState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  redirectUrl: string | null
  _hasHydrated: boolean

  setUser: (user: User | null) => void
  setAccessToken: (token: string | null) => void
  setRefreshToken: (token: string | null) => void
  setRedirectUrl: (url: string | null) => void
  updateUserProfile: (updates: Partial<User>) => void
  handleLogin: (user: User, accessToken: string, refreshToken: string) => void
  clearAll: () => void

  isLogin: () => boolean
  getUserId: () => number | null

  validateAuthState: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      redirectUrl: null,
      refreshToken: null,
      _hasHydrated: false,

      setUser: (user) => set({ user }),
      setAccessToken: (token) => set({ accessToken: token }),
      setRefreshToken: (token) => set({ refreshToken: token }),
      setRedirectUrl: (url) => set({ redirectUrl: url }),

      updateUserProfile: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      handleLogin: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken })
      },

      clearAll: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          redirectUrl: null,
        })
        if (typeof window !== 'undefined') {
          localStorage.removeItem('user-storage')
        }
      },

      isLogin: () => {
        const { user, accessToken } = get()
        return user !== null && accessToken !== null
      },

      getUserId: () => {
        return get().user?.id || null
      },

      validateAuthState: () => {
        const { user, accessToken, refreshToken } = get()

        if (user && (!accessToken || !refreshToken)) {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            redirectUrl: null,
          })
        }
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => {
        return () => {
          useUserStore.setState({ _hasHydrated: true })
        }
      },
    }
  )
)
