<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const API = "https://itline-django-9s85.onrender.com/api";

const user = JSON.parse(localStorage.getItem("user") || "null");
if (!user || !user.is_excellence) router.push("/login");

function logout() {
  localStorage.removeItem("user");
  router.push("/login");
}

// ─────────────────────────────
// STATE
// ─────────────────────────────

const activeTab = ref("payments"); // "payments" | "attendance" | "prices"

const teachers = ref([]);
const stagePrices = ref([]);
const payments = ref([]);
const loading = ref(false);
const generating = ref(false);

// Attendance
const selectedTeacherForAtt = ref(null);
const attStudents = ref([]);
const selectedStudent = ref(null);
const studentMonthAttendance = ref([]); // 1 oylik davomat
const selectedAttMonth = ref(new Date().toISOString().slice(0, 7));
const loadingAtt = ref(false);

// Payments
const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const selectedTeacherId = ref("");
const editingPrice = ref(null); // { stage, value }

// ─────────────────────────────
// FETCH
// ─────────────────────────────

async function fetchTeachers() {
  const res = await fetch(`${API}/teachers/`);
  teachers.value = await res.json();
}

async function fetchStagePrices() {
  const res = await fetch(`${API}/stage-prices/`);
  stagePrices.value = await res.json();
}

async function fetchPayments() {
  loading.value = true;
  try {
    let url = `${API}/payments/?month=${selectedMonth.value}`;
    if (selectedTeacherId.value)
      url += `&teacher_id=${selectedTeacherId.value}`;
    const res = await fetch(url);
    payments.value = await res.json();
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await Promise.all([fetchTeachers(), fetchStagePrices(), fetchPayments()]);
});

// ─────────────────────────────
// STAGE PRICES
// ─────────────────────────────

function startEditPrice(sp) {
  editingPrice.value = { stage: sp.stage, value: sp.price };
}

async function savePrice() {
  if (!editingPrice.value) return;
  const res = await fetch(
    `${API}/stage-prices/update/${editingPrice.value.stage}/`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: editingPrice.value.value }),
    },
  );
  const data = await res.json();
  const sp = stagePrices.value.find(
    (s) => s.stage === editingPrice.value.stage,
  );
  if (sp) sp.price = data.price;
  editingPrice.value = null;
}

// ─────────────────────────────
// PAYMENTS
// ─────────────────────────────

async function generatePayments() {
  if (!confirm(`${selectedMonth.value} uchun to'lovlarni yaratish?`)) return;
  generating.value = true;
  try {
    const res = await fetch(`${API}/payments/generate/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: selectedMonth.value }),
    });
    const data = await res.json();
    alert(data.message);
    await fetchPayments();
  } finally {
    generating.value = false;
  }
}

async function togglePaid(payment) {
  const res = await fetch(`${API}/payments/confirm/${payment.id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_paid: !payment.is_paid }),
  });
  const data = await res.json();
  payment.is_paid = data.is_paid;
}

async function updateAmount(payment) {
  await fetch(`${API}/payments/${payment.id}/update/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount_due: payment.amount_due }),
  });
}

const totalAmount = computed(() =>
  payments.value.reduce((a, b) => a + b.amount_due, 0),
);
const paidAmount = computed(() =>
  payments.value.filter((p) => p.is_paid).reduce((a, b) => a + b.amount_due, 0),
);
const unpaidAmount = computed(() => totalAmount.value - paidAmount.value);

// ─────────────────────────────
// ATTENDANCE (Excellence view)
// ─────────────────────────────

async function selectTeacherForAtt(teacher) {
  selectedTeacherForAtt.value = teacher;
  selectedStudent.value = null;
  studentMonthAttendance.value = [];
  loadingAtt.value = true;
  try {
    const res = await fetch(`${API}/students/?teacher_id=${teacher.id}`);
    attStudents.value = await res.json();
  } finally {
    loadingAtt.value = false;
  }
}

async function selectStudentForAtt(student) {
  selectedStudent.value = student;
  loadingAtt.value = true;
  try {
    // O'sha oyning darslarini va davomatini olamiz
    const res = await fetch(
      `${API}/student-attendance/${student.id}/?month=${selectedAttMonth.value}`,
    );
    studentMonthAttendance.value = await res.json();
  } finally {
    loadingAtt.value = false;
  }
}

// Student to'lov holati (payments dan olamiz)
function getStudentPayment(studentId) {
  return payments.value.find(
    (p) => p.student_id === studentId && p.month === selectedMonth.value,
  );
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

function money(val) {
  return Number(val).toLocaleString("uz-UZ") + " so'm";
}

function formatMonth(m) {
  const [year, mon] = m.split("-");
  const months = [
    "Yan",
    "Fev",
    "Mar",
    "Apr",
    "May",
    "Iyn",
    "Iyl",
    "Avg",
    "Sen",
    "Okt",
    "Noy",
    "Dek",
  ];
  return `${months[parseInt(mon) - 1]} ${year}`;
}
</script>

<template>
  <div class="max-w-6xl mx-auto p-4 sm:p-6">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-xl sm:text-2xl font-medium">Excellence Panel</h1>
        <p class="text-gray-400 text-sm mt-0.5">
          Xush kelibsiz, {{ user.name }}!
        </p>
      </div>
      <button
        @click="logout"
        class="px-4 py-2 rounded-full border border-gray-200 text-sm hover:bg-gray-50 transition"
      >
        Chiqish
      </button>
    </div>

    <!-- Tablar -->
    <div class="flex gap-2 mb-6 overflow-x-auto pb-1">
      <button
        v-for="tab in [
          { key: 'payments', label: '💳 To\'lovlar' },
          { key: 'attendance', label: '📋 Davomat' },
          { key: 'prices', label: '⚙️ Narxlar' },
        ]"
        :key="tab.key"
        @click="activeTab = tab.key"
        :class="[
          'px-4 py-2 rounded-full text-sm border transition whitespace-nowrap',
          activeTab === tab.key
            ? 'bg-gray-900 text-white border-gray-900'
            : 'border-gray-200 text-gray-500 hover:bg-gray-50',
        ]"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- TO'LOVLAR -->
    <div v-if="activeTab === 'payments'">
      <div class="flex flex-wrap gap-3 mb-5">
        <div>
          <label class="block text-xs text-gray-400 mb-1">Oy</label>
          <input
            type="month"
            v-model="selectedMonth"
            @change="fetchPayments"
            class="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">O'qituvchi</label>
          <select
            v-model="selectedTeacherId"
            @change="fetchPayments"
            class="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
          >
            <option value="">Barchasi</option>
            <option v-for="t in teachers" :key="t.id" :value="t.id">
              {{ t.name }}
            </option>
          </select>
        </div>
        <div class="flex items-end">
          <button
            @click="generatePayments"
            :disabled="generating"
            class="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-700 transition disabled:opacity-50"
          >
            {{ generating ? "Hisoblanmoqda..." : "To'lovlarni yaratish" }}
          </button>
        </div>
      </div>

      <!-- Statistika -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div class="bg-gray-100 rounded-xl p-4">
          <p class="text-xs text-gray-500 mb-1">Jami</p>
          <p class="text-xl font-semibold">{{ money(totalAmount) }}</p>
        </div>
        <div class="bg-green-50 rounded-xl p-4">
          <p class="text-xs text-green-600 mb-1">To'langan</p>
          <p class="text-xl font-semibold text-green-700">
            {{ money(paidAmount) }}
          </p>
        </div>
        <div class="bg-red-50 rounded-xl p-4">
          <p class="text-xs text-red-500 mb-1">Qolgan</p>
          <p class="text-xl font-semibold text-red-600">
            {{ money(unpaidAmount) }}
          </p>
        </div>
      </div>

      <!-- Jadval -->
      <div v-if="loading" class="text-center py-8 text-gray-400">
        Yuklanmoqda...
      </div>

      <div v-else class="border border-gray-100 rounded-2xl overflow-x-auto">
        <table class="w-full text-sm min-w-[600px]">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="text-left px-4 py-3 text-xs text-gray-400 font-medium">
                Student
              </th>
              <th class="text-left px-4 py-3 text-xs text-gray-400 font-medium">
                Telefon
              </th>
              <th class="text-left px-4 py-3 text-xs text-gray-400 font-medium">
                O'qituvchi
              </th>
              <th class="text-left px-4 py-3 text-xs text-gray-400 font-medium">
                Etap
              </th>
              <th class="text-left px-4 py-3 text-xs text-gray-400 font-medium">
                Summa
              </th>
              <th class="text-left px-4 py-3 text-xs text-gray-400 font-medium">
                Holat
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="payment in payments"
              :key="payment.id"
              class="border-b border-gray-50 hover:bg-gray-50 transition"
            >
              <td class="px-4 py-3 font-medium">{{ payment.student_name }}</td>
              <td class="px-4 py-3 text-gray-500">
                {{ payment.student_phone }}
              </td>
              <td class="px-4 py-3 text-gray-500">
                {{ payment.teacher_name }}
              </td>
              <td class="px-4 py-3">{{ payment.stage }}-etap</td>
              <td class="px-4 py-3">
                <input
                  type="number"
                  v-model="payment.amount_due"
                  @change="updateAmount(payment)"
                  class="border border-gray-200 rounded-lg px-2 py-1 w-28 text-sm outline-none focus:border-gray-400"
                />
              </td>
              <td class="px-4 py-3">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="payment.is_paid"
                    @change="togglePaid(payment)"
                    class="w-4 h-4"
                  />
                  <span
                    :class="payment.is_paid ? 'text-green-600' : 'text-red-500'"
                    class="text-xs font-medium"
                  >
                    {{ payment.is_paid ? "To'langan" : "To'lanmagan" }}
                  </span>
                </label>
              </td>
            </tr>
          </tbody>
        </table>
        <p
          v-if="payments.length === 0"
          class="text-center py-8 text-gray-400 text-sm"
        >
          Bu oy uchun to'lovlar yo'q.
        </p>
      </div>
    </div>

    <!-- DAVOMAT -->
    <div v-if="activeTab === 'attendance'">
      <div class="flex gap-4 mb-4">
        <div>
          <label class="block text-xs text-gray-400 mb-1">Oy</label>
          <input
            type="month"
            v-model="selectedAttMonth"
            class="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
          />
        </div>
      </div>

      <!-- Mobile: accordion-style, Desktop: 3 ustun -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- O'qituvchilar -->
        <div class="space-y-2">
          <h3
            class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2"
          >
            O'qituvchilar
          </h3>
          <div
            v-for="teacher in teachers"
            :key="teacher.id"
            @click="selectTeacherForAtt(teacher)"
            :class="[
              'px-4 py-3 rounded-xl cursor-pointer transition text-sm border',
              selectedTeacherForAtt?.id === teacher.id
                ? 'bg-gray-900 text-white border-gray-900'
                : 'border-gray-100 hover:bg-gray-50',
            ]"
          >
            <p class="font-medium">{{ teacher.name }}</p>
            <p
              :class="
                selectedTeacherForAtt?.id === teacher.id
                  ? 'text-gray-300'
                  : 'text-gray-400'
              "
              class="text-xs"
            >
              {{ teacher.phone || "Telefon yo'q" }}
            </p>
          </div>
        </div>

        <!-- Studentlar -->
        <div class="space-y-2">
          <h3
            class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2"
          >
            O'quvchilar
          </h3>
          <div v-if="!selectedTeacherForAtt" class="text-sm text-gray-400 py-4">
            O'qituvchi tanlang
          </div>
          <div v-else-if="loadingAtt" class="text-sm text-gray-400 py-4">
            Yuklanmoqda...
          </div>
          <div
            v-else
            v-for="student in attStudents"
            :key="student.id"
            @click="selectStudentForAtt(student)"
            :class="[
              'px-4 py-3 rounded-xl cursor-pointer transition text-sm border',
              selectedStudent?.id === student.id
                ? 'bg-gray-900 text-white border-gray-900'
                : 'border-gray-100 hover:bg-gray-50',
            ]"
          >
            <div class="flex justify-between items-center">
              <div>
                <p class="font-medium">
                  {{ student.name }} {{ student.surname }}
                </p>
                <p
                  :class="
                    selectedStudent?.id === student.id
                      ? 'text-gray-300'
                      : 'text-gray-400'
                  "
                  class="text-xs"
                >
                  {{ student.stage }}-etap
                </p>
              </div>
              <span
                v-if="getStudentPayment(student.id)"
                :class="[
                  'text-xs px-2 py-0.5 rounded-full',
                  getStudentPayment(student.id)?.is_paid
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-500',
                ]"
              >
                {{ getStudentPayment(student.id)?.is_paid ? "✓" : "✗" }}
              </span>
            </div>
          </div>
          <p
            v-if="
              selectedTeacherForAtt && !loadingAtt && attStudents.length === 0
            "
            class="text-sm text-gray-400 py-4"
          >
            O'quvchi yo'q
          </p>
        </div>

        <!-- Student davomati -->
        <div>
          <h3
            class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2"
          >
            {{
              selectedStudent ? selectedStudent.name + " davomati" : "Davomat"
            }}
          </h3>
          <div v-if="!selectedStudent" class="text-sm text-gray-400 py-4">
            O'quvchi tanlang
          </div>
          <div v-else-if="loadingAtt" class="text-sm text-gray-400 py-4">
            Yuklanmoqda...
          </div>
          <div v-else class="space-y-1.5">
            <div
              v-if="getStudentPayment(selectedStudent.id)"
              :class="[
                'rounded-xl p-3 mb-3',
                getStudentPayment(selectedStudent.id)?.is_paid
                  ? 'bg-green-50 border border-green-100'
                  : 'bg-red-50 border border-red-100',
              ]"
            >
              <p
                class="text-xs font-medium"
                :class="
                  getStudentPayment(selectedStudent.id)?.is_paid
                    ? 'text-green-700'
                    : 'text-red-600'
                "
              >
                {{
                  getStudentPayment(selectedStudent.id)?.is_paid
                    ? "✓ To'lov qilingan"
                    : "✗ To'lov qilinmagan"
                }}
              </p>
              <p class="text-sm font-semibold mt-0.5">
                {{
                  money(getStudentPayment(selectedStudent.id)?.amount_due || 0)
                }}
              </p>
            </div>
            <div
              v-for="att in studentMonthAttendance"
              :key="att.id"
              class="flex items-center justify-between border border-gray-100 rounded-xl px-3 py-2"
            >
              <div>
                <p class="text-sm font-medium">{{ att.lesson_title }}</p>
                <p class="text-xs text-gray-400">{{ att.lesson_date }}</p>
              </div>
              <span
                :class="[
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  statusStyle[att.status],
                ]"
              >
                {{ statusLabel[att.status] }}
              </span>
            </div>
            <p
              v-if="studentMonthAttendance.length === 0"
              class="text-sm text-gray-400 py-4 text-center"
            >
              Bu oy uchun dars yo'q
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- NARXLAR -->
    <div v-if="activeTab === 'prices'">
      <h2 class="text-lg font-medium mb-4">Etap narxlari</h2>
      <div class="space-y-2 max-w-md">
        <div
          v-for="sp in stagePrices"
          :key="sp.stage"
          class="flex flex-wrap gap-3 items-center justify-between border border-gray-100 rounded-xl px-4 py-3"
        >
          <p class="text-sm font-medium">{{ sp.stage }}-etap</p>
          <div
            v-if="editingPrice?.stage === sp.stage"
            class="flex gap-2 items-center flex-wrap"
          >
            <input
              v-model="editingPrice.value"
              type="number"
              class="border border-gray-200 rounded-xl px-3 py-1.5 text-sm outline-none w-32"
            />
            <button
              @click="savePrice"
              class="px-3 py-1.5 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-700 transition"
            >
              Saqlash
            </button>
            <button
              @click="editingPrice = null"
              class="px-3 py-1.5 border border-gray-200 rounded-xl text-sm"
            >
              Bekor
            </button>
          </div>
          <div v-else class="flex items-center gap-3">
            <span class="text-sm font-medium">{{ money(sp.price) }}</span>
            <button
              @click="startEditPrice(sp)"
              class="text-xs px-3 py-1 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
            >
              O'zgartirish
            </button>
          </div>
        </div>
        <p
          v-if="stagePrices.length === 0"
          class="text-sm text-gray-400 text-center py-4"
        >
          Narxlar yo'q.
        </p>
      </div>
    </div>
  </div>
</template>
