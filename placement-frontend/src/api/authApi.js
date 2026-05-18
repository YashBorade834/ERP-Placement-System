import axios from "axios";
import { AUTH_BACKEND_URL, SIS_BASE_URL } from "../config";

export const verifyToken = async (token) => {
  // Assuming the auth backend has an endpoint to verify token and return user info
  // You might need to adjust the endpoint path (e.g., /api/auth/verify or /api/user/me)
  return axios.get(`${AUTH_BACKEND_URL}/api/user/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "ngrok-skip-browser-warning": "true",
    },
  });
};

export const getStudentSISData = async (studentId) => {
  return axios.get(`${SIS_BASE_URL}/api/students/${studentId}`, {
    headers: {
      "ngrok-skip-browser-warning": "true",
    }
  });
};
