<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
import Ask from "../components/ask.vue";

const showAsk = ref(false);
const teacherToDelete = ref(null);
// ─────────────────────────────
// AUTH
// ─────────────────────────────

const user = JSON.parse(localStorage.getItem("user") || "null");

// login qilmagan bo‘lsa
if (!user) {
  router.push("/login");
}

// admin bo‘lmasa
if (user && !user.is_admin) {
  router.push("/");
}

function logout() {
  localStorage.removeItem("user");
  router.push("/login");
}

// ─────────────────────────────
// STATE
// ─────────────────────────────

const teachers = ref([]);
const students = ref([]);

const payments = ref([]);
const loadingPayments = ref(false);

const loadingStudents = ref(false);
const loadingTeachers = ref(false);

const stageLoading = ref(null);

const showForm = ref(false);
const showReassign = ref(false);
const showStudents = ref(false);

const newTeacher = ref({
  name: "",
  phone: "",
});

const fromTeacher = ref(null);
const toTeacher = ref(null);

const selectedTeacherId = ref(null);

const STAGES = [1, 2, 3, 4, 5, 6, 7];

// ─────────────────────────────
// COMPUTED
// ─────────────────────────────

const selectedTeacherName = computed(() => {
  return (
    teachers.value.find((t) => t.id === selectedTeacherId.value)?.name || ""
  );
});

// ─────────────────────────────
// FETCH
// ─────────────────────────────

async function updateSchedule(student, schedule) {
  await fetch(`${API}/students/update/${student.id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ schedule }),
  });
  student.schedule = schedule;
}

async function fetchStudents(teacherId) {
  loadingStudents.value = true;

  try {
    if (!teacherId) {
      students.value = [];
      return;
    }

    const res = await fetch(`${API}/students/?teacher_id=${teacherId}`);

    if (!res.ok) {
      throw new Error("Students yuklanmadi");
    }

    const data = await res.json();

    console.log("STUDENTS:", data);

    students.value = data;
  } catch (e) {
    console.error(e);
    alert("Studentlarni yuklashda xatolik");
  } finally {
    loadingStudents.value = false;
  }
}

async function fetchPayments(teacherId) {
  loadingPayments.value = true;

  try {
    const res = await fetch(`${API}/payments/?teacher_id=${teacherId}`);

    if (!res.ok) {
      throw new Error("Payments yuklanmadi");
    }

    payments.value = await res.json();

    console.log("PAYMENTS:", payments.value);
  } catch (e) {
    console.error(e);
    alert("To'lovlarni yuklashda xatolik");
  } finally {
    loadingPayments.value = false;
  }
}

onMounted(async () => {
  await fetchTeachers();
});

// ─────────────────────────────
// CREATE TEACHER
// ─────────────────────────────

async function fetchTeachers() {
  try {
    const res = await fetch(`${API}/teachers/`);
    const data = await res.json();

    console.log("TEACHERS:", data);

    teachers.value = data;
  } catch (e) {
    console.error("Error:", e);
  }
}

onMounted(() => {
  fetchTeachers();
});

async function createTeacher() {
  if (!newTeacher.value.name.trim()) {
    alert("Teacher ismini kiriting");
    return;
  }

  try {
    const res = await fetch(`${API}/teachers/create/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newTeacher.value),
    });

    if (!res.ok) {
      throw new Error("Teacher yaratilmadi");
    }

    newTeacher.value = {
      name: "",
      phone: "",
    };

    showForm.value = false;

    await fetchTeachers();

    alert("Teacher qo'shildi");
  } catch (e) {
    console.error(e);
    alert("Teacher yaratishda xatolik");
  }
}

// ─────────────────────────────
// DELETE TEACHER
// ─────────────────────────────

async function deleteTeacher(id) {
  teacherToDelete.value = id;
  showAsk.value = true;

  try {
    const res = await fetch(`${API}/teachers/${id}/delete/`, {
      method: "DELETE",
    });

    // backend error
    if (!res.ok) {
      let errorMessage = "O'chirishda xatolik";

      try {
        const data = await res.json();

        if (data.error) {
          errorMessage = data.error;
        }
      } catch {
        const text = await res.text();
        console.log(text);
      }

      alert(errorMessage);
      return;
    }

    // active teacher bo‘lsa cleanup
    if (selectedTeacherId.value === id) {
      selectedTeacherId.value = null;
      showStudents.value = false;
      students.value = [];
    }

    await fetchTeachers();

    alert("Teacher o'chirildi");
  } catch (e) {
    console.error(e);
    alert("Server bilan aloqa yo'q");
  }
}

// ─────────────────────────────
// REASSIGN STUDENTS
// ─────────────────────────────

async function reassignStudents() {
  if (!fromTeacher.value || !toTeacher.value) {
    alert("Teacher tanlang");
    return;
  }

  if (fromTeacher.value === toTeacher.value) {
    alert("Bir xil teacher tanlandi");
    return;
  }

  try {
    const fromId = fromTeacher.value;

    const res = await fetch(`${API}/teachers/reassign/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from_teacher_id: fromId,
        to_teacher_id: toTeacher.value,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || "Xatolik");
      return;
    }

    alert("O'quvchilar o'tkazildi");

    showReassign.value = false;

    fromTeacher.value = null;
    toTeacher.value = null;

    if (selectedTeacherId.value === fromId) {
      await fetchStudents(selectedTeacherId.value);
    }
  } catch (e) {
    console.error(e);
    alert("Server bilan aloqa yo'q");
  }
}

// ─────────────────────────────
// SELECT TEACHER
// ─────────────────────────────

async function selectTeacher(teacherId) {
  selectedTeacherId.value = teacherId;
  showStudents.value = true;

  await Promise.all([fetchStudents(teacherId), fetchPayments(teacherId)]);
}

// ─────────────────────────────
// UPDATE STAGE
// ─────────────────────────────

async function updateStage(student, stage) {
  if (stageLoading.value === student.id) {
    return;
  }

  stageLoading.value = student.id;

  try {
    const res = await fetch(`${API}/students/update/${student.id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ stage }),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Xatolik");
      return;
    }

    // stage 5 => boshqa teacherga o'tsa
    if (stage === 5 && result.teacher_id !== selectedTeacherId.value) {
      students.value = students.value.filter((s) => s.id !== student.id);

      alert(`${student.name} kotta teacherga o'tdi`);
    } else {
      const s = students.value.find((s) => s.id === student.id);

      if (s) {
        s.stage = result.stage;
        s.teacher_id = result.teacher_id;
        s.teacher_name = result.teacher_name;
      }
    }
  } catch (e) {
    console.error(e);
    alert("Server bilan aloqa yo'q");
  } finally {
    stageLoading.value = null;
  }
}

function getStudentPayment(studentId) {
  return payments.value.find((p) => p.student_id === studentId);
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("uz-UZ") + " so'm";
}
</script>
<template>
  <div class="max-w-4xl mx-auto mx-3 px-4">
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
        class="px-4 py-2 rounded-full text-sm hover:bg-gray-50">
        Chiqish
      </button>
    </div>

    <!-- QUICK NAV -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
      <div
        @click="$router.push('/students')"
        class="p-5 border rounded-2xl cursor-pointer hover:bg-gray-50">
        👥 O'quvchilar
      </div>
      <div
        @click="$router.push('/attendance')"
        class="p-5 border rounded-2xl cursor-pointer hover:bg-gray-50">
        📋 Davomat
      </div>
    </div>

    <!-- TEACHERS -->
    <div class="rounded-2xl p-4 sm:p-6 mb-6">
      <div class="flex justify-between mb-4">
        <h2 class="text-lg font-medium">O'qituvchilar</h2>
        <div class="flex gap-2">
          <button
            @click="showReassign = !showReassign"
            class="px-3 py-1 rounded-full text-sm">
            O'tkazish
          </button>
          <button
            @click="showForm = !showForm"
            class="bg-black text-white px-3 py-1 rounded-full text-sm">
            + Qo'shish
          </button>
        </div>
      </div>

      <!-- FORM -->
      <div v-if="showForm" class="p-4 bg-gray-50 rounded-xl mb-4">
        <input
          v-model="newTeacher.name"
          placeholder="Ism"
          class="w-full p-2 rounded mb-2" />
        <input
          v-model="newTeacher.phone"
          placeholder="Telefon"
          class="w-full p-2 rounded mb-2" />
        <button
          @click="createTeacher"
          class="w-full bg-black text-white py-2 rounded">
          Saqlash
        </button>
      </div>

      <!-- REASSIGN -->
      <div v-if="showReassign" class="p-4 bg-yellow-50 rounded-xl mb-4">
        <select v-model.number="fromTeacher" class="w-full p-2 rounded mb-2">
          <option :value="null">Kimdan</option>
          <option v-for="t in teachers" :key="t.id" :value="t.id">
            {{ t.name }}
          </option>
        </select>
        <select v-model.number="toTeacher" class="w-full p-2 rounded mb-2">
          <option :value="null">Kimga</option>
          <option v-for="t in teachers" :key="t.id" :value="t.id">
            {{ t.name }}
          </option>
        </select>
        <button
          @click="reassignStudents"
          class="w-full bg-yellow-500 text-white py-2 rounded">
          O'tkazish
        </button>
      </div>

      <!-- LIST -->
      <div
        v-for="t in teachers"
        :key="t.id"
        class="flex flex-wrap gap-2 justify-between items-center p-3 rounded-xl mb-2">
        <div>
          <p class="font-medium">{{ t.name }}</p>
          <p class="text-xs text-gray-400">{{ t.phone }}</p>
        </div>
        <div class="flex gap-2">
          <button
            @click="selectTeacher(t.id)"
            class="text-blue-500 text-sm border px-2 rounded cursor-pointer">
            O'quvchilar
          </button>
          <button
            @click="deleteTeacher(t.id)"
            class="text-red-400 text-sm border px-2 rounded cursor-pointer">
            O'chirish
          </button>
          <Ask
            v-if="showAsk"
            title="Teacherni o'chirish"
            message="Rostdan ham o'chirmoqchimisiz?"
            @confirm="confirmDelete"
            @cancel="showAsk = false" />
        </div>
      </div>
    </div>

    <!-- STUDENTS -->
    <div v-if="showStudents" class="rounded-2xl p-4 sm:p-6">
      <h2 class="mb-4 font-medium">
        {{ selectedTeacherName }} — o'quvchilari ({{ students.length }})
      </h2>
      <div v-if="loadingStudents">Yuklanmoqda...</div>
      <div
        v-else
        v-for="s in students"
        :key="s.id"
        class="flex flex-wrap gap-2 justify-between items-center p-3 rounded mb-2">
        <div>
          <p class="font-medium">{{ s.name }} {{ s.surname }}</p>

          <p class="text-xs text-gray-400">
            {{ s.phone }}
          </p>

          <div
            v-if="getStudentPayment(s.id)"
            class="mt-2 flex flex-wrap items-center gap-2">
            <span
              :class="
                getStudentPayment(s.id).is_paid
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-600'
              "
              class="text-xs px-2 py-1 rounded-full">
              {{
                getStudentPayment(s.id).is_paid ? "To‘langan" : "To‘lanmagan"
              }}
            </span>

            <span class="text-xs text-gray-500">
              {{ formatMoney(getStudentPayment(s.id).amount_due) }}
            </span>
          </div>
        </div>
        <div class="flex gap-1 flex-wrap">
          <button
            v-for="st in STAGES"
            :key="st"
            @click="updateStage(s, st)"
            class="w-7 h-7 text-xs rounded-full"
            :class="s.stage === st ? 'bg-black text-white' : ''">
            {{ st }}
          </button>
        </div>
        <div class="flex gap-1 w-full mt-1">
          <button
            @click="updateSchedule(s, 'odd')"
            :class="[
              'flex-1 text-xs py-1 rounded-lg border transition',
              s.schedule === 'odd'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50',
            ]">
            Du/Chor/Juma
          </button>
          <button
            @click="updateSchedule(s, 'even')"
            :class="[
              'flex-1 text-xs py-1 rounded-lg border transition',
              s.schedule === 'even'
                ? 'bg-gray-900 text-white border-gray-900'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50',
            ]">
            Se/Pay/Shan
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
