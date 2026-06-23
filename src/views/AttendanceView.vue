<script setup>
import { ref, onMounted, computed } from "vue";

const API = "https://itline-django-9s85.onrender.com/api";

// ─── Auth (router guard allaqachon tekshirgan, shu yerda faqat user olamiz) ──
const user = JSON.parse(localStorage.getItem("user") || "null");

// ─── Constants ────────────────────────────────────────────────
const today        = new Date().toISOString().slice(0, 10);
const currentMonth = new Date().toISOString().slice(0, 7);
const ODD_DAYS     = new Set([1, 3, 5]); // Du, Chor, Juma
const EVEN_DAYS    = new Set([2, 4, 6]); // Se, Pay, Shan

const scheduleLabel = { odd: "Du / Chor / Juma", even: "Se / Pay / Shan" };
const statusStyle   = {
  present: "bg-green-100 text-green-700",
  late:    "bg-yellow-100 text-yellow-700",
  absent:  "bg-red-100 text-red-600",
};
const statusLabel = { present: "Keldi", late: "Kech", absent: "Kelmadi" };

// ─── State ────────────────────────────────────────────────────
const lessons         = ref([]);
const attendances     = ref([]);
const absenceMap      = ref({});
const selectedLesson  = ref(null);
const loadingLessons  = ref(true);
const loadingAttend   = ref(false);
const savingId        = ref(null);
const showCreateForm  = ref(false);
const newLesson       = ref({ title: "", date: today });

// ─── Computed ─────────────────────────────────────────────────
const presentCount = computed(() => attendances.value.filter((a) => a.status === "present").length);
const lateCount    = computed(() => attendances.value.filter((a) => a.status === "late").length);
const absentCount  = computed(() => attendances.value.filter((a) => a.status === "absent").length);

const selectedSchedule = computed(() =>
  selectedLesson.value ? getScheduleForDate(selectedLesson.value.date) : null
);

// ─── Helpers ──────────────────────────────────────────────────
function getScheduleForDate(dateStr) {
  const wd = new Date(dateStr).getDay();
  if (ODD_DAYS.has(wd))  return "odd";
  if (EVEN_DAYS.has(wd)) return "even";
  return null;
}

/** Generic fetch wrapper */
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  // 500/404 da HTML qaytsa JSON.parse crash qilmasin
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { /* HTML error page */ }
  return { ok: res.ok, status: res.status, data };
}

// ─── Fetch ────────────────────────────────────────────────────
async function fetchLessons() {
  // Admin uchun teacher_id null — so'rov yubormaymiz
  if (!user?.teacher_id) {
    loadingLessons.value = false;
    return;
  }

  loadingLessons.value = true;
  try {
    const { ok, data } = await apiFetch(`/lessons/?teacher_id=${user.teacher_id}`);
    if (!ok || !Array.isArray(data)) return;
    lessons.value = data;

    // Bugungi darsni avtomatik tanlash
    const todayLesson = data.find((l) => l.date === today);
    if (todayLesson) await selectLesson(todayLesson);
  } catch (e) {
    console.error("Darslar yuklanmadi:", e);
  } finally {
    loadingLessons.value = false;
  }
}

async function fetchMonthlyAbsences(studentIds) {
  const map = {};
  await Promise.all(
    studentIds.map(async (id) => {
      try {
        const { data } = await apiFetch(`/student-attendance/${id}/?month=${currentMonth}`);
        map[id] = Array.isArray(data)
          ? data.filter((a) => a.status === "absent").length
          : 0;
      } catch {
        map[id] = 0;
      }
    })
  );
  absenceMap.value = map;
}

async function selectLesson(lesson) {
  selectedLesson.value = lesson;
  loadingAttend.value  = true;
  try {
    const { ok, data } = await apiFetch(`/attendance/${lesson.id}/`);
    if (!ok || !Array.isArray(data)) return;
    attendances.value = data;
    const ids = data.map((a) => a.student_id);
    if (ids.length) await fetchMonthlyAbsences(ids);
  } catch (e) {
    console.error("Davomat yuklanmadi:", e);
  } finally {
    loadingAttend.value = false;
  }
}

// ─── Create lesson ────────────────────────────────────────────
async function createLesson() {
  if (!newLesson.value.title.trim() || !newLesson.value.date) return;
  if (!user?.teacher_id) { alert("Sizda teacher_id yo'q"); return; }

  try {
    const { ok, data } = await apiFetch("/lessons/create/", {
      method: "POST",
      body: JSON.stringify({
        title:      newLesson.value.title,
        date:       newLesson.value.date,
        teacher_id: user.teacher_id,
      }),
    });

    if (!ok) { alert(data?.error || "Xatolik yuz berdi"); return; }

    newLesson.value    = { title: "", date: today };
    showCreateForm.value = false;
    await fetchLessons();
    const created = lessons.value.find((l) => l.id === data?.id);
    if (created) await selectLesson(created);
  } catch (e) {
    console.error("Dars yaratilmadi:", e);
  }
}

// ─── Update attendance ────────────────────────────────────────
async function setStatus(att, status) {
  if (savingId.value === att.id) return;
  savingId.value = att.id;
  const prev = att.status;
  try {
    const { ok } = await apiFetch(`/attendance/update/${att.id}/`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    if (!ok) return;
    att.status = status;
    // Absence counter ni lokal yangilash
    const sid = att.student_id;
    if (prev === "absent" && status !== "absent") {
      absenceMap.value[sid] = Math.max(0, (absenceMap.value[sid] || 0) - 1);
    } else if (prev !== "absent" && status === "absent") {
      absenceMap.value[sid] = (absenceMap.value[sid] || 0) + 1;
    }
  } catch (e) {
    console.error("Status yangilanmadi:", e);
  } finally {
    savingId.value = null;
  }
}

onMounted(fetchLessons);
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-5xl mx-auto px-4 py-6">

      <!-- Header -->
      <div class="flex flex-wrap gap-3 justify-between items-center mb-6">
        <div>
          <h1 class="text-xl font-semibold">Davomat</h1>
          <p class="text-sm text-gray-400">{{ user?.name }}</p>
        </div>
        <button
          @click="$router.push('/admin')"
          class="px-4 py-2 rounded-full border border-gray-200 text-sm bg-white hover:bg-gray-50 transition cursor-pointer">
          ← Admin
        </button>
      </div>

      <!-- Admin uchun xabar -->
      <div
        v-if="!user?.teacher_id"
        class="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
        <p class="text-sm font-medium text-yellow-700 mb-1">Davomat teacher uchun</p>
        <p class="text-xs text-yellow-500">Admin akkauntida teacher_id yo'q — davomat ko'rish uchun teacher akkauntiga kiring</p>
      </div>

      <div v-else class="flex flex-col lg:grid lg:grid-cols-3 gap-4">

        <!-- Darslar paneli -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-2xl p-4 shadow-sm">
            <div class="flex justify-between items-center mb-3">
              <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">Darslar</h2>
              <button
                @click="showCreateForm = !showCreateForm"
                class="text-xs px-3 py-1.5 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition cursor-pointer">
                + Dars
              </button>
            </div>

            <!-- Yangi dars formasi -->
            <div v-if="showCreateForm" class="bg-gray-50 rounded-xl p-3 mb-3 space-y-2">
              <input
                v-model="newLesson.title"
                placeholder="Dars nomi"
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
              <input
                type="date"
                v-model="newLesson.date"
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
              <p v-if="newLesson.date" class="text-xs text-gray-400 px-1">
                Bu kun:
                <span class="font-medium text-gray-600">
                  {{ scheduleLabel[getScheduleForDate(newLesson.date)] || "Dam olish kuni" }}
                </span>
                guruhi
              </p>
              <button
                @click="createLesson"
                class="w-full bg-gray-900 text-white rounded-lg py-2 text-sm hover:bg-gray-700 transition cursor-pointer">
                Yaratish
              </button>
            </div>

            <!-- Darslar ro'yxati -->
            <div v-if="loadingLessons" class="text-center py-6 text-gray-400 text-sm">
              Yuklanmoqda...
            </div>
            <div v-else class="space-y-1.5 max-h-[40vh] lg:max-h-[60vh] overflow-y-auto">
              <div
                v-for="lesson in lessons"
                :key="lesson.id"
                @click="selectLesson(lesson)"
                :class="[
                  'px-3 py-2.5 rounded-xl cursor-pointer transition text-sm',
                  selectedLesson?.id === lesson.id
                    ? 'bg-gray-900 text-white'
                    : 'border border-gray-100 hover:bg-gray-50',
                ]">
                <p class="font-medium">{{ lesson.title }}</p>
                <p :class="selectedLesson?.id === lesson.id ? 'text-gray-300' : 'text-gray-400'"
                  class="text-xs mt-0.5 flex gap-2">
                  <span>{{ lesson.date }}</span>
                  <span v-if="lesson.date === today" class="text-green-400">● Bugun</span>
                </p>
              </div>
              <p v-if="lessons.length === 0" class="text-center py-4 text-gray-400 text-sm">
                Hozircha dars yo'q
              </p>
            </div>
          </div>
        </div>

        <!-- Davomat paneli -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-2xl p-4 shadow-sm">

            <div
              v-if="!selectedLesson"
              class="flex items-center justify-center h-32 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
              Darsni tanlang
            </div>

            <div v-else>
              <div class="flex flex-wrap gap-3 justify-between items-start mb-4">
                <div>
                  <h2 class="font-semibold">{{ selectedLesson.title }}</h2>
                  <p class="text-sm text-gray-400 mt-0.5">
                    {{ selectedLesson.date }}
                    <span
                      v-if="selectedSchedule"
                      class="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                      {{ scheduleLabel[selectedSchedule] }}
                    </span>
                  </p>
                </div>
                <div class="flex gap-2 text-xs">
                  <span class="px-3 py-1 rounded-full bg-green-100 text-green-700">✓ {{ presentCount }}</span>
                  <span class="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">⏰ {{ lateCount }}</span>
                  <span class="px-3 py-1 rounded-full bg-red-100 text-red-600">✗ {{ absentCount }}</span>
                </div>
              </div>

              <div v-if="loadingAttend" class="text-center py-8 text-gray-400">
                Yuklanmoqda...
              </div>

              <div v-else class="space-y-2">
                <div
                  v-for="att in attendances"
                  :key="att.id"
                  class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-gray-100 rounded-xl px-4 py-3">
                  <div class="min-w-0">
                    <p class="text-sm font-medium truncate">{{ att.student_name }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">
                      Bu oy:
                      <span :class="(absenceMap[att.student_id] || 0) >= 3 ? 'text-red-500 font-semibold' : 'text-gray-500'">
                        {{ absenceMap[att.student_id] || 0 }} kun kelmagan
                      </span>
                    </p>
                  </div>
                  <div class="flex gap-1.5 shrink-0">
                    <button
                      v-for="s in ['present', 'late', 'absent']"
                      :key="s"
                      @click="setStatus(att, s)"
                      :disabled="savingId === att.id"
                      :class="[
                        'px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer',
                        att.status === s ? statusStyle[s] : 'border border-gray-200 text-gray-400 hover:bg-gray-50',
                        savingId === att.id ? 'opacity-50 cursor-not-allowed' : '',
                      ]">
                      {{ statusLabel[s] }}
                    </button>
                  </div>
                </div>

                <p v-if="attendances.length === 0" class="text-center py-6 text-gray-400 text-sm">
                  Bu kunga mos o'quvchi yo'q
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>