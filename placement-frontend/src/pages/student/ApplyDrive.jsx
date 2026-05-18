import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getActiveDrives,
  checkEligibility,
  applyForDrive,
  getMyApplications,
} from "../../api/studentApi";
import { getAcademicProfile } from "../../api/academicApi";
import { checkResumeExists } from "../../api/resumeApi";

export default function ApplyDrive({ user }) {
  const navigate = useNavigate();
  const STUDENT_ID = user?.student_id || user?.id || 1;

  const [drives, setDrives] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedDrive, setSelectedDrive] = useState(null);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [eligibilityCheck, setEligibilityCheck] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);

  const [profile, setProfile] = useState(null);
  const [hasResume, setHasResume] = useState(false);

  useEffect(() => {
    loadDrives();
    loadMyApplications();
    loadProfile();
    loadResumeStatus();
  }, []);

  const loadResumeStatus = async () => {
    try {
      const res = await checkResumeExists(STUDENT_ID);
      setHasResume(res.data.has_resume);
    } catch (err) {
      console.error("Error checking resume status:", err);
    }
  };

  const loadProfile = async () => {
    try {
      const res = await getAcademicProfile(STUDENT_ID);
      if (res.data) {
        setProfile(res.data);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  };

  const isProfileComplete = () => {
    // If still loading or profile is null, it's not "complete" yet
    if (!profile) return false;

    return (
      profile.cgpa !== "" && profile.cgpa !== null &&
      profile.current_backlogs !== "" && profile.current_backlogs !== null &&
      profile.history_backlogs !== "" && profile.history_backlogs !== null &&
      profile.tenth_marks !== "" && profile.tenth_marks !== null &&
      profile.twelfth_marks !== "" && profile.twelfth_marks !== null &&
      profile.batch_year !== "" && profile.batch_year !== null &&
      profile.gender !== "" && profile.gender !== null
    );
  };

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

  const hasApplied = (driveId) => {
    return myApplications.some(app => app.drive_id === driveId && app.is_active);
  };

  const handleCheckEligibility = async (drive) => {
    // 1. Validate profile is complete first (REDIRECTION GUARD)
    if (!isProfileComplete()) {
      setError("❌ Please fill your Academic Profile first before applying for drives!");
      // Redirect to dashboard specifically to the profile tab
      setTimeout(() => navigate("/student/dashboard?tab=profile"), 1000);
      return;
    }

    // 2. Validate resume is uploaded
    if (!hasResume) {
      setError("❌ Please upload your Resume first before applying for drives!");
      setTimeout(() => navigate("/resume"), 1000);
      return;
    }

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

  return (
    <>
      <div className="erp-page-title">
        <h1>Apply for Drives</h1>
        <p>Browse and apply for active placement drives</p>
      </div>

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

      <div className="erp-grid-2">
        {loading ? (
          <div className="erp-card erp-p-8 erp-text-center erp-text-muted" style={{ gridColumn: '1 / -1' }}>Loading drives...</div>
        ) : drives.length === 0 ? (
          <div className="erp-card erp-p-8 erp-text-center erp-text-muted" style={{ gridColumn: '1 / -1' }}>No active drives available right now</div>
        ) : (
          drives.map(drive => (
            <div key={drive.id} className="erp-card erp-animate-in">
              <div className="erp-card__header">
                <div>
                  <div className="erp-card__title">{drive.title}</div>
                  <div className="erp-card__subtitle">🏢 {drive.company_name} • 📍 {drive.venue}</div>
                </div>
                <div className="erp-text-primary erp-fw-700">{drive.package || "N/A"}</div>
              </div>
              <div className="erp-card__body">
                {drive.description && (
                  <p className="erp-text-muted erp-text-sm erp-mb-4">{drive.description}</p>
                )}

                {drive.eligibility && (
                  <div className="erp-alert erp-alert--info erp-mb-4">
                    <div className="erp-flex-center erp-gap-2 erp-fw-600 erp-mb-2">
                      <i className="fa-solid fa-graduation-cap"></i>
                      <span>Eligibility Criteria</span>
                    </div>
                    <div className="erp-grid-2 erp-text-xs">
                      {drive.eligibility.min_cgpa && <span>📊 Min CGPA: {drive.eligibility.min_cgpa}</span>}
                      {drive.eligibility.allowed_branches && <span>🎓 Branches: {drive.eligibility.allowed_branches}</span>}
                      {drive.eligibility.min_batch && <span>📆 Batch: {drive.eligibility.min_batch}</span>}
                      {drive.eligibility.max_backlogs !== null && <span>❌ Max Backlogs: {drive.eligibility.max_backlogs}</span>}
                    </div>
                  </div>
                )}

                {drive.workflow && drive.workflow.rounds && drive.workflow.rounds.length > 0 && (
                  <div className="erp-mb-4">
                    <div className="erp-flex-center erp-gap-2 erp-fw-700 erp-mb-3 erp-text-primary" style={{ fontSize: '13px' }}>
                      <i className="fa-solid fa-stairs"></i>
                      <span>Selection Process</span>
                      <span className="erp-badge erp-badge--primary" style={{ marginLeft: 'auto' }}>
                        {drive.workflow.total_rounds || drive.workflow.rounds.length} Rounds
                      </span>
                    </div>
                    
                    <div className="erp-grid-1 erp-gap-2">
                      {drive.workflow.rounds.map((round, index) => (
                        <div key={round.id} className="erp-p-3" style={{ 
                          borderLeft: '3px solid var(--erp-primary)',
                          background: 'var(--erp-surface)',
                          borderRadius: '0 var(--erp-radius) var(--erp-radius) 0',
                          display: 'flex',
                          gap: '12px',
                          alignItems: 'start'
                        }}>
                          <div className="erp-fw-700" style={{ 
                            width: '24px', height: '24px', borderRadius: '50%', background: 'var(--erp-primary)', color: 'white', flexShrink: 0, fontSize: '11px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(26, 86, 219, 0.2)'
                          }}>
                            {index + 1}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div className="erp-flex-between erp-mb-1" style={{ alignItems: 'center' }}>
                              <div className="erp-fw-700 erp-text-xs">{round.round_name}</div>
                              {round.mode && <div className="erp-badge erp-badge--muted" style={{ fontSize: '8px', padding: '1px 5px' }}>{round.mode}</div>}
                            </div>
                            {round.remarks && (
                              <p className="erp-text-muted erp-lh-tight" style={{ fontSize: '10.5px' }}>
                                {round.remarks}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="erp-mt-4">
                  {hasApplied(drive.id) ? (
                    <button disabled className="erp-btn erp-btn--ghost" style={{ width: '100%' }}>
                      <i className="fa-solid fa-check"></i> Already Applied
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCheckEligibility(drive)}
                      disabled={eligibilityLoading || loading}
                      className="erp-btn erp-btn--primary"
                      style={{ width: '100%' }}
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

      {showEligibilityModal && selectedDrive && eligibilityCheck && (
        <div className="erp-modal-overlay erp-modal--open">
          <div className="erp-modal">
            <div className="erp-modal__header">
              <div className="erp-modal__title">Eligibility Check</div>
              <button className="erp-modal__close" onClick={() => setShowEligibilityModal(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="erp-modal__body">
              <p className="erp-mb-4">
                Position: <strong>{selectedDrive.title}</strong> at <strong>{selectedDrive.company_name}</strong>
              </p>

              <div className={`erp-alert ${eligibilityCheck.eligible ? 'erp-alert--success' : 'erp-alert--danger'} erp-mb-5`}>
                <i className={`fa-solid ${eligibilityCheck.eligible ? 'fa-circle-check' : 'fa-circle-xmark'}`}></i>
                <div>
                  <div className="erp-fw-700">{eligibilityCheck.eligible ? "You Are Eligible!" : "Not Eligible"}</div>
                  <div className="erp-text-xs">{eligibilityCheck.message}</div>
                </div>
              </div>

              {selectedDrive.eligibility && (
                <div className="erp-mb-5">
                  <h4 className="erp-label erp-mb-2">Required Criteria:</h4>
                  <div className="erp-card erp-p-4 erp-text-sm">
                    {selectedDrive.eligibility.min_cgpa && (
                      <div className="erp-flex-between erp-mb-2">
                        <span className="erp-text-muted">📊 Minimum CGPA:</span>
                        <span className="erp-fw-600">{selectedDrive.eligibility.min_cgpa}</span>
                      </div>
                    )}
                    {selectedDrive.eligibility.allowed_branches && (
                      <div className="erp-flex-between erp-mb-2">
                        <span className="erp-text-muted">🎓 Allowed Branches:</span>
                        <span className="erp-fw-600">{selectedDrive.eligibility.allowed_branches}</span>
                      </div>
                    )}
                    {selectedDrive.eligibility.min_batch && (
                      <div className="erp-flex-between erp-mb-2">
                        <span className="erp-text-muted">📆 Batch Range:</span>
                        <span className="erp-fw-600">
                          {selectedDrive.eligibility.min_batch} - {selectedDrive.eligibility.max_batch}
                        </span>
                      </div>
                    )}
                    {selectedDrive.eligibility.max_backlogs !== null && (
                      <div className="erp-flex-between">
                        <span className="erp-text-muted">❌ Max Backlogs:</span>
                        <span className="erp-fw-600">{selectedDrive.eligibility.max_backlogs}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedDrive.workflow && selectedDrive.workflow.rounds && selectedDrive.workflow.rounds.length > 0 && (
                <div className="erp-mb-5">
                  <h4 className="erp-label erp-mb-2">Selection Process:</h4>
                  <div className="erp-card erp-p-2">
                    {selectedDrive.workflow.rounds.map((round, index) => (
                      <div key={round.id} className="erp-p-3 erp-flex erp-gap-3" style={{ 
                        borderBottom: index < selectedDrive.workflow.rounds.length - 1 ? '1px solid var(--erp-border)' : 'none'
                      }}>
                        <div className="erp-fw-700" style={{ 
                          width: '22px', height: '22px', borderRadius: '50%', background: 'var(--erp-primary)', color: 'white', fontSize: '10px', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(26, 86, 219, 0.2)'
                        }}>
                          {index + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="erp-flex-between">
                            <span className="erp-fw-600 erp-text-sm">{round.round_name}</span>
                            {round.mode && <span className="erp-badge erp-badge--muted" style={{ fontSize: '8px' }}>{round.mode}</span>}
                          </div>
                          {round.remarks && <p className="erp-text-xs erp-text-muted erp-mt-1">{round.remarks}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {eligibilityCheck.mismatches && eligibilityCheck.mismatches.length > 0 && (
                <div className="erp-alert erp-alert--danger erp-mb-5">
                  <div>
                    <div className="erp-fw-600 erp-mb-1">⚠️ Eligibility Issues:</div>
                    <ul className="erp-text-xs erp-pl-4">
                      {eligibilityCheck.mismatches.map((mismatch, idx) => (
                        <li key={idx}>{mismatch}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="erp-alert erp-alert--info erp-m-0">
                <i className="fa-solid fa-lightbulb"></i>
                <span className="erp-text-xs">
                  <strong>Note:</strong> Your metrics are verified in real-time from the SIS module.
                </span>
              </div>
            </div>

            <div className="erp-modal__footer">
              <button onClick={() => setShowEligibilityModal(false)} className="erp-btn erp-btn--ghost">
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={!eligibilityCheck.eligible || loading}
                className={`erp-btn ${eligibilityCheck.eligible ? 'erp-btn--primary' : 'erp-btn--disabled'}`}
              >
                {loading ? "Applying..." : "✓ Confirm Application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}