<template>
    <div class="min-h-screen bg-slate-50 p-6 font-sans">

        <!-- Header -->
        <div class="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <div class="w-1.5 h-6 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600"></div>
                    <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Moliya</h1>
                </div>
                <p class="text-sm text-slate-400 ml-3.5">To'lovlar va xarajatlar monitoringi</p>
            </div>
            <router-link to="/excellence"
                class="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 active:scale-95 text-slate-500 hover:text-rose-500 text-sm font-medium rounded-lg border border-slate-100 shadow-sm transition-all duration-150 w-full sm:w-auto">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Chiqish
            </router-link>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

            <!-- Income -->
            <div
                class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div
                    class="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full opacity-60 group-hover:opacity-100 transition-opacity">
                </div>
                <div class="relative">
                    <div class="flex items-center gap-2 mb-4">
                        <div
                            class="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm shadow-emerald-200">
                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2.5"
                                viewBox="0 0 24 24">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                            </svg>
                        </div>
                        <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">Daromad</span>
                    </div>
                    <p class="text-2xl font-bold text-slate-800 tabular-nums">{{ fmt(totalPayments) }}</p>
                    <p class="text-xs text-emerald-500 font-medium mt-1.5 flex items-center gap-1">
                        <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        {{ confirmedCount }} tasdiqlangan · {{ payments.length - confirmedCount }} kutilmoqda
                    </p>
                </div>
            </div>

            <!-- Expense -->
            <div
                class="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div
                    class="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-bl-full opacity-60 group-hover:opacity-100 transition-opacity">
                </div>
                <div class="relative">
                    <div class="flex items-center gap-2 mb-4">
                        <div
                            class="w-8 h-8 rounded-lg bg-rose-500 flex items-center justify-center shadow-sm shadow-rose-200">
                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2.5"
                                viewBox="0 0 24 24">
                                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" />
                            </svg>
                        </div>
                        <span class="text-xs font-medium text-slate-400 uppercase tracking-wider">Xarajat</span>
                    </div>
                    <p class="text-2xl font-bold text-slate-800 tabular-nums">{{ fmt(totalExpenses) }}</p>
                    <p class="text-xs text-rose-400 font-medium mt-1.5 flex items-center gap-1">
                        <span class="inline-block w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                        {{ expenses.length }} ta xarajat yozuvi
                    </p>
                </div>
            </div>

            <!-- Balance -->
            <div class="rounded-2xl p-5 relative overflow-hidden shadow-sm"
                :class="balance >= 0 ? 'bg-gradient-to-br from-indigo-500 to-indigo-700' : 'bg-gradient-to-br from-orange-400 to-rose-500'">
                <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full"></div>
                <div class="relative">
                    <div class="flex items-center gap-2 mb-4">
                        <div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2.5"
                                viewBox="0 0 24 24">
                                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                                <polyline points="16 7 22 7 22 13" />
                            </svg>
                        </div>
                        <span class="text-xs font-medium text-white/70 uppercase tracking-wider">Balans</span>
                    </div>
                    <p class="text-2xl font-bold text-white tabular-nums">
                        {{ balance >= 0 ? '+' : '' }}{{ fmt(balance) }}
                    </p>
                    <p class="text-xs text-white/70 font-medium mt-1.5 flex items-center gap-1">
                        <span>{{ balance >= 0 ? '↑ Ijobiy holat' : '↓ Manfiy holat' }}</span>
                    </p>
                </div>
            </div>
        </div>

        <!-- Tabs -->
        <div class="flex items-center justify-between mb-4">
            <div class="flex gap-1 bg-white border border-slate-100 shadow-sm rounded-xl p-1">
                <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key" :class="activeTab === tab.key
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'"
                    class="px-5 py-2 text-sm font-medium rounded-lg transition-all duration-150 flex items-center gap-2">
                    <span>{{ tab.label }}</span>
                    <span class="text-xs px-1.5 py-0.5 rounded-md"
                        :class="activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'">
                        {{ tab.key === 'payments' ? payments.length : expenses.length }}
                    </span>
                </button>
            </div>

            <!-- Search -->
            <div class="relative">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" fill="none"
                    stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                <input v-model="search" type="text" placeholder="Qidirish..."
                    class="pl-9 pr-4 py-2 text-sm bg-white border border-slate-100 shadow-sm rounded-xl text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition-all w-52" />
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
            <div class="flex flex-col items-center gap-3">
                <svg class="w-8 h-8 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p class="text-sm text-slate-400">Ma'lumotlar yuklanmoqda...</p>
            </div>
        </div>

        <!-- Payments Table -->
        <div v-else-if="activeTab === 'payments'"
            class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table class="w-full">
                <thead>
                    <tr class="border-b border-slate-100 bg-slate-50/70">
                        <th class="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5">
                            Talaba</th>
                        <th class="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5">
                            Miqdor</th>
                        <th class="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5">
                            Bosqich</th>
                        <th class="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5">
                            Oy</th>
                        <th class="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5">
                            Holat</th>
                        <th class="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5">
                            Amal</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                    <tr v-if="filteredPayments.length === 0">
                        <td colspan="6" class="px-5 py-12 text-center text-sm text-slate-400">Hech qanday to'lov
                            topilmadi</td>
                    </tr>
                    <tr v-for="p in filteredPayments" :key="p.id" class="hover:bg-slate-50/50 transition-colors group">
                        <td class="px-5 py-3.5">
                            <div class="flex items-center gap-2.5">
                                <div
                                    class="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 shrink-0">
                                    {{ initials(p.student_name) }}
                                </div>
                                <div>
                                    <span class="text-sm font-medium text-slate-700 block">{{ p.student_name }}</span>
                                    <span class="text-xs text-slate-400">{{ p.teacher_name }}</span>
                                </div>
                            </div>
                        </td>
                        <td class="px-5 py-3.5 text-sm font-bold tabular-nums"
                            :class="p.is_paid ? 'text-emerald-600' : 'text-slate-700'">
                            {{ fmt(p.amount_due) }}
                        </td>
                        <td class="px-5 py-3.5">
                            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                                {{ p.stage }}-bosqich
                            </span>
                        </td>
                        <td class="px-5 py-3.5 text-sm text-slate-400 tabular-nums">{{ formatMonth(p.month) }}</td>
                        <td class="px-5 py-3.5">
                            <span :class="p.is_paid
                                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                                : 'bg-amber-50 text-amber-600 ring-1 ring-amber-100'"
                                class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full">
                                <span class="w-1.5 h-1.5 rounded-full"
                                    :class="p.is_paid ? 'bg-emerald-400' : 'bg-amber-400'"></span>
                                {{ p.is_paid ? "To'langan" : 'Kutilmoqda' }}
                            </span>
                        </td>
                        <td class="px-5 py-3.5">
                            <button v-if="!p.is_paid" @click="confirmPayment(p.id)" :disabled="confirmingId === p.id"
                                class="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 active:scale-95">
                                {{ confirmingId === p.id ? '...' : 'Tasdiqlash' }}
                            </button>
                            <span v-else class="text-xs text-slate-300">—</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Expenses Table -->
        <div v-else-if="activeTab === 'expenses'"
            class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table class="w-full">
                <thead>
                    <tr class="border-b border-slate-100 bg-slate-50/70">
                        <th class="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5">
                            Nomi</th>
                        <th class="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5">
                            Miqdor</th>
                        <th class="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5">
                            Kategoriya</th>
                        <th class="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-5 py-3.5">
                            Sana</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                    <tr v-if="filteredExpenses.length === 0">
                        <td colspan="4" class="px-5 py-12 text-center text-sm text-slate-400">Hech qanday xarajat
                            topilmadi</td>
                    </tr>
                    <tr v-for="e in filteredExpenses" :key="e.id" class="hover:bg-slate-50/50 transition-colors">
                        <td class="px-5 py-3.5">
                            <div class="flex items-center gap-2.5">
                                <div class="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                                    <svg class="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor"
                                        stroke-width="2" viewBox="0 0 24 24">
                                        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" />
                                    </svg>
                                </div>
                                <span class="text-sm font-medium text-slate-700">{{ e.title }}</span>
                            </div>
                        </td>
                        <td class="px-5 py-3.5 text-sm font-bold text-rose-500 tabular-nums">−{{ fmt(e.amount) }}</td>
                        <td class="px-5 py-3.5">
                            <span
                                class="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                                {{ e.category }}
                            </span>
                        </td>
                        <td class="px-5 py-3.5 text-sm text-slate-400 tabular-nums">{{ e.date }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Toast -->
        <transition name="toast">
            <div v-if="toast.show"
                class="fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium z-50"
                :class="toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'">
                <svg v-if="toast.type === 'success'" class="w-4 h-4" fill="none" stroke="currentColor"
                    stroke-width="2.5" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {{ toast.message }}
            </div>
        </transition>

    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const API = 'https://itline-django-9s85.onrender.com/api'

const payments = ref([])
const expenses = ref([])
const loading = ref(true)
const activeTab = ref('payments')
const search = ref('')
const confirmingId = ref(null)
const toast = ref({ show: false, message: '', type: 'success' })

const tabs = [
    { key: 'payments', label: "To'lovlar" },
    { key: 'expenses', label: 'Xarajatlar' },
]

// ── Formatters ──
const fmt = n => (n ?? 0).toLocaleString('uz-UZ') + " so'm"
const formatDate = d => {
    if (!d) return '—'
    // Handle ISO strings
    if (d.includes('T') || d.includes('-')) {
        const dt = new Date(d)
        return `${String(dt.getDate()).padStart(2, '0')}.${String(dt.getMonth() + 1).padStart(2, '0')}.${dt.getFullYear()}`
    }
    return d
}
const initials = name => {
    if (!name) return '?'
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}
const monthNames = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
const formatMonth = m => {
    if (!m) return '—'
    const [year, month] = m.split('-')
    const idx = parseInt(month, 10) - 1
    return monthNames[idx] ? `${monthNames[idx]} ${year}` : m
}

// ── Computed ──
const totalPayments = computed(() => payments.value.reduce((s, p) => s + (p.amount_due ?? p.amount ?? 0), 0))
const totalExpenses = computed(() => expenses.value.reduce((s, e) => s + (e.amount ?? 0), 0))
const balance = computed(() => totalPayments.value - totalExpenses.value)
const confirmedCount = computed(() => payments.value.filter(p => p.is_paid ?? p.confirmed).length)

const filteredPayments = computed(() => {
    if (!search.value) return payments.value
    const q = search.value.toLowerCase()
    return payments.value.filter(p =>
        (p.student_name || '').toLowerCase().includes(q) ||
        (p.month || '').toLowerCase().includes(q) ||
        (p.teacher_name || '').toLowerCase().includes(q)
    )
})
const filteredExpenses = computed(() => {
    if (!search.value) return expenses.value
    const q = search.value.toLowerCase()
    return expenses.value.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    )
})

// ── Toast helper ──
const showToast = (message, type = 'success') => {
    toast.value = { show: true, message, type }
    setTimeout(() => { toast.value.show = false }, 3000)
}

// ── API calls ──
const loadPayments = async () => {
    try {
        const res = await fetch(`${API}/payments/`)
        console.log('payments status:', res.status)
        if (!res.ok) throw new Error()
        const data = await res.json()
        console.log('payments data:', data)
        payments.value = data
    } catch (err) {
        console.error('payments fetch error:', err)
        // Fallback mock
        payments.value = [
            { id: 1, student: 'Sardor Mirzayev', amount: 500000, description: 'Fevral oyi', date: '15.02.2025', confirmed: true },
            { id: 2, student: 'Dilnoza Xasanova', amount: 450000, description: 'Fevral oyi', date: '16.02.2025', confirmed: true },
            { id: 3, student: 'Jasur Qodirov', amount: 500000, description: 'Mart oyi', date: '03.03.2025', confirmed: false },
            { id: 4, student: 'Sherzod Aliyev', amount: 480000, description: 'Mart oyi', date: '04.03.2025', confirmed: true },
            { id: 5, student: 'Kamola Ergasheva', amount: 500000, description: 'Mart oyi', date: '05.03.2025', confirmed: false },
        ]
    }
}

const confirmPayment = async (id) => {
    confirmingId.value = id
    try {
        console.log('confirming payment id:', id)
        const res = await fetch(`${API}/payments/confirm/${id}/`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_paid: true })
        })
        console.log('confirm status:', res.status)
        if (!res.ok) throw new Error()
        const idx = payments.value.findIndex(p => p.id === id)
        if (idx !== -1) payments.value[idx].is_paid = true   // ⚠️ oldingi javobda aytilgan tuzatish ham shu yerda
        showToast("To'lov tasdiqlandi ✓")
    } catch (err) {
        console.error('confirm payment error:', err)
        showToast("Xatolik yuz berdi", 'error')
    } finally {
        confirmingId.value = null
    }
}
onMounted(async () => {
    await loadPayments()
    // Expenses: no backend endpoint, use mock data
    expenses.value = [
        { id: 1, title: "O'qituvchi maoshi", amount: 2000000, category: 'Maosh', date: '28.02.2025' },
        { id: 2, title: 'Internet', amount: 150000, category: 'Kommunal', date: '01.03.2025' },
        { id: 3, title: 'Doskalar', amount: 300000, category: 'Qurilmalar', date: '05.03.2025' },
        { id: 4, title: 'Konditsioner', amount: 450000, category: 'Qurilmalar', date: '10.03.2025' },
    ]
    loading.value = false
})
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-enter-from,
.toast-leave-to {
    opacity: 0;
    transform: translateY(12px) scale(0.95);
}
</style>