<template>
  <div class="min-h-screen bg-slate-50 p-4 sm:p-6 font-sans">
    <ManagerNav
      title="Ustozlar"
      subtitle="Telefon raqamni tahrirlash, o'quvchilarni ko'chirish va ustozni o'chirish"
    />

    <!-- ══════════ OGOHLANTIRISH ══════════ -->
    <div
      v-if="problem.length"
      class="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4"
    >
      <p class="text-sm font-medium text-amber-800 mb-1">
        <AppIcon name="warning" /> {{ problem.length }} ta ustozning raqami
        muammoli
      </p>
      <p class="text-xs text-amber-700">
        Raqami to'liq bo'lmagan ustoz tizimga kira olmaydi — quyidagi
        ro'yxatdan to'g'rilab qo'ying:
        <span class="font-medium">{{ problem.map((t) => t.name).join(", ") }}</span>
      </p>
    </div>

    <!-- ══════════ YANGI USTOZ ══════════ -->
    <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-4">
      <p class="text-sm font-medium text-slate-700 mb-3">Yangi ustoz qo'shish</p>
      <div class="flex flex-col sm:flex-row gap-3">
        <input
          v-model="newTeacher.name"
          placeholder="Ism familiya"
          class="flex-1 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-300"
        />
        <input
          v-model="newTeacher.phone"
          placeholder="Telefon (90 123 45 67)"
          class="flex-1 border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-300 tabular-nums"
        />
        <button
          @click="createTeacher"
          :disabled="!newTeacher.name || !newTeacher.phone || busy"
          class="px-5 py-2 rounded-lg bg-slate-900 text-white text-sm disabled:opacity-40 hover:bg-slate-800 transition shrink-0"
        >
          <AppIcon name="plus" /> Qo'shish
        </button>
      </div>
      <p class="text-[11px] text-slate-400 mt-2">
        Boshlang'ich parol: <span class="font-mono">excel2024</span>
      </p>
    </div>

    <!-- ══════════ RO'YXAT ══════════ -->
    <div
      class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
    >
      <div v-if="loading" class="p-16 text-center">
        <AppIcon name="spinner" class="w-7 h-7 text-indigo-400 animate-spin" />
        <p class="text-sm text-slate-400 mt-3">Yuklanmoqda...</p>
      </div>

      <div v-else class="divide-y divide-slate-100">
        <div v-for="t in teachers" :key="t.id" class="p-4">
          <div class="flex flex-col sm:flex-row sm:items-center gap-3">
            <!-- Ism -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="font-semibold text-slate-800">{{ t.name }}</p>
                <span
                  v-if="t.is_senior"
                  class="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600"
                  >katta ustoz</span
                >
              </div>
              <p class="text-xs text-slate-400 mt-0.5">
                {{ t.students_count }} o'quvchi · {{ t.groups_count }} guruh
              </p>
            </div>

            <!-- Telefon: tahrir -->
            <div class="flex items-center gap-2 shrink-0">
              <template v-if="editing === t.id">
                <input
                  v-model="editPhone"
                  class="w-40 border border-indigo-300 rounded-lg px-3 py-1.5 text-sm outline-none tabular-nums"
                  @keyup.enter="savePhone(t)"
                />
                <button
                  @click="savePhone(t)"
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
                <span
                  :class="[
                    'tabular-nums text-sm',
                    t.phone_complete ? 'text-slate-600' : 'text-rose-500',
                  ]"
                  >{{ t.phone }}</span
                >
                <button
                  @click="startEdit(t)"
                  class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs hover:bg-slate-50 hover:text-indigo-500 transition"
                >
                  <AppIcon name="edit" /> Tahrirlash
                </button>
                <button
                  @click="askDelete(t)"
                  class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-400 text-xs hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition"
                >
                  <AppIcon name="trash" />
                </button>
              </template>
            </div>
          </div>

          <p v-if="t.phone_note" class="text-[11px] text-rose-500 mt-1.5">
            <AppIcon name="warning" /> {{ t.phone_note }}
          </p>
        </div>
      </div>
    </div>

    <!-- ══════════ O'CHIRISH MODALI ══════════ -->
    <div
      v-if="deleting"
      class="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-40"
      @click.self="deleting = null"
    >
      <div class="bg-white rounded-2xl p-5 w-full max-w-md shadow-xl">
        <p class="font-semibold text-slate-800 mb-1">
          {{ deleting.name }} o'chirilsinmi?
        </p>
        <p class="text-sm text-slate-500 mb-4">
          Unda <span class="font-medium">{{ deleting.students_count }}</span> ta
          o'quvchi va
          <span class="font-medium">{{ deleting.groups_count }}</span> ta guruh
          bor. Ular kimga o'tsin?
        </p>

        <select
          v-model="deleteTo"
          class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-300 mb-4"
        >
          <option value="">Hech kimga — biriktirilmagan holga tushsin</option>
          <option
            v-for="t in teachers.filter((x) => x.id !== deleting.id)"
            :key="t.id"
            :value="t.id"
          >
            {{ t.name }}
          </option>
        </select>

        <div class="flex gap-2 justify-end">
          <button
            @click="deleting = null"
            class="px-4 py-2 rounded-lg border border-slate-200 text-slate-500 text-sm hover:bg-slate-50"
          >
            Bekor
          </button>
          <button
            @click="doDelete"
            :disabled="busy"
            class="px-4 py-2 rounded-lg bg-rose-500 text-white text-sm hover:bg-rose-600 disabled:opacity-40"
          >
            O'chirish
          </button>
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
import { ref, computed, reactive, onMounted } from "vue";
import AppIcon from "@/components/AppIcon.vue";
import ManagerNav from "@/components/ManagerNav.vue";
import { apiGet, apiSend } from "@/utils/managerApi";

const teachers = ref([]);
const loading = ref(true);
const busy = ref(false);
const toast = ref("");

const editing = ref(null);
const editPhone = ref("");
const deleting = ref(null);
const deleteTo = ref("");
const newTeacher = reactive({ name: "", phone: "" });

const problem = computed(() => teachers.value.filter((t) => !t.phone_complete));

function say(msg) {
  toast.value = msg;
  setTimeout(() => (toast.value = ""), 3000);
}

function startEdit(t) {
  editing.value = t.id;
  editPhone.value = t.phone;
}

function askDelete(t) {
  deleting.value = t;
  deleteTo.value = "";
}

async function fetchTeachers() {
  loading.value = true;
  try {
    const { data } = await apiGet("/teachers/overview/");
    teachers.value = Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("teachers/overview:", e);
    say("Ma'lumot yuklanmadi");
  } finally {
    loading.value = false;
  }
}

async function savePhone(t) {
  const phone = editPhone.value.trim();
  if (!phone) return say("Telefon bo'sh bo'lishi mumkin emas");
  busy.value = true;
  try {
    const { ok, data } = await apiSend(`/teachers/update/${t.id}/`, "PATCH", {
      phone,
    });
    if (!ok) return say(data.error || "Saqlanmadi");
    say(`${t.name} raqami yangilandi`);
    editing.value = null;
    await fetchTeachers();
  } catch (e) {
    console.error("update teacher:", e);
    say("Tarmoq xatosi");
  } finally {
    busy.value = false;
  }
}

async function createTeacher() {
  busy.value = true;
  try {
    const { ok, data } = await apiSend("/teachers/create/", "POST", {
      name: newTeacher.name.trim(),
      phone: newTeacher.phone.trim(),
    });
    if (!ok) return say(data.error || "Qo'shilmadi");
    say(`${data.name} qo'shildi`);
    newTeacher.name = "";
    newTeacher.phone = "";
    await fetchTeachers();
  } catch (e) {
    console.error("create teacher:", e);
    say("Tarmoq xatosi");
  } finally {
    busy.value = false;
  }
}

async function doDelete() {
  busy.value = true;
  try {
    const q = deleteTo.value ? `?to_teacher_id=${deleteTo.value}` : "";
    const { ok, data } = await apiSend(
      `/teachers/delete/${deleting.value.id}/${q}`,
      "DELETE"
    );
    if (!ok) return say(data.error || "O'chirilmadi");
    say(data.message);
    deleting.value = null;
    await fetchTeachers();
  } catch (e) {
    console.error("delete teacher:", e);
    say("Tarmoq xatosi");
  } finally {
    busy.value = false;
  }
}

onMounted(fetchTeachers);
</script>
