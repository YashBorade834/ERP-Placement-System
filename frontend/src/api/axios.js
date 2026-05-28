import axios from "axios";
import { API_URL, AUTH_FRONTEND_URL } from "../config";

const instance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// Add a request interceptor to include the auth token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Handle 401 Unauthorized
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized API call. Redirecting to login...");
      localStorage.removeItem("token");
      localStorage.removeItem("erp_user");
      sessionStorage.removeItem("token");
      window.location.href = `${AUTH_FRONTEND_URL}/login?redirect=${window.location.origin}`;
      return Promise.reject(error);
    }

    // retry only once
    if (!config.__retry) {
      config.__retry = true;

      console.log("Retrying API call...");
      return instance(config);
    }

    return Promise.reject(error);
  }
);

export default instance;