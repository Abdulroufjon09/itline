<template>
  <div v-if="ui.loading" class="loading-overlay">
    <div class="spinner">
      <div class="dot"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '../stores/uiStore'
const ui = useUiStore()
</script>

<style scoped>
.loading-overlay { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.35); z-index:99999 }
.spinner { width:80px; height:80px; display:flex; align-items:center; justify-content:center }
.dot { width:36px; height:36px; border-radius:50%; background:linear-gradient(90deg,#06b6d4,#7c3aed); box-shadow:0 4px 18px rgba(0,0,0,0.15); animation:spin 1s linear infinite }
@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
</style>
