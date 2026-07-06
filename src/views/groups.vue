<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
const router = useRouter();
const API = "https://itline-django-9s85.onrender.com/api";

const user = JSON.parse(localStorage.getItem("user") || "null");
if (!user) router.push("/login");
if (user && !user.is_admin) router.push("/");

function logout() {
  localStorage.removeItem("user");
  router.push("/login");
}

// ─────────────────────────────
// STATE
// ─────────────────────────────

const groups = ref([]);
const teachers = ref([]);
const allStudents = ref([]);

const loadingGroups = ref(true);
const savingGroup = ref(false);

// panel: null | 'create' | 'edit' | 'detail'
const panel = ref(null);
const activeGroup = ref(null);

const form = ref({
  name: "",
  teacher_id: null,
  students: [],
  lesson_time: "09:00",
  lesson_room: "",
});
const studentSearch = ref("");

const avatarColors = [
  { backgroundColor: "#EEEDFE", color: "#3C3489" },
  { backgroundColor: "#E1F5EE", color: "#085041" },
  { backgroundColor: "#FAECE7", color: "#712B13" },
  { backgroundColor: "#E6F1FB", color: "#0C447C" },
  { backgroundColor: "#FAEEDA", color: "#633806" },
];

// ─────────────────────────────
// COMPUTED
// ─────────────────────────────

const searchResults = computed(() => {
  const q = studentSearch.value.trim().toLowerCase();
  if (!q) return [];
  return allStudents.value
    .filter(
      (s) =>
        !form.value.students.includes(s.id) &&
        (`${s.name} ${s.surname}`.toLowerCase().includes(q) ||
          (s.phone || "").includes(q)),
    )
    .slice(0, 8);
});

const selectedStudents = computed(() =>
  allStudents.value.filter((s) => form.value.students.includes(s.id)),
);

// ─────────────────────────────
// FETCH
// ─────────────────────────────

async function fetchGroups() {
  loadingGroups.value = true;
  try {
    const res = await fetch(`${API}/groups/`);
    if (!res.ok) throw new Error("Guruhlarni yuklashda xatolik");
    groups.value = await res.json();

    if (activeGroup.value) {
      activeGroup.value =
        groups.value.find((g) => g.id === activeGroup.value.id) || null;
    }
  } catch (e) {
    console.error("Fetch Groups Error:", e);
  } finally {
    loadingGroups.value = false;
  }
}

async function fetchTeachers() {
  try {
    const res = await fetch(`${API}/teachers/`);
    if (!res.ok) throw new Error("O'qituvchilarni yuklashda xatolik");
    teachers.value = await res.json();
  } catch (e) {
    console.error("Fetch Teachers Error:", e);
  }
}

async function fetchAllStudents() {
  try {
    const res = await fetch(`${API}/students/`);
    if (!res.ok) throw new Error("O'quvchilarni yuklashda xatolik");
    allStudents.value = await res.json();
  } catch (e) {
    console.error("Fetch Students Error:", e);
  }
}

onMounted(async () => {
  await Promise.all([fetchGroups(), fetchTeachers(), fetchAllStudents()]);
  // Ensure each group has a `students` array derived from allStudents when backend omits it
  if (allStudents.value.length && groups.value.length) {
    groups.value = groups.value.map((g) => ({
      ...g,
      students: g.students?.length
        ? g.students
        : allStudents.value.filter((s) => s.group === g.id || s.group_id === g.id),
    }));
  }
});

// ─────────────────────────────
// PANEL HELPERS
// ─────────────────────────────

function openCreate() {
  form.value = {
    name: "",
    teacher_id: null,
    students: [],
    lesson_time: "09:00",
    lesson_room: "",
  };
  studentSearch.value = "";
  activeGroup.value = null;
  panel.value = "create";
}

function openEdit(group) {
  form.value = {
    name: group.name,
    teacher_id: group.teacher?.id || null,
    students: group.students?.map((s) => s.id) || [],
    lesson_time: group.lesson_time || "09:00",
    lesson_room: group.lesson_room || "",
  };
  studentSearch.value = "";
  activeGroup.value = group;
  panel.value = "edit";
}

function openDetail(group) {
  activeGroup.value = group;
  panel.value = "detail";
}

function closePanel() {
  panel.value = null;
  activeGroup.value = null;
}

// ─────────────────────────────
// STUDENT SEARCH
// ─────────────────────────────

function addStudent(id) {
  if (!form.value.students.includes(id)) form.value.students.push(id);
  studentSearch.value = "";
}

function removeStudent(id) {
  form.value.students = form.value.students.filter((s) => s !== id);
}

// ─────────────────────────────
// CRUD
// ─────────────────────────────

async function saveGroup() {
  if (!form.value.name.trim()) {
    alert("Guruh nomini kiriting");
    return;
  }
  savingGroup.value = true;
  try {
    const isEdit = panel.value === "edit";
    const url = isEdit
      ? `${API}/groups/update/${activeGroup.value.id}/`
      : `${API}/groups/create/`;
    const method = isEdit ? "PATCH" : "POST";

    const payload = {
      name: form.value.name.trim(),
      students: form.value.students,
      lesson_time: form.value.lesson_time,
      lesson_room: form.value.lesson_room.trim(),
    };

    if (form.value.teacher_id) {
      payload.teacher_id = Number(form.value.teacher_id);
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || `Xatolik yuz berdi: ${res.status}`);
      return;
    }

    const saved = await res.json().catch(() => null);
    await fetchGroups();

    const id = isEdit ? activeGroup.value?.id : saved?.id || saved?.group?.id;
    const updated = groups.value.find((g) => g.id === id);

    if (updated) openDetail(updated);
    else closePanel();
  } catch (e) {
    alert("Server bilan aloqa yo'q yoki so'rovda xatolik");
  } finally {
    savingGroup.value = false;
  }
}

async function deleteGroup(id) {
  if (!confirm("Guruhni o'chirmoqchimisiz?")) return;
  try {
    const res = await fetch(`${API}/groups/delete/${id}/`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "O'chirishda xatolik");
      return;
    }
    closePanel();
    await fetchGroups();
  } catch (e) {
    alert("Server bilan aloqa yo'q");
  }
}

// ─────────────────────────────
// HELPERS
// ─────────────────────────────

function initials(s) {
  return ((s.name?.[0] || "") + (s.surname?.[0] || "")).toUpperCase();
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4 sm:mb-6 gap-2">
        <div class="flex items-center gap-2 sm:gap-3 min-w-0">
          <RouterLink to="/admin" class="text-gray-400 hover:text-gray-700 transition shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="1.4em" height="1.4em" viewBox="0 0 48 48">
              <path d="M0 0h48v48H0z" fill="none" />
              <path fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="4"
                d="M44 40.836q-7.34-8.96-13.036-10.168t-10.846-.365V41L4 23.545L20.118 7v10.167q9.523.075 16.192 6.833q6.668 6.758 7.69 16.836Z"
                clip-rule="evenodd" />
            </svg>
          </RouterLink>
          <div class="min-w-0">
            <h1 class="text-lg sm:text-xl font-semibold truncate">Guruhlar</h1>
            <p class="text-xs sm:text-sm text-gray-400">
              {{ groups.length }} ta guruh
            </p>
          </div>
        </div>
        <div class="flex gap-2 shrink-0">
          <button @click="openCreate"
            class="bg-black text-white px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm hover:bg-gray-800 transition whitespace-nowrap">
            + Guruh
          </button>
          <button @click="logout"
            class="border border-gray-200 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm hover:bg-gray-100 transition bg-white whitespace-nowrap hidden sm:block">
            Chiqish
          </button>
        </div>
      </div>
      <div class="relative">
        <!-- Groups list — hidden on mobile when panel is open -->
        <div :class="[
          panel ? 'lg:grid lg:grid-cols-5 gap-4' : '',
          'flex flex-col lg:flex lg:flex-row gap-4',
        ]">
          <!-- List column -->
          <div :class="[
            panel ? 'lg:col-span-2' : 'w-full',
            panel ? 'hidden lg:block' : 'block',
          ]">
            <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div v-if="loadingGroups" class="text-center py-12 text-gray-400 text-sm">
                Yuklanmoqda...
              </div>

              <div v-else-if="groups.length === 0" class="text-center py-12 text-gray-400 text-sm">
                <p class="text-3xl mb-3">🗂️</p>
                <p>Hozircha guruhlar yo'q</p>
                <button @click="openCreate" class="mt-4 text-sm text-black underline">
                  Birinchi guruhni yarating
                </button>
              </div>

              <div v-else>
                <div v-for="group in groups" :key="group.id" @click="openDetail(group)" :class="[
                  'px-4 sm:px-5 py-4 border-b border-gray-100 cursor-pointer transition hover:bg-gray-50 last:border-0',
                  activeGroup?.id === group.id && panel === 'detail'
                    ? 'bg-gray-50 border-l-2 border-l-black'
                    : '',
                ]">
                  <div class="flex items-center justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <p class="font-medium text-sm truncate">
                          {{ group.name }}
                        </p>
                        <span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">
                          {{ group.students?.length || 0 }} ta
                        </span>
                      </div>
                      <p class="text-xs text-gray-400 mt-0.5 truncate">
                        {{ group.teacher?.name || "O'qituvchi yo'q" }}
                        <span v-if="group.lesson_time">
                          · {{ group.lesson_time }}</span>
                        <span v-if="group.lesson_room">
                          · {{ group.lesson_room }}-xona</span>
                      </p>
                    </div>
                    <div class="flex shrink-0 items-center">
                      <div v-for="(s, i) in (group.students || []).slice(0, 3)" :key="s.id"
                        class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 border-white -ml-2 first:ml-0"
                        :style="avatarColors[i % avatarColors.length]" :title="`${s.name} ${s.surname}`">
                        {{ initials(s) }}
                      </div>
                      <span v-if="(group.students?.length || 0) > 3" class="text-xs text-gray-400 ml-2 self-center">
                        +{{ group.students.length - 3 }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Panel column — full screen on mobile, side panel on desktop -->
          <div v-if="panel" :class="[
            'lg:col-span-3',
            'fixed inset-0 z-40 lg:static lg:inset-auto lg:z-auto',
            'flex flex-col',
          ]">
            <!-- Mobile backdrop -->
            <div class="absolute inset-0 bg-black/20 lg:hidden" @click="closePanel"></div>

            <!-- Panel content -->
            <div
              class="relative mt-auto lg:mt-0 bg-white lg:rounded-2xl shadow-lg lg:shadow-sm rounded-t-3xl max-h-[92dvh] lg:max-h-none overflow-y-auto p-5">
              <!-- Mobile drag handle -->
              <div class="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 lg:hidden"></div>

              <!-- DETAIL panel -->
              <template v-if="panel === 'detail' && activeGroup">
                <div class="flex items-start justify-between mb-5">
                  <div class="min-w-0 flex-1 pr-3">
                    <h2 class="text-lg font-semibold truncate">
                      {{ activeGroup.name }}
                    </h2>
                    <p class="text-sm text-gray-400 mt-0.5 truncate">
                      {{
                        activeGroup.teacher?.name ||
                        "O'qituvchi biriktirilmagan"
                      }}
                    </p>
                    <p v-if="activeGroup.lesson_time || activeGroup.lesson_room"
                      class="text-sm text-gray-400 mt-0.5 truncate">
                      <span v-if="activeGroup.lesson_time">{{
                        activeGroup.lesson_time
                      }}</span>
                      <span v-if="activeGroup.lesson_time && activeGroup.lesson_room">
                        ·
                      </span>
                      <span v-if="activeGroup.lesson_room">{{ activeGroup.lesson_room }}-xona</span>
                    </p>
                  </div>
                  <button @click="closePanel" class="text-gray-300 hover:text-gray-600 text-2xl leading-none shrink-0">
                    ×
                  </button>
                </div>

                <div class="flex gap-2 mb-5">
                  <button @click="openEdit(activeGroup)"
                    class="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">
                    ✏️ Tahrirlash
                  </button>
                  <button @click="deleteGroup(activeGroup.id)"
                    class="flex-1 border border-red-100 text-red-500 py-2.5 rounded-xl text-sm hover:bg-red-50 transition">
                    🗑 O'chirish
                  </button>
                </div>

                <p class="text-xs text-gray-400 uppercase tracking-wide mb-3">
                  O'quvchilar — {{ activeGroup.students?.length || 0 }} ta
                </p>

                <div v-if="activeGroup.students?.length > 0" class="space-y-2">
                  <div v-for="(s, i) in activeGroup.students" :key="s.id"
                    class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
                    <div class="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                      :style="avatarColors[i % avatarColors.length]">
                      {{ initials(s) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium truncate">
                        {{ s.name }} {{ s.surname }}
                      </p>
                      <p class="text-xs text-gray-400">{{ s.phone }}</p>
                    </div>
                    <span class="text-xs text-gray-400 shrink-0 bg-gray-100 px-2 py-0.5 rounded-full">
                      {{ s.stage }}-etap
                    </span>
                  </div>
                </div>
                <div v-else
                  class="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
                  Bu guruhda hozircha o'quvchi yo'q
                </div>
              </template>

              <!-- CREATE / EDIT panel -->
              <template v-else-if="panel === 'create' || panel === 'edit'">
                <div class="flex items-center justify-between mb-5">
                  <h2 class="font-semibold">
                    {{
                      panel === "create" ? "Yangi guruh" : "Guruhni tahrirlash"
                    }}
                  </h2>
                  <button @click="closePanel" class="text-gray-300 hover:text-gray-600 text-2xl leading-none">
                    ×
                  </button>
                </div>

                <div class="mb-4">
                  <label class="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Guruh nomi</label>
                  <input v-model="form.name" placeholder="Masalan: A-guruh, Django-1, Morning..."
                    class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-400 transition" />
                </div>

                <div class="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label class="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Dars vaqti</label>
                    <input v-model="form.lesson_time" type="time"
                      class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-400 transition" />
                  </div>
                  <div>
                    <label class="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Xona</label>
                    <input v-model="form.lesson_room" placeholder="Masalan: 204-xona"
                      class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-400 transition" />
                  </div>
                </div>

                <div class="mb-4">
                  <label class="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">O'qituvchi</label>
                  <select v-model.number="form.teacher_id"
                    class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-400 bg-white transition">
                    <option :value="null">— Tanlang</option>
                    <option v-for="t in teachers" :key="t.id" :value="t.id">
                      {{ t.name }}
                    </option>
                  </select>
                </div>

                <div class="mb-4">
                  <label class="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">
                    O'quvchilar
                    <span v-if="selectedStudents.length" class="text-gray-600 normal-case ml-1">
                      ({{ selectedStudents.length }} ta tanlangan)
                    </span>
                  </label>

                  <div class="relative">
                    <input v-model="studentSearch" placeholder="Ism yoki telefon raqam..."
                      class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-gray-400 transition" />
                    <div v-if="searchResults.length > 0"
                      class="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden">
                      <div v-for="s in searchResults" :key="s.id" @click="addStudent(s.id)"
                        class="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer">
                        <div
                          class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                          :style="avatarColors[s.id % avatarColors.length]">
                          {{ initials(s) }}
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium truncate">
                            {{ s.name }} {{ s.surname }}
                          </p>
                          <p class="text-xs text-gray-400">{{ s.phone }}</p>
                        </div>
                        <span class="text-xs text-gray-400 shrink-0">{{ s.stage }}-etap</span>
                      </div>
                    </div>
                    <p v-else-if="
                      studentSearch.trim() && searchResults.length === 0
                    "
                      class="absolute w-full mt-1 bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm text-gray-400 text-center shadow">
                      Topilmadi
                    </p>
                  </div>

                  <div v-if="selectedStudents.length > 0" class="mt-3 space-y-1.5">
                    <div v-for="(s, i) in selectedStudents" :key="s.id"
                      class="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-xl">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                        :style="avatarColors[i % avatarColors.length]">
                        {{ initials(s) }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium truncate">
                          {{ s.name }} {{ s.surname }}
                        </p>
                        <p class="text-xs text-gray-400">{{ s.phone }}</p>
                      </div>
                      <button @click="removeStudent(s.id)"
                        class="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-100 hover:text-red-500 text-gray-400 text-sm transition shrink-0">
                        ×
                      </button>
                    </div>
                  </div>
                  <div v-else
                    class="mt-3 text-center py-4 text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
                    Hali o'quvchi tanlanmagan — yuqoridan qidiring
                  </div>
                </div>

                <div class="flex gap-2 pt-2 pb-2">
                  <button @click="saveGroup" :disabled="savingGroup"
                    class="flex-1 bg-black text-white py-2.5 rounded-xl text-sm hover:bg-gray-800 transition disabled:opacity-50">
                    {{
                      savingGroup
                        ? "Saqlanmoqda..."
                        : panel === "create"
                          ? "✓ Guruh yaratish"
                          : "✓ Saqlash"
                    }}
                  </button>
                  <button @click="closePanel"
                    class="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition">
                    Bekor qilish
                  </button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>