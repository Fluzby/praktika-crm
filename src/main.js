import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";
import { router } from "./router";
import { applyTheme } from "./lib/settings";

const EASTER_ART = `
⠐⣪⡑⣤⣶⣶⣶⣦⡔⣩⡒⠀
⢸⣯⣾⣿⢏⣿⣏⢿⣿⣮⣿⠀
⢸⣿⢸⡗⣶⠙⢱⡖⣿⢸⣿⠀
⢸⡿⠀⠳⣄⣐⣂⡴⠃⠸⣿⠀
⣾⠃⠀⡵⡔⠕⠕⡰⡅⠀⢻⡆
⢹⡆⠘⢴⠙⠑⠉⢳⡱⠀⣾⠁
⠊⠀⠀⠈⡖⡖⡖⡎⠀⠀⠈⠂
⠀⠀⠀⠀⠉⠁⠉⠁⠀⠀⠀⠀
`;

if (typeof window !== "undefined" && typeof console !== "undefined") {
  console.info(EASTER_ART);
}

applyTheme();
createApp(App).use(router).mount("#app");
