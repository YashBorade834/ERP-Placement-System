import { useEffect, useState } from "react";
import {
  getActiveDrives,
  checkEligibility,
  applyForDrive,
  getMyApplications,
  withdrawApplication,
} from "../../api/studentApi";
import { getAcademicProfile, updateAcademicProfile } from "../../api/academicApi";
import { checkResumeExists } from "../../api/resumeApi";
import PlacementAnalytics from "../../components/PlacementAnalytics";

export default function StudentDashboard({ user }) {
  // Use student ID from authenticated user
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

  const [activeTab, setActiveTab] = useState("available"); // available | my-applications | profile

  // 🔹 Check for tab param in URL (e.g. ?tab=profile)
  const location = window.location;
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab && ["available", "my-applications", "profile"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const [profile, setProfile] = useState({
    cgpa: "",
    current_backlogs: "",
    history_backlogs: "",
    tenth_marks: "",
    twelfth_marks: "",
    diploma_marks: "",
    batch_year: "",
    gender: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [hasResume, setHasResume] = useState(false);

  // Load drives and applications on mount
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
      setProfileLoading(true);
      const res = await getAcademicProfile(STUDENT_ID);
      if (res.data) {
        setProfile(res.data);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError("⚠️ Student record not found in SIS or Placement system. Please ensure you are a registered student.");
      } else {
        console.error("Error loading profile:", err);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    try {
      setProfileLoading(true);
      await updateAcademicProfile({ ...profile, student_id: STUDENT_ID });
      setSuccess("Profile saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save profile");
    } finally {
      setProfileLoading(false);
    }
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

  // Check if student already applied for a drive
  const hasApplied = (driveId) => {
    return myApplications.some(app => app.drive_id === driveId && app.is_active);
  };

  // Check if academic profile is complete
  const isProfileComplete = () => {
    // If still loading or profile is null, it's not "complete" yet
    if (profileLoading || !profile) return false;

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

  // Check eligibility before applying
  const handleCheckEligibility = async (drive) => {
    // 1. If profile is still fetching, show a wait message
    if (profileLoading) {
      setError("⏳ Please wait, loading your academic profile...");
      return;
    }

    // 2. Validate profile is complete first (REDIRECTION GUARD)
    if (!isProfileComplete()) {
      setError("❌ Please fill your Academic Profile first before applying for drives!");
      // Immediate visual feedback then redirect
      setTimeout(() => setActiveTab("profile"), 800);
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
    <>
      {/* HEADER */}
      <div className="erp-page-title">
        <h1>🎯 Student Dashboard</h1>
        <p>Student ID: {STUDENT_ID} | Find and apply for placement drives</p>
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

      {/* RESUME WARNING */}
      {!hasResume && (
        <div className="erp-alert erp-alert--warning erp-mb-4 flex justify-between items-center">
          <div className="erp-flex erp-items-center erp-gap-3">
            <i className="fa-solid fa-file-pdf erp-text-xl"></i>
            <div>
              <div className="erp-fw-700">Resume Missing!</div>
              <div className="erp-text-xs">You haven't uploaded your resume. You won't be able to apply for drives.</div>
            </div>
          </div>
          <button onClick={() => window.location.href = "/resume"} className="erp-btn erp-btn--warning erp-btn--sm">
            Upload Now
          </button>
        </div>
      )}

      {/* TABS */}
      <div className="erp-flex erp-gap-2 erp-mb-6">
        <button
          onClick={() => setActiveTab("available")}
          className={`erp-btn ${activeTab === "available" ? "erp-btn--primary" : "erp-btn--ghost"}`}
        >
          <i className="fa-solid fa-briefcase"></i> Available Drives
        </button>
        <button
          onClick={() => setActiveTab("my-applications")}
          className={`erp-btn ${activeTab === "my-applications" ? "erp-btn--primary" : "erp-btn--ghost"}`}
        >
          <i className="fa-solid fa-file-lines"></i> My Applications
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`erp-btn ${activeTab === "profile" ? "erp-btn--primary" : "erp-btn--ghost"}`}
        >
          <i className="fa-solid fa-user-graduate"></i> My Profile
        </button>
      </div>

      {/* TAB 1: AVAILABLE DRIVES */}
      {activeTab === "available" && (
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
      )}

      {/* TAB 2: MY APPLICATIONS */}
      {activeTab === "my-applications" && (
        <div className="erp-grid-2">
          {myApplications.length === 0 ? (
            <div className="erp-card erp-p-8 erp-text-center erp-text-muted" style={{ gridColumn: '1 / -1' }}>
              No applications yet. <span className="erp-text-primary erp-cursor-pointer" onClick={() => setActiveTab("available")}>Apply for drives</span>
            </div>
          ) : (
            myApplications.map(app => (
              <div key={app.id} className="erp-card erp-animate-in">
                <div className="erp-card__header">
                  <div>
                    <div className="erp-card__title">{app.drive_title}</div>
                    <div className="erp-card__subtitle">🏢 {app.company_name}</div>
                  </div>
                  <span className={`erp-pill ${
                    app.application_status === 'APPLIED' ? 'erp-pill--primary' :
                    app.application_status === 'SHORTLISTED' ? 'erp-pill--warning' :
                    app.application_status === 'SELECTED' ? 'erp-pill--success' :
                    app.application_status === 'REJECTED' ? 'erp-pill--danger' :
                    app.application_status === 'WITHDRAWN' ? 'erp-pill--inactive' : 'erp-pill--inactive'
                  }`}>
                    {getStatusEmoji(app.application_status)} {app.application_status}
                  </span>
                </div>
                <div className="erp-card__body">
                  <div className="erp-text-sm erp-text-muted erp-mb-4">
                    <p className="erp-mb-1"><i className="fa-solid fa-clock erp-mr-2"></i> Applied: {new Date(app.applied_at).toLocaleDateString()}</p>
                    {app.drive_date && <p><i className="fa-solid fa-calendar erp-mr-2"></i> Drive Date: {app.drive_date}</p>}
                  </div>

                  {app.feedback && (
                    <div className="erp-alert erp-alert--info erp-text-xs erp-mb-4">
                      <strong>Feedback:</strong> {app.feedback}
                    </div>
                  )}

                  {app.is_active && app.application_status === "APPLIED" && (
                    <button
                      onClick={() => handleWithdraw(app.id)}
                      disabled={loading}
                      className="erp-btn erp-btn--danger erp-btn--sm"
                      style={{ width: '100%' }}
                    >
                      <i className="fa-solid fa-trash"></i> Withdraw Application
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: MY PROFILE */}
      {activeTab === "profile" && (
        <div className="erp-card erp-mb-6">
          <div className="erp-card__header">
            <div className="erp-card__title">Academic Details</div>
          </div>
          <div style={{ padding: '20px' }}>
            <p style={{ fontSize: '13px', color: 'var(--erp-text-muted)', marginBottom: '16px' }}>
              Fill in your academic metrics. These will be used for drive eligibility checks.
            </p>
            <div className="erp-form-grid-2">
              <div className="erp-form-group">
                <label>Current CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  name="cgpa"
                  value={profile.cgpa || ""}
                  onChange={handleProfileChange}
                  className="erp-form-control"
                  placeholder="e.g. 8.5"
                />
              </div>
              <div className="erp-form-group">
                <label>Current Active Backlogs</label>
                <input
                  type="number"
                  name="current_backlogs"
                  value={profile.current_backlogs ?? ""}
                  onChange={handleProfileChange}
                  className="erp-form-control"
                  placeholder="e.g. 0"
                />
              </div>
              <div className="erp-form-group">
                <label>History Backlogs</label>
                <input
                  type="number"
                  name="history_backlogs"
                  value={profile.history_backlogs ?? ""}
                  onChange={handleProfileChange}
                  className="erp-form-control"
                  placeholder="e.g. 1"
                />
              </div>
              <div className="erp-form-group">
                <label>10th Marks (%)</label>
                <input
                  type="number"
                  step="0.01"
                  name="tenth_marks"
                  value={profile.tenth_marks || ""}
                  onChange={handleProfileChange}
                  className="erp-form-control"
                  placeholder="e.g. 85.5"
                />
              </div>
              <div className="erp-form-group">
                <label>12th Marks (%)</label>
                <input
                  type="number"
                  step="0.01"
                  name="twelfth_marks"
                  value={profile.twelfth_marks || ""}
                  onChange={handleProfileChange}
                  className="erp-form-control"
                  placeholder="e.g. 80.0"
                />
              </div>
              <div className="erp-form-group">
                <label>Diploma Marks (%) - Optional</label>
                <input
                  type="number"
                  step="0.01"
                  name="diploma_marks"
                  value={profile.diploma_marks || ""}
                  onChange={handleProfileChange}
                  className="erp-form-control"
                  placeholder="e.g. 82.0"
                />
              </div>
              <div className="erp-form-group">
                <label>Batch Year</label>
                <input
                  type="number"
                  name="batch_year"
                  value={profile.batch_year || ""}
                  onChange={handleProfileChange}
                  className="erp-form-control"
                  placeholder="e.g. 2024"
                />
              </div>
              <div className="erp-form-group">
                <label>Gender</label>
                <select
                  name="gender"
                  value={profile.gender || ""}
                  onChange={handleProfileChange}
                  className="erp-form-control"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={profileLoading}
              className="erp-btn erp-btn--primary erp-btn--lg"
              style={{ width: '100%', marginTop: '20px' }}
            >
              {profileLoading ? "Saving..." : "💾 Save Academic Profile"}
            </button>
          </div>
        </div>
      )}

      {/* ELIGIBILITY CHECK MODAL */}
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