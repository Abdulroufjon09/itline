<template>
  <div class="min-h-screen bg-[#eef0f7] flex flex-col pb-28 font-nunito">
    <!-- Header -->
    <div class="px-5 pt-12 pb-4">
      <h1 class="text-2xl font-black text-[#1e1040] tracking-tight">
        Leaderboard
      </h1>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="flex flex-col items-center justify-center flex-1 gap-3">
      <div
        class="w-10 h-10 rounded-full border-4 border-purple-100 border-t-purple-500 animate-spin"></div>
      <p class="text-gray-400 text-sm font-semibold">Yuklanmoqda...</p>
    </div>

    <div v-else class="px-4 flex flex-col gap-3">
      <!-- Top 3 Podium -->
      <div class="flex items-end justify-center gap-3 py-6">
        <!-- 2nd -->
        <div class="flex flex-col items-center gap-2">
          <div class="relative">
            <div
              class="w-16 h-16 rounded-full bg-[#1e2130] ring-4 ring-gray-300 flex items-center justify-center text-xl font-black text-white shadow-md">
              {{ users[1]?.profiles?.full_name?.charAt(0) || "?" }}
            </div>
            <span
              class="absolute -bottom-1 -right-1 bg-gray-400 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow"
              >2</span
            >
          </div>
          <p
            class="text-xs font-bold text-gray-500 max-w-[72px] truncate text-center">
            {{ users[1]?.profiles?.full_name?.split(" ")[0] || "—" }}
          </p>
          <div class="bg-white rounded-xl px-3 py-1 shadow-sm">
            <span class="text-gray-500 text-xs font-black"
              >{{ users[1]?.passed_quizzes || 0 }} ✅</span
            >
          </div>
          <div
            class="w-20 h-16 bg-white rounded-t-2xl flex items-center justify-center shadow-sm">
            <span class="text-gray-400 text-2xl font-black">2</span>
          </div>
        </div>

        <!-- 1st -->
        <div class="flex flex-col items-center gap-2 -mb-2">
          <span class="text-2xl">👑</span>
          <div class="relative">
            <div
              class="w-20 h-20 rounded-full bg-[#1a2a3a] ring-4 ring-cyan-400 flex items-center justify-center text-2xl font-black text-white shadow-lg">
              {{ users[0]?.profiles?.full_name?.charAt(0) || "?" }}
            </div>
            <span
              class="absolute -bottom-1 -right-1 bg-cyan-400 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow"
              >1</span
            >
          </div>
          <p
            class="text-sm font-black text-[#1e1040] max-w-[80px] truncate text-center">
            {{ users[0]?.profiles?.full_name?.split(" ")[0] || "—" }}
          </p>
          <div class="bg-cyan-50 rounded-xl px-3 py-1 shadow-sm">
            <span class="text-cyan-500 text-xs font-black"
              >{{ users[0]?.passed_quizzes || 0 }} ✅</span
            >
          </div>
          <div
            class="w-20 h-24 bg-gradient-to-b from-cyan-100 to-white rounded-t-2xl flex items-center justify-center shadow-sm">
            <span class="text-cyan-400 text-3xl font-black">1</span>
          </div>
        </div>

        <!-- 3rd -->
        <div class="flex flex-col items-center gap-2">
          <div class="relative">
            <div
              class="w-16 h-16 rounded-full bg-[#2a1a10] ring-4 ring-orange-300 flex items-center justify-center text-xl font-black text-white shadow-md">
              {{ users[2]?.profiles?.full_name?.charAt(0) || "?" }}
            </div>
            <span
              class="absolute -bottom-1 -right-1 bg-orange-400 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow"
              >3</span
            >
          </div>
          <p
            class="text-xs font-bold text-gray-500 max-w-[72px] truncate text-center">
            {{ users[2]?.profiles?.full_name?.split(" ")[0] || "—" }}
          </p>
          <div class="bg-orange-50 rounded-xl px-3 py-1 shadow-sm">
            <span class="text-orange-400 text-xs font-black"
              >{{ users[2]?.passed_quizzes || 0 }} ✅</span
            >
          </div>
          <div
            class="w-20 h-10 bg-white rounded-t-2xl flex items-center justify-center shadow-sm">
            <span class="text-orange-400 text-2xl font-black">3</span>
          </div>
        </div>
      </div>

      <div class="h-px bg-purple-100 mb-1"></div>

      <div
        v-for="(user, index) in users.slice(3)"
        :key="user.user_id"
        class="flex items-center gap-4 bg-white rounded-2xl px-4 py-3 shadow-sm shadow-purple-50">
        <span class="text-gray-400 text-sm font-black w-5 text-center">{{
          index + 4
        }}</span>

        <div
          class="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-sm font-black text-purple-400 flex-shrink-0 overflow-hidden">
          <img
            v-if="user.profiles?.avatar_url"
            :src="user.profiles.avatar_url"
            class="w-full h-full object-cover" />
          <span v-else>{{ user.profiles?.full_name?.charAt(0) || "?" }}</span>
        </div>

        <div class="flex-1 min-w-0">
          <p class="text-[#1e1040] font-bold text-sm truncate">
            {{ user.profiles?.full_name || "Noma'lum" }}
          </p>
          <p class="text-gray-400 text-xs font-semibold">
            {{ user.passed_quizzes }} quiz yakunlandi
          </p>
        </div>

        <div class="bg-purple-50 rounded-xl px-3 py-1">
          <span class="text-purple-500 text-xs font-black"
            >{{ user.passed_quizzes }} ✅</span
          >
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="users.length === 0"
        class="flex flex-col items-center justify-center py-20 gap-3">
        <span class="text-5xl">🏆</span>
        <p class="text-gray-400 font-semibold text-sm">Hali hech kim yo'q</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useLeaderboardStore } from "../stores/LeaderboardStore";
import { storeToRefs } from "pinia";

const store = useLeaderboardStore();
const { users, loading } = storeToRefs(store);

onMounted(() => {
  store.fetchLeaderboard();
});
</script>
