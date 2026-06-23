<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const API = "https://itline-django-9s85.onrender.com/api";

const user = JSON.parse(localStorage.getItem("user") || "null");
if (!user) router.push("/login");
if (user && !user.is_admin) router.push("/");

function logout() {
  localStorage.removeItem("user");
  router.push("/login");
}

// ─────────────────────────────
// STATE
// ─────────────────────────────

const lessons = ref([]);
const attendances = ref([]);
const groups = ref([]);
const selectedLesson = ref(null);
const loadingLessons = ref(true);
const loadingAttendance = ref(false);
const savingId = ref(null);
const absenceMap = ref({});

// Guruh filter
const selectedGroupId = ref(null);

const showCreateLesson = ref(false);

const today = new Date().toISOString().slice(0, 10);
const newLesson = ref({ title: "", date: today, group_id: null });

const ODD_DAYS_JS = new Set([1, 3, 5]);
const EVEN_DAYS_JS = new Set([2, 4, 6]);

function getScheduleForDate(dateStr) {
  const d = new Date(dateStr);
  const wd = d.getDay();
  if (ODD_DAYS_JS.has(wd)) return "odd";
  if (EVEN_DAYS_JS.has(wd)) return "even";
  return null;
}

const currentMonth = new Date().toISOString().slice(0, 7);

const scheduleLabel = {
  odd: "Du / Chor / Juma",
  even: "Se / Pay / Shan",
};

// ─────────────────────────────
// FETCH
// ─────────────────────────────

async function fetchLessons() {
  loadingLessons.value = true;
  try {
    const res = await fetch(`${API}/lessons/?teacher_id=${user.teacher_id}`);
    lessons.value = await res.json();
    const todayLesson = lessons.value.find((l) => l.date === today);
    if (todayLesson) await selectLesson(todayLesson);
  } finally {
    loadingLessons.value = false;
  }
}

async function fetchGroups() {
  try {
    const res = await fetch(`${API}/groups/`);
    groups.value = await res.json();
  } catch (e) {
    console.error(e);
  }
}

async function fetchMonthlyAbsences(studentIds) {
  const map = {};
  await Promise.all(
    studentIds.map(async (id) => {
      const res = await fetch(
        `${API}/student-attendance/${id}/?month=${currentMonth}`,
      );
      const data = await res.json();
      map[id] = data.filter((a) => a.status === "absent").length;
    }),
  );
  absenceMap.value = map;
}

async function selectLesson(lesson) {
  selectedLesson.value = lesson;
  loadingAttendance.value = true;
  try {
    const res = await fetch(`${API}/attendance/${lesson.id}/`);
    const data = await res.json();
    attendances.value = data;
    const ids = data.map((a) => a.student_id);
    if (ids.length) await fetchMonthlyAbsences(ids);
  } finally {
    loadingAttendance.value = false;
  }
}

// ─────────────────────────────
// CREATE LESSON
// ─────────────────────────────

async function createLesson() {
  if (!newLesson.value.title || !newLesson.value.date) return;

  const res = await fetch(`${API}/lessons/create/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: newLesson.value.title,
      date: newLesson.value.date,
      teacher_id: user.teacher_id,
      group_id: newLesson.value.group_id || null,
    }),
  });

  const data = await res.json();
  if (res.ok) {
    const createdGroupId = newLesson.value.group_id;
    newLesson.value = { title: "", date: today, group_id: null };
    showCreateLesson.value = false;
    await fetchLessons();
    const created = lessons.value.find((l) => l.id === data.id);
    if (created) {
      await selectLesson(created);
      // Yaratilganda tanlangan guruhni avtomatik filter qilamiz
      if (createdGroupId) {
        selectedGroupId.value = createdGroupId;
      }
    }
  } else {
    alert(data.error || "Xatolik");
  }
}

// ─────────────────────────────
// UPDATE ATTENDANCE
// ─────────────────────────────

async function setStatus(attendance, status) {
  if (savingId.value === attendance.id) return;
  savingId.value = attendance.id;
  const oldStatus = attendance.status;

  try {
    await fetch(`${API}/attendance/update/${attendance.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    attendance.status = status;

    const sid = attendance.student_id;
    if (oldStatus === "absent" && status !== "absent") {
      absenceMap.value[sid] = Math.max(0, (absenceMap.value[sid] || 0) - 1);
    } else if (oldStatus !== "absent" && status === "absent") {
      absenceMap.value[sid] = (absenceMap.value[sid] || 0) + 1;
    }
  } finally {
    savingId.value = null;
  }
}

// ─────────────────────────────
// COMPUTED
// ─────────────────────────────

const presentCount = computed(
  () => filteredAttendances.value.filter((a) => a.status === "present").length,
);
const lateCount = computed(
  () => filteredAttendances.value.filter((a) => a.status === "late").length,
);
const absentCount = computed(
  () => filteredAttendances.value.filter((a) => a.status === "absent").length,
);

const selectedSchedule = computed(() =>
  selectedLesson.value ? getScheduleForDate(selectedLesson.value.date) : null,
);

// Guruh bo'yicha filter — tanlangan guruh student ID lari
const selectedGroupStudentIds = computed(() => {
  if (!selectedGroupId.value) return null;
  const group = groups.value.find((g) => g.id === selectedGroupId.value);
  if (!group) return null;
  return new Set(group.students?.map((s) => s.id) || []);
});

// Filterlangan davomat ro'yxati
const filteredAttendances = computed(() => {
  if (!selectedGroupStudentIds.value) return attendances.value;
  return attendances.value.filter((a) =>
    selectedGroupStudentIds.value.has(a.student_id)
  );
});

// Guruh uchun attendance count (faqat shu guruh studentlaridan)
function groupAttendanceCount(group) {
  const ids = new Set(group.students?.map((s) => s.id) || []);
  return attendances.value.filter((a) => ids.has(a.student_id)).length;
}

const statusStyle = {
  present: "bg-green-100 text-green-700",
  late: "bg-yellow-100 text-yellow-700",
  absent: "bg-red-100 text-red-600",
};

const statusLabel = {
  present: "Keldi",
  late: "Kech",
  absent: "Kelmadi",
};

onMounted(() => {
  fetchLessons();
  fetchGroups();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-5xl mx-auto px-4 py-6">
      <!-- Header -->
      <div class="flex flex-wrap gap-3 justify-between items-center mb-6">
        <div>
          <h1 class="text-xl font-semibold">Davomat</h1>
          <p class="text-sm text-gray-400">{{ user.name }}</p>
        </div>
        <div class="flex gap-2">
          <button @click="$router.push('/admin')"
            class="px-4 py-2 rounded-full border border-gray-200 text-sm bg-white hover:bg-gray-50 transition">
            ← Admin
          </button>
          <button @click="logout"
            class="px-4 py-2 rounded-full border border-gray-200 text-sm bg-white hover:bg-gray-50 transition">
            Chiqish
          </button>
        </div>
      </div>

      <div class="flex flex-col lg:grid lg:grid-cols-3 gap-4">
        <!-- Darslar panel -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-2xl p-4 shadow-sm">
            <div class="flex justify-between items-center mb-3">
              <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Darslar
              </h2>
              <button @click="showCreateLesson = !showCreateLesson"
                class="text-xs px-3 py-1.5 rounded-full bg-gray-900 text-white hover:bg-gray-700 transition">
                + Dars
              </button>
            </div>

            <!-- Yangi dars formasi -->
            <div v-if="showCreateLesson" class="bg-gray-50 rounded-xl p-3 mb-3 space-y-2">
              <input v-model="newLesson.title" placeholder="Dars nomi"
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
              <input type="date" v-model="newLesson.date"
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400" />
              <select v-model.number="newLesson.group_id"
                class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-gray-400 bg-white">
                <option :value="null">🗂️ Guruh tanlang (ixtiyoriy)</option>
                <option v-for="g in groups" :key="g.id" :value="g.id">
                  {{ g.name }}
                  <template v-if="g.teacher"> — {{ g.teacher.name }}</template>
                </option>
              </select>
              <p v-if="newLesson.date" class="text-xs text-gray-400 px-1">
                📅 Bu kun:
                <span class="font-medium text-gray-600">
                  {{ scheduleLabel[getScheduleForDate(newLesson.date)] || "Dam olish kuni" }}
                </span>
                guruhi
              </p>
              <button @click="createLesson"
                class="w-full bg-gray-900 text-white rounded-lg py-2 text-sm hover:bg-gray-700 transition">
                Yaratish
              </button>
            </div>

            <!-- Darslar ro'yxati -->
            <div v-if="loadingLessons" class="text-center py-6 text-gray-400 text-sm">
              Yuklanmoqda...
            </div>
            <div v-else class="space-y-1.5 max-h-[40vh] lg:max-h-[60vh] overflow-y-auto">
              <div v-for="lesson in lessons" :key="lesson.id" @click="selectLesson(lesson)" :class="[
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

        <!-- Davomat panel -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-2xl p-4 shadow-sm">
            <div v-if="!selectedLesson"
              class="flex items-center justify-center h-32 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
              Darsni tanlang
            </div>

            <div v-else>
              <!-- Dars sarlavhasi + statistika -->
              <div class="flex flex-wrap gap-3 justify-between items-start mb-4">
                <div>
                  <h2 class="font-semibold">{{ selectedLesson.title }}</h2>
                  <p class="text-sm text-gray-400 mt-0.5">
                    {{ selectedLesson.date }}
                    <span v-if="selectedSchedule"
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

              <!-- GURUH FILTER — har doim ko'rinadi -->
              <div v-if="groups.length > 0" class="flex gap-2 flex-wrap mb-4">
                <button @click="selectedGroupId = null" :class="[
                  'px-3 py-1.5 rounded-full text-xs border transition',
                  selectedGroupId === null
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50',
                ]">
                  Barchasi ({{ attendances.length }})
                </button>
                <button v-for="g in groups" :key="g.id" @click="selectedGroupId = g.id" :class="[
                  'px-3 py-1.5 rounded-full text-xs border transition',
                  selectedGroupId === g.id
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50',
                ]">
                  🗂️ {{ g.name }}
                  <span class="opacity-60 ml-0.5">({{ groupAttendanceCount(g) }})</span>
                </button>
              </div>

              <!-- Davomat ro'yxati -->
              <div v-if="loadingAttendance" class="text-center py-8 text-gray-400">
                Yuklanmoqda...
              </div>

              <div v-else class="space-y-2">
                <div v-for="att in filteredAttendances" :key="att.id"
                  class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-gray-100 rounded-xl px-4 py-3">
                  <div class="min-w-0">
                    <p class="text-sm font-medium truncate">{{ att.student_name }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">
                      Bu oy:
                      <span :class="(absenceMap[att.student_id] || 0) >= 3
                          ? 'text-red-500 font-semibold'
                          : 'text-gray-500'
                        ">
                        {{ absenceMap[att.student_id] || 0 }} kun kelmagan
                      </span>
                    </p>
                  </div>

                  <div class="flex gap-1.5 shrink-0">
                    <button v-for="status in ['present', 'late', 'absent']" :key="status"
                      @click="setStatus(att, status)" :disabled="savingId === att.id" :class="[
                        'px-3 py-1 rounded-full text-xs font-medium transition',
                        att.status === status
                          ? statusStyle[status]
                          : 'border border-gray-200 text-gray-400 hover:bg-gray-50',
                        savingId === att.id ? 'opacity-50 cursor-not-allowed' : '',
                      ]">
                      {{ statusLabel[status] }}
                    </button>
                  </div>
                </div>

                <p v-if="filteredAttendances.length === 0" class="text-center py-6 text-gray-400 text-sm">
                  Bu guruhda davomat yo'q
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>