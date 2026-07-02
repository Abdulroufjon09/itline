<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import AdminProducts from "./AdminProducts.vue";
import Adminorders from "./Adminorders.vue";
import Coin_settings from "./coin_settings.vue";

const router = useRouter();
const API = "https://itline-django-9s85.onrender.com/api";

const user = JSON.parse(localStorage.getItem("user") || "null");
if (!user || !user.is_excellence) router.push("/login");

function logout() {
  localStorage.removeItem("user");
  router.push("/login");
}

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 9) return "+998" + digits;
  if (digits.length >= 11) return "+" + digits;
  return "+" + digits;
}

const activeTab = ref("payments");

const teachers = ref([]);
const stagePrices = ref([]);
const payments = ref([]);
const loading = ref(false);
const generating = ref(false);

const selectedTeacherForAtt = ref(null);
const attStudents = ref([]);
const selectedStudent = ref(null);
const studentMonthAttendance = ref([]);
const selectedAttMonth = ref(new Date().toISOString().slice(0, 7));
const loadingAtt = ref(false);
const attPayments = ref([]);

const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const selectedTeacherId = ref("");
const editingPrice = ref(null);

const historyTeacherId = ref("");
const historyMonth = ref(new Date().toISOString().slice(0, 7));
const historyPayments = ref([]);
const loadingHistory = ref(false);

const addTab = ref("student");
const addErrorFields = ref(new Set());
const addNetworkError = ref(false);
const addSuccessMsg = ref("");
const addLoading = ref(false);

const studentForm = ref({
  name: "",
  surname: "",
  phone: "",
  password: "",
  teacher_id: "",
  schedule: "odd",
});

const teacherForm = ref({
  name: "",
  phone: "",
});

async function fetchTeachers() {
  const res = await fetch(`${API}/teachers/`);
  if (res.ok) {
    teachers.value = await res.json();
  } else {
    const res2 = await fetch(`${API}/teachers/create/`);
    teachers.value = await res2.json();
  }
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

async function fetchAttPayments() {
  const res = await fetch(`${API}/payments/?month=${selectedAttMonth.value}`);
  attPayments.value = await res.json();
}

async function fetchHistoryPayments() {
  if (!historyTeacherId.value) return;
  loadingHistory.value = true;
  try {
    const url = `${API}/payments/?month=${historyMonth.value}&teacher_id=${historyTeacherId.value}`;
    const res = await fetch(url);
    historyPayments.value = await res.json();
  } finally {
    loadingHistory.value = false;
  }
}

onMounted(async () => {
  await Promise.all([fetchTeachers(), fetchStagePrices()]);
  await fetchPayments();
  await fetchAttPayments();
});

watch(activeTab, (tab) => {
  if (tab === "history" && historyTeacherId.value) {
    fetchHistoryPayments();
  }
});

watch([historyTeacherId, historyMonth], () => {
  if (activeTab.value === "history" && historyTeacherId.value) {
    fetchHistoryPayments();
  }
});

watch(selectedAttMonth, async () => {
  await fetchAttPayments();
  if (selectedStudent.value) {
    selectStudentForAtt(selectedStudent.value);
  }
});

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
    body: JSON.stringify({
      is_paid: !payment.is_paid,
      amount_due: payment.amount_due,
    }),
  });
  const data = await res.json();
  payment.is_paid = data.is_paid;
  if (data.amount_due !== undefined) {
    payment.amount_due = data.amount_due;
  }
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

const historyTotalAmount = computed(() =>
  historyPayments.value.reduce((a, b) => a + b.amount_due, 0),
);
const historyPaidAmount = computed(() =>
  historyPayments.value
    .filter((p) => p.is_paid)
    .reduce((a, b) => a + b.amount_due, 0),
);
const historyUnpaidAmount = computed(
  () => historyTotalAmount.value - historyPaidAmount.value,
);

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
    const res = await fetch(
      `${API}/student-attendance/${student.id}/?month=${selectedAttMonth.value}`,
    );
    studentMonthAttendance.value = await res.json();
  } finally {
    loadingAtt.value = false;
  }
}

function getStudentPaymentForAtt(studentId) {
  return attPayments.value.find(
    (p) => p.student_id === studentId && p.month === selectedAttMonth.value,
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

function addMarkError(...fields) {
  fields.forEach((f) => addErrorFields.value.add(f));
  setTimeout(() => fields.forEach((f) => addErrorFields.value.delete(f)), 1500);
}

function addHasError(field) {
  return addErrorFields.value.has(field);
}

function resetStudentForm() {
  studentForm.value = {
    name: "",
    surname: "",
    phone: "",
    password: "",
    teacher_id: "",
    schedule: "odd",
  };
}

function resetTeacherForm() {
  teacherForm.value = { name: "", phone: "" };
}

function switchAddTab(tab) {
  addTab.value = tab;
  addErrorFields.value.clear();
  addNetworkError.value = false;
  addSuccessMsg.value = "";
}

async function addApiFetch(path, options = {}) {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const data = await res.json();
    addNetworkError.value = false;
    return { ok: res.ok, data };
  } catch {
    addNetworkError.value = true;
    throw new Error("network");
  }
}

async function submitStudent() {
  const required = ["name", "surname", "phone", "password", "teacher_id"];
  const missing = required.filter((f) => !studentForm.value[f]);
  if (missing.length) {
    addMarkError(...missing);
    return;
  }

  addLoading.value = true;
  try {
    const { ok, data } = await addApiFetch("/register/", {
      method: "POST",
      body: JSON.stringify({
        name: studentForm.value.name,
        surname: studentForm.value.surname,
        phone: normalizePhone(studentForm.value.phone),
        password: studentForm.value.password,
        teacher_id: Number(studentForm.value.teacher_id),
        schedule: studentForm.value.schedule,
      }),
    });
    if (!ok) {
      alert(data.error || "Xatolik yuz berdi");
      return;
    }
    addSuccessMsg.value = `${studentForm.value.name} ${studentForm.value.surname} muvaffaqiyatli qo'shildi`;
    resetStudentForm();
    setTimeout(() => (addSuccessMsg.value = ""), 3000);
  } catch {
    // addNetworkError ko'rsatiladi
  } finally {
    addLoading.value = false;
  }
}

async function submitTeacher() {
  const required = ["name", "phone"];
  const missing = required.filter((f) => !teacherForm.value[f]);

  if (missing.length) {
    addMarkError(...missing);
    return;
  }

  addLoading.value = true;
  try {
    const payload = {
      name: teacherForm.value.name,
      phone: normalizePhone(teacherForm.value.phone),
      // password jo'natmayabmiz - backend ADMIN_PASSWORD ishlatadi
    };

    const { ok, data } = await addApiFetch("/teachers/create/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!ok) {
      alert(data.error || "Xatolik yuz berdi");
      return;
    }

    // ✅ Parolni ko'rsatish
    alert(
      `✅ ${teacherForm.value.name} o'qituvchi qo'shildi!\n\n` +
        `📱 Telefon: ${normalizePhone(teacherForm.value.phone)}\n` +
        `🔐 Parol: excel2024\n\n` +
        `Login qilish uchun bu ma'lumotlarni ishlating.`,
    );

    addSuccessMsg.value = `${teacherForm.value.name} o'qituvchi sifatida qo'shildi ✓`;
    resetTeacherForm();
    await fetchTeachers();
    setTimeout(() => (addSuccessMsg.value = ""), 3000);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    addLoading.value = false;
  }
}

const inputClass = (field) => [
  "w-full px-3 py-2.5 rounded-xl border outline-none transition text-sm",
  addHasError(field)
    ? "border-red-300 bg-red-50"
    : "border-gray-200 focus:border-gray-400",
];
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
          { key: 'history', label: '📊 Tarix' },
          { key: 'attendance', label: '📋 Davomat' },
          { key: 'add', label: '👤 Qo\'shish' },
          { key: 'mahsulotlar', label: 'mahsulotlar' },
          { key: 'orders', label: '📦 Buyurtmalar' },
          { key: 'settings', label: '⚙️ Coin Settings' },
        ]"
        :key="tab.key"
        @click="activeTab = tab.key"
        :class="[
          'cursor-pointer px-4 py-2 rounded-full text-sm border transition whitespace-nowrap',
          activeTab === tab.key
            ? 'bg-gray-900 text-white border-gray-900'
            : 'border-gray-200 text-gray-500 hover:bg-gray-50',
        ]"
      >
        {{ tab.label }}
      </button>
      <router-link
        class="px-4 py-2 rounded-full text-sm border transition whitespace-nowrap border-gray-200 text-gray-500 hover:bg-gray-50"
        to="/finance"
        >💵 Moliya</router-link
      >
    </div>

    <!-- ══════════ TO'LOVLAR ══════════ -->
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

    <!-- ══════════ TARIX ══════════ -->
    <div v-if="activeTab === 'history'">
      <div class="flex flex-wrap gap-3 mb-5">
        <div>
          <label class="block text-xs text-gray-400 mb-1">O'qituvchi</label>
          <select
            v-model="historyTeacherId"
            class="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none min-w-[160px]"
          >
            <option value="">— Tanlang —</option>
            <option v-for="t in teachers" :key="t.id" :value="t.id">
              {{ t.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">Oy</label>
          <input
            type="month"
            v-model="historyMonth"
            class="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none"
          />
        </div>
        <div class="flex items-end">
          <button
            @click="fetchHistoryPayments"
            :disabled="!historyTeacherId || loadingHistory"
            class="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-700 transition disabled:opacity-40"
          >
            {{ loadingHistory ? "Yuklanmoqda..." : "Ko'rish" }}
          </button>
        </div>
      </div>

      <div v-if="!historyTeacherId" class="text-center py-16 text-gray-400">
        <p class="text-sm">O'qituvchini tanlang</p>
      </div>

      <template v-else>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div class="bg-gray-100 rounded-xl p-4">
            <p class="text-xs text-gray-500 mb-1">Jami</p>
            <p class="text-xl font-semibold">{{ money(historyTotalAmount) }}</p>
            <p class="text-xs text-gray-400 mt-1">
              {{ historyPayments.length }} o'quvchi
            </p>
          </div>
          <div class="bg-green-50 rounded-xl p-4">
            <p class="text-xs text-green-600 mb-1">To'langan</p>
            <p class="text-xl font-semibold text-green-700">
              {{ money(historyPaidAmount) }}
            </p>
            <p class="text-xs text-green-500 mt-1">
              {{ historyPayments.filter((p) => p.is_paid).length }} o'quvchi
            </p>
          </div>
          <div class="bg-red-50 rounded-xl p-4">
            <p class="text-xs text-red-500 mb-1">Qolgan</p>
            <p class="text-xl font-semibold text-red-600">
              {{ money(historyUnpaidAmount) }}
            </p>
            <p class="text-xs text-red-400 mt-1">
              {{ historyPayments.filter((p) => !p.is_paid).length }} o'quvchi
            </p>
          </div>
        </div>

        <div v-if="loadingHistory" class="text-center py-8 text-gray-400">
          Yuklanmoqda...
        </div>
        <div v-else class="border border-gray-100 rounded-2xl overflow-x-auto">
          <table class="w-full text-sm min-w-[500px]">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th
                  class="text-left px-4 py-3 text-xs text-gray-400 font-medium"
                >
                  #
                </th>
                <th
                  class="text-left px-4 py-3 text-xs text-gray-400 font-medium"
                >
                  Student
                </th>
                <th
                  class="text-left px-4 py-3 text-xs text-gray-400 font-medium"
                >
                  Etap
                </th>
                <th
                  class="text-left px-4 py-3 text-xs text-gray-400 font-medium"
                >
                  Summa
                </th>
                <th
                  class="text-left px-4 py-3 text-xs text-gray-400 font-medium"
                >
                  Holat
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(payment, idx) in historyPayments"
                :key="payment.id"
                class="border-b border-gray-50 hover:bg-gray-50 transition"
              >
                <td class="px-4 py-3 text-gray-400 text-xs">{{ idx + 1 }}</td>
                <td class="px-4 py-3">
                  <p class="font-medium">{{ payment.student_name }}</p>
                  <p class="text-xs text-gray-400">
                    {{ payment.student_phone }}
                  </p>
                </td>
                <td class="px-4 py-3 text-gray-500">
                  {{ payment.stage }}-etap
                </td>
                <td class="px-4 py-3 font-medium">
                  {{ money(payment.amount_due) }}
                </td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'px-2.5 py-1 rounded-full text-xs font-medium',
                      payment.is_paid
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600',
                    ]"
                  >
                    {{ payment.is_paid ? "✓ To'langan" : "✗ To'lanmagan" }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
          <p
            v-if="historyPayments.length === 0"
            class="text-center py-8 text-gray-400 text-sm"
          >
            Bu oy uchun to'lovlar yo'q.
          </p>
        </div>
      </template>
    </div>

    <!-- ══════════ DAVOMAT ══════════ -->
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

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- O'qituvchilar -->
        <div class="space-y-2">
          <h3
            class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2"
          >
            O'qituvchilar
          </h3>
          <p v-if="teachers.length === 0" class="text-sm text-gray-400 py-4">
            Yuklanmoqda...
          </p>
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
          <p v-if="!selectedTeacherForAtt" class="text-sm text-gray-400 py-4">
            O'qituvchi tanlang
          </p>
          <p v-else-if="loadingAtt" class="text-sm text-gray-400 py-4">
            Yuklanmoqda...
          </p>
          <template v-else>
            <div
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
                  v-if="getStudentPaymentForAtt(student.id)"
                  :class="[
                    'text-xs px-2 py-0.5 rounded-full',
                    getStudentPaymentForAtt(student.id)?.is_paid
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-500',
                  ]"
                >
                  {{ getStudentPaymentForAtt(student.id)?.is_paid ? "✓" : "✗" }}
                </span>
              </div>
            </div>
            <p
              v-if="attStudents.length === 0"
              class="text-sm text-gray-400 py-4"
            >
              O'quvchi yo'q
            </p>
          </template>
        </div>

        <!-- Davomat -->
        <div>
          <h3
            class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2"
          >
            {{
              selectedStudent ? selectedStudent.name + " davomati" : "Davomat"
            }}
          </h3>
          <p v-if="!selectedStudent" class="text-sm text-gray-400 py-4">
            O'quvchi tanlang
          </p>
          <p v-else-if="loadingAtt" class="text-sm text-gray-400 py-4">
            Yuklanmoqda...
          </p>
          <div v-else class="space-y-1.5">
            <div
              v-if="getStudentPaymentForAtt(selectedStudent.id)"
              :class="[
                'rounded-xl p-3 mb-3',
                getStudentPaymentForAtt(selectedStudent.id)?.is_paid
                  ? 'bg-green-50 border border-green-100'
                  : 'bg-red-50 border border-red-100',
              ]"
            >
              <p
                class="text-xs font-medium"
                :class="
                  getStudentPaymentForAtt(selectedStudent.id)?.is_paid
                    ? 'text-green-700'
                    : 'text-red-600'
                "
              >
                {{
                  getStudentPaymentForAtt(selectedStudent.id)?.is_paid
                    ? "✓ To'lov qilingan"
                    : "✗ To'lov qilinmagan"
                }}
              </p>
              <p class="text-sm font-semibold mt-0.5">
                {{
                  money(
                    getStudentPaymentForAtt(selectedStudent.id)?.amount_due ||
                      0,
                  )
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

    <!-- ══════════ QO'SHISH ══════════ -->
    <div v-if="activeTab === 'add'">
      <div class="flex gap-2 mb-6">
        <button
          @click="switchAddTab('student')"
          :class="[
            'px-4 py-2 rounded-xl text-sm border transition cursor-pointer',
            addTab === 'student'
              ? 'bg-gray-900 text-white border-gray-900'
              : 'border-gray-200 text-gray-500 hover:bg-gray-50',
          ]"
        >
          🎓 Student
        </button>
        <button
          @click="switchAddTab('teacher')"
          :class="[
            'px-4 py-2 rounded-xl text-sm border transition cursor-pointer',
            addTab === 'teacher'
              ? 'bg-gray-900 text-white border-gray-900'
              : 'border-gray-200 text-gray-500 hover:bg-gray-50',
          ]"
        >
          👤 O'qituvchi
        </button>
      </div>

      <div
        v-if="addNetworkError"
        class="max-w-[420px] mb-4 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2"
      >
        <span class="text-red-400">⚠</span>
        <div>
          <p class="text-xs font-medium text-red-600">Internet aloqasi yo'q</p>
          <p class="text-xs text-red-400">
            Tarmoqni tekshirib qayta urinib ko'ring
          </p>
        </div>
        <button
          @click="addNetworkError = false"
          class="ml-auto text-red-300 hover:text-red-500 text-lg leading-none cursor-pointer"
        >
          ×
        </button>
      </div>

      <div
        v-if="addSuccessMsg"
        class="max-w-[420px] mb-4 px-3 py-2.5 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2"
      >
        <span class="text-green-500">✓</span>
        <p class="text-xs font-medium text-green-700">{{ addSuccessMsg }}</p>
      </div>

      <!-- STUDENT FORM -->
      <div
        v-if="addTab === 'student'"
        class="max-w-[420px] flex flex-col gap-4"
      >
        <div>
          <label class="block text-xs text-gray-400 mb-1.5">Ism</label>
          <input
            type="text"
            v-model="studentForm.name"
            placeholder="Ismingiz"
            :class="inputClass('name')"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1.5">Familiya</label>
          <input
            type="text"
            v-model="studentForm.surname"
            placeholder="Familiyangiz"
            :class="inputClass('surname')"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1.5">Telefon</label>
          <input
            type="tel"
            v-model="studentForm.phone"
            placeholder="+998 90 000 00 00"
            :class="inputClass('phone')"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1.5">O'qituvchi</label>
          <select
            v-model="studentForm.teacher_id"
            :class="inputClass('teacher_id')"
          >
            <option value="">Tanlang</option>
            <option v-for="t in teachers" :key="t.id" :value="t.id">
              {{ t.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1.5">Dars kuni</label>
          <div class="flex gap-2">
            <button
              type="button"
              @click="studentForm.schedule = 'odd'"
              :class="[
                'flex-1 py-2 rounded-xl text-sm border transition cursor-pointer',
                studentForm.schedule === 'odd'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50',
              ]"
            >
              Du / Chor / Juma
            </button>
            <button
              type="button"
              @click="studentForm.schedule = 'even'"
              :class="[
                'flex-1 py-2 rounded-xl text-sm border transition cursor-pointer',
                studentForm.schedule === 'even'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50',
              ]"
            >
              Se / Pay / Shan
            </button>
          </div>
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1.5">Parol</label>
          <input
            type="password"
            v-model="studentForm.password"
            @keyup.enter="submitStudent"
            placeholder="••••••••"
            :class="inputClass('password')"
          />
        </div>
        <button
          @click="submitStudent"
          :disabled="addLoading"
          class="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-700 transition cursor-pointer disabled:opacity-50"
        >
          {{ addLoading ? "Saqlanmoqda..." : "Student qo'shish" }}
        </button>
      </div>

      <!-- TEACHER FORM -->
      <div
        v-if="addTab === 'teacher'"
        class="max-w-[420px] flex flex-col gap-4"
      >
        <div>
          <label class="block text-xs text-gray-400 mb-1.5">Ism</label>
          <input
            type="text"
            v-model="teacherForm.name"
            placeholder="O'qituvchi ismi"
            :class="inputClass('name')"
          />
        </div>

        <div>
          <label class="block text-xs text-gray-400 mb-1.5">Telefon</label>
          <input
            type="tel"
            v-model="teacherForm.phone"
            placeholder="+998 90 000 00 00"
            :class="inputClass('phone')"
          />
        </div>

        <button
          @click="submitTeacher"
          :disabled="addLoading"
          class="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-700 transition cursor-pointer disabled:opacity-50"
        >
          {{ addLoading ? "Saqlanmoqda..." : "O'qituvchi qo'shish" }}
        </button>
      </div>
    </div>

    <div class="" v-if="activeTab === 'mahsulotlar'">
      <AdminProducts />
    </div>
    <div class="" v-if="activeTab === 'orders'">
      <Adminorders />
    </div>
    <div class="" v-if="activeTab === 'settings'">
      <Coin_settings />
    </div>
  </div>
</template>
