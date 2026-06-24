<template>
  <div class="leaderboard">
    <ul>
      <li v-for="(u, idx) in users" :key="u.id" :class="['row', u.role]">
        <span class="rank">{{ idx + 1 }}</span>
        <span class="name">{{ u.name }} {{ u.surname }}</span>
        <span class="coins">🪙 {{ u.coin_balance  }}</span>
      </li>
    </ul>
    <div v-if="users.length === 0" class="empty">Ma'lumot yuklanmoqda...</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useCoinStore } from '../stores/coinStore'

const store = useCoinStore()
onMounted(() => store.fetchUsers(true))

const users = computed(() => store.users.slice(0, 10))
</script>

<style scoped>
.leaderboard { padding: 12px; background: #fff; border-radius: 8px }
.leaderboard ul { list-style: none; padding: 0; margin: 0 }
.leaderboard .row { display:flex; gap:12px; align-items:center; padding:6px 0; border-bottom:1px solid #eee }
.leaderboard .rank { width:28px; font-weight:700 }
.leaderboard .name { flex:1 }
.leaderboard .coins { margin-left:auto; font-weight:700 }
.leaderboard .student { background: linear-gradient(90deg,#f8fbff,#fff) }
.leaderboard .teacher { background: linear-gradient(90deg,#fff7f0,#fff) }
.leaderboard .admin { background: linear-gradient(90deg,#f4fff8,#fff) }
.leaderboard .manager { background: linear-gradient(90deg,#fff9f4,#fff) }
.empty { text-align:center; color:#aaa; padding: 20px 0; font-size:14px }
</style>