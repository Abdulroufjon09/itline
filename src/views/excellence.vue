<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import AdminProducts from "./AdminProducts.vue";
import Adminorders from "./Adminorders.vue";
import Coin_settings from "./coin_settings.vue";
import DefaultFee from "./DefaultFee.vue";
import { normalizePhone } from "../utils/phone.js";
import Groups from "./groups.vue";
import LessonsPlans from "./LessonsPlans.vue";
import NewsManager from "./NewsManager.vue";

const router = useRouter();
const API = "https://itline-django-9s85.onrender.com/api";

const user = JSON.parse(localStorage.getItem("user") || "null");
if (!user || !user.is_excellence) router.push("/login");

function logout() {
  localStorage.removeItem("user");
  router.push("/login");
}

const activeTab = ref("payments");

const teachers = ref([]);
const stagePrices = ref([]);
const payments = ref([]);
const groups = ref([]);
const courses = ref([]);
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

// ══════════ QO'SHISH (bitta forma, parolga qarab rol avto aniqlanadi) ══════════
const ROLE_PASSWORDS = {
  excellence: "excellence2024",
  admin: "excel2024",
};

const addErrorFields = ref(new Set());
const addNetworkError = ref(false);
const addSuccessMsg = ref("");
const addLoading = ref(false);

const addForm = ref({
  name: "",
  surname: "",
  phone: "",
  password: "",
  teacher_id: "",
  schedule: "odd",
});

// Parolga qarab avto aniqlanadigan rol
const detectedRole = computed(() => {
  const pwd = addForm.value.password;
  if (!pwd) return null;
  if (pwd === ROLE_PASSWORDS.excellence) return "excellence";
  if (pwd === ROLE_PASSWORDS.admin) return "admin";
  return "student";
});

const roleLabel = computed(() => {
  switch (detectedRole.value) {
    case "excellence":
      return "🌟 Manager";
    case "admin":
      return "🛡️ Teacher";
    case "student":
      return "🎓 Student";
    default:
      return null;
  }
});

async function fetchTeachers() {
  try {
    const res = await fetch(`${API}/teachers/`);
    if (!res.ok) {
      const res2 = await fetch(`${API}/teachers/create/`);
      teachers.value = res2.ok ? await res2.json() : [];
      return;
    }
    teachers.value = await res.json();
  } catch (e) {
    console.error("Fetch Teachers Error:", e);
    teachers.value = [];
  }
}

async function fetchStagePrices() {
  try {
    const res = await fetch(`${API}/stage-prices/`);
    if (!res.ok) throw new Error("Bosqich narxlarini yuklashda xatolik");
    stagePrices.value = await res.json();
  } catch (e) {
    console.error("Fetch Stage Prices Error:", e);
    stagePrices.value = [];
  }
}

async function fetchCourses() {
  try {
    const res = await fetch(`${API}/courses/`);
    if (!res.ok) throw new Error("Kurslarni yuklashda xatolik");
    courses.value = await res.json();
  } catch (e) {
    console.error("Fetch Courses Error:", e);
    courses.value = [];
  }
}

async function fetchGroups() {
  try {
    const res = await fetch(`${API}/groups/`);
    if (!res.ok) throw new Error("Guruhlarni yuklashda xatolik");
    groups.value = await res.json();
  } catch (e) {
    console.error("Fetch Groups Error:", e);
    groups.value = [];
  }
}

async function fetchPayments() {
  loading.value = true;
  try {
    let url = `${API}/payments/?month=${selectedMonth.value}`;
    if (selectedTeacherId.value) {
      url += `&teacher_id=${selectedTeacherId.value}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error("To'lovlarni yuklashda xatolik");
    const data = await res.json();
    payments.value = (Array.isArray(data) ? data : []).map((payment) => ({
      ...payment,
      is_checked: Boolean(
        payment.is_checked ??
        payment.is_selected ??
        payment.checked ??
        payment.is_paid,
      ),
      is_paid: Boolean(
        payment.is_paid ??
        payment.is_checked ??
        payment.is_selected ??
        payment.checked,
      ),
    }));
  } catch (e) {
    console.error("Fetch Payments Error:", e);
    payments.value = [];
  } finally {
    loading.value = false;
  }
}

async function fetchAttPayments() {
  try {
    const res = await fetch(`${API}/payments/?month=${selectedAttMonth.value}`);
    if (!res.ok) throw new Error("Davomat to'lovlarini yuklashda xatolik");
    attPayments.value = await res.json();
  } catch (e) {
    console.error("Fetch Attendance Payments Error:", e);
    attPayments.value = [];
  }
}

async function fetchHistoryPayments() {
  if (!historyTeacherId.value) return;
  loadingHistory.value = true;
  try {
    const url = `${API}/payments/?month=${historyMonth.value}&teacher_id=${historyTeacherId.value}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Tarix to'lovlarini yuklashda xatolik");
    historyPayments.value = await res.json();
  } catch (e) {
    console.error("Fetch History Payments Error:", e);
    historyPayments.value = [];
  } finally {
    loadingHistory.value = false;
  }
}

onMounted(async () => {
  await Promise.allSettled([
    fetchTeachers(),
    fetchStagePrices(),
    fetchCourses(),
    fetchGroups(),
  ]);
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

// ══════════ TUZATILDI: status FAQAT checkbox holatiga bog'liq ══════════
async function togglePaid(payment) {
  const shouldBePaid = !payment.is_paid;
  const res = await fetch(`${API}/payments/confirm/${payment.id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      is_paid: shouldBePaid,
      is_checked: shouldBePaid,
      amount_due: payment.amount_due ?? paymentAmountDue(payment),
    }),
  });
  const data = await res.json();
  payment.is_paid = data.is_paid ?? shouldBePaid;
  payment.is_checked = data.is_checked ?? payment.is_paid;
  if (data.amount_due !== undefined) {
    payment.amount_due = data.amount_due;
  }
}

async function updateAmount(payment) {
  await fetch(`${API}/payments/${payment.id}/update/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount_due: payment.amount_due ?? paymentAmountDue(payment),
    }),
  });
}

const totalAmount = computed(() =>
  payments.value.reduce((a, b) => a + Number(paymentAmountDue(b) || 0), 0),
);
// ══════════ TUZATILDI: paidAmount endi bitta manbadan (paymentPaidAmount) hisoblanadi ══════════
const paidAmount = computed(() =>
  payments.value.reduce((a, b) => a + paymentPaidAmount(b), 0),
);
const unpaidAmount = computed(() => totalAmount.value - paidAmount.value);

const historyTotalAmount = computed(() =>
  historyPayments.value.reduce(
    (a, b) => a + Number(paymentAmountDue(b) || 0),
    0,
  ),
);
const historyPaidAmount = computed(() =>
  historyPayments.value.reduce((a, b) => a + paymentPaidAmount(b), 0),
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

function findPaymentGroup(payment) {
  if (!payment) return null;
  if (payment.group && typeof payment.group === "object") return payment.group;
  if (payment.group_id != null) {
    return (
      groups.value.find(
        (g) => g.id === payment.group_id || g.group_id === payment.group_id,
      ) || null
    );
  }

  const phone = normalizePhone(payment.student_phone);
  const name = String(payment.student_name || "")
    .trim()
    .toLowerCase();

  return (
    groups.value.find(
      (g) =>
        Array.isArray(g.students) &&
        g.students.some((s) => {
          if (!s) return false;
          if (s.id != null && s.id === payment.student_id) return true;
          if (phone && normalizePhone(s.phone) === phone) return true;
          if (
            name &&
            `${s.name || ""} ${s.surname || ""}`.trim().toLowerCase() === name
          )
            return true;
          return false;
        }),
    ) || null
  );
}

function getPaymentCourse(payment) {
  if (!payment) return null;
  if (payment.course && typeof payment.course === "object")
    return payment.course;
  if (payment.group?.course && typeof payment.group.course === "object") {
    return payment.group.course;
  }

  const group = findPaymentGroup(payment);
  if (group) {
    if (group.course && typeof group.course === "object") return group.course;
    const courseId =
      group.course || payment.course_id || payment.group?.course_id;
    const courseObj = courses.value.find((c) => c.id === courseId);
    if (courseObj) return courseObj;
    return {
      name: group.course_name || group.name,
      monthly_fee: group.monthly_fee,
      fee: group.monthly_fee,
    };
  }

  const courseId =
    payment.course_id || payment.group?.course_id || payment.group?.course?.id;
  return courses.value.find((c) => c.id === courseId) || null;
}

function courseLabel(payment) {
  const course = getPaymentCourse(payment);
  return (
    payment.course_name ||
    payment.group?.course_name ||
    payment.group_name ||
    course?.name ||
    course?.title ||
    course?.course_name ||
    payment.group?.name ||
    "—"
  );
}

function paymentCourseFee(payment) {
  const course = getPaymentCourse(payment);
  return (
    Number(course?.monthly_fee || course?.price || course?.fee) ||
    payment.monthly_fee ||
    payment.group?.monthly_fee ||
    payment.group?.course?.monthly_fee ||
    payment.group?.course?.fee ||
    0
  );
}

// ══════════ TUZATILDI: 0 qiymatni ham to'g'ri hisoblaydi, is_paid'ga qarab "soxta" summa qo'shmaydi ══════════
function paymentPaidAmount(payment) {
  return (
    Number(
      payment.paid_amount ??
        payment.amount_paid ??
        payment.amount_received ??
        0,
    ) || 0
  );
}

function paymentAmountDue(payment) {
  const course = getPaymentCourse(payment);
  const courseFee =
    Number(course?.monthly_fee ?? course?.price ?? course?.fee) || 0;
  const explicitDue = payment.amount_due;

  if (explicitDue != null && explicitDue !== 0) {
    return explicitDue;
  }
  if (courseFee) {
    return courseFee;
  }
  return (
    payment.monthly_fee ??
    payment.monthly_price ??
    payment.price ??
    payment.amount ??
    payment.group?.monthly_fee ??
    payment.group?.price ??
    payment.group?.amount ??
    payment.group?.course_monthly_fee ??
    payment.group?.course?.monthly_fee ??
    payment.group?.course?.monthly_price ??
    payment.group?.course?.price ??
    payment.group?.course?.fee ??
    payment.course_monthly_fee ??
    payment.course?.monthly_fee ??
    payment.course?.monthly_price ??
    payment.course?.price ??
    payment.course?.fee ??
    (course && typeof course === "object"
      ? (course.monthly_fee ?? course.price ?? course.fee)
      : null) ??
    0
  );
}

// Qolgan = Oylik to'lov (default summa) - hozirgacha to'langan summa
function remainingAmount(payment) {
  const due = Number(paymentAmountDue(payment)) || 0;
  const paid = Number(paymentPaidAmount(payment)) || 0;
  return due - paid;
}
// ✅ YANGI: minus tugmasini bosishni to'sib qo'yadi (klaviaturadan "-" kiritilmasin)
function blockNegativeKey(e) {
  if (e.key === "-" || e.key === "Subtract" || e.key === "NumpadSubtract") {
    e.preventDefault();
  }
}

// ✅ YANGI: agar biror yo'l bilan (masalan, paste orqali) manfiy son kirsa, uni 0 ga tuzatadi
function sanitizePaidAmount(payment) {
  const val = Number(payment.paid_amount);
  if (isNaN(val) || val < 0) {
    payment.paid_amount = 0;
  }
}
// ══════════ TUZATILDI: status FAQAT checkbox (is_checked) holatiga qarab belgilanadi ══════════
async function savePaymentRow(payment) {
  const shouldBePaid = Boolean(payment.is_checked);

  try {
    const res = await fetch(`${API}/payments/confirm/${payment.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        is_paid: shouldBePaid,
        is_checked: shouldBePaid,
        amount_due: payment.amount_due ?? paymentAmountDue(payment),
        paid_amount: payment.paid_amount ?? 0,
      }),
    });

    const data = await res.json().catch(() => ({}));
    payment.is_paid = data.is_paid ?? shouldBePaid;
    payment.is_checked = data.is_checked ?? shouldBePaid;
    payment.paid_amount = data.paid_amount ?? payment.paid_amount;

    if (!res.ok) {
      throw new Error("Confirm endpoint failed");
    }
  } catch (e) {
    try {
      const fallbackRes = await fetch(`${API}/payments/update/${payment.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount_due: payment.amount_due ?? paymentAmountDue(payment),
          paid_amount: payment.paid_amount,
          is_checked: shouldBePaid,
          is_paid: shouldBePaid,
        }),
      });
      const fallbackData = await fallbackRes.json().catch(() => ({}));
      payment.is_paid = fallbackData.is_paid ?? shouldBePaid;
      payment.is_checked = fallbackData.is_checked ?? shouldBePaid;
    } catch (fallbackError) {
      console.error("To'lovni saqlashda xatolik:", fallbackError);
    }
  }
}
function addMarkError(...fields) {
  fields.forEach((f) => addErrorFields.value.add(f));
  setTimeout(() => fields.forEach((f) => addErrorFields.value.delete(f)), 1500);
}

function addHasError(field) {
  return addErrorFields.value.has(field);
}

function resetAddForm() {
  addForm.value = {
    name: "",
    surname: "",
    phone: "",
    password: "",
    teacher_id: "",
    schedule: "odd",
  };
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

async function submitAdd() {
  const role = detectedRole.value;

  if (!role) {
    addMarkError("password");
    return;
  }

  const required =
    role === "student"
      ? ["name", "surname", "phone", "password", "teacher_id"]
      : ["name", "phone", "password"];

  const missing = required.filter((f) => !addForm.value[f]);
  if (missing.length) {
    addMarkError(...missing);
    return;
  }

  let normalizedPhone;
  try {
    normalizedPhone = normalizePhone(addForm.value.phone);
  } catch {
    addMarkError("phone");
    return;
  }

  addLoading.value = true;
  try {
    const payload = {
      name: addForm.value.name,
      surname: addForm.value.surname,
      phone: normalizedPhone,
      password: addForm.value.password,
      admin_password: addForm.value.password,
      excellence_password: addForm.value.password,
    };

    if (role === "student") {
      payload.teacher_id = Number(addForm.value.teacher_id);
      payload.schedule = addForm.value.schedule;
      // ══════════ TUZATILDI: yangi student uchun to'lov statusini eksplisit false qilib yuboramiz ══════════
      payload.is_paid = false;
      payload.is_checked = false;
    }

    const { ok, data } = await addApiFetch("/register/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!ok) {
      alert(data.error || "Xatolik yuz berdi");
      return;
    }

    const roleText =
      role === "excellence"
        ? "Excellence"
        : role === "admin"
          ? "Admin"
          : "Student";
    addSuccessMsg.value = `${addForm.value.name} ${addForm.value.surname} ${roleText} sifatida muvaffaqiyatli qo'shildi`;
    resetAddForm();
    if (role !== "student") await fetchTeachers();
    setTimeout(() => (addSuccessMsg.value = ""), 3000);
  } catch {
    // addNetworkError ko'rsatiladi
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
      <div class="space-y-2">
        <h1 class="flex gap-3 text-xl sm:text-2xl font-sans">
          <span
            ><img
              src="../icon/itline.jpg"
              alt=""
              class="w-10 rounded-full animate-spin"  style="animation-duration: 5s" /></span
          >Itline Panel
        </h1>
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
          { key: 'payments', label: '💳 Payments' },
          { key: 'fee', label: '💼 Courses' },

          { key: 'history', label: '📊 History' },
          { key: 'attendance', label: '📋 Attendance' },
          { key: 'add', label: '👤 Add' },
          { key: 'mahsulotlar', label: ' Products' },
          { key: 'orders', label: '📦 orders' },
          { key: 'settings', label: '⚙️ Coin Settings' },
          { key: 'groups', label: '🗂️ Groups' },
          { key: 'news', label: '📩 News' },
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
        >💵 finance</router-link
      >
      <router-link
        class="px-4 py-2 rounded-full text-sm border transition whitespace-nowrap border-gray-200 text-gray-500 hover:bg-gray-50"
        to="/database"
        >🗄️ Baza</router-link
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
                Kurs
              </th>
              <th class="text-left px-4 py-3 text-xs text-gray-400 font-medium">
                Oylik to'lov
              </th>
              <th class="text-left px-4 py-3 text-xs text-gray-400 font-medium">
                To'langan
              </th>
              <th class="text-left px-4 py-3 text-xs text-gray-400 font-medium">
                Qolgan
              </th>
              <th class="text-left px-4 py-3 text-xs text-gray-400 font-medium">
                Tanlash
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
              <td class="px-4 py-3 text-gray-600">
                {{ courseLabel(payment) }}
              </td>
              <td class="px-4 py-3">{{ money(paymentAmountDue(payment)) }}</td>
              <td class="px-4 py-3">
                <!-- ✅ TUZATILDI: manfiy son kiritib bo'lmaydi -->
                <input
                  type="number"
                  min="0"
                  step="1"
                  v-model.number="payment.paid_amount"
                  @keydown="blockNegativeKey($event)"
                  @input="sanitizePaidAmount(payment)"
                  @change="savePaymentRow(payment)"
                  placeholder="0"
                  class="border border-gray-200 rounded-lg px-2 py-1 w-28 text-sm outline-none focus:border-gray-400"
                />
              </td>
              <td
                class="px-4 py-3 font-medium"
                :class="
                  remainingAmount(payment) > 0
                    ? 'text-red-600'
                    : 'text-green-600'
                "
              >
                {{ remainingAmount(payment) > 0 ? "-" : "+"
                }}{{ money(Math.abs(remainingAmount(payment))) }}
              </td>
              <td class="px-4 py-3">
                <label class="inline-flex items-center cursor-pointer">
                  <!-- ✅ TUZATILDI: summa 0/bo'sh bo'lsa checkbox disabled -->
                  <input
                    type="checkbox"
                    v-model="payment.is_checked"
                    :disabled="
                      !Number(payment.paid_amount) ||
                      Number(payment.paid_amount) <= 0
                    "
                    @change="savePaymentRow(payment)"
                    class="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </label>
              </td>
              <td class="px-4 py-3">
                <span
                  :class="[
                    'px-2.5 py-1 rounded-full text-xs font-medium',
                    payment.is_checked
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600',
                  ]"
                >
                  {{ payment.is_checked ? "To'langan" : "To'lanmagan" }}
                </span>
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
                  Kurs
                </th>
                <th
                  class="text-left px-4 py-3 text-xs text-gray-400 font-medium"
                >
                  Oylik to'lov
                </th>
                <th
                  class="text-left px-4 py-3 text-xs text-gray-400 font-medium"
                >
                  To'langan
                </th>
                <th
                  class="text-left px-4 py-3 text-xs text-gray-400 font-medium"
                >
                  Qolgan
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
                  {{ courseLabel(payment) }}
                </td>
                <td class="px-4 py-3 font-medium">
                  {{ money(paymentAmountDue(payment)) }}
                </td>
                <td class="px-4 py-3 text-gray-700">
                  {{ money(paymentPaidAmount(payment)) }}
                </td>
                <td
                  class="px-4 py-3 font-medium"
                  :class="
                    remainingAmount(payment) > 0
                      ? 'text-red-600'
                      : 'text-green-600'
                  "
                >
                  {{ remainingAmount(payment) > 0 ? "-" : "+"
                  }}{{ money(Math.abs(remainingAmount(payment))) }}
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
                    {{ student.group_name || student.course_name || "" }}
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
                    paymentAmountDue(
                      getStudentPaymentForAtt(selectedStudent.id),
                    ),
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
    <div v-if="activeTab === 'add'" class="max-w-[420px]">
      <div
        v-if="addNetworkError"
        class="mb-4 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2"
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
        class="mb-4 px-3 py-2.5 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2"
      >
        <span class="text-green-500">✓</span>
        <p class="text-xs font-medium text-green-700">{{ addSuccessMsg }}</p>
      </div>

      <div class="flex flex-col gap-4">
        <div>
          <label class="block text-xs text-gray-400 mb-1.5">Ism</label>
          <input
            type="text"
            v-model="addForm.name"
            placeholder="Ism"
            :class="inputClass('name')"
          />
        </div>
        <div v-if="detectedRole === 'student' || !detectedRole">
          <label class="block text-xs text-gray-400 mb-1.5">Familiya</label>
          <input
            type="text"
            v-model="addForm.surname"
            placeholder="Familiyangiz"
            :class="inputClass('surname')"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1.5">Telefon</label>
          <input
            type="tel"
            v-model="addForm.phone"
            placeholder="+998 90 000 00 00"
            :class="inputClass('phone')"
          />
        </div>

        <div>
          <label class="block text-xs text-gray-400 mb-1.5">Parol</label>
          <input
            type="password"
            v-model="addForm.password"
            @keyup.enter="submitAdd"
            placeholder="••••••••"
            :class="inputClass('password')"
          />
          <p v-if="roleLabel" class="text-xs text-gray-400 mt-1.5">
            Aniqlangan rol:
            <span class="font-medium text-gray-600">{{ roleLabel }}</span>
          </p>
        </div>

        <!-- Faqat student uchun: o'qituvchi va dars kuni -->
        <template v-if="detectedRole === 'student'">
          <div>
            <label class="block text-xs text-gray-400 mb-1.5">O'qituvchi</label>
            <select
              v-model="addForm.teacher_id"
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
                @click="addForm.schedule = 'odd'"
                :class="[
                  'flex-1 py-2 rounded-xl text-sm border transition cursor-pointer',
                  addForm.schedule === 'odd'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50',
                ]"
              >
                Du / Chor / Juma
              </button>
              <button
                type="button"
                @click="addForm.schedule = 'even'"
                :class="[
                  'flex-1 py-2 rounded-xl text-sm border transition cursor-pointer',
                  addForm.schedule === 'even'
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50',
                ]"
              >
                Se / Pay / Shan
              </button>
            </div>
          </div>
        </template>

        <button
          @click="submitAdd"
          :disabled="addLoading"
          class="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-700 transition cursor-pointer disabled:opacity-50"
        >
          {{ addLoading ? "Saqlanmoqda..." : "Qo'shish" }}
        </button>
      </div>
    </div>

    <div class="" v-if="activeTab === 'mahsulotlar'">
      <AdminProducts />
    </div>
    <div class="" v-if="activeTab === 'orders'">
      <Adminorders />
    </div>
    <div class="" v-if="activeTab === 'fee'">
      <DefaultFee />
    </div>
    <div class="" v-if="activeTab === 'settings'">
      <Coin_settings />
    </div>
    <div class="" v-if="activeTab === 'news'">
      <NewsManager />
    </div>
    <div v-if="activeTab === 'groups'">
      <Groups />
    </div>
  </div>
</template>
