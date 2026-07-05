<script setup>
import { ref, onMounted } from "vue";

const API = "https://itline-django-9s85.onrender.com/api";
const user = JSON.parse(localStorage.getItem("user") || "null");

const newsList = ref([]);
const loading = ref(true);
const saving = ref(false);
const errorMsg = ref("");
const successMsg = ref("");

// Forma holati
const showForm = ref(false);
const editingId = ref(null); // null = yangi qo'shish, id bo'lsa = tahrirlash
const form = ref({
  title: "",
  content: "",
  priority: "normal",
  is_active: true,
  expires_at: "",
});

// Qaysi elementning amallar menyusi ochiq turibdi
const openMenuId = ref(null);

const PRIORITY_OPTIONS = [
  { value: "normal", label: "Oddiy", color: "bg-slate-200/70 text-slate-600" },
  {
    value: "important",
    label: "Muhim",
    color: "bg-amber-300/80 text-amber-950",
  },
  { value: "urgent", label: "Shoshilinch", color: "bg-rose-400/80 text-white" },
];

function authHeaders() {
  return {
    "Content-Type": "application/json",
    // token saqlash usulingizga qarab moslang (Token/Bearer)
    Authorization: `Token ${user?.token || ""}`,
  };
}

function toggleMenu(id) {
  openMenuId.value = openMenuId.value === id ? null : id;
}

// ─────────────────────────────
// FETCH
// ─────────────────────────────

async function fetchNews() {
  loading.value = true;
  try {
    const res = await fetch(`${API}/news/`, { headers: authHeaders() });
    if (!res.ok) throw new Error();
    newsList.value = await res.json();
  } catch (e) {
    errorMsg.value = "Yangiliklarni yuklab bo'lmadi.";
  } finally {
    loading.value = false;
  }
}

onMounted(fetchNews);

// ─────────────────────────────
// FORM ACTIONS
// ─────────────────────────────

function openCreateForm() {
  editingId.value = null;
  form.value = {
    title: "",
    content: "",
    priority: "normal",
    is_active: true,
    expires_at: "",
  };
  showForm.value = true;
}

function openEditForm(item) {
  editingId.value = item.id;
  form.value = {
    title: item.title,
    content: item.content,
    priority: item.priority,
    is_active: item.is_active,
    expires_at: item.expires_at ? item.expires_at.slice(0, 16) : "",
  };
  showForm.value = true;
  openMenuId.value = null;
}

function closeForm() {
  showForm.value = false;
  errorMsg.value = "";
}

async function submitForm() {
  if (!form.value.title.trim() || !form.value.content.trim()) {
    errorMsg.value = "Sarlavha va matnni to'ldiring.";
    return;
  }

  saving.value = true;
  errorMsg.value = "";

  const payload = {
    ...form.value,
    expires_at: form.value.expires_at || null,
  };

  try {
    const url = editingId.value
      ? `${API}/news/${editingId.value}/`
      : `${API}/news/`;
    const method = editingId.value ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error();

    successMsg.value = editingId.value
      ? "Yangilik tahrirlandi ✅"
      : "Yangilik qo'shildi ✅";
    setTimeout(() => (successMsg.value = ""), 3000);

    showForm.value = false;
    await fetchNews();
  } catch (e) {
    errorMsg.value = "Saqlashda xatolik yuz berdi.";
  } finally {
    saving.value = false;
  }
}

async function toggleActive(item) {
  try {
    await fetch(`${API}/news/${item.id}/`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ is_active: !item.is_active }),
    });
    item.is_active = !item.is_active;
  } catch (e) {
    errorMsg.value = "Holatni o'zgartirib bo'lmadi.";
  }
}

async function deleteNews(id) {
  if (!confirm("Yangilikni o'chirishni tasdiqlaysizmi?")) return;
  try {
    const res = await fetch(`${API}/news/${id}/`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error();
    newsList.value = newsList.value.filter((n) => n.id !== id);
    openMenuId.value = null;
  } catch (e) {
    errorMsg.value = "O'chirishda xatolik yuz berdi.";
  }
}

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden px-3 py-6 sm:px-4 sm:py-12">
    <div class="relative mx-auto max-w-3xl">
      <!-- Glass card container -->
      <div
        class="overflow-hidden rounded-[22px] border border-white/60 bg-white/40 shadow-[0_8px_32px_rgba(31,38,135,0.12)] backdrop-blur-2xl sm:rounded-[28px]"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between gap-3 border-b border-white/50 bg-white/30 px-4 py-5 backdrop-blur-xl sm:px-8 sm:py-6"
        >
          <div class="min-w-0">
            <p
              class="text-[10px] font-bold tracking-[0.14em] text-indigo-500/80 sm:text-[10.5px] sm:tracking-[0.16em]"
            >
              E'LONLAR BOSHQARUVI
            </p>
            <h2 class="text-lg font-bold text-slate-800 sm:text-xl">Yangiliklar</h2>
          </div>
          <button
            @click="openCreateForm"
            class="shrink-0 rounded-2xl border border-white/60 bg-white/70 px-3.5 py-2.5 text-sm font-bold text-slate-700 shadow-[0_4px_16px_rgba(31,38,135,0.1)] backdrop-blur-md transition hover:bg-white/90 hover:shadow-[0_6px_20px_rgba(31,38,135,0.15)] active:scale-95 sm:px-4"
          >
            + Qo'shish
          </button>
        </div>

        <div class="px-3 py-5 sm:px-8 sm:py-6">
          <!-- Xabarlar -->
          <div
            v-if="successMsg"
            class="mb-4 rounded-2xl border border-emerald-200/70 bg-emerald-50/70 px-4 py-3 text-sm font-medium text-emerald-700 backdrop-blur-md"
          >
            {{ successMsg }}
          </div>
          <div
            v-if="errorMsg && !showForm"
            class="mb-4 rounded-2xl border border-rose-200/70 bg-rose-50/70 px-4 py-3 text-sm font-medium text-rose-600 backdrop-blur-md"
          >
            {{ errorMsg }}
          </div>

          <!-- RO'YXAT -->
          <div v-if="loading" class="py-16 text-center text-sm text-slate-400">
            <div
              class="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-400"
            ></div>
            Yuklanmoqda...
          </div>

          <div
            v-else-if="!newsList.length"
            class="py-16 text-center text-sm text-slate-400"
          >
            <p class="mb-2 text-3xl">🗞️</p>
            Hozircha yangiliklar yo'q
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="item in newsList"
              :key="item.id"
              class="relative rounded-2xl border border-white/60 bg-white/50 p-3.5 shadow-[0_4px_20px_rgba(31,38,135,0.06)] backdrop-blur-xl transition hover:bg-white/70 sm:p-4"
              :class="!item.is_active && 'opacity-50'"
            >
              <div class="flex items-start gap-3">
                <span
                  class="mt-1 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm"
                  :class="
                    PRIORITY_OPTIONS.find((p) => p.value === item.priority)?.color
                  "
                >
                  {{
                    PRIORITY_OPTIONS.find((p) => p.value === item.priority)?.label
                  }}
                </span>

                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold text-slate-800">
                    {{ item.title }}
                  </p>
                  <p class="mt-0.5 line-clamp-2 text-xs text-slate-500">
                    {{ item.content }}
                  </p>
                  <p class="mt-1.5 text-[10.5px] text-slate-400">
                    {{ formatDate(item.created_at) }}
                    <span v-if="item.expires_at">
                      · muddati: {{ formatDate(item.expires_at) }}</span
                    >
                  </p>
                </div>

                <!-- Amallar tugmasi (uch nuqta) -->
                <button
                  @click="toggleMenu(item.id)"
                  class="flex shrink-0 h-8 w-8 items-center justify-center rounded-xl border border-white/60 bg-white/60 text-slate-500 backdrop-blur-sm transition hover:bg-white/90"
                  :class="openMenuId === item.id && 'bg-white/90 text-indigo-500'"
                  aria-label="Amallar"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    class="h-4.5 w-4.5"
                  >
                    <circle cx="12" cy="5" r="1.8" />
                    <circle cx="12" cy="12" r="1.8" />
                    <circle cx="12" cy="19" r="1.8" />
                  </svg>
                </button>
              </div>

              <!-- Yashiringan amallar: faqat menyu ochiq bo'lsa chiqadi -->
              <Transition
                enter-active-class="transition duration-150 ease-out"
                enter-from-class="opacity-0 -translate-y-1"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition duration-100 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-1"
              >
                <div
                  v-if="openMenuId === item.id"
                  class="mt-3 flex flex-wrap gap-1.5 border-t border-white/60 pt-3"
                >
                  <button
                    @click="toggleActive(item)"
                    class="flex-1 min-w-[90px] rounded-xl border border-white/60 bg-white/60 px-2.5 py-2 text-[11px] font-medium text-slate-600 backdrop-blur-sm transition hover:bg-white/90"
                  >
                    {{ item.is_active ? "Yashirish" : "Faollashtirish" }}
                  </button>
                  <button
                    @click="openEditForm(item)"
                    class="flex-1 min-w-[90px] rounded-xl border border-white/60 bg-white/60 px-2.5 py-2 text-[11px] font-medium text-slate-600 backdrop-blur-sm transition hover:bg-white/90"
                  >
                    Tahrirlash
                  </button>
                  <button
                    @click="deleteNews(item.id)"
                    class="flex-1 min-w-[90px] rounded-xl border border-rose-200/70 bg-rose-50/60 px-2.5 py-2 text-[11px] font-medium text-rose-500 backdrop-blur-sm transition hover:bg-rose-100/80"
                  >
                    O'chirish
                  </button>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- FORMA (modal) -->
    <Teleport to="body">
      <div
        v-if="showForm"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 px-4 backdrop-blur-sm"
        @click.self="closeForm"
      >
        <div
          class="w-full max-w-md rounded-[22px] border border-white/70 bg-white/60 p-5 shadow-[0_20px_60px_rgba(31,38,135,0.25)] backdrop-blur-2xl animate-[popIn_0.25s_ease] sm:rounded-[28px] sm:p-6"
        >
          <h3 class="mb-4 text-base font-bold text-slate-800">
            {{ editingId ? "Yangilikni tahrirlash" : "Yangi yangilik" }}
          </h3>

          <div v-if="errorMsg" class="mb-3 text-sm font-medium text-rose-500">
            {{ errorMsg }}
          </div>

          <div class="space-y-3.5">
            <div>
              <label class="mb-1 block text-xs font-medium text-slate-500"
                >Sarlavha</label
              >
              <input
                v-model="form.title"
                type="text"
                placeholder="Masalan: Ertaga darslar bekor qilinadi"
                class="w-full rounded-xl border border-white/70 bg-white/70 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none backdrop-blur-md transition focus:border-indigo-300 focus:bg-white/90 focus:ring-2 focus:ring-indigo-200/60"
              />
            </div>

            <div>
              <label class="mb-1 block text-xs font-medium text-slate-500"
                >Matn</label
              >
              <textarea
                v-model="form.content"
                rows="3"
                placeholder="Yangilik matni..."
                class="w-full resize-none rounded-xl border border-white/70 bg-white/70 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none backdrop-blur-md transition focus:border-indigo-300 focus:bg-white/90 focus:ring-2 focus:ring-indigo-200/60"
              ></textarea>
            </div>

            <div>
              <label class="mb-1 block text-xs font-medium text-slate-500"
                >Muhimlik darajasi</label
              >
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="opt in PRIORITY_OPTIONS"
                  :key="opt.value"
                  type="button"
                  @click="form.priority = opt.value"
                  class="flex-1 min-w-[80px] rounded-xl py-2 text-xs font-bold backdrop-blur-sm transition"
                  :class="
                    form.priority === opt.value
                      ? opt.color
                      : 'bg-white/50 text-slate-400 border border-white/70'
                  "
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <label
              class="flex items-center gap-2 text-sm font-medium text-slate-600"
            >
              <input
                v-model="form.is_active"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 accent-indigo-400"
              />
              Faol (Board sahifasida ko'rsatilsin)
            </label>
          </div>

          <div class="mt-6 flex gap-2">
            <button
              @click="closeForm"
              class="flex-1 rounded-xl border border-white/70 bg-white/50 py-2.5 text-sm font-medium text-slate-600 backdrop-blur-md transition hover:bg-white/80"
            >
              Bekor qilish
            </button>
            <button
              @click="submitForm"
              :disabled="saving"
              class="flex-1 rounded-xl bg-gradient-to-b from-indigo-400 to-indigo-500 py-2.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(99,102,241,0.35)] transition hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50"
            >
              {{ saving ? "Saqlanmoqda..." : "Saqlash" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style>
@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.94) translateY(6px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
</style>