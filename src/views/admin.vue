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

// ─── State ───────────────────────────────────────────────────
const teachers = ref([]);
const students = ref([]);
const payments = ref([]);

const loadingTeachers = ref(false);
const loadingStudents = ref(false);
const loadingPayments = ref(false);
const stageLoading = ref(null);

const showForm = ref(false);
const showReassign = ref(false);
const showStudents = ref(false);
const showAsk = ref(false);

const teacherToDelete = ref(null);
const selectedTeacherId = ref(null);

const newTeacher = ref({ name: "", phone: "" });
const fromTeacher = ref(null);
const toTeacher = ref(null);

// ─── Computed ────────────────────────────────────────────────
const selectedTeacherName = computed(
  () =>
    teachers.value.find((t) => t.id === selectedTeacherId.value)?.name ?? "",
);

const currentTeacherId = computed(() => user?.id ?? null);

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
async function fetchTeachers() {
  loadingTeachers.value = true;
  try {
    teachers.value = await apiFetch("/teachers/");
  } catch (e) {
    alert(e.message);
  } finally {
    loadingTeachers.value = false;
  }
}

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

// ─── Teacher Actions ─────────────────────────────────────────
async function createTeacher() {
  if (!newTeacher.value.name.trim()) {
    alert("Ism kiriting");
    return;
  }
  try {
    await apiFetch("/teachers/create/", {
      method: "POST",
      body: JSON.stringify(newTeacher.value),
    });
    newTeacher.value = { name: "", phone: "" };
    showForm.value = false;
    await fetchTeachers();
  } catch (e) {
    alert(e.message);
  }
}

function askDelete(id) {
  if (currentTeacherId.value === id) {
    alert("O'zingizni o'chira olmaysiz");
    return;
  }
  teacherToDelete.value = id;
  showAsk.value = true;
}

async function confirmDelete() {
  const id = teacherToDelete.value;
  showAsk.value = false;
  teacherToDelete.value = null;
  try {
    await apiFetch(`/teachers/delete/${id}/`, {
      method: "DELETE",
      headers: { "X-Requester-Id": String(currentTeacherId.value) },
    });
    if (selectedTeacherId.value === id) {
      selectedTeacherId.value = null;
      showStudents.value = false;
      students.value = [];
    }
    await fetchTeachers();
  } catch (e) {
    alert(e.message);
  }
}

async function reassignStudents() {
  if (!fromTeacher.value || !toTeacher.value) {
    alert("Teacher tanlang");
    return;
  }
  if (fromTeacher.value === toTeacher.value) {
    alert("Bir xil teacher tanlandi");
    return;
  }
  const fromId = fromTeacher.value;
  try {
    await apiFetch("/teachers/reassign/", {
      method: "POST",
      body: JSON.stringify({
        from_teacher_id: fromId,
        to_teacher_id: toTeacher.value,
      }),
    });
    showReassign.value = false;
    fromTeacher.value = null;
    toTeacher.value = null;
    if (selectedTeacherId.value === fromId)
      await fetchStudents(selectedTeacherId.value);
  } catch (e) {
    alert(e.message);
  }
}

// ─── Student Actions ─────────────────────────────────────────
async function selectTeacher(teacherId) {
  selectedTeacherId.value = teacherId;
  showStudents.value = true;
  await Promise.all([fetchStudents(teacherId), fetchPayments(teacherId)]);
}

async function updateStage(student, stage) {
  if (stageLoading.value === student.id) return;
  stageLoading.value = student.id;
  try {
    const result = await apiFetch(`/students/update/${student.id}/`, {
      method: "PATCH",
      body: JSON.stringify({ stage }),
    });
    if (stage === 5 && result.teacher_id !== selectedTeacherId.value) {
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
  await fetchTeachers();
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
        @click="logout"
        class="px-4 py-2 rounded-full text-sm hover:bg-gray-50"
      >
        Chiqish
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

    <!-- TEACHERS -->
    <div class="rounded-2xl p-4 sm:p-6 mb-6">
      <div class="flex justify-between mb-4">
        <h2 class="text-lg font-medium">O'qituvchilar</h2>
        <div class="flex gap-2">
          <button
            @click="showReassign = !showReassign"
            class="px-3 py-1 rounded-full text-sm"
          >
            O'tkazish
          </button>
        </div>
      </div>

      <!-- REASSIGN -->
      <div v-if="showReassign" class="p-4 bg-yellow-50 rounded-xl mb-4">
        <select
          v-model.number="fromTeacher"
          class="w-full p-2 rounded mb-2 cursor-pointer"
        >
          <option :value="null">Kimdan</option>
          <option v-for="t in teachers" :key="t.id" :value="t.id">
            {{ t.name }}
          </option>
        </select>
        <select
          v-model.number="toTeacher"
          class="w-full p-2 rounded mb-2 cursor-pointer"
        >
          <option :value="null">Kimga</option>
          <option v-for="t in teachers" :key="t.id" :value="t.id">
            {{ t.name }}
          </option>
        </select>
        <button
          @click="reassignStudents"
          class="w-full bg-yellow-500 text-white py-2 rounded"
        >
          O'tkazish
        </button>
      </div>

      <!-- LOADING -->
      <div
        v-if="loadingTeachers"
        class="text-center py-4 text-gray-400 text-sm"
      >
        Yuklanmoqda...
      </div>

      <!-- LIST -->
      <div
        v-else
        v-for="t in teachers"
        :key="t.id"
        class="flex flex-wrap gap-2 justify-between items-center p-3 rounded-xl mb-2"
      >
        <div>
          <p class="font-medium">{{ t.name }}</p>
          <p class="text-xs text-gray-400">{{ t.phone }}</p>
        </div>
        <div class="flex gap-2 items-center">
          <button
            @click="selectTeacher(t.id)"
            class="text-blue-500 text-sm border px-2 rounded cursor-pointer"
          >
            O'quvchilar
          </button>
        </div>
      </div>

      <!-- DELETE CONFIRM -->
      <div
        v-if="showAsk"
        class="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      >
        <div class="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
          <h3 class="font-semibold mb-2">Teacherni o'chirish</h3>
          <p class="text-sm text-gray-500 mb-4">
            Rostdan ham o'chirmoqchimisiz?
          </p>
          <div class="flex gap-2">
            <button
              @click="showAsk = false"
              class="flex-1 py-2 rounded-xl border text-sm"
            >
              Bekor
            </button>
            <button
              @click="confirmDelete"
              class="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm"
            >
              O'chirish
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- STUDENTS -->
    <div v-if="showStudents" class="rounded-2xl p-4 sm:p-6">
      <h2 class="mb-4 font-medium">
        {{ selectedTeacherName }} — o'quvchilari ({{ students.length }})
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
