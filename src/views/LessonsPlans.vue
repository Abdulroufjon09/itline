<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const API = "https://itline-django-9s85.onrender.com/api";

const user = JSON.parse(localStorage.getItem("user") || "null");

// ✅ ROLE-BASED ACCESS CONTROL: Hamma foydalanuvchilar (admin, excellence, student) ko'ra olishlari mumkin
// Faqat login qilgan foydalanuvchilar uchun
if (!user) {
  router.push("/login");
}

// ─────────────────────────────
// STATE
// ─────────────────────────────

const groups = ref([]);
const loading = ref(true);
const errorMsg = ref("");

// Soniyalik soat — faqat header'dagi jonli soat uchun
const clockNow = ref(new Date());
// 1 soniyada bir yangilanadigan "holat" vaqti
const statusNow = ref(new Date());

let clockTimer = null;
let statusTimer = null;
let refetchTimer = null;

const DAY_NAMES = [
  "Yakshanba",
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
];

const SCHEDULE_LABEL = {
  odd: "Du / Chor / Juma",
  even: "Se / Pay / Shan",
};

// ─────────────────────────────
// FETCH
// ─────────────────────────────

async function fetchGroups() {
  try {
    const res = await fetch(`${API}/groups/`);
    if (!res.ok) throw new Error("Guruhlarni yuklashda xatolik");
    groups.value = await res.json();
    errorMsg.value = "";
  } catch (e) {
    errorMsg.value = "Ma'lumotlarni yuklab bo'lmadi. Qayta urinib ko'ring.";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchGroups();
  clockTimer = setInterval(() => (clockNow.value = new Date()), 1000);
  statusTimer = setInterval(() => (statusNow.value = new Date()), 1000);
  refetchTimer = setInterval(fetchGroups, 120000);
});

onUnmounted(() => {
  clearInterval(clockTimer);
  clearInterval(statusTimer);
  clearInterval(refetchTimer);
});

// ─────────────────────────────
// HELPERS
// ─────────────────────────────

// JS getDay(): Yak=0..Shan=6  →  Python weekday(): Dush=0..Yak=6
function scheduleTypeForDate(date) {
  const py = (date.getDay() + 6) % 7;
  if ([0, 2, 4].includes(py)) return "odd";
  if ([1, 3, 5].includes(py)) return "even";
  return null; // Yakshanba — dars yo'q
}

function timeToMinutes(t) {
  if (!t) return -1;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(t) {
  if (!t) return "--:--";
  const [h, m] = t.split(":");
  return `${h}:${m}`;
}

function formatClock(date) {
  return date.toLocaleTimeString("uz-UZ", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function initials(name) {
  return (name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ✅ Joriy vaqtdan darsgacha qolgan aniq soniyani hisoblaydi
function secondsUntilLesson(lessonTime) {
  if (!lessonTime) return -1;
  const [h, m] = lessonTime.split(":").map(Number);
  const target = new Date(statusNow.value);
  target.setHours(h, m, 0, 0);
  return Math.round((target - statusNow.value) / 1000);
}

// ✅ Soniyani "X soat Y daqiqa qoldi" ko'rinishiga o'giradi
function formatCountdown(totalSeconds) {
  if (totalSeconds <= 0) return "HOZIR";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);

  if (h > 0 && m > 0) return `${h} soat ${m} daq qoldi`;
  if (h > 0) return `${h} soat qoldi`;
  if (m > 0) return `${m} daq qoldi`;
  return "1 daq qoldi";
}

// ─────────────────────────────
// COMPUTED
// ─────────────────────────────

const todaySchedule = computed(() => scheduleTypeForDate(clockNow.value));
const todayLabel = computed(() => DAY_NAMES[clockNow.value.getDay()]);
const todayDate = computed(() =>
  clockNow.value.toLocaleDateString("uz-UZ", {
    day: "2-digit",
    month: "long",
  }),
);

const todaysGroups = computed(() => {
  if (!todaySchedule.value) return [];
  const filtered = groups.value
    .filter((g) => g.schedule === todaySchedule.value && g.lesson_time)
    .slice();

  // Joriy vaqtni olish
  const nowMin = timeToMinutes(
    `${statusNow.value.getHours()}:${statusNow.value.getMinutes()}`,
  );

  // Qolgan (hali boshlanmagani va hozir) va o'tgan darslarni ajrat
  const upcoming = filtered.filter(
    (g) => timeToMinutes(g.lesson_time) >= nowMin,
  );
  const past = filtered.filter((g) => timeToMinutes(g.lesson_time) < nowMin);

  // Qolganlarni vaqti bo'yicha o'rnat (yaqindan uzoqga)
  upcoming.sort(
    (a, b) => timeToMinutes(a.lesson_time) - timeToMinutes(b.lesson_time),
  );

  // O'tganlarni teskari o'rnat (eng yaqin o'tgan dars yuqorida)
  past.sort(
    (a, b) => timeToMinutes(b.lesson_time) - timeToMinutes(a.lesson_time),
  );

  return [...upcoming, ...past];
});

// ✅ Eng yaqin kelayotgan darsning id'si (vaqtga qarab, indeksga emas)
const nextGroupId = computed(() => {
  const nowMin = timeToMinutes(
    `${statusNow.value.getHours()}:${statusNow.value.getMinutes()}`,
  );
  const upcoming = todaysGroups.value.filter(
    (g) => timeToMinutes(g.lesson_time) >= nowMin,
  );
  return upcoming.length ? upcoming[0].id : null;
});

// ✅ Har bir guruh o'zining haqiqiy vaqti bo'yicha baholanadi
function rowStatus(group) {
  const nowMin = timeToMinutes(
    `${statusNow.value.getHours()}:${statusNow.value.getMinutes()}`,
  );
  const t = timeToMinutes(group.lesson_time);

  if (t < nowMin) return "past";
  if (group.id === nextGroupId.value) return "next";
  return "upcoming";
}

function statusText(group) {
  const status = rowStatus(group);
  if (status === "past") return "TUGADI";

  const secondsLeft = secondsUntilLesson(group.lesson_time);

  if (status === "next") {
    return secondsLeft > 0 ? formatCountdown(secondsLeft) : "HOZIR";
  }

  // upcoming
  return formatCountdown(secondsLeft);
}

const STATUS_CLASS = {
  past: "bg-slate-800/60 text-slate-500",
  next: "bg-amber-400 text-slate-950 shadow-[0_0_16px_rgba(251,191,36,0.5)]",
  upcoming: "bg-slate-800/80 text-slate-400 border border-slate-700",
};

// ─────────────────────────────
// NEWS
// ─────────────────────────────

const news = ref([]);
const currentNewsIndex = ref(0);
let newsRotateTimer = null;

async function fetchNews() {
  try {
    const res = await fetch(`${API}/news/active/`);
    if (res.ok) news.value = await res.json();
  } catch (e) {
    // jim
  }
}

onMounted(() => {
  fetchNews();
  newsRotateTimer = setInterval(() => {
    if (news.value.length > 1) {
      currentNewsIndex.value = (currentNewsIndex.value + 1) % news.value.length;
    }
  }, 6000);
});

onUnmounted(() => clearInterval(newsRotateTimer));

const PRIORITY_STYLE = {
  urgent: "bg-red-500/10 border-red-500/40 text-red-300",
  important: "bg-amber-400/10 border-amber-400/40 text-amber-300",
  normal: "bg-slate-800/60 border-slate-700 text-slate-300",
};

const PRIORITY_DOT = {
  urgent: "bg-red-400",
  important: "bg-amber-400",
  normal: "bg-slate-500",
};
</script>

<template>
  <div
    class="min-h-screen bg-[#0a0e14] bg-[radial-gradient(ellipse_at_top,#151c26_0%,#0a0e14_60%)] px-4 py-6 sm:py-10"
  >
    <div
      class="mx-auto flex max-w-6xl flex-col items-start gap-5 lg:flex-row lg:gap-6"
    >
      <!-- ══════════ NEWS SIDEBAR ══════════ -->
      <aside
        v-if="news.length"
        class="order-1 w-full shrink-0 lg:sticky lg:top-10 lg:order-2 lg:w-72"
      >
        <div
          class="overflow-hidden rounded-2xl border border-slate-800/80 bg-[#10151d] shadow-2xl shadow-black/50 animate-[fadeIn_0.4s_ease]"
        >
          <div
            class="border-b border-slate-800/80 bg-gradient-to-b from-[#141b24] to-[#10151d] px-5 py-4"
          >
            <p class="text-[10.5px] font-bold tracking-[0.16em] text-amber-400">
              E'LONLAR
            </p>
          </div>

          <div class="p-4">
            <div
              class="rounded-xl border px-4 py-3 transition-opacity duration-300"
              :class="PRIORITY_STYLE[news[currentNewsIndex].priority]"
            >
              <div class="mb-1.5 flex items-center gap-2">
                <span class="relative flex h-2 w-2 shrink-0">
                  <span
                    class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                    :class="PRIORITY_DOT[news[currentNewsIndex].priority]"
                  ></span>
                  <span
                    class="relative inline-flex h-2 w-2 rounded-full"
                    :class="PRIORITY_DOT[news[currentNewsIndex].priority]"
                  ></span>
                </span>
                <p class="truncate text-sm font-bold">
                  {{ news[currentNewsIndex].title }}
                </p>
              </div>
              <p class="text-xs leading-relaxed opacity-80">
                {{ news[currentNewsIndex].content }}
              </p>
            </div>

            <!-- Rotatsiya indikatorlari -->
            <div
              v-if="news.length > 1"
              class="mt-3 flex items-center justify-center gap-1.5"
            >
              <span
                v-for="(n, idx) in news"
                :key="n.id"
                class="h-1.5 rounded-full transition-all"
                :class="
                  idx === currentNewsIndex
                    ? 'w-4 bg-amber-400'
                    : 'w-1.5 bg-slate-700'
                "
              ></span>
            </div>
          </div>
        </div>
      </aside>

      <!-- ══════════ SCHEDULE BOARD ══════════ -->
      <div
        class="order-2 w-full min-w-0 overflow-hidden rounded-2xl border border-slate-800/80 bg-[#10151d] shadow-2xl shadow-black/50 animate-[fadeIn_0.4s_ease] lg:order-1 lg:flex-1"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between gap-3 border-b border-slate-800/80 bg-gradient-to-b from-[#141b24] to-[#10151d] px-5 py-5 sm:px-7"
        >
          <div class="flex min-w-0 items-center gap-3">
            <RouterLink
              to="/groups"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-800 text-slate-400 transition hover:border-amber-400/60 hover:text-amber-400"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
                <path
                  d="M15 18l-6-6 6-6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </RouterLink>
            <div class="min-w-0">
              <p
                class="text-[10.5px] font-bold tracking-[0.16em] text-amber-400"
              >
                DARSLAR TAXTASI
              </p>
              <h1 class="truncate text-xl font-bold text-slate-100">
                Bugungi jadval
              </h1>
            </div>
          </div>

          <div class="shrink-0 text-right">
            <p class="text-[11px] uppercase tracking-[0.08em] text-slate-500">
              {{ todayLabel }} · {{ todayDate }}
            </p>
            <p
              class="font-['Space_Mono',monospace] text-xl font-bold tabular-nums text-amber-400 drop-shadow-[0_0_18px_rgba(251,191,36,0.35)]"
            >
              {{ formatClock(clockNow) }}
            </p>
          </div>
        </div>

        <!-- Column labels (desktop) -->
        <div
          v-if="!loading && todaysGroups.length"
          class="hidden grid-cols-[84px_1.4fr_90px_1.3fr_1.1fr_84px_120px] gap-2 border-b border-slate-800/60 px-5 py-3 text-[10.5px] tracking-[0.1em] text-slate-500 sm:grid sm:px-7"
        >
          <span>VAQT</span>
          <span>GURUH</span>
          <span>XONA</span>
          <span>O'QITUVCHI</span>
          <span>KUNLAR</span>
          <span>O'QUVCHI</span>
          <span>HOLAT</span>
        </div>

        <!-- Loading -->
        <div
          v-if="loading"
          class="px-6 py-16 text-center text-sm text-slate-500"
        >
          <div
            class="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-amber-400"
          ></div>
          Yuklanmoqda...
        </div>

        <!-- Error -->
        <div
          v-else-if="errorMsg"
          class="px-6 py-16 text-center text-sm text-orange-400"
        >
          {{ errorMsg }}
        </div>

        <!-- Sunday / no schedule -->
        <div
          v-else-if="!todaySchedule"
          class="px-6 py-16 text-center text-sm text-slate-500"
        >
          <p class="mb-2 text-3xl">☕</p>
          <p>Bugun dars yo'q — dam olish kuni</p>
        </div>

        <!-- Empty -->
        <div
          v-else-if="todaysGroups.length === 0"
          class="px-6 py-16 text-center text-sm text-slate-500"
        >
          <p class="mb-2 text-3xl">🗂️</p>
          <p>Bugunga rejalashtirilgan guruh topilmadi</p>
        </div>

        <!-- Rows -->
        <div v-else class="divide-y divide-slate-800/60">
          <div
            v-for="(g, i) in todaysGroups"
            :key="g.id"
            class="animate-[rowIn_0.3s_ease_backwards] px-5 py-4 transition-opacity sm:px-7"
            :class="rowStatus(g) === 'past' ? 'opacity-40' : 'opacity-100'"
            :style="{ animationDelay: `${Math.min(i * 40, 400)}ms` }"
          >
            <!-- Desktop row -->
            <div
              class="hidden grid-cols-[84px_1.4fr_90px_1.3fr_1.1fr_84px_120px] items-center gap-2 sm:grid"
            >
              <span
                class="font-['Space_Mono',monospace] text-base font-bold tabular-nums text-slate-100"
                :class="
                  rowStatus(g) === 'next' &&
                  'text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                "
              >
                {{ formatTime(g.lesson_time) }}
              </span>

              <span class="truncate text-sm font-semibold text-slate-100">
                {{ g.name }}
              </span>

              <span
                class="font-['Space_Mono',monospace] text-sm text-slate-300"
              >
                {{ g.room || "—" }}
              </span>

              <span
                class="flex min-w-0 items-center gap-2 text-sm text-slate-400"
              >
                <span
                  v-if="g.teacher"
                  class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[9.5px] font-bold text-amber-400"
                >
                  {{ initials(g.teacher.name) }}
                </span>
                <span class="truncate">{{
                  g.teacher?.name || "Biriktirilmagan"
                }}</span>
              </span>

              <span class="text-[12.5px] text-slate-500">
                {{ SCHEDULE_LABEL[g.schedule] }}
              </span>

              <span
                class="font-['Space_Mono',monospace] text-sm text-slate-400"
              >
                {{ g.students?.length || 0 }}
              </span>

              <span>
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold tracking-[0.06em]"
                  :class="STATUS_CLASS[rowStatus(g)]"
                >
                  <span
                    v-if="rowStatus(g) === 'next'"
                    class="relative flex h-1.5 w-1.5"
                  >
                    <span
                      class="absolute inline-flex h-full w-full animate-ping rounded-full bg-slate-950/60"
                    ></span>
                    <span
                      class="relative inline-flex h-1.5 w-1.5 rounded-full bg-slate-950"
                    ></span>
                  </span>
                  {{ statusText(g) }}
                </span>
              </span>
            </div>

            <!-- Mobile card -->
            <div class="flex items-center gap-3 sm:hidden">
              <span
                class="font-['Space_Mono',monospace] text-lg font-bold tabular-nums text-slate-100"
                :class="rowStatus(g) === 'next' && 'text-amber-400'"
              >
                {{ formatTime(g.lesson_time) }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-slate-100">
                  {{ g.name }}
                </p>
                <p class="truncate text-[11.5px] text-slate-500">
                  {{ g.room || "Xona yo'q" }} ·
                  {{ g.teacher?.name || "O'qituvchi yo'q" }} ·
                  {{ g.students?.length || 0 }} ta
                </p>
              </div>
              <span
                class="shrink-0 rounded-full px-2 py-1 text-[10px] font-bold tracking-[0.05em]"
                :class="STATUS_CLASS[rowStatus(g)]"
              >
                {{ statusText(g) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@import url("https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap");

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes rowIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
</style>