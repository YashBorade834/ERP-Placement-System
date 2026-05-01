import { useEffect, useState } from "react";
import {
  shortlistApplication,
  rejectApplication,
  selectApplication,
  setApplicationStatus,
} from "../../api/applicationStatusApi";
import API from "../../api/axios";

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Modal state
  const [selectedApp, setSelectedApp] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("SHORTLISTED");
  const [remarks, setRemarks] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);

  // Load all applications on mount
  useEffect(() => {
    loadAllApplications();
  }, []);

  const loadAllApplications = async () => {
    try {
      setLoading(true);
      // Fetch all applications from student endpoint
      const res = await API.get("/student/application/all");
      console.log("Applications fetched:", res.data);
      setApplications(res.data);
      setError("");
    } catch (err) {
      console.error("Full error object:", err);
      console.error("Error response:", err.response);
      setError("Failed to load applications: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSetStatus = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      setStatusLoading(true);
      await setApplicationStatus(selectedApp.id, 1, newStatus, remarks);
      setSuccess(`✓ Status updated to ${newStatus}`);
      setShowStatusModal(false);
      setRemarks("");
      loadAllApplications();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update status: " + (err.response?.data?.detail || err.message));
    } finally {
      setStatusLoading(false);
    }
  };

  const handleQuickStatus = async (status, remarks_text) => {
    if (!selectedApp) return;

    try {
      setStatusLoading(true);
      if (status === "SHORTLISTED") {
        await shortlistApplication(selectedApp.id, remarks_text);
      } else if (status === "REJECTED") {
        await rejectApplication(selectedApp.id, remarks_text);
      } else if (status === "SELECTED") {
        await selectApplication(selectedApp.id, remarks_text);
      }
      setSuccess(`✓ Application ${status}`);
      setShowStatusModal(false);
      loadAllApplications();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update status: " + (err.response?.data?.detail || err.message));
    } finally {
      setStatusLoading(false);
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

  // Filter applications
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.student_id.toString().includes(searchTerm) ||
      app.drive_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.company_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "ALL" || app.application_status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: applications.length,
    applied: applications.filter((a) => a.application_status === "APPLIED").length,
    shortlisted: applications.filter((a) => a.application_status === "SHORTLISTED").length,
    selected: applications.filter((a) => a.application_status === "SELECTED").length,
    rejected: applications.filter((a) => a.application_status === "REJECTED").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6">
        <h1 className="text-3xl font-bold">📋 Manage All Applications</h1>
        <p className="text-purple-100 mt-1">View and manage student applications across all drives</p>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto p-6">
        {/* MESSAGES */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-4 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError("")} className="font-bold">
              ✕
            </button>
          </div>
        )}
        {success && (
          <div className="bg-green-100 text-green-700 p-4 rounded mb-4 flex justify-between items-center">
            <span>{success}</span>
            <button onClick={() => setSuccess("")} className="font-bold">
              ✕
            </button>
          </div>
        )}

        {/* STATS CARDS */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded shadow">
            <h3 className="text-gray-600 text-sm font-semibold">Total</h3>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.total}</p>
          </div>

          <div className="bg-gray-50 border-l-4 border-gray-500 p-4 rounded shadow">
            <h3 className="text-gray-600 text-sm font-semibold">Applied</h3>
            <p className="text-2xl font-bold text-gray-600 mt-1">{stats.applied}</p>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded shadow">
            <h3 className="text-gray-600 text-sm font-semibold">Shortlisted</h3>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.shortlisted}</p>
          </div>

          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded shadow">
            <h3 className="text-gray-600 text-sm font-semibold">Selected</h3>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.selected}</p>
          </div>

          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow">
            <h3 className="text-gray-600 text-sm font-semibold">Rejected</h3>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.rejected}</p>
          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white p-4 rounded shadow mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔍 Search
              </label>
              <input
                type="text"
                placeholder="Search by Student ID, Drive, or Company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📊 Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="APPLIED">📝 Applied</option>
                <option value="PENDING">⏳ Pending</option>
                <option value="SHORTLISTED">✅ Shortlisted</option>
                <option value="SELECTED">🎉 Selected</option>
                <option value="REJECTED">❌ Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* APPLICATIONS TABLE */}
        <div className="bg-white rounded shadow-md overflow-hidden">
          <div className="bg-purple-50 p-4 border-b border-purple-200">
            <h2 className="text-lg font-semibold text-gray-800">
              Applications ({filteredApplications.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading applications...</div>
          ) : filteredApplications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No applications found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Student ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Drive & Company
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Applied Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Current Status
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Remarks
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm text-gray-800 font-semibold">
                        #{app.student_id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="font-semibold">{app.drive_title}</div>
                        <div className="text-xs text-gray-500">{app.company_name}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {new Date(app.applied_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-3 py-1 rounded text-sm font-semibold ${getStatusBadgeColor(
                            app.application_status
                          )}`}
                        >
                          {getStatusEmoji(app.application_status)} {app.application_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {app.remarks || "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setNewStatus(app.application_status);
                            setRemarks(app.remarks || "");
                            setShowStatusModal(true);
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold transition"
                        >
                          Change Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* STATUS MODAL */}
      {showStatusModal && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Set Application Status</h2>
            <p className="text-gray-600 mb-4">
              Student ID: <span className="font-semibold">#{selectedApp.student_id}</span>
            </p>

            <form onSubmit={handleSetStatus} className="space-y-4">
              {/* STATUS SELECTOR */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="APPLIED">📝 APPLIED</option>
                  <option value="PENDING">⏳ PENDING</option>
                  <option value="SHORTLISTED">✅ SHORTLISTED</option>
                  <option value="SELECTED">🎉 SELECTED</option>
                  <option value="REJECTED">❌ REJECTED</option>
                  <option value="WITHDRAWN">🗑️ WITHDRAWN</option>
                </select>
              </div>

              {/* REMARKS */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Remarks (Optional)
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add remarks about the decision..."
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="3"
                />
              </div>

              {/* BUTTONS */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  disabled={statusLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded font-semibold hover:bg-gray-50 transition disabled:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={statusLoading}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600 transition disabled:bg-gray-400"
                >
                  {statusLoading ? "Updating..." : "Update Status"}
                </button>
              </div>

              {/* QUICK ACTIONS */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-600 font-semibold mb-3">Quick Actions:</p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickStatus("SHORTLISTED", "Shortlisted for next round")
                    }
                    disabled={statusLoading}
                    className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold hover:bg-yellow-200 transition disabled:bg-gray-100"
                  >
                    ✅ Shortlist
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickStatus("SELECTED", "Job offer extended")
                    }
                    disabled={statusLoading}
                    className="px-3 py-2 bg-green-100 text-green-700 rounded text-xs font-semibold hover:bg-green-200 transition disabled:bg-gray-100"
                  >
                    🎉 Select
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickStatus("REJECTED", "Not selected")
                    }
                    disabled={statusLoading}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded text-xs font-semibold hover:bg-red-200 transition disabled:bg-gray-100"
                  >
                    ❌ Reject
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
