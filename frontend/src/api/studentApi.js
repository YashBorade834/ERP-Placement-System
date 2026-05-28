import axios from "./axios";

// 🎯 DRIVES - Student can see active drives
export const getActiveDrives = () => axios.get("/student/drives");

// ✅ ELIGIBILITY - Check if student is eligible for a drive
export const checkEligibility = (studentId, driveId) =>
  axios.post("/student/check-eligibility", {
    student_id: studentId,
    drive_id: driveId,
  });

// 📋 APPLY - Apply for a drive
export const applyForDrive = (studentId, driveId) =>
  axios.post("/student/apply", {
    student_id: studentId,
    drive_id: driveId,
  });

// 📊 MY APPLICATIONS - Get all my applications
export const getMyApplications = (studentId) =>
  axios.get(`/student/applications/${studentId}`);

// 🔍 APPLICATION DETAILS - Get single application details
export const getApplicationDetails = (applicationId) =>
  axios.get(`/student/application/${applicationId}`);

// 🚫 WITHDRAW - Withdraw an application
export const withdrawApplication = (applicationId) =>
  axios.put(`/student/application/${applicationId}/withdraw`);
