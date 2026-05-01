// import API from "./axios";

// // Create Company
// export const createCompany = (data) => API.post("/company/", data);

// // Get All Companies
// export const getCompanies = () => API.get("/company/");

// // Update Company
// export const updateCompany = (id, data) =>
//   API.put(`/company/${id}`, data);

import axios from "./axios";

export const getCompanies = () => axios.get("/admin/company/");
export const createCompany = (data) => axios.post("/admin/company/", data);
export const deleteCompany = (id) => axios.delete(`/admin/company/${id}`);