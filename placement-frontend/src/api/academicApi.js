import axiosInstance from "./axios";

export const getAcademicProfile = (studentId) => {
  return axiosInstance.get(`/student/academic/${studentId}`);
};

export const updateAcademicProfile = (data) => {
  return axiosInstance.post("/student/academic/", data);
};
