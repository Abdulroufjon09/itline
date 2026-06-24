<script setup>
import Leaderboard from "@/components/Leaderboard.vue";
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import Magazine from "./Magazine.vue";

const router = useRouter();

const API = "https://itline-django-9s85.onrender.com/api";

const user = JSON.parse(localStorage.getItem("user") || "{}");

// auth
if (!user?.id) {
  router.push("/login");
}

// ─────────────────────────────
// STATE
// ─────────────────────────────

const students = ref([]);
const payments = ref([]);
const groups = ref([]); // barcha guruhlar
const myGroup = ref(null); // joriy o'quvchi uchun guruh

const loadingStudents = ref(true);
const loadingPayments = ref(true);
const loadingGroups = ref(false);

const activeTab = ref("students");

// admin uchun guruh filter
const selectedGroupId = ref(null);

// ─────────────────────────────
// COLORS
// ─────────────────────────────

const avatarColors = [
  { backgroundColor: "#EEEDFE", color: "#3C3489" },
  { backgroundColor: "#E1F5EE", color: "#085041" },
  { backgroundColor: "#FAECE7", color: "#712B13" },
  { backgroundColor: "#E6F1FB", color: "#0C447C" },
  { backgroundColor: "#FAEEDA", color: "#633806" },
];

// ─────────────────────────────
// FETCH DATA
// ─────────────────────────────

async function fetchStudents() {
  loadingStudents.value = true;
  try {
    const res = await fetch(`${API}/students/?teacher_id=${user.teacher_id}`);
    students.value = await res.json();
  } catch (e) {
    console.error(e);
  } finally {
    loadingStudents.value = false;
  }
}

async function fetchPayments() {
  loadingPayments.value = true;
  try {
    const res = await fetch(`${API}/payments/${user.id}/`);
    payments.value = await res.json();
  } catch (e) {
    console.error(e);
  } finally {
    loadingPayments.value = false;
  }
}

async function fetchGroups() {
  loadingGroups.value = true;
  try {
    const res = await fetch(`${API}/groups/`);
    const data = await res.json();
    groups.value = data;

    if (!user.is_admin && user.phone) {
      myGroup.value =
        data.find((g) => g.students?.some((s) => s.phone === user.phone)) ||
        null;
    }
  } catch (e) {
    console.error(e);
  } finally {
    loadingGroups.value = false;
  }
}

onMounted(async () => {
  await Promise.all([fetchStudents(), fetchPayments(), fetchGroups()]);
});

// ─────────────────────────────
// COMPUTED
// ─────────────────────────────

// Admin: tanlangan guruh bo'yicha studentlarni filter qilish
const filteredStudents = computed(() => {
  if (!user.is_admin || !selectedGroupId.value) return students.value;
  const group = groups.value.find((g) => g.id === selectedGroupId.value);
  if (!group) return students.value;
  const ids = new Set(group.students?.map((s) => s.id) || []);
  return students.value.filter((s) => ids.has(s.id));
});

// Studentga guruh nomini qaytarish
function getStudentGroup(studentId) {
  return (
    groups.value.find((g) => g.students?.some((s) => s.id === studentId)) ||
    null
  );
}

// ─────────────────────────────
// HELPERS
// ─────────────────────────────

function logout() {
  localStorage.removeItem("user");
  router.push("/login");
}

function initials(student) {
  return (
    (student.name?.[0] || "") + (student.surname?.[0] || "")
  ).toUpperCase();
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString("uz-UZ") + " so'm";
}

function formatMonth(month) {
  if (!month) return "";
  const [year, mon] = month.split("-");
  const months = [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "Iyun",
    "Iyul",
    "Avgust",
    "Sentabr",
    "Oktabr",
    "Noyabr",
    "Dekabr",
  ];
  return `${months[parseInt(mon) - 1]} ${year}`;
}

function formatDate(date) {
  if (!date) return "";
  let cleaned = date.replace(" ", "T");
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) return date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate() - 1).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function stageStyle(stage) {
  if (stage <= 2) return { backgroundColor: "#E1F5EE", color: "#085041" };
  if (stage <= 4) return { backgroundColor: "#E6F1FB", color: "#0C447C" };
  return { backgroundColor: "#FAEEDA", color: "#633806" };
}
</script>

<template>
  <div class="max-w-4xl mx-auto p-4 sm:p-6">
    <!-- HEADER -->
    <div class="flex items-center justify-between mb-8">
      <div v-if="user.is_admin" class="flex items-center gap-3">
        <RouterLink
          to="/admin"
          class="flex text-gray-600 hover:text-gray-900 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1.7em"
            height="1.7em"
            viewBox="0 0 48 48"
          >
            <path d="M0 0h48v48H0z" fill="none" />
            <path
              fill="none"
              stroke="currentColor"
              stroke-linejoin="round"
              stroke-width="4"
              d="M44 40.836q-7.34-8.96-13.036-10.168t-10.846-.365V41L4 23.545L20.118 7v10.167q9.523.075 16.192 6.833q6.668 6.758 7.69 16.836Z"
              clip-rule="evenodd"
            />
          </svg>
        </RouterLink>
        <div>
          <h1 class="text-xl sm:text-2xl font-semibold">Kabinet</h1>
          <p class="text-sm text-gray-400 mt-1">
            Xush kelibsiz, {{ user.name }}
          </p>
        </div>
      </div>
      <button
        @click="logout"
        class="border border-gray-200 px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition ml-auto"
      >
        Chiqish
      </button>
    </div>

    <!-- PROFILE -->
    <div
      class="border border-gray-100 rounded-2xl p-4 sm:p-5 mb-6 flex items-center gap-4"
    >
      <div
        class="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-semibold shrink-0"
        :style="avatarColors[0]"
      >
        {{ (user.name?.[0] || "").toUpperCase() }}
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <p class="font-medium text-base sm:text-lg truncate">
            {{ user.name }} {{ user.surname }}
          </p>
          <p class="text-yellow-500" v-if="user.is_admin">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
            >
              <path d="M0 0h24v24H0z" fill="none" />
              <path
                fill="currentColor"
                d="m12 17.275l-4.15 2.5q-.275.175-.575.15t-.525-.2t-.35-.437t-.05-.588l1.1-4.725L3.775 10.8q-.25-.225-.312-.513t.037-.562t.3-.45t.55-.225l4.85-.425l1.875-4.45q.125-.3.388-.45t.537-.15t.537.15t.388.45l1.875 4.45l4.85.425q.35.05.55.225t.3.45t.038.563t-.313.512l-3.675 3.175l1.1 4.725q.075.325-.05.588t-.35.437t-.525.2t-.575-.15z"
              />
            </svg>
          </p>
        </div>
        <p class="text-sm text-gray-400">{{ user.phone }}</p>

        <!-- O'quvchi uchun: guruh ko'rsatish profile cardda -->
        <div v-if="!user.is_admin && myGroup" class="mt-2">
          <span
            class="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600"
          >
            🗂️ {{ myGroup.name }}
          </span>
        </div>
        <div
          v-else-if="!user.is_admin && !loadingGroups && !myGroup"
          class="mt-2"
        >
          <span
            class="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-gray-50 text-gray-400"
          >
            Guruhga biriktirilmagan
          </span>
        </div>
      </div>
    </div>

    <!-- TABS -->
    <div class="flex gap-3 mb-6 flex-wrap">
      <button
        @click="activeTab = 'students'"
        :class="[
          'px-4 sm:px-5 py-2 rounded-full border text-sm transition',
          activeTab === 'students'
            ? 'bg-black text-white border-black'
            : 'border-gray-200 text-gray-600 hover:bg-gray-50',
        ]"
      >
        👥 Guruh
      </button>
      <div v-if="!user.is_admin">
        <button
          @click="activeTab = 'payments'"
          :class="[
            'px-4 sm:px-5 py-2 rounded-full border text-sm transition',
            activeTab === 'payments'
              ? 'bg-black text-white border-black'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50',
          ]"
        >
          💳 To'lovlar
        </button>
      </div>
      <div v-if="!user.is_admin">
        <button
          @click="activeTab = 'leader'"
          :class="[
            'px-4 sm:px-5 py-2 rounded-full border text-sm transition',
            activeTab === 'leader'
              ? 'bg-black text-white border-black'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50',
          ]"
        >
          ⍟ Leaderboard
        </button>
      </div>
      <div v-if="!user.is_admin">
        <button
          @click="activeTab = 'market'"
          :class="[
            'px-4 sm:px-5 py-2 rounded-full border text-sm transition',
            activeTab === 'market'
              ? 'bg-black text-white border-black'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50',
          ]"
        >
          ⍟ Magazine
        </button>
      </div>
    </div>

    <!-- STUDENTS -->
    <div v-if="activeTab === 'students'">
      <!-- Admin: guruh bo'yicha filter -->
      <div
        v-if="user.is_admin && groups.length > 0"
        class="mb-4 flex gap-2 flex-wrap"
      >
        <button
          @click="selectedGroupId = null"
          :class="[
            'px-3 py-1.5 rounded-full text-xs border transition',
            selectedGroupId === null
              ? 'bg-black text-white border-black'
              : 'border-gray-200 text-gray-500 hover:bg-gray-50',
          ]"
        >
          Barchasi ({{ students.length }})
        </button>
        <button
          v-for="g in groups"
          :key="g.id"
          @click="selectedGroupId = g.id"
          :class="[
            'px-3 py-1.5 rounded-full text-xs border transition',
            selectedGroupId === g.id
              ? 'bg-black text-white border-black'
              : 'border-gray-200 text-gray-500 hover:bg-gray-50',
          ]"
        >
          🗂️ {{ g.name }}
          <span class="opacity-60 ml-0.5">
            ({{
              g.students?.filter((s) => students.some((st) => st.id === s.id))
                .length || 0
            }})
          </span>
        </button>
      </div>

      <div class="mb-4 text-sm text-gray-400">
        {{ filteredStudents.length }} ta o'quvchi
        <span v-if="selectedGroupId" class="ml-1 text-gray-500">
          — {{ groups.find((g) => g.id === selectedGroupId)?.name }}
        </span>
      </div>

      <div class="border border-gray-100 rounded-2xl table-wrapper">
        <div v-if="loadingStudents" class="text-center py-10 text-gray-400">
          Yuklanmoqda...
        </div>
        <table
          v-else-if="filteredStudents.length > 0"
          class="w-full text-sm min-w-[360px] responsive-table"
        >
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left px-4 py-3">#</th>
              <th class="text-left px-4 py-3">O'quvchi</th>
              <th v-if="user.is_admin" class="text-left px-4 py-3">Raqam</th>
              <th class="text-left px-4 py-3">Guruh</th>
              <th class="text-left px-4 py-3">Etap</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(student, index) in filteredStudents"
              :key="student.id"
              class="border-t border-gray-100 hover:bg-gray-50 transition"
            >
              <td class="px-4 py-4 text-gray-400">{{ index + 1 }}</td>
              <td class="px-4 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                    :style="avatarColors[index % avatarColors.length]"
                  >
                    {{ initials(student) }}
                  </div>
                  <p class="font-medium">
                    {{ student.name }} {{ student.surname }}
                  </p>
                </div>
              </td>
              <td v-if="user.is_admin" class="px-4 py-4">
                <span
                  class="px-3 py-1 rounded-full text-xs font-medium"
                  :style="stageStyle(student.stage)"
                >
                  {{ student.phone }}
                </span>
              </td>
              <!-- GURUH USTUNI -->
              <td class="px-4 py-4">
                <span
                  v-if="getStudentGroup(student.id)"
                  class="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 whitespace-nowrap"
                >
                  🗂️ {{ getStudentGroup(student.id).name }}
                </span>
                <span v-else class="text-xs text-gray-300">—</span>
              </td>
              <td class="px-4 py-4">
                <span
                  class="px-3 py-1 rounded-full text-xs font-medium"
                  :style="stageStyle(student.stage)"
                >
                  {{ student.stage }}-etap
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="text-center py-10 text-gray-400">
          O'quvchilar yo'q
        </div>
      </div>
    </div>

    <!-- PAYMENTS -->
    <div v-if="activeTab === 'payments'">
      <div v-if="loadingPayments" class="text-center py-10 text-gray-400">
        Yuklanmoqda...
      </div>
      <div v-else-if="payments.length > 0" class="space-y-4">
        <div
          v-for="payment in payments"
          :key="payment.id"
          class="border border-gray-100 rounded-2xl p-4 sm:p-5"
        >
          <div class="flex items-start justify-between mb-5 gap-3">
            <div>
              <p class="font-semibold text-base sm:text-lg">
                {{ formatMonth(payment.month) }}
              </p>
              <p class="text-sm text-gray-400 mt-1">{{ payment.stage }}-etap</p>
            </div>
            <div class="text-right shrink-0">
              <div
                :class="[
                  'px-3 py-1 rounded-full text-xs font-medium inline-block',
                  payment.is_paid
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-600',
                ]"
              >
                {{
                  payment.is_paid ? "To'lov qilingan ✓" : "To'lov qilinmagan"
                }}
              </div>
              <p v-if="payment.paid_at" class="text-xs text-gray-400 mt-2">
                {{ formatDate(payment.paid_at) }}
              </p>
            </div>
          </div>
          <div>
            <p class="text-sm text-gray-400 mb-1">To'lov summasi</p>
            <p class="text-2xl sm:text-3xl font-bold">
              {{ formatMoney(payment.amount_due) }}
            </p>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-10 text-gray-400">
        Hozircha to'lovlar mavjud emas
      </div>
    </div>

    <div class="mt-4 px-4" v-if="activeTab === 'leader'">
      <div class="mt-4">
        <Leaderboard />
      </div>
    </div>

    <div class="mt-4 px-4" v-if="activeTab === 'market'">
      <div class="mt-4">
        <Magazine />
      </div>
    </div>
  </div>
</template>

<style>
.table-wrapper {
  overflow-x: auto;
}

@media (max-width: 768px) {
  .responsive-table {
    min-width: 600px;
  }
}

@media (max-width: 480px) {
  .responsive-table {
    min-width: 520px;
  }

  .responsive-table th,
  .responsive-table td {
    padding: 10px 8px;
    font-size: 12px;
  }
}
</style>
