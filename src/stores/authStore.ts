import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as null | { id: string; name: string; role: string },
    token: '' as string,
  }),
  actions: {
    setUser(u: { id: string; name: string; role: string } | null) {
      this.user = u
    },
    setToken(t: string) {
      this.token = t
    },
  },
})
