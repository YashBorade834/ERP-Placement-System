import axios from "axios";
import { AUTH_BACKEND_URL, SIS_BASE_URL, API_URL } from "../config";

export const verifyToken = async (token) => {
  return axios.get(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "ngrok-skip-browser-warning": "true",
    },
  }).then(res => res.data);
};

export const getStudentSISData = async (studentId) => {
  return axios.get(`${SIS_BASE_URL}/api/students/${studentId}`, {
    headers: {
      "ngrok-skip-browser-warning": "true",
    }
  });
};
