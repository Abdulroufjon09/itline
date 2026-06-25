<template>
  <div class="manager-panel space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="panel-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <h3 class="panel-title">Manager paneli</h3>
      </div>
      <button @click="open = !open" class="press glass-pill px-3 py-1.5 text-xs">
        {{ open ? 'Yopish' : 'Ochish' }}
      </button>
    </div>

    <div v-if="open" class="space-y-3">
      <!-- Tab navigation -->
      <div class="tab-nav">
        <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key"
          :class="['tab-btn', activeTab === tab.key ? 'tab-btn--active' : '']">
          <component :is="tab.icon" class="tab-icon" />
          <span>{{ tab.label }}</span>
          <span v-if="tab.count !== undefined" class="tab-badge">{{ tab.count }}</span>
        </button>
      </div>

      <!-- Tab panels -->
      <div class="tab-content">

        <!-- O'qituvchilar -->
        <div v-if="activeTab === 'teachers'" class="section-panel">
          <div class="section-header">
            <div>
              <p class="section-title">O'qituvchilar</p>
              <p class="section-sub">Jami {{ teachers.length }} ta o'qituvchi</p>
            </div>
            <button @click="showAddTeacher = !showAddTeacher" class="press glass-pill px-3 py-1.5 text-xs add-btn">
              + Qo'shish
            </button>
          </div>

          <div v-if="showAddTeacher" class="add-form">
            <input v-model="newTeacher.name" placeholder="Ism familiya" class="form-input" />
            <input v-model="newTeacher.subject" placeholder="Fan" class="form-input" />
            <input v-model="newTeacher.phone" placeholder="Telefon" class="form-input" />
            <div class="form-actions">
              <button @click="addTeacher" class="press glass-pill px-3 py-1.5 text-xs">Saqlash</button>
              <button @click="showAddTeacher = false"
                class="press glass-pill px-3 py-1.5 text-xs cancel-btn">Bekor</button>
            </div>
          </div>

          <div class="search-box">
            <input v-model="teacherSearch" placeholder="Qidirish..." class="form-input search-input" />
          </div>

          <div class="data-table">
            <table>
              <thead>
                <tr>
                  <th>Ism</th>
                  <th>Fan</th>
                  <th>Telefon</th>
                  <th>Holat</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="t in filteredTeachers" :key="t.id">
                  <td>
                    <div class="user-cell">
                      <div class="avatar" :style="{ background: t.color + '22', color: t.color }">
                        {{ initials(t.name) }}
                      </div>
                      <span>{{ t.name }}</span>
                    </div>
                  </td>
                  <td class="muted">{{ t.subject }}</td>
                  <td class="muted">{{ t.phone }}</td>
                  <td><span
                      :class="['status-pill', t.active ? 'status--active' : 'status--inactive']">{{ t.active ? 'Faol' : 'Nofaol' }}</span>
                  </td>
                  <td>
                    <button @click="toggleActive(teachers, t)"
                      class="row-action">{{ t.active ? 'O\'chirish' : 'Faollashtirish' }}</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Talabalar -->
        <div v-if="activeTab === 'students'" class="section-panel">
          <div class="section-header">
            <div>
              <p class="section-title">Talabalar</p>
              <p class="section-sub">Jami {{ students.length }} ta talaba</p>
            </div>
            <button @click="showAddStudent = !showAddStudent" class="press glass-pill px-3 py-1.5 text-xs add-btn">
              + Qo'shish
            </button>
          </div>

          <div v-if="showAddStudent" class="add-form">
            <input v-model="newStudent.name" placeholder="Ism familiya" class="form-input" />
            <input v-model="newStudent.group" placeholder="Guruh" class="form-input" />
            <input v-model="newStudent.phone" placeholder="Telefon" class="form-input" />
            <div class="form-actions">
              <button @click="addStudent" class="press glass-pill px-3 py-1.5 text-xs">Saqlash</button>
              <button @click="showAddStudent = false"
                class="press glass-pill px-3 py-1.5 text-xs cancel-btn">Bekor</button>
            </div>
          </div>

          <div class="search-box">
            <input v-model="studentSearch" placeholder="Qidirish..." class="form-input search-input" />
          </div>

          <div class="data-table">
            <table>
              <thead>
                <tr>
                  <th>Ism</th>
                  <th>Guruh</th>
                  <th>Telefon</th>
                  <th>Holat</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in filteredStudents" :key="s.id">
                  <td>
                    <div class="user-cell">
                      <div class="avatar" :style="{ background: s.color + '22', color: s.color }">
                        {{ initials(s.name) }}
                      </div>
                      <span>{{ s.name }}</span>
                    </div>
                  </td>
                  <td class="muted">{{ s.group }}</td>
                  <td class="muted">{{ s.phone }}</td>
                  <td><span
                      :class="['status-pill', s.active ? 'status--active' : 'status--inactive']">{{ s.active ? 'Faol' : 'Nofaol' }}</span>
                  </td>
                  <td>
                    <button @click="toggleActive(students, s)"
                      class="row-action">{{ s.active ? 'O\'chirish' : 'Faollashtirish' }}</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Adminlar -->
        <div v-if="activeTab === 'admins'" class="section-panel">
          <div class="section-header">
            <div>
              <p class="section-title">Adminlar</p>
              <p class="section-sub">Jami {{ admins.length }} ta admin</p>
            </div>
            <button @click="showAddAdmin = !showAddAdmin" class="press glass-pill px-3 py-1.5 text-xs add-btn">
              + Qo'shish
            </button>
          </div>

          <div v-if="showAddAdmin" class="add-form">
            <input v-model="newAdmin.name" placeholder="Ism familiya" class="form-input" />
            <input v-model="newAdmin.role" placeholder="Lavozim" class="form-input" />
            <input v-model="newAdmin.phone" placeholder="Telefon" class="form-input" />
            <div class="form-actions">
              <button @click="addAdmin" class="press glass-pill px-3 py-1.5 text-xs">Saqlash</button>
              <button @click="showAddAdmin = false"
                class="press glass-pill px-3 py-1.5 text-xs cancel-btn">Bekor</button>
            </div>
          </div>

          <div class="data-table">
            <table>
              <thead>
                <tr>
                  <th>Ism</th>
                  <th>Lavozim</th>
                  <th>Telefon</th>
                  <th>Holat</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="a in admins" :key="a.id">
                  <td>
                    <div class="user-cell">
                      <div class="avatar" :style="{ background: a.color + '22', color: a.color }">
                        {{ initials(a.name) }}
                      </div>
                      <span>{{ a.name }}</span>
                    </div>
                  </td>
                  <td class="muted">{{ a.role }}</td>
                  <td class="muted">{{ a.phone }}</td>
                  <td><span
                      :class="['status-pill', a.active ? 'status--active' : 'status--inactive']">{{ a.active ? 'Faol' : 'Nofaol' }}</span>
                  </td>
                  <td>
                    <button @click="toggleActive(admins, a)"
                      class="row-action">{{ a.active ? 'O\'chirish' : 'Faollashtirish' }}</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- To'lovlar -->
        <div v-if="activeTab === 'payments'" class="section-panel">
          <div class="section-header">
            <div>
              <p class="section-title">To'lovlar</p>
              <p class="section-sub">Jami: {{ totalPayments.toLocaleString() }} so'm</p>
            </div>
            <button @click="showAddPayment = !showAddPayment" class="press glass-pill px-3 py-1.5 text-xs add-btn">
              + Qo'shish
            </button>
          </div>

          <div v-if="showAddPayment" class="add-form">
            <input v-model="newPayment.student" placeholder="Talaba ismi" class="form-input" />
            <input v-model.number="newPayment.amount" type="number" placeholder="Miqdor (so'm)" class="form-input" />
            <input v-model="newPayment.description" placeholder="Izoh" class="form-input" />
            <div class="form-actions">
              <button @click="addPayment" class="press glass-pill px-3 py-1.5 text-xs">Saqlash</button>
              <button @click="showAddPayment = false"
                class="press glass-pill px-3 py-1.5 text-xs cancel-btn">Bekor</button>
            </div>
          </div>

          <div class="stats-row">
            <div class="stat-card stat--green">
              <p class="stat-label">Bu oy</p>
              <p class="stat-value">{{ monthPayments.toLocaleString() }} so'm</p>
            </div>
            <div class="stat-card stat--blue">
              <p class="stat-label">To'lovlar soni</p>
              <p class="stat-value">{{ payments.length }} ta</p>
            </div>
          </div>

          <div class="data-table">
            <table>
              <thead>
                <tr>
                  <th>Talaba</th>
                  <th>Miqdor</th>
                  <th>Izoh</th>
                  <th>Sana</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in payments" :key="p.id">
                  <td>{{ p.student }}</td>
                  <td class="amount--positive">{{ p.amount.toLocaleString() }} so'm</td>
                  <td class="muted">{{ p.description }}</td>
                  <td class="muted">{{ p.date }}</td>
                  <td>
                    <button @click="removeItem(payments, p)" class="row-action row-action--danger">O'chirish</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Xarajatlar -->
        <div v-if="activeTab === 'expenses'" class="section-panel">
          <div class="section-header">
            <div>
              <p class="section-title">Xarajatlar (Rashod)</p>
              <p class="section-sub">Jami: {{ totalExpenses.toLocaleString() }} so'm</p>
            </div>
            <button @click="showAddExpense = !showAddExpense" class="press glass-pill px-3 py-1.5 text-xs add-btn">
              + Qo'shish
            </button>
          </div>

          <div v-if="showAddExpense" class="add-form">
            <input v-model="newExpense.title" placeholder="Nomi" class="form-input" />
            <input v-model.number="newExpense.amount" type="number" placeholder="Miqdor (so'm)" class="form-input" />
            <select v-model="newExpense.category" class="form-input">
              <option value="">Kategoriya tanlang</option>
              <option value="Maosh">Maosh</option>
              <option value="Qurilmalar">Qurilmalar</option>
              <option value="Kommunal">Kommunal</option>
              <option value="Ta'lim">Ta'lim</option>
              <option value="Boshqa">Boshqa</option>
            </select>
            <div class="form-actions">
              <button @click="addExpense" class="press glass-pill px-3 py-1.5 text-xs">Saqlash</button>
              <button @click="showAddExpense = false"
                class="press glass-pill px-3 py-1.5 text-xs cancel-btn">Bekor</button>
            </div>
          </div>

          <div class="stats-row">
            <div class="stat-card stat--red">
              <p class="stat-label">Bu oy xarajat</p>
              <p class="stat-value">{{ monthExpenses.toLocaleString() }} so'm</p>
            </div>
            <div class="stat-card stat--amber">
              <p class="stat-label">Balans</p>
              <p class="stat-value" :class="balance >= 0 ? 'text-green' : 'text-red'">
                {{ balance.toLocaleString() }} so'm
              </p>
            </div>
          </div>

          <div class="data-table">
            <table>
              <thead>
                <tr>
                  <th>Nomi</th>
                  <th>Miqdor</th>
                  <th>Kategoriya</th>
                  <th>Sana</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="e in expenses" :key="e.id">
                  <td>{{ e.title }}</td>
                  <td class="amount--negative">{{ e.amount.toLocaleString() }} so'm</td>
                  <td>
                    <span class="category-tag">{{ e.category }}</span>
                  </td>
                  <td class="muted">{{ e.date }}</td>
                  <td>
                    <button @click="removeItem(expenses, e)" class="row-action row-action--danger">O'chirish</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'

const open = ref(true)
const activeTab = ref('teachers')

// ──────────── Ikonlar ────────────
const IconTeacher = () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
  h('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
  h('circle', { cx: 9, cy: 7, r: 4 }),
  h('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }),
  h('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' })
])
const IconStudent = () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
  h('path', { d: 'M22 10v6M2 10l10-5 10 5-10 5z' }),
  h('path', { d: 'M6 12v5c3 3 9 3 12 0v-5' })
])
const IconAdmin = () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
  h('path', { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' })
])
const IconPayment = () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
  h('rect', { x: 1, y: 4, width: 22, height: 16, rx: 2, ry: 2 }),
  h('line', { x1: 1, y1: 10, x2: 23, y2: 10 })
])
const IconExpense = () => h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
  h('line', { x1: 12, y1: 1, x2: 12, y2: 23 }),
  h('path', { d: 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' })
])

// ──────────── Tabs ────────────
const tabs = computed(() => [
  { key: 'teachers', label: "O'qituvchilar", icon: IconTeacher, count: teachers.value.length },
  { key: 'students', label: 'Talabalar', icon: IconStudent, count: students.value.length },
  { key: 'admins', label: 'Adminlar', icon: IconAdmin, count: admins.value.length },
  { key: 'payments', label: "To'lovlar", icon: IconPayment },
  { key: 'expenses', label: 'Xarajatlar', icon: IconExpense },
])

// ──────────── Yordamchi ────────────
const today = () => new Date().toLocaleDateString('uz-UZ')
const colors = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
const randColor = () => colors[Math.floor(Math.random() * colors.length)]
const initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
let nextId = 100

const toggleActive = (list: any[], item: any) => { item.active = !item.active }
const removeItem = (list: any[], item: any) => {
  const idx = list.findIndex(i => i.id === item.id)
  if (idx !== -1) list.splice(idx, 1)
}

// ──────────── O'qituvchilar ────────────
interface Teacher { id: number; name: string; subject: string; phone: string; active: boolean; color: string }
const teachers = ref<Teacher[]>([
  { id: 1, name: 'Aziz Karimov', subject: 'Matematika', phone: '+998 90 123 45 67', active: true, color: '#6366f1' },
  { id: 2, name: 'Malika Yusupova', subject: 'Ingliz tili', phone: '+998 91 234 56 78', active: true, color: '#0ea5e9' },
  { id: 3, name: 'Bobur Toshmatov', subject: 'Fizika', phone: '+998 93 345 67 89', active: false, color: '#10b981' },
])
const teacherSearch = ref('')
const filteredTeachers = computed(() =>
  teachers.value.filter(t =>
    t.name.toLowerCase().includes(teacherSearch.value.toLowerCase()) ||
    t.subject.toLowerCase().includes(teacherSearch.value.toLowerCase())
  )
)
const showAddTeacher = ref(false)
const newTeacher = ref({ name: '', subject: '', phone: '' })
const addTeacher = () => {
  if (!newTeacher.value.name) return
  teachers.value.push({ id: ++nextId, ...newTeacher.value, active: true, color: randColor() })
  newTeacher.value = { name: '', subject: '', phone: '' }
  showAddTeacher.value = false
}

// ──────────── Talabalar ────────────
interface Student { id: number; name: string; group: string; phone: string; active: boolean; color: string }
const students = ref<Student[]>([
  { id: 1, name: 'Sardor Mirzayev', group: 'G-101', phone: '+998 90 111 22 33', active: true, color: '#f59e0b' },
  { id: 2, name: 'Dilnoza Xasanova', group: 'G-102', phone: '+998 91 222 33 44', active: true, color: '#ec4899' },
  { id: 3, name: 'Jasur Qodirov', group: 'G-101', phone: '+998 93 333 44 55', active: true, color: '#8b5cf6' },
  { id: 4, name: 'Nilufar Raximova', group: 'G-103', phone: '+998 94 444 55 66', active: false, color: '#10b981' },
])
const studentSearch = ref('')
const filteredStudents = computed(() =>
  students.value.filter(s =>
    s.name.toLowerCase().includes(studentSearch.value.toLowerCase()) ||
    s.group.toLowerCase().includes(studentSearch.value.toLowerCase())
  )
)
const showAddStudent = ref(false)
const newStudent = ref({ name: '', group: '', phone: '' })
const addStudent = () => {
  if (!newStudent.value.name) return
  students.value.push({ id: ++nextId, ...newStudent.value, active: true, color: randColor() })
  newStudent.value = { name: '', group: '', phone: '' }
  showAddStudent.value = false
}

// ──────────── Adminlar ────────────
interface Admin { id: number; name: string; role: string; phone: string; active: boolean; color: string }
const admins = ref<Admin[]>([
  { id: 1, name: 'Kamola Nazarova', role: 'Bosh admin', phone: '+998 90 555 66 77', active: true, color: '#6366f1' },
  { id: 2, name: 'Otabek Sultanov', role: 'Moliyachi', phone: '+998 91 666 77 88', active: true, color: '#ef4444' },
])
const showAddAdmin = ref(false)
const newAdmin = ref({ name: '', role: '', phone: '' })
const addAdmin = () => {
  if (!newAdmin.value.name) return
  admins.value.push({ id: ++nextId, ...newAdmin.value, active: true, color: randColor() })
  newAdmin.value = { name: '', role: '', phone: '' }
  showAddAdmin.value = false
}

// ──────────── To'lovlar ────────────
interface Payment { id: number; student: string; amount: number; description: string; date: string }
const payments = ref<Payment[]>([
  { id: 1, student: 'Sardor Mirzayev', amount: 500000, description: 'Fevral oyi', date: '15.02.2025' },
  { id: 2, student: 'Dilnoza Xasanova', amount: 450000, description: 'Fevral oyi', date: '16.02.2025' },
  { id: 3, student: 'Jasur Qodirov', amount: 500000, description: 'Mart oyi', date: '03.03.2025' },
])
const totalPayments = computed(() => payments.value.reduce((s, p) => s + p.amount, 0))
const monthPayments = computed(() => payments.value.slice(0, 2).reduce((s, p) => s + p.amount, 0))
const showAddPayment = ref(false)
const newPayment = ref({ student: '', amount: 0, description: '' })
const addPayment = () => {
  if (!newPayment.value.student || !newPayment.value.amount) return
  payments.value.unshift({ id: ++nextId, ...newPayment.value, date: today() })
  newPayment.value = { student: '', amount: 0, description: '' }
  showAddPayment.value = false
}

// ──────────── Xarajatlar ────────────
interface Expense { id: number; title: string; amount: number; category: string; date: string }
const expenses = ref<Expense[]>([
  { id: 1, title: 'O\'qituvchi maoshi', amount: 2000000, category: 'Maosh', date: '28.02.2025' },
  { id: 2, title: 'Internet', amount: 150000, category: 'Kommunal', date: '01.03.2025' },
  { id: 3, title: 'Doskalar', amount: 300000, category: 'Qurilmalar', date: '05.03.2025' },
])
const totalExpenses = computed(() => expenses.value.reduce((s, e) => s + e.amount, 0))
const monthExpenses = computed(() => expenses.value.slice(0, 2).reduce((s, e) => s + e.amount, 0))
const balance = computed(() => totalPayments.value - totalExpenses.value)
const showAddExpense = ref(false)
const newExpense = ref({ title: '', amount: 0, category: '' })
const addExpense = () => {
  if (!newExpense.value.title || !newExpense.value.amount) return
  expenses.value.unshift({ id: ++nextId, ...newExpense.value, date: today() })
  newExpense.value = { title: '', amount: 0, category: '' }
  showAddExpense.value = false
}
</script>

<style scoped>
.manager-panel {
  font-family: inherit;
}

.panel-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(99, 102, 241, 0.12);
  color: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
}

/* ── Tabs ── */
.tab-nav {
  display: flex;
  gap: 2px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 10px;
  padding: 3px;
  overflow-x: auto;
  scrollbar-width: none;
}

.tab-nav::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border-radius: 8px;
  border: none;
  background: transparent;
  font-size: 0.72rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.5);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s;
  flex-shrink: 0;
}

.tab-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.75);
}

.tab-btn--active {
  background: #fff;
  color: #6366f1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tab-icon {
  opacity: 0.85;
  flex-shrink: 0;
}

.tab-badge {
  font-size: 0.65rem;
  background: rgba(99, 102, 241, 0.12);
  color: #6366f1;
  border-radius: 20px;
  padding: 1px 6px;
  font-weight: 600;
}

.tab-btn--active .tab-badge {
  background: rgba(99, 102, 241, 0.18);
}

/* ── Section ── */
.tab-content {
  margin-top: 2px;
}

.section-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 0.8rem;
  font-weight: 600;
  margin: 0;
}

.section-sub {
  font-size: 0.7rem;
  color: rgba(0, 0, 0, 0.45);
  margin: 2px 0 0;
}

.add-btn {
  background: rgba(99, 102, 241, 0.1) !important;
  color: #6366f1 !important;
  border-color: rgba(99, 102, 241, 0.2) !important;
}

/* ── Add form ── */
.add-form {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.025);
  border-radius: 10px;
  border: 1px dashed rgba(0, 0, 0, 0.1);
}

.form-input {
  width: 100%;
  padding: 7px 10px;
  font-size: 0.78rem;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  background: #fff;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.form-input:focus {
  border-color: #6366f1;
}

.form-actions {
  display: flex;
  gap: 6px;
  margin-top: 2px;
}

.cancel-btn {
  color: rgba(0, 0, 0, 0.4) !important;
}

/* ── Search ── */
.search-box {
  position: relative;
}

.search-input {
  padding-left: 10px;
}

/* ── Stats row ── */
.stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.stat-card {
  border-radius: 10px;
  padding: 10px 12px;
}

.stat--green {
  background: rgba(16, 185, 129, 0.1);
}

.stat--blue {
  background: rgba(14, 165, 233, 0.1);
}

.stat--red {
  background: rgba(239, 68, 68, 0.1);
}

.stat--amber {
  background: rgba(245, 158, 11, 0.1);
}

.stat-label {
  font-size: 0.68rem;
  color: rgba(0, 0, 0, 0.45);
  margin: 0 0 3px;
}

.stat-value {
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0;
}

/* ── Table ── */
.data-table {
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.07);
  overflow: hidden;
  overflow-x: auto;
}

.data-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;
  min-width: 380px;
}

.data-table th {
  text-align: left;
  padding: 8px 10px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.45);
  font-size: 0.68rem;
  background: rgba(0, 0, 0, 0.025);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.data-table td {
  padding: 8px 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  vertical-align: middle;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover td {
  background: rgba(0, 0, 0, 0.018);
}

.muted {
  color: rgba(0, 0, 0, 0.45);
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 0.65rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.68rem;
  font-weight: 500;
}

.status--active {
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
}

.status--inactive {
  background: rgba(0, 0, 0, 0.06);
  color: rgba(0, 0, 0, 0.4);
}

.category-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.68rem;
  font-weight: 500;
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

.amount--positive {
  color: #059669;
  font-weight: 600;
}

.amount--negative {
  color: #dc2626;
  font-weight: 600;
}

.text-green {
  color: #059669;
}

.text-red {
  color: #dc2626;
}

.row-action {
  font-size: 0.68rem;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: transparent;
  cursor: pointer;
  color: rgba(0, 0, 0, 0.5);
  transition: all 0.15s;
  white-space: nowrap;
}

.row-action:hover {
  background: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.75);
}

.row-action--danger {
  border-color: rgba(239, 68, 68, 0.2);
  color: #dc2626;
}

.row-action--danger:hover {
  background: rgba(239, 68, 68, 0.07);
}

/* ── Dark mode ── */
@media (prefers-color-scheme: dark) {
  .tab-nav {
    background: rgba(255, 255, 255, 0.06);
  }

  .tab-btn {
    color: rgba(255, 255, 255, 0.4);
  }

  .tab-btn:hover {
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.75);
  }

  .tab-btn--active {
    background: rgba(255, 255, 255, 0.1);
    color: #818cf8;
    box-shadow: none;
  }

  .tab-badge {
    background: rgba(129, 140, 248, 0.2);
    color: #818cf8;
  }

  .tab-btn--active .tab-badge {
    background: rgba(129, 140, 248, 0.25);
  }

  .section-sub {
    color: rgba(255, 255, 255, 0.35);
  }

  .add-form {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .form-input {
    background: rgba(255, 255, 255, 0.07);
    border-color: rgba(255, 255, 255, 0.12);
    color: #fff;
  }

  .form-input:focus {
    border-color: #818cf8;
  }

  .stat--green {
    background: rgba(16, 185, 129, 0.15);
  }

  .stat--blue {
    background: rgba(14, 165, 233, 0.15);
  }

  .stat--red {
    background: rgba(239, 68, 68, 0.15);
  }

  .stat--amber {
    background: rgba(245, 158, 11, 0.15);
  }

  .stat-label {
    color: rgba(255, 255, 255, 0.4);
  }

  .data-table {
    border-color: rgba(255, 255, 255, 0.08);
  }

  .data-table th {
    background: rgba(255, 255, 255, 0.04);
    color: rgba(255, 255, 255, 0.4);
    border-color: rgba(255, 255, 255, 0.07);
  }

  .data-table td {
    border-color: rgba(255, 255, 255, 0.05);
    color: #e2e8f0;
  }

  .data-table tr:hover td {
    background: rgba(255, 255, 255, 0.03);
  }

  .muted {
    color: rgba(255, 255, 255, 0.38);
  }

  .status--inactive {
    background: rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.4);
  }

  .category-tag {
    background: rgba(129, 140, 248, 0.15);
    color: #818cf8;
  }

  .row-action {
    border-color: rgba(255, 255, 255, 0.12);
    color: rgba(255, 255, 255, 0.45);
  }

  .row-action:hover {
    background: rgba(255, 255, 255, 0.07);
    color: rgba(255, 255, 255, 0.75);
  }

  .row-action--danger {
    border-color: rgba(239, 68, 68, 0.25);
    color: #f87171;
  }

  .row-action--danger:hover {
    background: rgba(239, 68, 68, 0.1);
  }

  .panel-icon {
    background: rgba(129, 140, 248, 0.15);
    color: #818cf8;
  }

  .add-btn {
    background: rgba(129, 140, 248, 0.15) !important;
    color: #818cf8 !important;
    border-color: rgba(129, 140, 248, 0.25) !important;
  }
}
</style>