import axios from "./axios";

export const getMOUs = () => axios.get("/admin/mou/");

export const createMOU = (formData) => axios.post("/admin/mou/", formData, {
  headers: {
    "Content-Type": "multipart/form-data",
  },
});

export const deleteMOU = (mouId) => axios.delete(`/admin/mou/${mouId}`);
