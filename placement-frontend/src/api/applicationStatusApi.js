import axios from "./axios";

// 📋 GET ALL APPLICATIONS (across all drives, for admin page)
export const getAllApplications = () =>
  axios.get("/student/application/all");

// 📋 GET ALL APPLICATIONS FOR A SPECIFIC DRIVE
export const getApplicationsForDrive = (driveId) =>
  axios.get(`/admin/application/drive/${driveId}/applications`);

// 📊 GET TOTAL APPLICATIONS COUNT
export const getApplicationsCount = () =>
  axios.get(`/admin/application/applications/count`);

// 🔧 SET CUSTOM STATUS + REMARKS (overall, uses round_id=1 as fallback)
export const setApplicationStatus = (applicationId, driveRoundId, status, remarks) =>
  axios.post(`/admin/application/${applicationId}/status`, null, {
    params: {
      drive_round_id: driveRoundId,
      status: status,
      remarks: remarks,
    },
  });

// ✅ SHORTLIST
export const shortlistApplication = (applicationId, remarks = "") =>
  axios.post(`/admin/application/${applicationId}/shortlist`, null, {
    params: { remarks },
  });

// ❌ REJECT
export const rejectApplication = (applicationId, remarks = "") =>
  axios.post(`/admin/application/${applicationId}/reject`, null, {
    params: { remarks },
  });

// 🎉 SELECT
export const selectApplication = (applicationId, remarks = "") =>
  axios.post(`/admin/application/${applicationId}/select`, null, {
    params: { remarks },
  });

// 📊 GET ALL APPLICATION STATUSES
export const getAllApplicationStatuses = () =>
  axios.get("/admin/application/");

// 🔍 GET STATUSES FOR ONE APPLICATION
export const getApplicationStatuses = (applicationId) =>
  axios.get(`/admin/application/${applicationId}/statuses`);

// 🔍 GET LATEST STATUS FOR ONE APPLICATION
export const getLatestApplicationStatus = (applicationId) =>
  axios.get(`/admin/application/${applicationId}/status/latest`);

// 🔄 GET ROUND-WISE STATUSES FOR AN APPLICATION
export const getRoundStatuses = (applicationId) =>
  axios.get(`/admin/application/${applicationId}/round-statuses`);

// 🔄 UPSERT STATUS FOR A SPECIFIC ROUND
export const setRoundStatus = (applicationId, roundId, status, remarks = "") =>
  axios.post(`/admin/application/${applicationId}/round/${roundId}/status`, null, {
    params: { status, remarks },
  });
