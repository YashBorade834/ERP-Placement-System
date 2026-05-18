import axios from "./axios";

export const getDrives = () => axios.get("/admin/drive/");
export const getDrive = (id) => axios.get(`/admin/drive/${id}`);
export const getCompleteDrive = (id) => axios.get(`/admin/drive/complete/${id}`);
export const createDrive = (data) => axios.post("/admin/drive/", data);
export const updateDrive = (id, data) => axios.put(`/admin/drive/${id}`, data);
export const updateCompleteDrive = (id, data) => axios.put(`/admin/drive/complete/${id}`, data);
export const createCompleteDrive = (data) => axios.post("/admin/drive/complete/create", data);