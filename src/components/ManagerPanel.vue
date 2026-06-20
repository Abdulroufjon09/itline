<template>
  <div class="manager-panel">
    <h3>Manager Panel</h3>
    <slot />
    <ManagerControls />
    <div class="actions">
      <button @click="refresh">Refresh users</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCoinStore } from '../stores/coinStore'
import ManagerControls from './ManagerControls.vue'
const coins = useCoinStore()
function refresh() { coins.fetchUsers() }
</script>

<style scoped>
.manager-panel { padding:12px; border-radius:8px; background:#fff }
.actions { margin-top:8px }
</style>
