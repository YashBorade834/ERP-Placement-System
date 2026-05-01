import axios from "./axios";

export const getDrives = () => axios.get("/admin/drive/");
export const createDrive = (data) => axios.post("/admin/drive/", data);
export const createCompleteDrive = (data) => axios.post("/admin/drive/complete/create", data);