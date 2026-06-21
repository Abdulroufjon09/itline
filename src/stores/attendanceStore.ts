import { defineStore } from 'pinia'
import { useUiStore } from './uiStore'
import { API_BASE } from '../config'

export const useAttendanceStore = defineStore('attendance', {
  actions: {
    async mark(userId: string, status: 'present' | 'absent' | 'late') {
      const ui = useUiStore()
      ui.start()
      try {
        try {
          await fetch(`${API_BASE}/attendance`, {
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