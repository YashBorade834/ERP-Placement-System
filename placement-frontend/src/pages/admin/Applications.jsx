import { useEffect, useState } from "react";
import {
  shortlistApplication,
  rejectApplication,
  selectApplication,
  setApplicationStatus,
  getRoundStatuses,
  setRoundStatus,
} from "../../api/applicationStatusApi";
import { checkResumeExists, getResume } from "../../api/resumeApi";
import API from "../../api/axios";
import { API_URL } from "../../config";

const STATUS_OPTIONS = [
  { value: "APPLIED",     label: "📝 Applied" },
  { value: "PENDING",     label: "⏳ Pending" },
  { value: "SHORTLISTED", label: "✅ Shortlisted" },
  { value: "SELECTED",    label: "🎉 Selected" },
  { value: "REJECTED",    label: "❌ Rejected" },
  { value: "WITHDRAWN",   label: "🗑️ Withdrawn" },
];

const statusPillClass = (status) => {
  const map = {
    APPLIED:     "erp-pill--primary",
    SHORTLISTED: "erp-pill--warning",
    SELECTED:    "erp-pill--success",
    REJECTED:    "erp-pill--danger",
    PENDING:     "erp-pill--inactive",
    WITHDRAWN:   "erp-pill--inactive",
  };
  return map[status] || "erp-pill--inactive";
};

const statusEmoji = (status) => {
  const map = {
    APPLIED: "📝", SHORTLISTED: "✅", SELECTED: "🎉",
    REJECTED: "❌", PENDING: "⏳", WITHDRAWN: "🗑️",
  };
  return map[status] || "📋";
};

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resumeStatus, setResumeStatus] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // ─── Round-wise modal state ────────────────────────────────────────
  const [selectedApp, setSelectedApp] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [roundStatuses, setRoundStatuses] = useState([]); // [{round_id, round_name, mode, status, remarks}]
  const [roundStatusLoading, setRoundStatusLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  // ──────────────────────────────────────────────────────────────────

  useEffect(() => { loadAllApplications(); }, []);

  const loadAllApplications = async () => {
    try {
      setLoading(true);
      const res = await API.get("/student/application/all");
      setApplications(res.data);
      setError("");
      loadResumeStatus(res.data);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Unknown error";
      setError("Failed to load applications: " + msg);
    } finally {
      setLoading(false);
    }
  };

  const loadResumeStatus = async (apps) => {
    const resumeMap = {};
    const uniqueStudents = [...new Set(apps.map(a => a.student_id))];
    for (const studentId of uniqueStudents) {
      try {
        const res = await checkResumeExists(studentId);
        resumeMap[studentId] = res.data;
      } catch {
        resumeMap[studentId] = { has_resume: false, resume_id: null };
      }
    }
    setResumeStatus(resumeMap);
  };

  // ─── Open modal: fetch per-round statuses ────────────────────────
  const openStatusModal = async (app) => {
    setSelectedApp(app);
    setShowStatusModal(true);
    setRoundStatuses([]);
    setRoundStatusLoading(true);
    try {
      const res = await getRoundStatuses(app.id);
      setRoundStatuses(res.data);
    } catch (err) {
      console.error("Failed to load round statuses:", err);
      setRoundStatuses([]); // Will show fallback single-status UI
    } finally {
      setRoundStatusLoading(false);
    }
  };

  const closeModal = () => {
    setShowStatusModal(false);
    setSelectedApp(null);
    setRoundStatuses([]);
  };

  // ─── Update a single round's status/remarks in local state ───────
  const handleRoundStatusChange = (roundId, field, value) => {
    setRoundStatuses(prev =>
      prev.map(r => r.round_id === roundId ? { ...r, [field]: value } : r)
    );
  };

  // ─── Save all round statuses ─────────────────────────────────────
  const handleSaveAllRounds = async () => {
    if (!selectedApp) return;
    setSaveLoading(true);
    try {
      await Promise.all(
        roundStatuses.map(r =>
          setRoundStatus(selectedApp.id, r.round_id, r.status, r.remarks || "")
        )
      );
      setSuccess(`✓ Round statuses saved for Student #${selectedApp.student_id}`);
      closeModal();
      loadAllApplications();
      setTimeout(() => setSuccess(""), 3500);
    } catch (err) {
      setError("Failed to save statuses: " + (err.response?.data?.detail || err.message));
    } finally {
      setSaveLoading(false);
    }
  };

  // ─── Fallback single-status save (for drives with no rounds) ─────
  const [fallbackStatus, setFallbackStatus] = useState("SHORTLISTED");
  const [fallbackRemarks, setFallbackRemarks] = useState("");

  const handleFallbackSave = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;
    setSaveLoading(true);
    try {
      await setApplicationStatus(selectedApp.id, 1, fallbackStatus, fallbackRemarks);
      setSuccess(`✓ Status updated to ${fallbackStatus}`);
      closeModal();
      loadAllApplications();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to update status: " + (err.response?.data?.detail || err.message));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDownloadResume = async (studentId) => {
    try {
      const res = await getResume(studentId);
      if (res.data?.file_path) {
        const fp = res.data.file_path.startsWith("/")
          ? res.data.file_path.substring(1)
          : res.data.file_path;
        window.open(`${API_URL}/${fp}`, "_blank");
      } else {
        setError("Resume file path not found.");
      }
    } catch (err) {
      setError("Failed to fetch resume details.");
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch =
      app.student_id.toString().includes(searchTerm) ||
      app.drive_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "ALL" || app.application_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total:       applications.length,
    applied:     applications.filter(a => a.application_status === "APPLIED").length,
    shortlisted: applications.filter(a => a.application_status === "SHORTLISTED").length,
    selected:    applications.filter(a => a.application_status === "SELECTED").length,
    rejected:    applications.filter(a => a.application_status === "REJECTED").length,
  };

  const handleExportCSV = () => {
    if (filteredApplications.length === 0) { setError("No applications to export."); return; }
    const headers = ["Student ID", "Drive Title", "Company", "Applied Date", "Status", "Remarks", "Resume Link"];
    const csvRows = [headers.join(",")];
    filteredApplications.forEach(app => {
      const esc = (s) => `"${String(s ?? "").replace(/"/g, '""').replace(/\n/g, " ")}"`;
      let resumeLink = "Not Uploaded";
      const ri = resumeStatus[app.student_id];
      if (ri?.has_resume && ri?.file_path) {
        const fp = ri.file_path.startsWith("/") ? ri.file_path.substring(1) : ri.file_path;
        resumeLink = `${API_URL}/${fp}`;
      }
      csvRows.push([
        app.student_id, esc(app.drive_title), esc(app.company_name),
        esc(new Date(app.applied_at).toLocaleDateString()),
        esc(app.application_status), esc(app.remarks), esc(resumeLink),
      ].join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", `applications_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <>
      <div className="erp-page-title">
        <h1>Manage All Applications</h1>
        <p>View and manage student applications across all drives</p>
      </div>

      {error && (
        <div className="erp-alert erp-alert--danger erp-mb-4 flex justify-between items-center">
          <div><i className="fa-solid fa-circle-xmark"></i><span>{error}</span></div>
          <button onClick={() => setError("")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit" }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}
      {success && (
        <div className="erp-alert erp-alert--success erp-mb-4 flex justify-between items-center">
          <div><i className="fa-solid fa-circle-check"></i><span>{success}</span></div>
          <button onClick={() => setSuccess("")} style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit" }}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {/* STATS */}
      <div className="erp-stats-grid erp-mb-6">
        <div className="erp-stat-card erp-stat-card--primary">
          <div className="erp-stat-card__header"><div className="erp-stat-card__icon"><i className="fa-solid fa-users"></i></div></div>
          <div className="erp-stat-card__value">{stats.total}</div>
          <div className="erp-stat-card__label">Total Applications</div>
        </div>
        <div className="erp-stat-card">
          <div className="erp-stat-card__header"><div className="erp-stat-card__icon"><i className="fa-solid fa-file-lines"></i></div></div>
          <div className="erp-stat-card__value">{stats.applied}</div>
          <div className="erp-stat-card__label">Applied</div>
        </div>
        <div className="erp-stat-card erp-stat-card--warning">
          <div className="erp-stat-card__header"><div className="erp-stat-card__icon"><i className="fa-solid fa-list-check"></i></div></div>
          <div className="erp-stat-card__value">{stats.shortlisted}</div>
          <div className="erp-stat-card__label">Shortlisted</div>
        </div>
        <div className="erp-stat-card erp-stat-card--success">
          <div className="erp-stat-card__header"><div className="erp-stat-card__icon"><i className="fa-solid fa-trophy"></i></div></div>
          <div className="erp-stat-card__value">{stats.selected}</div>
          <div className="erp-stat-card__label">Selected</div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="erp-card erp-mb-6">
        <div className="erp-card__body">
          <div className="erp-form-grid-2">
            <div className="erp-form-group">
              <label>🔍 Search</label>
              <input type="text" placeholder="Student ID, Drive, or Company..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="erp-form-control" />
            </div>
            <div className="erp-form-group">
              <label>📊 Filter by Status</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="erp-form-control">
                <option value="ALL">All Statuses</option>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="erp-card">
        <div className="erp-card__header">
          <div className="erp-card__title">Applications ({filteredApplications.length})</div>
          <button onClick={handleExportCSV} disabled={filteredApplications.length === 0} className="erp-btn erp-btn--success"
            style={filteredApplications.length === 0 ? { opacity: 0.5, pointerEvents: "none" } : {}}>
            <i className="fa-solid fa-file-csv"></i> Export to CSV
          </button>
        </div>
        <div className="erp-card__body">
          {loading ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#666" }}>Loading applications...</div>
          ) : filteredApplications.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center", color: "#666" }}>No applications found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Drive & Company</th>
                    <th>Applied Date</th>
                    <th>Overall Status</th>
                    <th>Remarks</th>
                    <th style={{ textAlign: "center" }}>Resume</th>
                    <th style={{ textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map(app => (
                    <tr key={app.id}>
                      <td><strong>#{app.student_id}</strong></td>
                      <td>
                        <div className="erp-fw-600">{app.drive_title}</div>
                        <div className="erp-text-xs erp-text-muted">{app.company_name}</div>
                      </td>
                      <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`erp-pill ${statusPillClass(app.application_status)}`}>
                          {statusEmoji(app.application_status)} {app.application_status}
                        </span>
                      </td>
                      <td className="erp-text-xs erp-text-muted" style={{ maxWidth: "200px" }}>
                        {app.remarks || "—"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {resumeStatus[app.student_id]?.has_resume ? (
                          <button onClick={() => handleDownloadResume(app.student_id)}
                            className="erp-btn erp-btn--success erp-btn--sm">
                            <i className="fa-solid fa-download"></i> Resume
                          </button>
                        ) : (
                          <span style={{ fontSize: "12px", color: "var(--erp-text-muted)" }}>❌ Not Uploaded</span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button onClick={() => openStatusModal(app)} className="erp-btn erp-btn--primary erp-btn--sm">
                          <i className="fa-solid fa-pen-to-square"></i> Manage Status
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

      {/* ─── STATUS MODAL ─────────────────────────────────────────── */}
      {showStatusModal && selectedApp && (
        <div className="erp-modal-overlay erp-modal--open">
          <div className="erp-modal" style={{ maxWidth: "600px" }}>
            {/* Header */}
            <div className="erp-modal__header">
              <div className="erp-modal__title">
                <i className="fa-solid fa-stairs" style={{ marginRight: "8px" }}></i>
                Round-wise Status Management
              </div>
              <button className="erp-modal__close" onClick={closeModal}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="erp-modal__body">
              {/* Application Info */}
              <div className="erp-alert erp-alert--info erp-mb-5" style={{ margin: 0 }}>
                <i className="fa-solid fa-user"></i>
                <div>
                  <div className="erp-fw-700">Student #{selectedApp.student_id}</div>
                  <div className="erp-text-xs">{selectedApp.drive_title} @ {selectedApp.company_name}</div>
                  <div className="erp-text-xs erp-text-muted">
                    Applied: {new Date(selectedApp.applied_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Round statuses loading */}
              {roundStatusLoading && (
                <div style={{ padding: "24px", textAlign: "center", color: "var(--erp-text-muted)" }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "8px" }}></i>
                  Loading rounds...
                </div>
              )}

              {/* ── ROUND-WISE FORM (if rounds exist) ── */}
              {!roundStatusLoading && roundStatuses.length > 0 && (
                <div className="erp-mt-4">
                  <div className="erp-flex-between erp-mb-4">
                    <span className="erp-label">Selection Rounds</span>
                    <span className="erp-badge erp-badge--primary">{roundStatuses.length} Rounds</span>
                  </div>

                  {roundStatuses.map((round, idx) => (
                    <div key={round.round_id} className="erp-mb-4" style={{
                      border: "1px solid var(--erp-border)",
                      borderRadius: "var(--erp-radius)",
                      overflow: "hidden",
                    }}>
                      {/* Round header */}
                      <div style={{
                        padding: "10px 16px",
                        background: "var(--erp-surface)",
                        borderBottom: "1px solid var(--erp-border)",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}>
                        <div style={{
                          width: "24px", height: "24px", borderRadius: "50%",
                          background: "var(--erp-primary)", color: "white",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "11px", fontWeight: 700, flexShrink: 0,
                          boxShadow: "0 2px 4px rgba(26,86,219,0.2)",
                        }}>
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="erp-fw-700 erp-text-sm">{round.round_name}</div>
                          {round.mode && (
                            <div className="erp-text-xs erp-text-muted">{round.mode}</div>
                          )}
                        </div>
                        <span className={`erp-pill ${statusPillClass(round.status)}`} style={{ fontSize: "10px" }}>
                          {statusEmoji(round.status)} {round.status}
                        </span>
                      </div>

                      {/* Status + Remarks */}
                      <div style={{ padding: "14px 16px" }} className="erp-form-grid-2">
                        <div className="erp-form-group">
                          <label>Status</label>
                          <select
                            value={round.status}
                            onChange={e => handleRoundStatusChange(round.round_id, "status", e.target.value)}
                            className="erp-form-control"
                          >
                            {STATUS_OPTIONS.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="erp-form-group">
                          <label>Remarks (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. Cleared, Not selected..."
                            value={round.remarks || ""}
                            onChange={e => handleRoundStatusChange(round.round_id, "remarks", e.target.value)}
                            className="erp-form-control"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── FALLBACK: no rounds defined for this drive ── */}
              {!roundStatusLoading && roundStatuses.length === 0 && (
                <div className="erp-mt-4">
                  <div className="erp-alert erp-alert--warning erp-mb-4">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    <span className="erp-text-sm">No rounds defined for this drive. Using overall status update.</span>
                  </div>
                  <form onSubmit={handleFallbackSave}>
                    <div className="erp-form-group erp-mb-4">
                      <label>Select Status</label>
                      <select
                        value={fallbackStatus}
                        onChange={e => setFallbackStatus(e.target.value)}
                        className="erp-form-control"
                      >
                        {STATUS_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="erp-form-group">
                      <label>Remarks</label>
                      <textarea
                        value={fallbackRemarks}
                        onChange={e => setFallbackRemarks(e.target.value)}
                        placeholder="Add decision notes..."
                        className="erp-form-control"
                        rows="3"
                      />
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="erp-modal__footer">
              <button onClick={closeModal} className="erp-btn erp-btn--ghost" disabled={saveLoading}>
                Cancel
              </button>
              {roundStatuses.length > 0 ? (
                <button
                  onClick={handleSaveAllRounds}
                  disabled={saveLoading}
                  className="erp-btn erp-btn--primary"
                >
                  <i className="fa-solid fa-floppy-disk"></i>
                  {saveLoading ? "Saving..." : `Save All ${roundStatuses.length} Rounds`}
                </button>
              ) : (
                !roundStatusLoading && (
                  <button
                    onClick={handleFallbackSave}
                    disabled={saveLoading}
                    className="erp-btn erp-btn--primary"
                  >
                    {saveLoading ? "Saving..." : "Update Status"}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
