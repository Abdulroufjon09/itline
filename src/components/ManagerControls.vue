<template>
  <div class="manager-controls">
    <h4>Manager Controls</h4>

    <div class="row">
      <label>User</label>
      <select v-model="selectedId">
        <option value="">-- tanlang --</option>
        <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }} ({{ u.role }})</option>
      </select>
    </div>

    <div class="row">
      <label>Attendance</label>
      <div class="buttons">
        <button @click="mark('present')">Present (+10)</button>
        <button @click="mark('late')">Late (-5)</button>
        <button @click="mark('absent')">Absent (-10)</button>
      </div>
    </div>

    <div class="row">
      <label>Task</label>
      <div class="buttons">
        <button @click="task(true)">Done (+10)</button>
        <button @click="task(false)">Missed (-10)</button>
      </div>
    </div>

    <div class="row">
      <label>Exam</label>
      <div class="buttons">
        <button @click="exam(true)">Pass (+80 + bonus 20)</button>
        <button @click="exam(false)">Fail (0)</button>
      </div>
    </div>

    <div class="row">
      <label>Referral</label>
      <div class="buttons">
        <button @click="referral">Referral (+100)</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCoinStore } from '../stores/coinStore'

const coins = useCoinStore()
const selectedId = ref('')

onMounted(() => coins.fetchUsers())

const users = coins.users

function pushAlert(message: string, type: string = 'success') {
  window.dispatchEvent(new CustomEvent('app-alert', { detail: { message, type } }))
}

async function mark(status: 'present' | 'absent' | 'late') {
  if (!selectedId.value) return pushAlert('Foydalanuvchi tanlanmadi', 'error')
  await coins.applyAttendance(selectedId.value, status)
  pushAlert('Davomat yangilandi')
}

async function task(done: boolean) {
  if (!selectedId.value) return pushAlert('Foydalanuvchi tanlanmadi', 'error')
  await coins.applyTask(selectedId.value, done)
  pushAlert(done ? 'Vazifa qo`shildi' : 'Vazifa yetishmadi')
}

async function exam(passed: boolean) {
  if (!selectedId.value) return pushAlert('Foydalanuvchi tanlanmadi', 'error')
  await coins.applyExam(selectedId.value, passed)
  pushAlert(passed ? 'Imtihon o‘tildi' : 'Imtihon o‘tmagan')
}

async function referral() {
  if (!selectedId.value) return pushAlert('Foydalanuvchi tanlanmadi', 'error')
  await coins.applyReferral(selectedId.value)
  pushAlert('Sherik uchun bonus berildi')
}
</script>

<style scoped>
.manager-controls { padding:12px; background:#fff; border-radius:8px }
.manager-controls h4 { margin:0 0 8px 0 }
.row { margin-bottom:8px }
.buttons { display:flex; gap:8px; margin-top:6px }
.buttons button { padding:6px 10px; border-radius:8px; border:1px solid #ddd }
</style>
