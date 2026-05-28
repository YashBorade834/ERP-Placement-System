import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getApplicationsForDrive,
  setApplicationStatus,
  shortlistApplication,
  rejectApplication,
  selectApplication,
} from "../../api/applicationStatusApi";

export default function ManageApplications() {
  const { driveId } = useParams();

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal state
  const [selectedApp, setSelectedApp] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("SHORTLISTED");
  const [remarks, setRemarks] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);

  // Load applications on mount
  useEffect(() => {
    if (driveId) {
      loadApplications();
    }
  }, [driveId]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const res = await getApplicationsForDrive(driveId);
      setApplications(res.data);
      setError("");
    } catch (err) {
      console.error("Error loading applications:", err);
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
      loadApplications();
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
      loadApplications();
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

  return (
    <>
      {/* HEADER */}
      <div className="erp-page-title">
        <h1>📊 Manage Applications</h1>
        <p>Drive ID: {driveId} | Set application statuses</p>
      </div>

      {/* MESSAGES */}
      {error && (
        <div className="erp-alert erp-alert--danger erp-mb-4 flex justify-between items-center">
          <div><i className="fa-solid fa-circle-xmark"></i><span>{error}</span></div>
          <button onClick={() => setError("")} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}
      {success && (
        <div className="erp-alert erp-alert--success erp-mb-4 flex justify-between items-center">
          <div><i className="fa-solid fa-circle-check"></i><span>{success}</span></div>
          <button onClick={() => setSuccess("")} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {/* APPLICATIONS TABLE */}
      <div className="erp-card">
        <div className="erp-card__header">
          <div>
            <div className="erp-card__title">Applications ({applications.length})</div>
          </div>
        </div>

        <div style={{ padding: '0 20px 20px' }}>
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--erp-text-muted)' }}>Loading applications...</div>
          ) : applications.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--erp-text-muted)' }}>No applications found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="erp-table" data-erp-sortable="true">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Company</th>
                    <th>Applied Date</th>
                    <th>Current Status</th>
                    <th>Remarks</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                       <td>
                        <div style={{ fontWeight: 600 }}>{app.student_name || `Student #${app.student_id}`}</div>
                        <div style={{ fontSize: '12px', color: 'var(--erp-text-muted)' }}>ID: {app.student_id}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{app.drive_title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--erp-text-muted)' }}>{app.company_name}</div>
                      </td>
                      <td>
                        {new Date(app.applied_at).toLocaleDateString()}
                      </td>
                      <td>
                        <span className={`erp-pill ${
                          app.application_status === 'APPLIED' ? 'erp-pill--primary' :
                          app.application_status === 'SHORTLISTED' ? 'erp-pill--warning' :
                          app.application_status === 'SELECTED' ? 'erp-pill--success' :
                          app.application_status === 'REJECTED' ? 'erp-pill--danger' :
                          app.application_status === 'WITHDRAWN' ? 'erp-pill--ghost' : ''
                        }`}>
                          {getStatusEmoji(app.application_status)} {app.application_status}
                        </span>
                      </td>
                      <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {app.remarks || "-"}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setNewStatus(app.application_status);
                            setRemarks(app.remarks || "");
                            setShowStatusModal(true);
                          }}
                          className="erp-btn erp-btn--primary erp-btn--sm"
                        >
                          Set Status
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
        <div className="erp-modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="erp-modal" style={{ display: 'block', position: 'relative', width: '100%', maxWidth: '500px', margin: '0 20px' }}>
            <div className="erp-modal__header">
              <h3 className="erp-modal__title">Set Application Status</h3>
              <button className="erp-modal__close" onClick={() => setShowStatusModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="erp-modal__body">
              <p style={{ marginBottom: '16px' }}>
                Student: <strong>{selectedApp.student_name || `#${selectedApp.student_id}`}</strong>
                {selectedApp.student_name && <span style={{ fontSize: '12px', color: 'var(--erp-text-muted)', marginLeft: '8px' }}>(ID: {selectedApp.student_id})</span>}
              </p>

              <form onSubmit={handleSetStatus}>
                {/* STATUS SELECTOR */}
                <div className="erp-form-group">
                  <label>Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="erp-form-control"
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
                <div className="erp-form-group">
                  <label>Remarks (Optional)</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add remarks about the decision..."
                    className="erp-form-control"
                    rows="3"
                  />
                </div>

                {/* BUTTONS */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setShowStatusModal(false)}
                    disabled={statusLoading}
                    className="erp-btn erp-btn--outline"
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={statusLoading}
                    className="erp-btn erp-btn--primary"
                    style={{ flex: 1 }}
                  >
                    {statusLoading ? "Updating..." : "Update Status"}
                  </button>
                </div>

                {/* QUICK ACTIONS */}
                <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--erp-border)' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--erp-text-muted)', marginBottom: '12px' }}>Quick Actions:</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleQuickStatus("SHORTLISTED", "Shortlisted for next round")}
                      disabled={statusLoading}
                      className="erp-btn erp-btn--warning erp-btn--sm"
                    >
                      ✅ Shortlist
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickStatus("SELECTED", "Job offer extended")}
                      disabled={statusLoading}
                      className="erp-btn erp-btn--success erp-btn--sm"
                    >
                      🎉 Select
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickStatus("REJECTED", "Not selected")}
                      disabled={statusLoading}
                      className="erp-btn erp-btn--danger erp-btn--sm"
                    >
                      ❌ Reject
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
