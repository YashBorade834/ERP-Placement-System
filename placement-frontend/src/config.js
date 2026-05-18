const USE_NGROK = import.meta.env.VITE_USE_NGROK === "true";

export const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === "true";
export const DEV_USER_ROLE = import.meta.env.VITE_DEV_USER_ROLE || "admin";
export const DEV_USER_ID = import.meta.env.VITE_DEV_USER_ID || "1";

export const API_URL = USE_NGROK
  ? import.meta.env.VITE_API_NGROK_URL
  : import.meta.env.VITE_API_LOCAL_URL;

export const SIS_BASE_URL = USE_NGROK
  ? import.meta.env.VITE_SIS_NGROK_URL
  : import.meta.env.VITE_SIS_LOCAL_URL;

export const AUTH_FRONTEND_URL = USE_NGROK
  ? import.meta.env.VITE_AUTH_FRONTEND_NGROK_URL
  : import.meta.env.VITE_AUTH_FRONTEND_LOCAL_URL;

export const AUTH_BACKEND_URL = USE_NGROK
  ? import.meta.env.VITE_AUTH_BACKEND_NGROK_URL
  : import.meta.env.VITE_AUTH_BACKEND_LOCAL_URL;

console.log("Frontend Configuration:", {
  USE_NGROK,
  API_URL,
  SIS_BASE_URL,
  AUTH_FRONTEND_URL,
  AUTH_BACKEND_URL
});
