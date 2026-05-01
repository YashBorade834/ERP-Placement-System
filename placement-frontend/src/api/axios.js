import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;
//  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";


const instance = axios.create({
  baseURL: API_URL,
  withCredentials: true   // 🔥 MUST
});

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

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