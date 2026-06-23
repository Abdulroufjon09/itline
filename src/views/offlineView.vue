<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center px-6">

      <!-- Icon -->
      <div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400">
          <line x1="1" y1="1" x2="23" y2="23"/>
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
          <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
          <circle cx="12" cy="20" r="1" fill="currentColor"/>
        </svg>
      </div>

      <h1 class="text-xl font-semibold text-gray-900 mb-2">Internet aloqasi yo'q</h1>
      <p class="text-sm text-gray-400 mb-8 max-w-[260px] mx-auto leading-relaxed">
        Tarmoq ulanishini tekshirib, qayta urinib ko'ring
      </p>

      <!-- Retry button -->
      <button
        @click="retry"
        :disabled="checking"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-700 transition disabled:opacity-50 cursor-pointer">
        <svg
          :class="checking ? 'animate-spin' : ''"
          width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        {{ checking ? 'Tekshirilmoqda...' : 'Qayta urinish' }}
      </button>

    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router  = useRouter();
const checking = ref(false);

async function retry() {
  checking.value = true;
  try {
    await fetch("https://itline-django-9s85.onrender.com/api/teachers/", {
      signal: AbortSignal.timeout(5000),
    });
    // Internet bor — orqaga qayt
    router.back();
  } catch {
    // Hali yo'q — sahifada qol
  } finally {
    checking.value = false;
  }
}
</script>