<template>
  <div class="leaderboard">
    <ul>
      <li v-for="(u, idx) in users" :key="u.id" :class="['row', u.role]">
        <span class="rank">{{ idx + 1 }}</span>
        <span class="name">{{ u.name }}</span>
        <span class="role">{{ u.role }}</span>
        <span class="coins">🪙 {{ u.coins }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useCoinStore } from '../stores/coinStore'

const store = useCoinStore()
onMounted(() => store.fetchUsers())



// show only top 10 for performance
const users = computed(() => store.topN(10))
</script>

<style scoped>
.leaderboard { padding: 12px; background: #fff; border-radius: 8px }
.leaderboard h2 { margin: 0 0 8px 0 }
.leaderboard ul { list-style: none; padding: 0; margin: 0 }
.leaderboard .row { display:flex; gap:12px; align-items:center; padding:6px 0; border-bottom:1px solid #eee }
.leaderboard .rank { width:28px; font-weight:700 }
.leaderboard .coins { margin-left:auto; font-weight:700 }
.leaderboard .student { background: linear-gradient(90deg,#f8fbff,#fff) }
.leaderboard .teacher { background: linear-gradient(90deg,#fff7f0,#fff) }
.leaderboard .admin { background: linear-gradient(90deg,#f4fff8,#fff) }
.leaderboard .manager { background: linear-gradient(90deg,#fff9f4,#fff) }
</style>
