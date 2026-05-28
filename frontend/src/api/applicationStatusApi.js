import axios from "./axios";

// ✅ Shortlist an application
export const shortlistApplication = (applicationId, remarks = "") =>
  axios.post(`/admin/application/${applicationId}/shortlist`, null, {
    params: { remarks },
  });

// ❌ Reject an application
export const rejectApplication = (applicationId, remarks = "") =>
  axios.post(`/admin/application/${applicationId}/reject`, null, {
    params: { remarks },
  });

// 🎉 Select (final offer) an application
export const selectApplication = (applicationId, remarks = "") =>
  axios.post(`/admin/application/${applicationId}/select`, null, {
    params: { remarks },
  });

// 📊 Get all application statuses (admin view)
export const setApplicationStatus = (applicationId, driveRoundId, status, remarks = "") =>
  axios.post(`/admin/application/${applicationId}/status`, null, {
    params: { drive_round_id: driveRoundId, status, remarks },
  });

// 🔍 Get statuses for one application
export const getApplicationStatuses = (applicationId) =>
  axios.get(`/admin/application/${applicationId}/statuses`);

// 🔍 Get latest status for one application
export const getLatestApplicationStatus = (applicationId) =>
  axios.get(`/admin/application/${applicationId}/status/latest`);

// 🔄 Get round-wise statuses for an application
export const getRoundStatuses = (applicationId) =>
  axios.get(`/admin/application/${applicationId}/round-statuses`);

// 🔄 Upsert status for a specific round
export const setRoundStatus = (applicationId, roundId, status, remarks = "") =>
  axios.post(`/admin/application/${applicationId}/round/${roundId}/status`, null, {
    params: { status, remarks },
  });

// 📊 Get count of applications (admin dashboard)
export const getApplicationsCount = () =>
  axios.get(`/admin/application/applications/count`);

// 📄 Get all applications for a specific drive (used in admin dashboard tables)
export const getApplicationsForDrive = (driveId) =>
  axios.get(`/admin/application/drive/${driveId}/applications`);