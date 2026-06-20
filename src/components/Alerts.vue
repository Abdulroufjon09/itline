<template>
  <div class="alerts-root">
    <div v-for="(a, i) in alerts" :key="i" :class="['alert', a.type]">{{ a.message }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

type Alert = { type: 'success' | 'error' | 'info'; message: string }
const alerts = ref<Alert[]>([])

function push(a: Alert) {
  alerts.value.push(a)
  setTimeout(() => { alerts.value.shift() }, 4000)
}

onMounted(() => {
  window.addEventListener('app-alert', (e: any) => {
    const d = e.detail
    push({ type: d.type || 'info', message: d.message || '' })
    // try native Notification as fallback (user must allow)
    if ((window as any).Notification && Notification.permission === 'granted') {
      new Notification(d.message)
    } else if ((window as any).Notification && Notification.permission !== 'denied') {
      Notification.requestPermission().then((p) => { if (p === 'granted') new Notification(d.message) })
    }
  })
})
</script>

<style scoped>
.alerts-root { position:fixed; right:16px; top:16px; z-index:9999 }
.alert { padding:8px 12px; margin-bottom:8px; border-radius:6px; color:#111 }
.alert.success { background:#e6ffed; border:1px solid #b7f3c7 }
.alert.error { background:#fff0f0; border:1px solid #f3b7b7 }
.alert.info { background:#f0f7ff; border:1px solid #b7d7ff }
</style>
