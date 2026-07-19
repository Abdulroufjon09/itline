<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useTheme } from "../composables/useTheme";

const API = "https://itline-django-9s85.onrender.com/api";
const router = useRouter();
const { theme, toggleTheme } = useTheme();

const user = ref(JSON.parse(localStorage.getItem("user") || "null"));
if (!user.value) router.push("/login");

const isDark = computed(() => theme.value === "dark");

function back() {
  if (user.value?.is_excellence) router.push("/excellence");
  else if (user.value?.is_admin) router.push("/admin");
  else router.push("/students");
}

const roleLabel = computed(() => {
  if (user.value?.is_excellence) return "Manager";
  if (user.value?.is_admin) return "O'qituvchi";
  return "O'quvchi";
});

const initials = computed(() => {
  const n = user.value?.name || "";
  const s = user.value?.surname || "";
  return ((n[0] || "") + (s[0] || "")).toUpperCase() || "?";
});

// ─────────── Shaxsiy ma'lumot ───────────
const profile = ref({
  name: user.value?.name || "",
  surname: user.value?.surname || "",
  saving: false,
  error: "",
  success: "",
});

async function saveProfile() {
  const p = profile.value;
  p.error = "";
  p.success = "";
  if (!p.name.trim()) {
    p.error = "Ism bo'sh bo'lishi mumkin emas";
    return;
  }
  p.saving = true;
  try {
    const res = await fetch(`${API}/profile/update/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: user.value.id,
        phone: user.value.phone,
        name: p.name.trim(),
        surname: p.surname.trim(),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      p.error = data.error || "Xatolik yuz berdi";
      return;
    }
    const updated = { ...user.value, name: data.name, surname: data.surname };
    localStorage.setItem("user", JSON.stringify(updated));
    user.value = updated;
    p.success = "Saqlandi";
    setTimeout(() => (profile.value.success = ""), 2500);
  } catch {
    p.error = "Internet aloqasi yo'q";
  } finally {
    profile.value.saving = false;
  }
}

// ─────────── Parol ───────────
const usingDefaultPassword = ref(
  localStorage.getItem("used_default_password") === "1",
);

const pwd = ref({
  old: "",
  new1: "",
  new2: "",
  saving: false,
  error: "",
  success: "",
  show: false,
});

async function savePassword() {
  const p = pwd.value;
  p.error = "";
  p.success = "";

  if (!p.old || !p.new1 || !p.new2) {
    p.error = "Barcha maydonlarni to'ldiring";
    return;
  }
  if (p.new1 !== p.new2) {
    p.error = "Yangi parollar bir-biriga mos kelmadi";
    return;
  }
  if (p.new1.length < 6) {
    p.error = "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak";
    return;
  }
  if (p.new1 === p.old) {
    p.error = "Yangi parol eskisidan farq qilishi kerak";
    return;
  }

  p.saving = true;
  try {
    const res = await fetch(`${API}/change-password/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: user.value.phone,
        old_password: p.old,
        new_password: p.new1,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      p.error = data.error || "Xatolik yuz berdi";
      return;
    }
    p.success = "Parol o'zgartirildi";
    p.old = p.new1 = p.new2 = "";
    localStorage.removeItem("used_default_password");
    usingDefaultPassword.value = false;
    setTimeout(() => (pwd.value.success = ""), 3000);
  } catch {
    p.error = "Internet aloqasi yo'q";
  } finally {
    pwd.value.saving = false;
  }
}

// Umumiy input klassi
const inputCls =
  "w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition " +
  "bg-white border-slate-200 text-slate-800 placeholder:text-slate-300 " +
  "focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 " +
  "dark:bg-white/5 dark:border-white/10 dark:text-slate-100 " +
  "dark:placeholder:text-slate-500 dark:focus:border-indigo-400/60 " +
  "dark:focus:ring-indigo-500/20";
</script>

<template>
  <div
    class="min-h-screen transition-colors bg-slate-50 dark:bg-slate-950 dark:bg-gradient-to-br dark:from-slate-950 dark:via-indigo-950/40 dark:to-slate-900"
  >
    <div class="max-w-2xl mx-auto px-4 py-6 sm:py-10">
      <!-- ══════════ HEADER ══════════ -->
      <div class="flex items-center justify-between mb-6">
        <button
          @click="back"
          class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition border bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:bg-white/5 dark:border-white/10 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Orqaga
        </button>

        <!-- Tez tema almashtirish -->
        <button
          @click="toggleTheme"
          :title="isDark ? 'Kunduzgi rejim' : 'Tungi rejim'"
          class="w-10 h-10 rounded-xl flex items-center justify-center transition border bg-white border-slate-200 hover:bg-slate-50 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10"
        >
          <span class="text-lg">{{ isDark ? "☀️" : "🌙" }}</span>
        </button>
      </div>

      <!-- ══════════ PROFIL KARTASI ══════════ -->
      <div
        class="relative overflow-hidden rounded-3xl p-6 sm:p-7 mb-5 border shadow-sm bg-white border-slate-100 dark:border-white/10 dark:bg-gradient-to-br dark:from-indigo-600/25 dark:via-purple-600/15 dark:to-slate-900/60"
      >
        <!-- Bezak -->
        <div
          class="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-50 bg-indigo-100 dark:bg-indigo-500/25"
        ></div>

        <div
          class="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5"
        >
          <div
            class="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-200 dark:shadow-indigo-950/60"
          >
            {{ initials }}
          </div>
          <div class="min-w-0">
            <h1
              class="text-xl sm:text-2xl font-bold tracking-tight truncate text-slate-800 dark:text-white"
            >
              {{ user?.name }} {{ user?.surname }}
            </h1>
            <p class="text-sm mt-0.5 text-slate-400 dark:text-slate-400">
              {{ user?.phone }}
            </p>
            <span
              class="inline-block mt-2 px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
            >
              {{ roleLabel }}
            </span>
          </div>
        </div>
      </div>

      <!-- Standart parol ogohlantirishi -->
      <div
        v-if="usingDefaultPassword"
        class="mb-5 px-4 py-3.5 rounded-2xl border flex items-start gap-3 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/25"
      >
        <span class="shrink-0">⚠️</span>
        <div class="min-w-0">
          <p class="text-sm font-medium text-amber-800 dark:text-amber-300">
            Siz standart parolda ishlayapsiz
          </p>
          <p class="text-xs mt-0.5 text-amber-600 dark:text-amber-400/80">
            Bu parol barcha o'qituvchilarda bir xil. Quyida o'zingizniki bilan
            almashtiring.
          </p>
        </div>
      </div>

      <!-- ══════════ SHAXSIY MA'LUMOT ══════════ -->
      <section
        class="rounded-3xl border p-5 sm:p-6 mb-5 shadow-sm bg-white border-slate-100 dark:bg-white/[0.03] dark:border-white/10"
      >
        <div class="flex items-center gap-2.5 mb-5">
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm bg-gradient-to-br from-sky-500 to-blue-600"
          >
            👤
          </div>
          <div>
            <h2 class="font-semibold text-slate-800 dark:text-white">
              Shaxsiy ma'lumot
            </h2>
            <p class="text-xs text-slate-400 dark:text-slate-500">
              Ism va familiyangiz
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              class="block text-xs mb-1.5 text-slate-400 dark:text-slate-500"
              >Ism</label
            >
            <input v-model="profile.name" type="text" :class="inputCls" />
          </div>
          <div>
            <label
              class="block text-xs mb-1.5 text-slate-400 dark:text-slate-500"
              >Familiya</label
            >
            <input v-model="profile.surname" type="text" :class="inputCls" />
          </div>
        </div>

        <div>
          <label
            class="block text-xs mb-1.5 mt-3 text-slate-400 dark:text-slate-500"
            >Telefon</label
          >
          <input
            :value="user?.phone"
            type="text"
            disabled
            :class="[inputCls, 'opacity-60 cursor-not-allowed']"
          />
          <p class="text-xs mt-1.5 text-slate-400 dark:text-slate-500">
            Telefon raqamni faqat administrator o'zgartira oladi
          </p>
        </div>

        <p
          v-if="profile.error"
          class="mt-3 px-3 py-2 rounded-xl text-xs bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
        >
          {{ profile.error }}
        </p>
        <p
          v-if="profile.success"
          class="mt-3 px-3 py-2 rounded-xl text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
        >
          ✓ {{ profile.success }}
        </p>

        <button
          @click="saveProfile"
          :disabled="profile.saving"
          class="mt-4 w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-medium text-white transition disabled:opacity-50 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-sm shadow-indigo-200 dark:shadow-none"
        >
          {{ profile.saving ? "Saqlanmoqda..." : "Saqlash" }}
        </button>
      </section>

      <!-- ══════════ XAVFSIZLIK ══════════ -->
      <section
        class="rounded-3xl border p-5 sm:p-6 mb-5 shadow-sm bg-white border-slate-100 dark:bg-white/[0.03] dark:border-white/10"
      >
        <button
          @click="pwd.show = !pwd.show"
          class="w-full flex items-center gap-2.5 text-left"
        >
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm bg-gradient-to-br from-rose-500 to-pink-600"
          >
            🔑
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="font-semibold text-slate-800 dark:text-white">
              Parolni o'zgartirish
            </h2>
            <p class="text-xs text-slate-400 dark:text-slate-500">
              Hisobingiz xavfsizligi
            </p>
          </div>
          <svg
            class="w-5 h-5 shrink-0 transition-transform text-slate-300 dark:text-slate-600"
            :class="pwd.show ? 'rotate-180' : ''"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <div v-if="pwd.show" class="mt-5 flex flex-col gap-3">
          <div>
            <label
              class="block text-xs mb-1.5 text-slate-400 dark:text-slate-500"
              >Joriy parol</label
            >
            <input
              v-model="pwd.old"
              type="password"
              placeholder="••••••••"
              :class="inputCls"
            />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                class="block text-xs mb-1.5 text-slate-400 dark:text-slate-500"
                >Yangi parol</label
              >
              <input
                v-model="pwd.new1"
                type="password"
                placeholder="Kamida 6 ta belgi"
                :class="inputCls"
              />
            </div>
            <div>
              <label
                class="block text-xs mb-1.5 text-slate-400 dark:text-slate-500"
                >Takrorlang</label
              >
              <input
                v-model="pwd.new2"
                type="password"
                placeholder="••••••••"
                @keyup.enter="savePassword"
                :class="inputCls"
              />
            </div>
          </div>

          <p
            v-if="pwd.error"
            class="px-3 py-2 rounded-xl text-xs bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
          >
            {{ pwd.error }}
          </p>
          <p
            v-if="pwd.success"
            class="px-3 py-2 rounded-xl text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
          >
            ✓ {{ pwd.success }}
          </p>

          <button
            @click="savePassword"
            :disabled="pwd.saving"
            class="w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-medium text-white transition disabled:opacity-50 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-sm shadow-rose-200 dark:shadow-none"
          >
            {{ pwd.saving ? "Saqlanmoqda..." : "Parolni yangilash" }}
          </button>
        </div>
      </section>

      <!-- ══════════ KO'RINISH ══════════ -->
      <section
        class="rounded-3xl border p-5 sm:p-6 shadow-sm bg-white border-slate-100 dark:bg-white/[0.03] dark:border-white/10"
      >
        <div class="flex items-center gap-2.5 mb-5">
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm bg-gradient-to-br from-amber-400 to-orange-500"
          >
            🎨
          </div>
          <div>
            <h2 class="font-semibold text-slate-800 dark:text-white">
              Ko'rinish
            </h2>
            <p class="text-xs text-slate-400 dark:text-slate-500">
              Ilova rangi va rejimi
            </p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <button
            @click="theme = 'light'"
            :class="[
              'relative overflow-hidden rounded-2xl border-2 p-4 text-left transition',
              !isDark
                ? 'border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-500/20'
                : 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20',
            ]"
          >
            <div
              class="w-full h-14 rounded-xl mb-3 bg-gradient-to-br from-slate-50 to-slate-200 border border-slate-200"
            ></div>
            <p class="text-sm font-medium text-slate-800 dark:text-white">
              ☀️ Kunduzgi
            </p>
            <p class="text-xs mt-0.5 text-slate-400 dark:text-slate-500">
              Yorug' rejim
            </p>
            <span
              v-if="!isDark"
              class="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-500 text-white text-[11px] flex items-center justify-center"
              >✓</span
            >
          </button>

          <button
            @click="theme = 'dark'"
            :class="[
              'relative overflow-hidden rounded-2xl border-2 p-4 text-left transition',
              isDark
                ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                : 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20',
            ]"
          >
            <div
              class="w-full h-14 rounded-xl mb-3 bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 border border-slate-700"
            ></div>
            <p class="text-sm font-medium text-slate-800 dark:text-white">
              🌙 Tungi
            </p>
            <p class="text-xs mt-0.5 text-slate-400 dark:text-slate-500">
              Ko'zga qulay
            </p>
            <span
              v-if="isDark"
              class="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-500 text-white text-[11px] flex items-center justify-center"
              >✓</span
            >
          </button>
        </div>

        <p class="text-xs mt-4 text-slate-400 dark:text-slate-500">
          Tanlov brauzeringizda saqlanadi va keyingi kirishda ham qo'llanadi.
        </p>
      </section>
    </div>
  </div>
</template>
