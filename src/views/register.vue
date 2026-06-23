<script setup>
import { reactive, ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useUiStore } from "../stores/uiStore";

// ─── Constants ────────────────────────────────────────────────
const API              = "https://itline-django-9s85.onrender.com/api";
const ADMIN_PASSWORD   = "excel2024";
const EXCELLENCE_PASSWORD = "excellence2024";

// ─── Setup ────────────────────────────────────────────────────
const router = useRouter();
const ui     = useUiStore();

// ─── State ────────────────────────────────────────────────────
const teachers     = ref([]);
const phoneChecked = ref(false);
const isNew        = ref(false);
const wrongPass    = ref(false);
const errorFields  = ref(new Set());
const networkError = ref(false);

const form = reactive({
  name:      "",
  surname:   "",
  phone:     "",
  teacher_id: "",
  password:  "",
  schedule:  "odd",
});

// ─── Computed ─────────────────────────────────────────────────
const isAdmin      = computed(() => form.password === ADMIN_PASSWORD);
const isExcellence = computed(() => form.password === EXCELLENCE_PASSWORD);
const isSpecial    = computed(() => isAdmin.value || isExcellence.value);

// ─── Helpers ──────────────────────────────────────────────────
function redirectUser(user) {
  if (user.is_excellence) router.push("/excellence");
  else if (user.is_admin)  router.push("/admin");
  else                     router.push("/students");
}

function buildUserPayload(result) {
  return {
    id:           result.id,
    name:         result.name,
    surname:      result.surname,
    phone:        result.phone,
    teacher_id:   result.teacher_id   ?? null,
    is_admin:     result.is_admin     ?? false,
    is_excellence: result.is_excellence ?? false,
  };
}

/** Maydonni xato holatiga tushiradi, 1.5s dan keyin tozalaydi */
function markError(...fields) {
  fields.forEach((f) => errorFields.value.add(f));
  setTimeout(() => {
    fields.forEach((f) => errorFields.value.delete(f));
  }, 1500);
}

function hasError(field) {
  return errorFields.value.has(field);
}

// ─── API ──────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    const data = await res.json();
    networkError.value = false;
    return { ok: res.ok, data };
  } catch (e) {
    // TypeError: Failed to fetch — internet yo'q yoki server yetib bo'lmaydi
    networkError.value = true;
    throw e;
  }
}

async function fetchTeachers() {
  try {
    const { data } = await apiFetch("/teachers/");
    teachers.value = data;
  } catch {
    // networkError.value allaqachon true — template ko'rsatadi
  }
}

// ─── Phone debounce ───────────────────────────────────────────
let debounceTimer = null;

function onPhoneInput() {
  clearTimeout(debounceTimer);
  phoneChecked.value = false;
  isNew.value        = false;
  wrongPass.value    = false;
  form.password      = "";
  errorFields.value.clear();

  if (form.phone.length >= 9) {
    debounceTimer = setTimeout(checkPhone, 500);
  }
}

async function checkPhone() {
  ui.start();
  try {
    const { data } = await apiFetch("/login/", {
      method: "POST",
      body: JSON.stringify({ phone: form.phone, password: null }),
    });
    phoneChecked.value = true;
    isNew.value        = !data.exists;
  } catch {
    // networkError.value allaqachon true
  } finally {
    ui.stop();
  }
}

// ─── Login ────────────────────────────────────────────────────
async function submitLogin() {
  if (!form.password) { markError("password"); return; }

  ui.start();
  try {
    const { ok, data } = await apiFetch("/login/", {
      method: "POST",
      body: JSON.stringify({ phone: form.phone, password: form.password }),
    });

    if (ok && data.exists) {
      const user = buildUserPayload(data);
      localStorage.setItem("user", JSON.stringify(user));
      redirectUser(user);
    } else {
      wrongPass.value = true;
      setTimeout(() => (wrongPass.value = false), 2000);
    }
  } catch {
    // networkError.value allaqachon true
  } finally {
    ui.stop();
  }
}

// ─── Register ─────────────────────────────────────────────────
async function submitRegister() {
  // Validatsiya
  const required = ["name", "phone", "password"];
  if (!isSpecial.value) required.push("surname", "teacher_id");

  const missing = required.filter((f) => !form[f]);
  if (missing.length) { markError(...missing); return; }

  ui.start();
  try {
    const payload = {
      name:     form.name,
      phone:    form.phone,
      password: form.password,
    };

    if (isAdmin.value)           payload.admin_password      = form.password;
    else if (isExcellence.value) payload.excellence_password = form.password;
    else {
      payload.surname    = form.surname;
      payload.teacher_id = Number(form.teacher_id);
      payload.schedule   = form.schedule;
    }

    const { ok, data } = await apiFetch("/register/", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!ok) { alert(data.error || "Xatolik yuz berdi"); return; }

    const user = buildUserPayload(data);
    localStorage.setItem("user", JSON.stringify(user));
    redirectUser(user);
  } catch {
    // networkError.value allaqachon true
  } finally {
    ui.stop();
  }
}

// ─── Lifecycle ────────────────────────────────────────────────
onMounted(async () => {
  const stored = localStorage.getItem("user");
  if (stored) { redirectUser(JSON.parse(stored)); return; }
  await fetchTeachers();
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-[360px] bg-white border border-gray-100 rounded-2xl overflow-hidden mx-4">

      <!-- HEADER -->
      <div class="p-8 pb-6">
        <div class="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center mb-5">
          <span class="text-white text-sm font-medium">IT</span>
        </div>
        <h1 class="text-xl font-semibold text-gray-900 mb-1">
          {{ isNew ? "Ro'yxatdan o'tish" : "Kirish" }}
        </h1>
        <p class="text-sm text-gray-400">
          {{ isNew ? "Ma'lumotlaringizni kiriting" : "Telefon raqamingizni kiriting" }}
        </p>
      </div>

      <!-- NETWORK ERROR BANNER -->
      <div
        v-if="networkError"
        class="mx-8 mb-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2">
        <span class="text-red-400 text-base">⚠</span>
        <div>
          <p class="text-xs font-medium text-red-600">Internet aloqasi yo'q</p>
          <p class="text-xs text-red-400">Tarmoqni tekshirib qayta urinib ko'ring</p>
        </div>
        <button
          @click="networkError = false"
          class="ml-auto text-red-300 hover:text-red-500 text-lg leading-none cursor-pointer">
          ×
        </button>
      </div>

      <!-- BODY -->
      <div class="px-8 pb-8 flex flex-col gap-4">

        <!-- PHONE -->
        <div>
          <label class="block text-xs text-gray-400 mb-1.5">Telefon</label>
          <input
            type="tel"
            v-model="form.phone"
            @input="onPhoneInput"
            @keyup.enter="checkPhone"
            placeholder="+998 90 000 00 00"
            :class="[
              'w-full px-3 py-2.5 rounded-xl border outline-none transition text-sm',
              hasError('phone') ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-gray-400',
            ]" />
        </div>

        <!-- LOGIN (mavjud foydalanuvchi) -->
        <template v-if="phoneChecked && !isNew">
          <div>
            <label class="block text-xs text-gray-400 mb-1.5">Parol</label>
            <input
              type="password"
              v-model="form.password"
              @keyup.enter="submitLogin"
              placeholder="••••••••"
              :class="[
                'w-full px-3 py-2.5 rounded-xl border outline-none transition text-sm',
                wrongPass || hasError('password') ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-gray-400',
              ]" />
            <p v-if="wrongPass" class="text-xs text-red-400 mt-1.5">Parol noto'g'ri</p>
          </div>
          <button
            @click="submitLogin"
            class="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-700 transition cursor-pointer">
            Kirish
          </button>
        </template>

        <!-- REGISTER (yangi foydalanuvchi) -->
        <template v-if="isNew">
          <div class="border-t border-gray-100 pt-4 flex flex-col gap-4">

            <!-- Ism -->
            <div>
              <label class="block text-xs text-gray-400 mb-1.5">Ism</label>
              <input
                type="text"
                v-model="form.name"
                placeholder="Ismingiz"
                :class="[
                  'w-full px-3 py-2.5 rounded-xl border outline-none transition text-sm',
                  hasError('name') ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-gray-400',
                ]" />
            </div>

            <!-- Familiya + Teacher + Jadval (oddiy foydalanuvchi uchun) -->
            <template v-if="!isSpecial">
              <div>
                <label class="block text-xs text-gray-400 mb-1.5">Familiya</label>
                <input
                  type="text"
                  v-model="form.surname"
                  placeholder="Familiyangiz"
                  :class="[
                    'w-full px-3 py-2.5 rounded-xl border outline-none transition text-sm',
                    hasError('surname') ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-gray-400',
                  ]" />
              </div>

              <div>
                <label class="block text-xs text-gray-400 mb-1.5">O'qituvchi</label>
                <select
                  v-model="form.teacher_id"
                  :class="[
                    'w-full px-3 py-2.5 rounded-xl border outline-none transition text-sm',
                    hasError('teacher_id') ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-gray-400',
                  ]">
                  <option value="">Tanlang</option>
                  <option v-for="t in teachers" :key="t.id" :value="t.id">{{ t.name }}</option>
                </select>
              </div>

              <div>
                <label class="block text-xs text-gray-400 mb-1.5">Dars kuni</label>
                <div class="flex gap-2">
                  <button
                    type="button"
                    @click="form.schedule = 'odd'"
                    :class="[
                      'flex-1 py-2 rounded-xl text-sm border transition cursor-pointer',
                      form.schedule === 'odd'
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50',
                    ]">
                    Du / Chor / Juma
                  </button>
                  <button
                    type="button"
                    @click="form.schedule = 'even'"
                    :class="[
                      'flex-1 py-2 rounded-xl text-sm border transition cursor-pointer',
                      form.schedule === 'even'
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50',
                    ]">
                    Se / Pay / Shan
                  </button>
                </div>
              </div>
            </template>

            <!-- Parol -->
            <div>
              <label class="block text-xs text-gray-400 mb-1.5">Parol</label>
              <input
                type="password"
                v-model="form.password"
                @keyup.enter="submitRegister"
                placeholder="••••••••"
                :class="[
                  'w-full px-3 py-2.5 rounded-xl border outline-none transition text-sm',
                  hasError('password') ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-gray-400',
                ]" />

              <!-- Admin/Excellence badge -->
              <p v-if="isAdmin" class="text-xs text-blue-500 mt-1.5">Admin sifatida ro'yxatdan o'tilmoqda</p>
              <p v-else-if="isExcellence" class="text-xs text-purple-500 mt-1.5">Excellence sifatida ro'yxatdan o'tilmoqda</p>
            </div>

            <button
              @click="submitRegister"
              class="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-700 transition cursor-pointer">
              Ro'yxatdan o'tish
            </button>
          </div>
        </template>

        <!-- INITIAL (telefon kiritilmagan) -->
        <template v-if="!phoneChecked">
          <button
            @click="checkPhone"
            class="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm hover:bg-gray-700 transition cursor-pointer">
            Davom etish
          </button>
        </template>

      </div>
    </div>
  </div>
</template>