import { defineStore } from 'pinia'
import { useUiStore } from './uiStore'

type User = {
  id: string
  name: string
  role: 'student' | 'teacher' | 'admin' | 'manager'
  coins: number
  group?: string
}

export const useCoinStore = defineStore('coin', {
  state: () => ({
    users: [] as User[],
    _lastFetched: 0 as number,
  }),
  getters: {
    leaderboard: (state) => [...state.users].sort((a, b) => b.coins - a.coins),
    topN: (state) => (n: number) => [...state.users].sort((a, b) => b.coins - a.coins).slice(0, n),
  },
  actions: {
    async fetchUsers(force: boolean = false) {
      const ui = useUiStore()
      const TTL = 60 * 1000 // 60s cache
      if (!force && this._lastFetched && Date.now() - this._lastFetched < TTL && this.users.length) {
        return
      }
      ui.start()
      try {
        const res = await fetch('/api/users')
        if (!res.ok) {
          const text = await res.text().catch(() => '')
          console.error('CoinStore.fetchUsers non-ok', res.status, text)
          window.dispatchEvent(new CustomEvent('app-alert', { detail: { type: 'error', message: `Users fetch failed: ${res.status}` } }))
          return
        }

        const ct = res.headers.get('content-type') || ''
        if (!ct.includes('application/json')) {
          const text = await res.text().catch(() => '')
          console.error('CoinStore.fetchUsers non-json response', text)
          window.dispatchEvent(new CustomEvent('app-alert', { detail: { type: 'error', message: 'Users response not JSON' } }))
          return
        }

        try {
          this.users = await res.json()
          this._lastFetched = Date.now()
        } catch (e) {
          const txt = await res.text().catch(() => '')
          console.error('CoinStore.fetchUsers parse error', e, txt)
          window.dispatchEvent(new CustomEvent('app-alert', { detail: { type: 'error', message: 'Users parse error' } }))
        }
      } catch (e) {
        console.error('CoinStore.fetchUsers', e)
        window.dispatchEvent(new CustomEvent('app-alert', { detail: { type: 'error', message: 'Users fetch error' } }))
      } finally {
        ui.stop()
      }
    },

    findUser(id: string) {
      return this.users.find((u) => u.id === id) || null
    },

    async updateCoin(userId: string, delta: number, reason?: string) {
      const u = this.findUser(userId)
      if (!u) return
      u.coins = Math.max(0, u.coins + delta)
      // optimistic update; also notify backend
      try {
        await fetch(`/api/users/${userId}/coins`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delta, reason }),
        })
      } catch (e) {
        console.warn('Failed to sync coin update', e)
      }
    },

    // Attendance rules
    async applyAttendance(userId: string, status: 'present' | 'absent' | 'late') {
      if (status === 'present') return this.updateCoin(userId, 10, 'attendance_present')
      if (status === 'absent') return this.updateCoin(userId, -10, 'attendance_absent')
      if (status === 'late') return this.updateCoin(userId, -5, 'attendance_late')
    },

    // Task rules
    async applyTask(userId: string, done: boolean) {
      return this.updateCoin(userId, done ? 10 : -10, 'task')
    },

    // Exam: base 80 coins if passed; bonus 20 awarded separately if passed
    async applyExam(userId: string, passed: boolean) {
      if (!passed) return this.updateCoin(userId, 0, 'exam_failed')
      await this.updateCoin(userId, 80, 'exam_pass')
      // bonus as separate call (per request: +20 bonus when passed)
      await this.updateCoin(userId, 20, 'exam_bonus')
    },

    // Referral
    async applyReferral(userId: string) {
      return this.updateCoin(userId, 100, 'referral')
    },
  },
})
