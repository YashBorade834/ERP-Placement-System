import { useEffect, useState } from "react";
import { getMyApplications, withdrawApplication } from "../../api/studentApi";
import { getRoundStatuses } from "../../api/applicationStatusApi";

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

const statusBgColor = (status) => {
  const map = {
    APPLIED:     "rgba(26,86,219,0.08)",
    SHORTLISTED: "rgba(255,193,7,0.12)",
    SELECTED:    "rgba(40,167,69,0.1)",
    REJECTED:    "rgba(245,40,70,0.08)",
    PENDING:     "rgba(108,117,125,0.1)",
    WITHDRAWN:   "rgba(108,117,125,0.1)",
  };
  return map[status] || "var(--erp-surface)";
};

const statusDotColor = (status) => {
  const map = {
    APPLIED:     "var(--erp-primary)",
    SHORTLISTED: "#d4980b",
    SELECTED:    "var(--erp-success)",
    REJECTED:    "var(--erp-danger)",
    PENDING:     "#6c757d",
    WITHDRAWN:   "#6c757d",
  };
  return map[status] || "#6c757d";
};

export default function MyApplications({ user }) {
  const STUDENT_ID = user?.student_id || user?.id || 1;
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Round statuses map: { [app.id]: [] }
  const [roundStatusMap, setRoundStatusMap] = useState({});
  // Offers map: { [app.id]: offer }
  const [offersMap, setOffersMap] = useState({});
  // Offer action modal
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const res = await getMyApplications(STUDENT_ID);
      setApps(res.data);
      // Load round statuses for all applications in parallel
      loadAllRoundStatuses(res.data);
      // Load offers for all applications
      loadAllOffers(res.data);
    } catch (err) {
      console.error("Error loading applications:", err);
      setError("Failed to load applications.");
    } finally {
      setLoading(false);
    }
  };

  const loadAllRoundStatuses = async (appList) => {
    const map = {};
    await Promise.all(
      appList.map(async (app) => {
        try {
          const res = await getRoundStatuses(app.id);
          map[app.id] = res.data || [];
        } catch {
          map[app.id] = [];
        }
      })
    );
    setRoundStatusMap(map);
  };

  const loadAllOffers = async (appList) => {
    const map = {};
    await Promise.all(
      appList.map(async (app) => {
        try {
          const res = await getStudentOffers();
          // Find offer for this application
          const offer = res.data.find(o => o.application_id === app.id);
          if (offer) {
            map[app.id] = offer;
          }
        } catch {
          // No offer found
        }
      })
    );
    setOffersMap(map);
  };

  const handleWithdraw = async (applicationId) => {
    if (!window.confirm("Are you sure you want to withdraw this application?")) return;
    try {
      setLoading(true);
      await withdrawApplication(applicationId);
      setSuccess("Application withdrawn");
      loadApplications();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to withdraw: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offerId) => {
    try {
      setLoading(true);
      await acceptOffer(offerId);
      setSuccess("Offer accepted successfully!");
      loadApplications();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to accept offer: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRejectOffer = async () => {
    if (!rejectReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    try {
      setLoading(true);
      await rejectOffer(selectedOffer.id, rejectReason);
      setSuccess("Offer rejected successfully!");
      setShowOfferModal(false);
      setRejectReason("");
      loadApplications();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to reject offer: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="erp-page-title">
        <h1>My Applications</h1>
        <p>View and manage your applied placement drives</p>
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

      <div className="erp-grid-2">
        {loading ? (
          <div className="erp-card erp-p-8 erp-text-center erp-text-muted" style={{ gridColumn: "1 / -1" }}>
            Loading applications...
          </div>
        ) : apps.length === 0 ? (
          <div className="erp-card erp-p-8 erp-text-center erp-text-muted" style={{ gridColumn: "1 / -1" }}>
            No applications found. Start applying to active drives!
          </div>
        ) : (
          apps.map(app => {
            const rounds = roundStatusMap[app.id] || [];
            return (
              <div key={app.id} className="erp-card erp-animate-in">
                {/* Card Header */}
                <div className="erp-card__header">
                  <div>
                    <div className="erp-card__title">{app.drive_title}</div>
                    <div className="erp-card__subtitle">🏢 {app.company_name} • 📍 {app.venue}</div>
                  </div>
                  <span className={`erp-pill ${statusPillClass(app.application_status)}`}>
                    {statusEmoji(app.application_status)} {app.application_status}
                  </span>
                </div>

                <div className="erp-card__body">
                  {/* Applied & Drive Date */}
                  <div className="erp-grid-2 erp-mb-4">
                    <div className="erp-text-xs">
                      <div className="erp-text-muted erp-mb-1">Applied On</div>
                      <div className="erp-fw-600">{new Date(app.applied_at).toLocaleDateString()}</div>
                    </div>
                    {app.drive_date && (
                      <div className="erp-text-xs">
                        <div className="erp-text-muted erp-mb-1">Drive Date</div>
                        <div className="erp-fw-600">{app.drive_date}</div>
                      </div>
                    )}
                  </div>

                  {/* ── ROUND-WISE STATUS TRACKER ── */}
                  {rounds.length > 0 ? (
                    <div className="erp-mb-4">
                      <div className="erp-flex-center erp-gap-2 erp-fw-700 erp-mb-3 erp-text-primary" style={{ fontSize: "12px" }}>
                        <i className="fa-solid fa-stairs"></i>
                        <span>Selection Progress</span>
                        <span className="erp-badge erp-badge--primary" style={{ marginLeft: "auto" }}>
                          {rounds.length} Rounds
                        </span>
                      </div>

                      {/* Timeline */}
                      <div style={{ position: "relative" }}>
                        {/* Vertical connecting line */}
                        {rounds.length > 1 && (
                          <div style={{
                            position: "absolute",
                            left: "11px",
                            top: "12px",
                            bottom: "12px",
                            width: "2px",
                            background: "var(--erp-border)",
                            zIndex: 0,
                          }} />
                        )}

                        {rounds.map((round, idx) => (
                          <div key={round.round_id} style={{
                            display: "flex",
                            gap: "12px",
                            alignItems: "flex-start",
                            marginBottom: idx < rounds.length - 1 ? "10px" : 0,
                            position: "relative",
                            zIndex: 1,
                          }}>
                            {/* Status dot */}
                            <div style={{
                              width: "24px",
                              height: "24px",
                              borderRadius: "50%",
                              background: statusBgColor(round.status),
                              border: `2px solid ${statusDotColor(round.status)}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "9px",
                              fontWeight: 700,
                              color: statusDotColor(round.status),
                              flexShrink: 0,
                              marginTop: "2px",
                            }}>
                              {round.status === "SELECTED" ? "✓" :
                               round.status === "REJECTED" ? "✗" :
                               idx + 1}
                            </div>

                            {/* Round info */}
                            <div style={{
                              flex: 1,
                              background: statusBgColor(round.status),
                              borderRadius: "var(--erp-radius)",
                              padding: "8px 12px",
                              border: `1px solid ${statusDotColor(round.status)}22`,
                            }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: round.remarks ? "4px" : 0 }}>
                                <div style={{ fontWeight: 600, fontSize: "12px", color: "var(--erp-text)" }}>
                                  Round {idx + 1}: {round.round_name}
                                  {round.mode && (
                                    <span style={{ fontWeight: 400, color: "var(--erp-text-muted)", marginLeft: "6px" }}>
                                      • {round.mode}
                                    </span>
                                  )}
                                </div>
                                <span className={`erp-pill ${statusPillClass(round.status)}`} style={{ fontSize: "9px", padding: "2px 7px" }}>
                                  {statusEmoji(round.status)} {round.status}
                                </span>
                              </div>
                              {round.remarks && (
                                <div style={{ fontSize: "11px", color: "var(--erp-text-muted)", marginTop: "2px" }}>
                                  {round.remarks}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Fallback: show remarks/feedback if no rounds */
                    <div className="erp-alert erp-alert--info erp-mb-4">
                      <div className="erp-text-xs">
                        <div className="erp-fw-600 erp-mb-1">Status Remarks:</div>
                        <div>{app.feedback || "No feedback provided yet."}</div>
                      </div>
                    </div>
                  )}

                  {/* Withdraw button */}
                  {app.is_active && app.application_status === "APPLIED" && (
                    <button
                      onClick={() => handleWithdraw(app.id)}
                      disabled={loading}
                      className="erp-btn erp-btn--danger erp-btn--sm erp-btn--block"
                    >
                      <i className="fa-solid fa-trash erp-mr-2"></i> Withdraw Application
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* OFFER ACTION MODAL */}
      {showOfferModal && selectedOffer && (
        <div className="erp-modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="erp-modal" style={{ display: 'block', position: 'relative', width: '100%', maxWidth: '500px', margin: '0 20px' }}>
            <div className="erp-modal__header">
              <h3 className="erp-modal__title">Reject Job Offer</h3>
              <button className="erp-modal__close" onClick={() => setShowOfferModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="erp-modal__body">
              <div className="erp-mb-4">
                <p className="erp-text-muted erp-mb-3">
                  <strong>Position:</strong> {selectedOffer.position}<br/>
                  <strong>Package:</strong> {selectedOffer.package}
                </p>
                <p className="erp-text-sm">
                  Please provide a reason for rejecting this offer. This helps companies understand candidate feedback.
                </p>
              </div>

              <div className="erp-form-group">
                <label>Rejection Reason *</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter your reason for rejection..."
                  className="erp-form-control"
                  rows="4"
                  required
                />
              </div>

              <div className="erp-flex erp-gap-2 erp-mt-4">
                <button
                  onClick={() => setShowOfferModal(false)}
                  disabled={loading}
                  className="erp-btn erp-btn--outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectOffer}
                  disabled={loading || !rejectReason.trim()}
                  className="erp-btn erp-btn--danger"
                  style={{ flex: 1 }}
                >
                  {loading ? "Processing..." : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}