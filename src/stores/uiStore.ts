import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    loading: false as boolean,
  }),
  actions: {
    start() { this.loading = true },
    stop() { this.loading = false },
    set(v: boolean) { this.loading = v },
  },
})
