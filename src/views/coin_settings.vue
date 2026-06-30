<script setup>
import { ref, onMounted, computed } from "vue";

const API = "https://itline-django-9s85.onrender.com/api";

const coinSettings = ref({ present: 5, late: 2, absent: -5 });
const loading = ref(true);
const saving = ref(false);
const feedback = ref(""); // "success:..." yoki "error:..."

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    /* HTML error page */
  }
  return { ok: res.ok, status: res.status, data };
}

async function fetchSettings() {
  loading.value = true;
  try {
    const { ok, data } = await apiFetch(`/attendance-coin-settings/`);
    if (ok && data) coinSettings.value = data;
  } catch (e) {
    console.error("Coin sozlamalari yuklanmadi:", e);
  } finally {
    loading.value = false;
  }
}

async function saveSettings() {
  saving.value = true;
  feedback.value = "";
  try {
    const { ok, data } = await apiFetch(`/attendance-coin-settings/update/`, {
      method: "PATCH",
      body: JSON.stringify({
        present: coinSettings.value.present,
        late: coinSettings.value.late,
        absent: coinSettings.value.absent,
      }),
    });
    if (ok) {
      coinSettings.value = {
        present: data.present,
        late: data.late,
        absent: data.absent,
      };
      feedback.value = "success:Saqlandi ✓";
    } else {
      feedback.value = `error:${data?.error || "Xatolik yuz berdi"}`;
    }
  } catch (e) {
    console.error(e);
    feedback.value = "error:Server bilan bog'lanishda xatolik";
  } finally {
    saving.value = false;
    setTimeout(() => (feedback.value = ""), 3000);
  }
}

const feedbackType = computed(() =>
  feedback.value.startsWith("success") ? "success" : "error",
);
const feedbackText = computed(() =>
  feedback.value.split(":").slice(1).join(":"),
);

onMounted(fetchSettings);
</script>

<template>
  <div class="bg-white border border-gray-100 rounded-2xl p-4 sm:p-5 shadow-sm">
    <div class="flex items-center gap-2 mb-1">
      <span class="text-lg">🪙</span>
      <h2 class="text-sm font-semibold text-gray-800">
        Davomat uchun coin sozlamalari
      </h2>
    </div>
    <p class="text-xs text-gray-400 mb-4">
      Bu yerda o'zgartirilgan qiymatlar barcha teacherlar uchun, davomat
      belgilanganda avtomatik qo'llanadi.
    </p>

    <div v-if="loading" class="text-sm text-gray-400 py-2">Yuklanmoqda...</div>

    <div v-else>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label class="text-xs text-gray-400 mb-1 flex items-center gap-1">
            ✅ Keldi
          </label>
          <input
            type="number"
            v-model.number="coinSettings.present"
            class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
          />
        </div>
        <div>
          <label class="text-xs text-gray-400 mb-1 flex items-center gap-1">
            ⏰ Kech keldi
          </label>
          <input
            type="number"
            v-model.number="coinSettings.late"
            class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
          />
        </div>
        <div>
          <label class="text-xs text-gray-400 mb-1 flex items-center gap-1">
            ✗ Kelmadi
          </label>
          <input
            type="number"
            v-model.number="coinSettings.absent"
            class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-100 transition"
          />
        </div>
      </div>

      <div class="flex items-center gap-3 mt-4">
        <button
          @click="saveSettings"
          :disabled="saving"
          class="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
        >
          {{ saving ? "Saqlanmoqda..." : "Saqlash" }}
        </button>
        <span
          v-if="feedback"
          class="text-xs font-medium"
          :class="
            feedbackType === 'success' ? 'text-emerald-600' : 'text-rose-600'
          "
        >
          {{ feedbackText }}
        </span>
      </div>
    </div>
  </div>
</template>
