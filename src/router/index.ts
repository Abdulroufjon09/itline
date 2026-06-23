import { createRouter, createWebHistory } from "vue-router";

const lazy = (view: string) => {
  return () => import(`@/views/${view}.vue`);
};

const routes = [
  {
    path: "/login",
    component: lazy("register"),
  },
  {
    path: "/",
    component: lazy("home"),
  },
  {
    path: "/students",
    component: lazy("Students"),
  },
  {
    path: "/admin",
    component: lazy("admin"),
  },
  {
    path: "/Attendance",
    component: lazy("AttendanceView"),
  },
  {
    path: "/excellence",
    component: lazy("excellence"),
  },
  {
    path: "/groups",
    component: lazy("groups"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
