import { createRouter, createWebHistory } from "vue-router";
import LoginPage from "../views/LoginPage.vue";
import AppLayout from "../layouts/AppLayout.vue";
import DashboardPage from "../views/DashboardPage.vue";
import ClientsPage from "../views/ClientsPage.vue";
import ClientDetailPage from "../views/ClientDetailPage.vue";
import HousesPage from "../views/HousesPage.vue";
import HouseDetailPage from "../views/HouseDetailPage.vue";
import CalendarPage from "../views/CalendarPage.vue";
import ArchivePage from "../views/ArchivePage.vue";
import SettingsPage from "../pages/SettingsPage.vue";
import { supabase } from "../lib/supabase";

const requireAuth = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      const message = (error.message || "").toLowerCase();
      if (message.includes("refresh token")) {
        await supabase.auth.signOut({ scope: "local" });
      }
      return false;
    }

    return !!data.session;
  } catch (error) {
    const message = (error?.message || "").toLowerCase();
    if (message.includes("refresh token")) {
      await supabase.auth.signOut({ scope: "local" });
    }
    return false;
  }
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
      { path: "calendar", component: CalendarPage },
      { path: "archive", component: ArchivePage },
      { path: "settings", component: SettingsPage },
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
