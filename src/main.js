import { createRouter } from "./router.js";
import { HomePage } from "./pages/HomePage.js";
import { RecordPage } from "./pages/RecordPage.js";
import { DashboardPage } from "./pages/DashboardPage.js";
import { AiReplyPage } from "./pages/AiReplyPage.js";

const USER_ID_STORAGE_KEY = "nuanwo_user_id";

function createUserId() {
  if (window.crypto?.randomUUID) {
    return `user_${window.crypto.randomUUID()}`;
  }

  return `user_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
}

function getOrCreateUserId() {
  const savedUserId = localStorage.getItem(USER_ID_STORAGE_KEY);

  if (savedUserId) {
    return savedUserId;
  }

  const userId = createUserId();
  localStorage.setItem(USER_ID_STORAGE_KEY, userId);
  return userId;
}

window.USER_ID = getOrCreateUserId();

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
  },
});

router.start();
