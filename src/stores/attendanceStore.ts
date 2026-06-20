import { defineStore } from 'pinia'
import { useCoinStore } from './coinStore'
import { useUiStore } from './uiStore'

export const useAttendanceStore = defineStore('attendance', {
  actions: {
    async mark(userId: string, status: 'present' | 'absent' | 'late') {
      const coins = useCoinStore()
      const ui = useUiStore()
      ui.start()
      try {
        await coins.applyAttendance(userId, status)
        // sync attendance record to backend
        try {
          await fetch(`/api/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, status, ts: new Date().toISOString() }),
          })
        } catch (e) {
          console.warn('attendance sync failed', e)
        }
      } finally {
        ui.stop()
      }
    },
  },
})
