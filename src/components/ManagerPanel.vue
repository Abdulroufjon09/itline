<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-base font-semibold">Manager paneli</h3>
      <button
        @click="open = !open"
        class="press glass-pill px-3 py-1.5 text-xs"
      >
        {{ open ? "Yopish" : "Ochish" }}
      </button>
    </div>

    <div v-if="open" class="space-y-4">
      <ManagerControls />
      <!-- AddLesson va boshqa kiritilgan komponentlar shu yerda ko'rinadi -->
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue'

const ManagerControls = defineAsyncComponent(() => import('./ManagerControls.vue'))

const open = ref(true)
</script>