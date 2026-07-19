<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";

// ─── Constants ───────────────────────────────────────────────
const API = "https://itline-django-9s85.onrender.com/api";
const STAGES = [1, 2, 3, 4, 5, 6, 7];

// ─── Router & Auth ───────────────────────────────────────────
const router = useRouter();

const user = JSON.parse(localStorage.getItem("user") || "null");
if (!user) router.push("/login");
else if (!user.is_admin) router.push("/");

function logout() {
  localStorage.removeItem("user");
  router.push("/login");
}

// ─── Standart parol eslatmasi ────────────────────────────────
const usingDefaultPassword = ref(
  localStorage.getItem("used_default_password") === "1",
);

// ─── State ───────────────────────────────────────────────────
const students = ref([]);
const payments = ref([]);

const loadingStudents = ref(false);
const loadingPayments = ref(false);
const stageLoading = ref(null);

// Admin o'zining o'quvchilarini ko'radi
const myTeacherId = computed(() => user?.teacher_id ?? null);

// ─── Helpers ─────────────────────────────────────────────────
function formatMoney(value) {
  return Number(value || 0).toLocaleString("uz-UZ") + " so'm";
}

function getStudentPayment(studentId) {
  return payments.value.find((p) => p.student_id === studentId);
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = "Xatolik yuz berdi";
    try {
      msg = JSON.parse(text)?.error ?? msg;
    } catch {
      /* plain text */
    }
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ─── Fetch ───────────────────────────────────────────────────
async function fetchStudents(teacherId) {
  if (!teacherId) {
    students.value = [];
    return;
  }
  loadingStudents.value = true;
  try {
    students.value = await apiFetch(`/students/?teacher_id=${teacherId}`);
  } catch (e) {
    alert(e.message);
  } finally {
    loadingStudents.value = false;
  }
}

async function fetchPayments(teacherId) {
  loadingPayments.value = true;
  try {
    payments.value = await apiFetch(`/payments/?teacher_id=${teacherId}`);
  } catch (e) {
    alert(e.message);
  } finally {
    loadingPayments.value = false;
  }
}

// ─── Student Actions ─────────────────────────────────────────


async function updateStage(student, stage) {
  if (stageLoading.value === student.id) return;
  stageLoading.value = student.id;
  try {
    const result = await apiFetch(`/students/update/${student.id}/`, {
      method: "PATCH",
      body: JSON.stringify({ stage }),
    });
    if (stage === 5 && result.teacher_id !== myTeacherId.value) {
      students.value = students.value.filter((s) => s.id !== student.id);
      alert(`${student.name} kotta teacherga o'tdi`);
    } else {
      const s = students.value.find((s) => s.id === student.id);
      if (s)
        Object.assign(s, {
          stage: result.stage,
          teacher_id: result.teacher_id,
          teacher_name: result.teacher_name,
        });
    }
  } catch (e) {
    alert(e.message);
  } finally {
    stageLoading.value = null;
  }
}

async function updateSchedule(student, schedule) {
  try {
    await apiFetch(`/students/update/${student.id}/`, {
      method: "PATCH",
      body: JSON.stringify({ schedule }),
    });
    student.schedule = schedule;
  } catch (e) {
    alert(e.message);
  }
}

// ─── Mount ───────────────────────────────────────────────────
onMounted(async () => {
  if (!myTeacherId.value) return;
  await Promise.all([
    fetchStudents(myTeacherId.value),
    fetchPayments(myTeacherId.value),
  ]);
});
</script>

<template>
  <div class="max-w-4xl mx-auto px-4">
    <!-- HEADER -->
    <div class="flex justify-between items-center mb-8 pt-4">
      <div>
        <h1 class="text-2xl font-medium">Admin panel</h1>
        <p class="text-gray-400 text-sm mt-1">
          Xush kelibsiz, {{ user.name }}!
        </p>
      </div>
      <button
        @click="$router.push('/profile')"
        class="px-4 py-2 rounded-full text-sm border border-gray-200 hover:bg-gray-50"
      >
        ⚙️ Profil
      </button>
    </div>

    <!-- Default parol ogohlantirishi -->
    <div
      v-if="usingDefaultPassword"
      class="mb-6 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3"
    >
      <span class="text-amber-500 shrink-0">⚠️</span>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-medium text-amber-800">
          Siz hali standart parolda ishlayapsiz
        </p>
        <p class="text-xs text-amber-600 mt-0.5">
          Bu parol barcha ustozlarda bir xil. Xavfsizlik uchun o'zingizniki
          bilan almashtiring.
        </p>
      </div>
      <button
        @click="$router.push('/profile')"
        class="px-3 py-1.5 rounded-full text-xs bg-amber-500 text-white hover:bg-amber-600 transition shrink-0"
      >
        O'zgartirish
      </button>
    </div>

    <!-- QUICK NAV -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div
        @click="$router.push('/students')"
        class="p-5 border rounded-2xl cursor-pointer hover:bg-gray-50"
      >
        👥 O'quvchilar
      </div>
      <div
        @click="$router.push('/Attendance')"
        class="p-5 border rounded-2xl cursor-pointer hover:bg-gray-50"
      >
        📋 Davomat
      </div>
      <div
        @click="$router.push('/groups')"
        class="p-5 border rounded-2xl cursor-pointer hover:bg-gray-50"
      >
        🗂️ Guruhlar
      </div>
    </div>

    <!-- STUDENTS -->
    <div class="rounded-2xl p-4 sm:p-6">
      <h2 class="mb-4 font-medium">
        Mening o'quvchilarim ({{ students.length }})
      </h2>

      <div
        v-if="loadingStudents"
        class="text-center py-4 text-gray-400 text-sm"
      >
        Yuklanmoqda...
      </div>

      <div
        v-else
        v-for="s in students"
        :key="s.id"
        class="flex flex-wrap gap-2 justify-between items-center p-3 rounded mb-2"
      >
        <div>
          <p class="font-medium">{{ s.name }} {{ s.surname }}</p>
          <p class="text-xs text-gray-400">{{ s.phone }}</p>
          <div
            v-if="getStudentPayment(s.id)"
            class="mt-2 flex flex-wrap items-center gap-2"
          >
            <span
              :class="
                getStudentPayment(s.id).is_paid
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-600'
              "
              class="text-xs px-2 py-1 rounded-full"
            >
              {{
                getStudentPayment(s.id).is_paid ? "To‘langan" : "To‘lanmagan"
              }}
            </span>
            <span class="text-xs text-gray-500">
              {{ formatMoney(getStudentPayment(s.id).amount_due) }}
            </span>
          </div>
        </div>

        <!-- Stage buttons -->
        <div class="flex gap-1 flex-wrap">
          <button
            v-for="st in STAGES"
            :key="st"
            @click="updateStage(s, st)"
            :disabled="stageLoading === s.id"
            class="w-7 h-7 text-xs rounded-full transition"
            :class="[
              s.stage === st
                ? 'bg-black text-white'
                : 'border border-gray-200 hover:bg-gray-50',
              stageLoading === s.id ? 'opacity-50 cursor-not-allowed' : '',
            ]"
          >
            {{ st }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
