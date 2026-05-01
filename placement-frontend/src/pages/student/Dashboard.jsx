import { useEffect, useState } from "react";
import {
  getActiveDrives,
  checkEligibility,
  applyForDrive,
  getMyApplications,
  withdrawApplication,
} from "../../api/studentApi";

export default function StudentDashboard() {
  // Dummy student ID (replace with actual auth later)
  const STUDENT_ID = 1;

  const [drives, setDrives] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedDrive, setSelectedDrive] = useState(null);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [eligibilityCheck, setEligibilityCheck] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);

  const [activeTab, setActiveTab] = useState("available"); // available | my-applications

  // Load drives and applications on mount
  useEffect(() => {
    loadDrives();
    loadMyApplications();
  }, []);

  const loadDrives = async () => {
    try {
      setLoading(true);
      const res = await getActiveDrives();
      setDrives(res.data);
      setError("");
    } catch (err) {
      console.error("Error loading drives:", err);
      setError("Failed to load drives: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadMyApplications = async () => {
    try {
      const res = await getMyApplications(STUDENT_ID);
      setMyApplications(res.data);
    } catch (err) {
      console.error("Error loading applications:", err);
    }
  };

  // Check if student already applied for a drive
  const hasApplied = (driveId) => {
    return myApplications.some(app => app.drive_id === driveId && app.is_active);
  };

  // Check eligibility before applying
  const handleCheckEligibility = async (drive) => {
    try {
      setEligibilityLoading(true);
      setSelectedDrive(drive);
      const res = await checkEligibility(STUDENT_ID, drive.id);
      setEligibilityCheck(res.data);
      setShowEligibilityModal(true);
    } catch (err) {
      console.error("Error checking eligibility:", err);
      setError("Error checking eligibility: " + (err.response?.data?.detail || err.message));
    } finally {
      setEligibilityLoading(false);
    }
  };

  // Apply for drive
  const handleApply = async () => {
    if (!eligibilityCheck?.eligible) {
      setError("You are not eligible for this drive");
      return;
    }

    try {
      setLoading(true);
      await applyForDrive(STUDENT_ID, selectedDrive.id);
      setSuccess(`✓ Applied successfully for ${selectedDrive.title}!`);
      setShowEligibilityModal(false);
      loadDrives();
      loadMyApplications();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error applying:", err);
      setError("Failed to apply: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Withdraw application
  const handleWithdraw = async (applicationId) => {
    if (!window.confirm("Are you sure you want to withdraw this application?")) {
      return;
    }

    try {
      setLoading(true);
      await withdrawApplication(applicationId);
      setSuccess("Application withdrawn");
      loadMyApplications();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error withdrawing:", err);
      setError("Failed to withdraw: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status) => {
    const statusMap = {
      APPLIED: "bg-blue-100 text-blue-700",
      SHORTLISTED: "bg-yellow-100 text-yellow-700",
      SELECTED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
      PENDING: "bg-gray-100 text-gray-700",
      WITHDRAWN: "bg-gray-200 text-gray-600",
    };
    return statusMap[status] || "bg-gray-100 text-gray-700";
  };

  const getStatusEmoji = (status) => {
    const emojiMap = {
      APPLIED: "📝",
      SHORTLISTED: "✅",
      SELECTED: "🎉",
      REJECTED: "❌",
      PENDING: "⏳",
      WITHDRAWN: "🗑️",
    };
    return emojiMap[status] || "📋";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8">
        <h1 className="text-4xl font-bold">🎯 Student Dashboard</h1>
        <p className="mt-2 text-blue-100">Student ID: {STUDENT_ID} | Find and apply for placement drives</p>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto p-6">
        {/* MESSAGES */}
        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-700 font-bold">✕</button>
        </div>}
        {success && <div className="bg-green-100 text-green-700 p-4 rounded mb-4 flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="text-green-700 font-bold">✕</button>
        </div>}

        {/* TABS */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab("available")}
            className={`px-6 py-3 rounded font-semibold transition ${
              activeTab === "available"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            📋 Available Drives ({drives.length})
          </button>
          <button
            onClick={() => setActiveTab("my-applications")}
            className={`px-6 py-3 rounded font-semibold transition ${
              activeTab === "my-applications"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            📊 My Applications ({myApplications.length})
          </button>
        </div>

        {/* TAB 1: AVAILABLE DRIVES */}
        {activeTab === "available" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading drives...</div>
            ) : drives.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No active drives available right now</div>
            ) : (
              drives.map(drive => (
                <div key={drive.id} className="bg-white p-6 rounded shadow-md hover:shadow-lg transition border-l-4 border-blue-500">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Left: Drive Info */}
                    <div className="md:col-span-2">
                      <h3 className="text-xl font-bold text-gray-800">{drive.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">📍 {drive.company_name} - {drive.venue}</p>
                      <p className="text-gray-600 text-sm">🏢 Industry: {drive.industry}</p>
                      {drive.drive_date && <p className="text-gray-600 text-sm">📅 Drive Date: {drive.drive_date}</p>}
                      {drive.description && (
                        <p className="text-gray-600 text-sm mt-2 line-clamp-2">{drive.description}</p>
                      )}
                    </div>

                    {/* Middle: Eligibility Info */}
                    {drive.eligibility && (
                      <div className="bg-blue-50 p-3 rounded border-l-2 border-blue-400">
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">Eligibility Criteria:</h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {drive.eligibility.min_cgpa && <li>📊 Min CGPA: {drive.eligibility.min_cgpa}</li>}
                          {drive.eligibility.allowed_branches && (
                            <li>🎓 Branches: {drive.eligibility.allowed_branches}</li>
                          )}
                          {drive.eligibility.min_batch && (
                            <li>📆 Batch: {drive.eligibility.min_batch}-{drive.eligibility.max_batch}</li>
                          )}
                          {drive.eligibility.max_backlogs !== null && (
                            <li>❌ Max Backlogs: {drive.eligibility.max_backlogs}</li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Right: Action Buttons */}
                    <div className="flex flex-col gap-2 justify-center">
                      {hasApplied(drive.id) ? (
                        <button
                          disabled
                          className="w-full bg-gray-400 text-white px-4 py-2 rounded font-semibold cursor-not-allowed"
                        >
                          ✓ Already Applied
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCheckEligibility(drive)}
                          disabled={eligibilityLoading || loading}
                          className="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold transition disabled:bg-gray-400"
                        >
                          {eligibilityLoading ? "Checking..." : "✓ Apply Now"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: MY APPLICATIONS */}
        {activeTab === "my-applications" && (
          <div className="space-y-4">
            {myApplications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No applications yet. <span className="cursor-pointer text-blue-600 hover:underline" onClick={() => setActiveTab("available")}>Apply for drives</span>
              </div>
            ) : (
              myApplications.map(app => (
                <div key={app.id} className="bg-white p-6 rounded shadow-md border-l-4 border-purple-500">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Application Info */}
                    <div className="md:col-span-2">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">{app.drive_title}</h3>
                          <p className="text-gray-600 text-sm">🏢 {app.company_name} • 📍 {app.venue}</p>
                        </div>
                        <span className={`px-3 py-1 rounded text-sm font-semibold ${getStatusBadgeColor(app.application_status)}`}>
                          {getStatusEmoji(app.application_status)} {app.application_status}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1 mt-3">
                        <p>📤 Applied: {new Date(app.applied_at).toLocaleDateString()}</p>
                        {app.drive_date && <p>📅 Drive Date: {app.drive_date}</p>}
                        {app.feedback && <p>💬 Feedback: {app.feedback}</p>}
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col gap-2 justify-between">
                      <div className="bg-purple-50 p-3 rounded">
                        <p className="text-xs text-gray-600 font-semibold mb-1">STATUS DETAILS</p>
                        <p className="text-sm font-bold text-purple-600">{app.application_status}</p>
                        {app.feedback && <p className="text-xs text-gray-600 mt-1">{app.feedback}</p>}
                      </div>

                      {app.is_active && app.application_status === "APPLIED" && (
                        <button
                          onClick={() => handleWithdraw(app.id)}
                          disabled={loading}
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-semibold transition disabled:bg-gray-400"
                        >
                          🗑️ Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ELIGIBILITY CHECK MODAL */}
      {showEligibilityModal && selectedDrive && eligibilityCheck && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-lg">
              <h2 className="text-2xl font-bold">Eligibility Check</h2>
              <p className="text-blue-100">Position: {selectedDrive.title} at {selectedDrive.company_name}</p>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Eligibility Status */}
              <div
                className={`p-4 rounded-lg ${
                  eligibilityCheck.eligible
                    ? "bg-green-50 border-l-4 border-green-500"
                    : "bg-red-50 border-l-4 border-red-500"
                }`}
              >
                <h3 className={`font-bold text-lg ${eligibilityCheck.eligible ? "text-green-700" : "text-red-700"}`}>
                  {eligibilityCheck.eligible ? "✓ You Are Eligible!" : "✗ Not Eligible"}
                </h3>
                <p className={`text-sm ${eligibilityCheck.eligible ? "text-green-600" : "text-red-600"}`}>
                  {eligibilityCheck.message}
                </p>
              </div>

              {/* Eligibility Details */}
              {selectedDrive.eligibility && (
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Required Criteria:</h4>
                  <div className="bg-gray-50 p-4 rounded space-y-2 text-sm">
                    {selectedDrive.eligibility.min_cgpa && (
                      <p className="flex justify-between">
                        <span>📊 Minimum CGPA:</span>
                        <span className="font-semibold">{selectedDrive.eligibility.min_cgpa}</span>
                      </p>
                    )}
                    {selectedDrive.eligibility.allowed_branches && (
                      <p className="flex justify-between">
                        <span>🎓 Allowed Branches:</span>
                        <span className="font-semibold">{selectedDrive.eligibility.allowed_branches}</span>
                      </p>
                    )}
                    {selectedDrive.eligibility.min_batch && (
                      <p className="flex justify-between">
                        <span>📆 Batch Range:</span>
                        <span className="font-semibold">
                          {selectedDrive.eligibility.min_batch} - {selectedDrive.eligibility.max_batch}
                        </span>
                      </p>
                    )}
                    {selectedDrive.eligibility.max_backlogs !== null && (
                      <p className="flex justify-between">
                        <span>❌ Max Backlogs:</span>
                        <span className="font-semibold">{selectedDrive.eligibility.max_backlogs}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Mismatches */}
              {eligibilityCheck.mismatches && eligibilityCheck.mismatches.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-700 mb-2">⚠️ Eligibility Issues:</h4>
                  <div className="bg-red-50 p-4 rounded space-y-2">
                    {eligibilityCheck.mismatches.map((mismatch, idx) => (
                      <p key={idx} className="text-sm text-red-600">
                        • {mismatch}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Dummy Student Data Note */}
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm text-yellow-700">
                <p className="font-semibold mb-1">💡 Note:</p>
                <p>Your student data is currently using dummy values. Once SIS module integration is complete, actual student details will be used for eligibility checking.</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="border-t p-6 flex gap-3 justify-end">
              <button
                onClick={() => setShowEligibilityModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={!eligibilityCheck.eligible || loading}
                className={`px-6 py-2 rounded font-semibold text-white transition ${
                  eligibilityCheck.eligible
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                {loading ? "Applying..." : "✓ Confirm Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}