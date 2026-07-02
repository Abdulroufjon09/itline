import { createRouter, createWebHistory } from "vue-router";
import OfflineView from "@/views/offlineView.vue";

fetch("https://itline-django-9s85.onrender.com/api/teachers/").catch(() => {});

const lazy = (view: string) => () => import(`@/views/${view}.vue`);

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

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
    component: lazy("AdminProducts"),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/excellence/orders",
    component: lazy("Adminorders"),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/excellence/CoinSettings",
    component: lazy("coin_settings"),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach((to) => {
  const user = getUser();

  if (to.meta.offline) return;

  if (!navigator.onLine) {
    return { path: "/offline" };
  }

  if (to.meta.requiresAuth && !user) {
    return { path: "/login" };
  }

  if (to.meta.requiresGuest && user) {
    return { path: "/" };
  }

  if (to.meta.requiresAdmin && !user?.is_admin) {
    return { path: "/" };
  }
});

window.addEventListener("online", () => {
  if (router.currentRoute.value.path === "/offline") {
    router.back();
  }
});

window.addEventListener("offline", () => {
  router.push("/offline");
});

export default router;
