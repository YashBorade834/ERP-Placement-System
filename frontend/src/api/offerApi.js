import axios from "./axios";

// ✅ ADMIN ENDPOINTS

// Get full offer report (for Admin/TPO dashboard)
export const getOfferReport = () =>
  axios.get("/admin/offer/report");

// Get drives with selected students
export const getDrivesWithSelectedStudents = () => 
  axios.get("/admin/offer/drives/with-selected-students");

// Get selected students for a specific drive
export const getSelectedStudentsForDrive = (driveId) => 
  axios.get(`/admin/offer/drives/${driveId}/selected-students`);

// Release offers for a drive
export const releaseOffers = (data) => 
  axios.post("/admin/offer/release-offers", data);

// Get all offers
export const getOffers = () => 
  axios.get("/admin/offer/");

// Get offer by ID
export const getOffer = (id) => 
  axios.get(`/admin/offer/${id}`);

// Get offer by application ID
export const getOfferByApplication = (applicationId) => 
  axios.get(`/admin/offer/application/${applicationId}`);

// Update offer
export const updateOffer = (id, data) => 
  axios.put(`/admin/offer/${id}`, data);

// Delete offer
export const deleteOffer = (id) => 
  axios.delete(`/admin/offer/${id}`);

// ✅ STUDENT ENDPOINTS

// Get offers for student
export const getStudentOffers = (studentId) => 
  axios.get(`/student/offer/student/${studentId}`);

// Get specific offer
export const getStudentOffer = (id) => 
  axios.get(`/student/offer/${id}`);

// Accept offer
export const acceptOffer = (id) => 
  axios.put(`/student/offer/${id}/accept`);

// Reject offer with reason
export const rejectOffer = (id, reason) => 
  axios.put(`/student/offer/${id}/reject`, { reason });
