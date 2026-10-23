import { createRouter } from "./router.js";
import { HomePage } from "./pages/HomePage.js";
import { RecordPage } from "./pages/RecordPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { AiReplyPage } from "./pages/AiReplyPage.js";
import { CalendarPage } from "./pages/CalendarPage.js";
import { BackgroundSoundPicker } from "./components/BackgroundSoundPicker.js";

// Keep the old device identifier untouched for an operator-assisted migration.
// It is never used as proof of identity or sent to the API.
window.USER_NICKNAME = localStorage.getItem("nuanwo_nickname") ?? "";

// 全局背景音乐——跨页面持续播放
const soundPicker = BackgroundSoundPicker({
  onChange(sound) {
    document.documentElement.style.setProperty("--ambient-overlay", sound.overlay);
  },
});
document.body.append(soundPicker);

const app = document.querySelector("#app");

if (!app) {
  throw new Error("App outlet was not found.");
}

const router = createRouter({
  outlet: app,
  routes: {
    "/": HomePage,
    "/record": RecordPage,
    "/dashboard": DashboardPage,
    "/ai-reply": AiReplyPage,
    "/calendar": CalendarPage,
  },
});

router.start();
