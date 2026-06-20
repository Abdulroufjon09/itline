<template>
  <form class="add-lesson" @submit.prevent="create">
    <div>
      <label>Lesson name</label>
      <input v-model="title" required />
    </div>
    <div>
      <label>Group</label>
      <select v-model="group">
        <option v-for="g in groups" :key="g" :value="g">{{ g }}</option>
      </select>
    </div>
    <div class="actions">
      <button type="submit">Add Lesson</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUiStore } from '../stores/uiStore'

const ui = useUiStore()

const title = ref('')
const group = ref('')
// groups could come from backend; simple static fallback
const groups = ['A', 'B', 'C']

async function create() {
  ui.start()
  try {
    await fetch('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.value, group: group.value }),
    })
    title.value = ''
    group.value = ''
    window.dispatchEvent(new CustomEvent('app-alert', { detail: { type: 'success', message: 'Lesson created' } }))
  } catch (e) {
    window.dispatchEvent(new CustomEvent('app-alert', { detail: { type: 'error', message: 'Create failed' } }))
  } finally {
    ui.stop()
  }
}
</script>

<style scoped>
.add-lesson { display:flex; flex-direction:column; gap:8px; padding:12px; background:#fff; border-radius:8px }
.actions { margin-top:8px }
</style>
