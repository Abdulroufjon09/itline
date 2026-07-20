<template>
  <div class="min-h-screen bg-slate-50 p-4 sm:p-6 font-sans">
    <ManagerNav
      title="Menejerlar"
      subtitle="Menejer qo'shish, telefon raqamni tahrirlash va o'chirish"
    />

    <!-- ══════════ YANGI MENEJER ══════════ -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4">
      <p class="text-sm font-medium text-slate-700 mb-3">Yangi menejer qo'shish</p>
      <div class="flex flex-col sm:flex-row gap-3">
        <input
          v-model="form.name"
          placeholder="Ism"
          class="flex-1 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-300"
        />
        <input
          v-model="form.surname"
          placeholder="Familiya"
          class="flex-1 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-300"
        />
        <input
          v-model="form.phone"
          placeholder="Telefon"
          class="flex-1 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-300 tabular-nums"
        />
        <input
          v-model="form.password"
          type="password"
          placeholder="Parol"
          class="flex-1 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-300"
        />
        <button
          @click="createManager"
          :disabled="!form.name || !form.phone || !form.password || busy"
          class="px-5 py-2 rounded-lg bg-slate-900 text-white text-sm disabled:opacity-40 hover:bg-slate-800 transition shrink-0"
        >
          <AppIcon name="plus" /> Qo'shish
        </button>
      </div>
    </div>

    <!-- ══════════ RO'YXAT ══════════ -->
    <div
      class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
    >
      <div
        class="p-4 border-b border-slate-100 flex items-center justify-between gap-3"
      >
        <p class="text-sm text-slate-500 tabular-nums">
          {{ managers.length }} ta menejer
        </p>
        <label
          class="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none"
        >
          <input type="checkbox" v-model="showInactive" class="accent-indigo-500" />
          O'chirilganlar ham
        </label>
      </div>

      <div v-if="loading" class="p-16 text-center">
        <AppIcon name="spinner" class="w-7 h-7 text-indigo-400 animate-spin" />
        <p class="text-sm text-slate-400 mt-3">Yuklanmoqda...</p>
      </div>

      <div v-else-if="!managers.length" class="p-16 text-center">
        <p class="text-sm text-slate-400">Menejer yo'q</p>
      </div>

      <div v-else class="divide-y divide-slate-100">
        <div
          v-for="m in managers"
          :key="m.id"
          :class="['p-4', m.is_active ? '' : 'opacity-50']"
        >
          <div class="flex flex-col sm:flex-row sm:items-center gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="font-semibold text-slate-800">
                  {{ m.name }} {{ m.surname }}
                </p>
                <span
                  v-if="!m.is_active"
                  class="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500"
                  >o'chirilgan</span
                >
              </div>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <template v-if="editing === m.id">
                <input
                  v-model="editPhone"
                  class="w-40 border border-indigo-300 rounded-lg px-3 py-1.5 text-sm outline-none tabular-nums"
                  @keyup.enter="savePhone(m)"
                />
                <button
                  @click="savePhone(m)"
                  :disabled="busy"
                  class="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs hover:bg-slate-800 disabled:opacity-40"
                >
                  <AppIcon name="check" /> Saqlash
                </button>
                <button
                  @click="editing = null"
                  class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-400 text-xs hover:bg-slate-50"
                >
                  <AppIcon name="x" />
                </button>
              </template>
              <template v-else>
                <span class="tabular-nums text-sm text-slate-600">{{ m.phone }}</span>
                <button
                  @click="startEdit(m)"
                  class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs hover:bg-slate-50 hover:text-indigo-500 transition"
                >
                  <AppIcon name="edit" /> Tahrirlash
                </button>
                <button
                  v-if="m.is_active"
                  @click="deactivate(m)"
                  class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-400 text-xs hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition"
                >
                  <AppIcon name="trash" />
                </button>
                <button
                  v-else
                  @click="reactivate(m)"
                  class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-400 text-xs hover:bg-emerald-50 hover:text-emerald-600 transition"
                >
                  <AppIcon name="refresh" /> Tiklash
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p
      v-if="toast"
      class="fixed top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50"
    >
      {{ toast }}
    </p>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from "vue";
import AppIcon from "@/components/AppIcon.vue";
import ManagerNav from "@/components/ManagerNav.vue";
import { apiGet, apiSend } from "@/utils/managerApi";

const managers = ref([]);
const loading = ref(true);
const busy = ref(false);
const toast = ref("");
const showInactive = ref(false);
const editing = ref(null);
const editPhone = ref("");

const form = reactive({ name: "", surname: "", phone: "", password: "" });

function say(msg) {
  toast.value = msg;
  setTimeout(() => (toast.value = ""), 3000);
}

function startEdit(m) {
  editing.value = m.id;
  editPhone.value = m.phone;
}

async function fetchManagers() {
  loading.value = true;
  try {
    const q = showInactive.value ? "?all=1" : "";
    const { data } = await apiGet(`/managers/${q}`);
    managers.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("managers:", e);
    say("Ma'lumot yuklanmadi");
  } finally {
    loading.value = false;
  }
}

async function patchManager(m, body, okMsg) {
  busy.value = true;
  try {
    const { ok, data } = await apiSend(`/manager/${m.id}/update/`, "PATCH", body);
    if (!ok) return say(data.error || "Saqlanmadi");
    say(okMsg);
    editing.value = null;
    await fetchManagers();
  } catch (e) {
    console.error("update manager:", e);
    say("Tarmoq xatosi");
  } finally {
    busy.value = false;
  }
}

function savePhone(m) {
  const phone = editPhone.value.trim();
  if (!phone) return say("Telefon bo'sh bo'lishi mumkin emas");
  return patchManager(m, { phone }, `${m.name} raqami yangilandi`);
}

function reactivate(m) {
  return patchManager(m, { is_active: true }, `${m.name} tiklandi`);
}

async function createManager() {
  busy.value = true;
  try {
    const { ok, data } = await apiSend("/manager/register/", "POST", { ...form });
    if (!ok) return say(data.error || "Qo'shilmadi");
    say(`${data.name} qo'shildi`);
    Object.assign(form, { name: "", surname: "", phone: "", password: "" });
    await fetchManagers();
  } catch (e) {
    console.error("create manager:", e);
    say("Tarmoq xatosi");
  } finally {
    busy.value = false;
  }
}

async function deactivate(m) {
  busy.value = true;
  try {
    const { ok, data } = await apiSend(`/manager/${m.id}/delete/`, "DELETE");
    if (!ok) return say(data.error || "O'chirilmadi");
    say(data.message);
    await fetchManagers();
  } catch (e) {
    console.error("delete manager:", e);
    say("Tarmoq xatosi");
  } finally {
    busy.value = false;
  }
}

watch(showInactive, fetchManagers);
onMounted(fetchManagers);
</script>
