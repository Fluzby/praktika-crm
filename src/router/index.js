import { createRouter, createWebHistory } from "vue-router";
import ClientsPage from "../views/ClientsPage.vue";
import HousesPage from "../views/HousesPage.vue";

const routes = [
  { path: "/", redirect: "/houses" },
  { path: "/clients", component: ClientsPage },
  { path: "/houses", component: HousesPage },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
