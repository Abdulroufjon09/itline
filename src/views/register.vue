<script setup>
import { reactive, ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useUiStore } from "../stores/uiStore";
<<<<<<< HEAD

const router = useRouter();
const API = "https://itline-django-9s85.onrender.com/api";
=======
import { useCoinStore } from "../stores/coinStore";

const Alerts = defineAsyncComponent(() => import("../components/Alerts.vue"));
const Leaderboard = defineAsyncComponent(
  () => import("../components/Leaderboard.vue"),
);
const ManagerPanel = defineAsyncComponent(
  () => import("../components/ManagerPanel.vue"),
);
const AddLesson = defineAsyncComponent(
  () => import("../components/AddLesson.vue"),
);

const router = useRouter();
const API = "https://itline-django.onrender.com/api";
>>>>>>> 2f325a63d78006016bc31b3b9ec93f6bda91bf20
const ui = useUiStore();

const ADMIN_PASSWORD = "excel2024";
const EXCELLENCE_PASSWORD = "excellence2024";

const teachers = ref([]);
const phoneChecked = ref(false);
const isNew = ref(false);
const wrongPassword = ref(false);
const errorStyle = ref(false);

const formData = reactive({
  name: "",
  surname: "",
  phone: "",
  teacher_id: "",
  password: "",
  schedule: "odd",
});

const isAdminPassword = computed(() => formData.password === ADMIN_PASSWORD);
const isExcellencePassword = computed(
  () => formData.password === EXCELLENCE_PASSWORD,
);
const isSpecialPassword = computed(
  () => isAdminPassword.value || isExcellencePassword.value,
);

function redirectUser(user) {
  if (user.is_excellence) router.push("/excellence");
  else if (user.is_admin) router.push("/admin");
  else router.push("/students");
}

onMounted(async () => {
  const user = localStorage.getItem("user");
  if (user) {
    redirectUser(JSON.parse(user));
    return;
  }
<<<<<<< HEAD
  await fetchTeachers();
});

async function fetchTeachers() {
  try {
    const res = await fetch(`${API}/teachers/`);
    teachers.value = await res.json();
  } catch (e) {
    console.error(e);
=======

  const coins = useCoinStore();
  // fetch teachers and users in parallel to speed up load
  await Promise.allSettled([fetchTeachers(), coins.fetchUsers()]);
  // prefetch lazy components in background to speed subsequent render
  setTimeout(() => {
    import("../components/Leaderboard.vue");
    import("../components/ManagerPanel.vue");
    import("../components/AddLesson.vue");
  }, 500);
});

const currentUser = ref(JSON.parse(localStorage.getItem("user") || "null"));
const isManagerView = computed(
  () =>
    !!(
      currentUser.value &&
      (currentUser.value.is_admin || currentUser.value.role === "manager")
    ),
);

// ─────────────────────────────
// FETCH TEACHERS
// ─────────────────────────────

async function fetchTeachers() {
  try {
    const res = await fetch(`${API}/teachers/`);
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error("fetchTeachers failed", res.status, t);
      window.dispatchEvent(
        new CustomEvent("app-alert", {
          detail: {
            type: "error",
            message: `Teachers fetch failed: ${res.status}`,
          },
        }),
      );
      return;
    }
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      const t = await res.text().catch(() => "");
      console.error("fetchTeachers non-json", t);
      window.dispatchEvent(
        new CustomEvent("app-alert", {
          detail: { type: "error", message: "Teachers response not JSON" },
        }),
      );
      return;
    }
    teachers.value = await res.json();
  } catch (e) {
    console.error(e);
    window.dispatchEvent(
      new CustomEvent("app-alert", {
        detail: { type: "error", message: "Teachers fetch error" },
      }),
    );
>>>>>>> 2f325a63d78006016bc31b3b9ec93f6bda91bf20
  }
}

let debounce = null;
function onPhoneInput() {
  clearTimeout(debounce);
  phoneChecked.value = false;
  isNew.value = false;
  wrongPassword.value = false;
  formData.password = "";
  if (formData.phone.length >= 9) debounce = setTimeout(checkPhone, 500);
}

async function checkPhone() {
  ui.start();
  try {
    const res = await fetch(`${API}/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: formData.phone, password: null }),
    });
<<<<<<< HEAD
=======

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error("checkPhone failed", res.status, t);
      window.dispatchEvent(
        new CustomEvent("app-alert", {
          detail: {
            type: "error",
            message: `Phone check failed: ${res.status}`,
          },
        }),
      );
      return;
    }
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      const t = await res.text().catch(() => "");
      console.error("checkPhone non-json", t);
      window.dispatchEvent(
        new CustomEvent("app-alert", {
          detail: { type: "error", message: "Phone check invalid response" },
        }),
      );
      return;
    }
>>>>>>> 2f325a63d78006016bc31b3b9ec93f6bda91bf20
    const result = await res.json();
    phoneChecked.value = true;
    isNew.value = !result.exists;
  } catch (e) {
    console.error(e);
  } finally {
    ui.stop();
  }
}

async function submitLogin() {
  if (!formData.password) return triggerError();
  ui.start();
  try {
    const res = await fetch(`${API}/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: formData.phone,
        password: formData.password,
      }),
    });
<<<<<<< HEAD
=======

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error("submitLogin failed", res.status, t);
      window.dispatchEvent(
        new CustomEvent("app-alert", {
          detail: { type: "error", message: `Login failed: ${res.status}` },
        }),
      );
      return;
    }
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      const t = await res.text().catch(() => "");
      console.error("submitLogin non-json", t);
      window.dispatchEvent(
        new CustomEvent("app-alert", {
          detail: { type: "error", message: "Login invalid response" },
        }),
      );
      return;
    }
>>>>>>> 2f325a63d78006016bc31b3b9ec93f6bda91bf20
    const result = await res.json();
    if (result.exists) {
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: result.id,
          name: result.name,
          surname: result.surname,
          phone: result.phone,
          teacher_id: result.teacher_id ?? null,
          is_admin: result.is_admin ?? false,
          is_excellence: result.is_excellence ?? false,
        }),
      );
      redirectUser(result);
    } else {
      wrongPassword.value = true;
      setTimeout(() => (wrongPassword.value = false), 2000);
    }
  } catch (e) {
    console.error(e);
  } finally {
    ui.stop();
  }
}

async function submitRegister() {
  const required = ["name", "phone", "password"];
  if (!isSpecialPassword.value) required.push("surname", "teacher_id");
  for (const f of required) {
    if (!formData[f]) {
      triggerError();
      return;
    }
  }

  ui.start();
  try {
    const payload = {
      name: formData.name,
      phone: formData.phone,
      password: formData.password,
    };
<<<<<<< HEAD
    if (isAdminPassword.value) payload.admin_password = formData.password;
    else if (isExcellencePassword.value)
=======
    if (isAdminPassword.value) {
      payload.admin_password = formData.password;
    } else if (isExcellencePassword.value) {
>>>>>>> 2f325a63d78006016bc31b3b9ec93f6bda91bf20
      payload.excellence_password = formData.password;
    else {
      payload.surname = formData.surname;
      payload.teacher_id = Number(formData.teacher_id);
      payload.schedule = formData.schedule;
    }

    const res = await fetch(`${API}/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
<<<<<<< HEAD
=======

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error("submitRegister failed", res.status, t);
      window.dispatchEvent(
        new CustomEvent("app-alert", {
          detail: { type: "error", message: `Register failed: ${res.status}` },
        }),
      );
      return;
    }

    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      const t = await res.text().catch(() => "");
      console.error("submitRegister non-json", t);
      window.dispatchEvent(
        new CustomEvent("app-alert", {
          detail: { type: "error", message: "Register invalid response" },
        }),
      );
      return;
    }

>>>>>>> 2f325a63d78006016bc31b3b9ec93f6bda91bf20
    const result = await res.json();
    if (!res.ok) {
      alert(result.error || "Xatolik");
      return;
    }

    const userData = {
      id: result.id,
      name: result.name,
      surname: result.surname,
      phone: result.phone,
      teacher_id: result.teacher_id ?? null,
      is_admin: result.is_admin ?? false,
      is_excellence: result.is_excellence ?? false,
    };
    localStorage.setItem("user", JSON.stringify(userData));
    redirectUser(userData);
  } catch (e) {
    console.error(e);
  } finally {
    ui.stop();
  }
}

function triggerError() {
  errorStyle.value = true;
  setTimeout(() => (errorStyle.value = false), 1500);
}
</script>

<template>
<<<<<<< HEAD
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div
      class="w-full max-w-[360px] bg-white border border-gray-100 rounded-2xl overflow-hidden mx-4"
    >
=======
  <div
    class="w-full max-w-[360px] bg-white absolute top-40 left-1/2 transform -translate-x-1/2 border border-gray-100 rounded-2xl overflow-hidden mx-4">
    <div
      class="w-[360px] bg-white border border-gray-100 rounded-2xl overflow-hidden">
>>>>>>> 2f325a63d78006016bc31b3b9ec93f6bda91bf20
      <!-- HEADER -->
      <div class="p-8 pb-6">
        <div
          class="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center mb-5">
          <span class="text-white text-sm font-medium">I</span>
          <!-- class="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center mb-5"> -->
          <span class="text-white text-sm font-medium">E</span>
        </div>
        <h1 class="text-xl font-semibold text-gray-900 mb-1">
          {{ isNew ? "Ro'yxatdan o'tish" : "Kirish" }}
        </h1>
        <p class="text-sm text-gray-400">
          {{
            isNew
              ? "Ma'lumotlaringizni kiriting"
              : "Telefon raqamingizni kiriting"
          }}
        </p>
      </div>

      <!-- BODY -->
      <div class="px-8 pb-8 flex flex-col gap-4">
        <!-- PHONE -->
        <div>
          <label class="block text-xs text-gray-400 mb-1.5">Telefon</label>
          <input
            type="tel"
            v-model="formData.phone"
            @input="onPhoneInput"
            placeholder="+998 90 000 00 00"
            :class="[
              'w-full px-3 py-2.5 rounded-xl border outline-none transition text-sm',
              errorStyle && !formData.phone
                ? 'border-red-300 bg-red-50'
                : 'border-gray-200 focus:border-gray-400',
            ]" />
        </div>

        <!-- LOGIN -->
        <template v-if="phoneChecked && !isNew">
          <div>
            <label class="block text-xs text-gray-400 mb-1.5">Parol</label>
            <input
              type="password"
              v-model="formData.password"
              placeholder="••••••••"
              :class="[
                'w-full px-3 py-2.5 rounded-xl border outline-none transition text-sm',
                wrongPassword || (errorStyle && !formData.password)
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-200 focus:border-gray-400',
              ]" />
            <p v-if="wrongPassword" class="text-xs text-red-400 mt-1.5">
              Parol noto'g'ri
            </p>
          </div>
          <button
            @click="submitLogin"
<<<<<<< HEAD
            class="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-700 transition"
          >
            Kirish
=======
            :disabled="loading"
            class="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-700 transition disabled:opacity-50">
            {{ loading ? "Kirilmoqda..." : "Kirish" }}
>>>>>>> 2f325a63d78006016bc31b3b9ec93f6bda91bf20
          </button>
        </template>

        <!-- REGISTER -->
        <template v-if="isNew">
          <div class="border-t border-gray-100 pt-4 flex flex-col gap-4">
            <div>
              <label class="block text-xs text-gray-400 mb-1.5">Ism</label>
              <input
                type="text"
                v-model="formData.name"
                placeholder="Ismingiz"
                class="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-gray-400 text-sm" />
            </div>

            <template v-if="!isSpecialPassword">
              <div>
                <label class="block text-xs text-gray-400 mb-1.5"
                  >Familiya</label
                >
                <input
                  type="text"
                  v-model="formData.surname"
                  placeholder="Familiyangiz"
                  class="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-gray-400 text-sm" />
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1.5"
                  >O'qituvchi</label
                >
                <select
                  v-model="formData.teacher_id"
                  class="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-gray-400 text-sm">
                  <option value="">Tanlang</option>
<<<<<<< HEAD
                  <option v-for="t in teachers" :key="t.id" :value="t.id">
                    {{ t.name }}
=======
                  <option
                    v-for="teacher in teachers"
                    :key="teacher.id"
                    :value="teacher.id">
                    {{ teacher.name }}
>>>>>>> 2f325a63d78006016bc31b3b9ec93f6bda91bf20
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm text-gray-500 mb-1"
                  >Dars kuni</label
                >
                <div class="flex gap-2">
                  <button
                    type="button"
                    @click="formData.schedule = 'odd'"
                    :class="[
                      'flex-1 py-2 rounded-xl text-sm border transition',
                      formData.schedule === 'odd'
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50',
                    ]">
                    Du / Chor / Juma
                  </button>
                  <button
                    type="button"
                    @click="formData.schedule = 'even'"
                    :class="[
                      'flex-1 py-2 rounded-xl text-sm border transition',
                      formData.schedule === 'even'
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50',
                    ]">
                    Se / Pay / Shan
                  </button>
                </div>
              </div>
            </template>

            <div>
              <label class="block text-xs text-gray-400 mb-1.5">Parol</label>
              <input
                type="password"
                v-model="formData.password"
                placeholder="••••••••"
<<<<<<< HEAD
                class="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-gray-400 text-sm"
              />
=======
                class="w-full px-3 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-gray-400 text-sm" />
              <p v-if="passwordHint" class="text-xs text-amber-500 mt-1">
                {{ passwordHint }}
              </p>
>>>>>>> 2f325a63d78006016bc31b3b9ec93f6bda91bf20
            </div>

            <button
              @click="submitRegister"
<<<<<<< HEAD
              class="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-700 transition"
            >
              Ro'yxatdan o'tish
=======
              :disabled="loading"
              class="w-full py-2.5 rounded-xl cursor-pointer bg-gray-900 text-white text-sm hover:bg-gray-700 transition disabled:opacity-50">
              {{ loading ? "Saqlanmoqda..." : "Ro'yxatdan o'tish" }}
>>>>>>> 2f325a63d78006016bc31b3b9ec93f6bda91bf20
            </button>
          </div>
        </template>

        <!-- INITIAL -->
        <template v-if="!phoneChecked">
          <button
            @click="checkPhone"
<<<<<<< HEAD
            class="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-700 transition"
          >
            Davom etish
=======
            :disabled="loading"
            class="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-700 transition disabled:opacity-50">
            {{ loading ? "Tekshirilmoqda..." : "Davom etish" }}
>>>>>>> 2f325a63d78006016bc31b3b9ec93f6bda91bf20
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
