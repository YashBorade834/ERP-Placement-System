import axios from "./axios";

// 📤 UPLOAD RESUME
export const uploadResume = (studentId, file) => {
  const formData = new FormData();
  formData.append("student_id", studentId);
  formData.append("file", file);

  return axios.post("/student/resume/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// 📥 GET RESUME (Download)
export const getResume = (studentId) =>
  axios.get(`/student/resume/${studentId}`);

// ✅ CHECK IF RESUME EXISTS
export const checkResumeExists = (studentId) =>
  axios.get(`/student/resume/check/${studentId}`);

// 📋 GET ALL RESUMES (Admin)
export const getAllResumes = () =>
  axios.get("/student/resumes/all");

// 💾 DOWNLOAD RESUME FILE
export const downloadResume = (filePath) => {
  return axios.get(`/uploads/${filePath}`, {
    responseType: "blob",
  });
};