import { createRouter, createWebHistory } from "vue-router";
import LoginPage from "../views/LoginPage.vue";
import AppLayout from "../layouts/AppLayout.vue";
import DashboardPage from "../views/DashboardPage.vue";
import ClientsPage from "../views/ClientsPage.vue";
import ClientDetailPage from "../views/ClientDetailPage.vue";
import HousesPage from "../views/HousesPage.vue";
import HouseDetailPage from "../views/HouseDetailPage.vue";
import { supabase } from "../lib/supabase";

const requireAuth = async () => {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
};

const routes = [
  { path: "/login", component: LoginPage },
  {
    path: "/",
    component: AppLayout,
    children: [
      { path: "", redirect: "/dashboard" },
      { path: "dashboard", component: DashboardPage },
      { path: "clients", component: ClientsPage },
      { path: "clients/:id", component: ClientDetailPage },
      { path: "houses", component: HousesPage },
      { path: "houses/:id", component: HouseDetailPage },
    ],
    beforeEnter: async () => {
      const ok = await requireAuth();
      return ok ? true : "/login";
    },
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
