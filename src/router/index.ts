import { createRouter, createWebHistory } from "vue-router";
import OfflineView from "@/views/OfflineView.vue"; // static — offline paytda ham ishlaydi

// ─── Server warm-up (Render.com cold start oldini olish) ─────
// /api/teachers/ mavjud endpoint — 404 bo'lmaydi
fetch("https://itline-django-9s85.onrender.com/api/teachers/").catch(() => {});

// ─── Lazy loader ─────────────────────────────────────────────
const lazy = (view: string) => () => import(`@/views/${view}.vue`);

// ─── Auth helpers ─────────────────────────────────────────────
function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

// ─── Routes ──────────────────────────────────────────────────
const routes = [
  {
    path: "/login",
    component: lazy("register"),
    meta: { requiresGuest: true },
  },
  {
    path: "/",
    component: lazy("home"),
    meta: { requiresAuth: true },
  },
  {
    path: "/students",
    component: lazy("Students"),
    meta: { requiresAuth: true },
  },
  {
    path: "/admin",
    component: lazy("admin"),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/attendance",
    component: lazy("AttendanceView"),
    meta: { requiresAuth: true },
  },
  {
    path: "/excellence",
    component: lazy("excellence"),
    meta: { requiresAuth: true },
  },
  // Offline sahifa — static import (lazy bo'lsa tarmoqsiz yuklanmaydi)
  {
    path: "/offline",
    component: OfflineView,
    meta: { offline: true },
  },
  // 404
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
  {
    path: "/groups",
    component: lazy("groups"),
  },
  {
    path: "/excellence/products",
    component: () => import("@/views/AdminProducts.vue"),
  },
  {
    path: "/excellence/orders",
    component: () => import("@/views/Adminorders.vue"),
  },
];

// ─── Router ──────────────────────────────────────────────────
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

// ─── Global guard ─────────────────────────────────────────────
router.beforeEach((to) => {
  const user = getUser();

  // /offline sahifasiga loop bo'lmasin
  if (to.meta.offline) return;

  // Internet yo'q — offline sahifaga yo'nalt
  if (!navigator.onLine) {
    return { path: "/offline" };
  }

  // Login qilmagan → faqat /login ga ruxsat
  if (to.meta.requiresAuth && !user) {
    return { path: "/login" };
  }

  // Login qilgan → /login ga kirmasin
  if (to.meta.requiresGuest && user) {
    return { path: "/" };
  }

  // Admin sahifasi — admin bo'lmasa uyga
  if (to.meta.requiresAdmin && !user?.is_admin) {
    return { path: "/" };
  }
});

// ─── Online/Offline hodisalari ────────────────────────────────
// Internet tiklansa — orqaga qayt
window.addEventListener("online", () => {
  if (router.currentRoute.value.path === "/offline") {
    router.back();
  }
});

// Internet uzilsa — offline sahifaga o't
window.addEventListener("offline", () => {
  router.push("/offline");
});

export default router;
