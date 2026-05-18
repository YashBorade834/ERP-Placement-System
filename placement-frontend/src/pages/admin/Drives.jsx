import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCompanies } from "../../api/companyApi";
import { createCompleteDrive, getDrives, getCompleteDrive, updateCompleteDrive } from "../../api/driveApi";

export default function Drives() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedDriveId, setSelectedDriveId] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    drive: true,
    eligibility: true,
    workflow: true,
    rounds: true,
  });

  const [form, setForm] = useState({
    // Drive Details
    company_id: "",
    title: "",
    description: "",
    drive_date: "",
    venue: "",
    package: "",
    is_published: false,
    is_active: true,
    registration_open: true,

    // Eligibility Rules
    eligibility: {
      min_cgpa: "",
      max_backlogs: "",
      min_backlogs: "",
      allowed_branches: "",
      gender_restriction: "",
      min_batch: "",
      max_batch: "",
      other_criteria: "",
    },

    // Workflow
    workflow: {
      description: "",
      total_rounds: 1,
      rounds: [{ round_number: 1, round_name: "", mode: "", remarks: "", round_date: "" }],
    },
  });

  const loadCompanies = async () => {
    try {
      const res = await getCompanies();
      setCompanies(res.data);
      setError("");
    } catch (err) {
      console.error("Error loading companies:", err);
      setError("Failed to load companies: " + (err.response?.data?.detail || err.message));
    }
  };

  const loadDrives = async () => {
    try {
      const res = await getDrives();
      setDrives(res.data);
    } catch (err) {
      console.error("Error loading drives:", err);
    }
  };

  useEffect(() => {
    loadCompanies();
    loadDrives();
  }, []);

  const handleCompanyChange = (e) => {
    const companyId = e.target.value;
    setForm({ ...form, company_id: companyId });
    const selected = companies.find(c => c.id === parseInt(companyId));
    setSelectedCompany(selected);
  };

  const handleEligibilityChange = (field, value) => {
    setForm({
      ...form,
      eligibility: { ...form.eligibility, [field]: value },
    });
  };

  const handleWorkflowChange = (field, value) => {
    setForm({
      ...form,
      workflow: { ...form.workflow, [field]: value },
    });
  };

  const handleRoundChange = (index, field, value) => {
    const updatedRounds = [...form.workflow.rounds];
    updatedRounds[index] = { ...updatedRounds[index], [field]: value };
    setForm({
      ...form,
      workflow: { ...form.workflow, rounds: updatedRounds },
    });
  };

  const addRound = () => {
    const newRoundNumber = form.workflow.rounds.length + 1;
    setForm({
      ...form,
      workflow: {
        ...form.workflow,
        total_rounds: newRoundNumber,
        rounds: [
          ...form.workflow.rounds,
          { round_number: newRoundNumber, round_name: "", mode: "", remarks: "", round_date: "" },
        ],
      },
    });
  };

  const removeRound = (index) => {
    const updatedRounds = form.workflow.rounds.filter((_, i) => i !== index);
    setForm({
      ...form,
      workflow: {
        ...form.workflow,
        total_rounds: updatedRounds.length,
        rounds: updatedRounds.map((r, i) => ({ ...r, round_number: i + 1 })),
      },
    });
  };

  const handleEditDrive = async (driveId) => {
    try {
      setLoading(true);
      const res = await getCompleteDrive(driveId);
      const { drive, eligibility, workflow } = res.data;

      setEditMode(true);
      setSelectedDriveId(driveId);

      // Populate form
      setForm({
        company_id: drive.company_id.toString(),
        title: drive.title,
        description: drive.description || "",
        drive_date: drive.drive_date || "",
        venue: drive.venue || "",
        package: drive.package || "",
        is_published: drive.is_published,
        is_active: drive.is_active,
        registration_open: drive.registration_open,
        eligibility: {
          min_cgpa: eligibility?.min_cgpa || "",
          max_backlogs: eligibility?.max_backlogs || "",
          min_backlogs: eligibility?.min_backlogs || "",
          allowed_branches: eligibility?.allowed_branches || "",
          gender_restriction: eligibility?.gender_restriction || "",
          min_batch: eligibility?.min_batch || "",
          max_batch: eligibility?.max_batch || "",
          other_criteria: eligibility?.other_criteria || "",
        },
        workflow: {
          description: workflow?.description || "",
          total_rounds: workflow?.total_rounds || 1,
          rounds: workflow?.rounds?.length > 0 ? workflow.rounds.map(r => ({
            round_number: r.round_number,
            round_name: r.round_name,
            mode: r.mode || "",
            remarks: r.remarks || "",
            round_date: r.round_date || ""
          })) : [{ round_number: 1, round_name: "", mode: "", remarks: "", round_date: "" }],
        },
      });

      // Find company
      const selected = companies.find(c => c.id === drive.company_id);
      setSelectedCompany(selected);

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Expand sections
      setExpandedSections({ drive: true, eligibility: true, workflow: true, rounds: true });

    } catch (err) {
      console.error("Error fetching drive details:", err);
      setError("Failed to load drive details for editing.");
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditMode(false);
    setSelectedDriveId(null);
    resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setForm({
      company_id: "",
      title: "",
      description: "",
      drive_date: "",
      venue: "",
      package: "",
      is_published: false,
      is_active: true,
      registration_open: true,
      eligibility: {
        min_cgpa: "",
        max_backlogs: "",
        min_backlogs: "",
        allowed_branches: "",
        gender_restriction: "",
        min_batch: "",
        max_batch: "",
        other_criteria: "",
      },
      workflow: {
        description: "",
        total_rounds: 1,
        rounds: [{ round_number: 1, round_name: "", mode: "", remarks: "", round_date: "" }],
      },
    });
    setSelectedCompany(null);
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    // Validation
    if (!form.company_id || !form.title || !form.venue) {
      setError("Company, Title, and Venue are required!");
      return;
    }

    try {
      setLoading(true);

      // Helper to convert empty strings to null and ensure numbers are correct
      const cleanEligibility = () => {
        const e = form.eligibility;
        if (!Object.values(e).some(v => v !== "" && v !== null)) return null;
        return {
          min_cgpa: e.min_cgpa !== "" ? parseFloat(e.min_cgpa) : null,
          max_backlogs: e.max_backlogs !== "" ? parseInt(e.max_backlogs) : null,
          min_backlogs: e.min_backlogs !== "" ? parseInt(e.min_backlogs) : null,
          min_batch: e.min_batch !== "" ? parseInt(e.min_batch) : null,
          max_batch: e.max_batch !== "" ? parseInt(e.max_batch) : null,
          allowed_branches: e.allowed_branches || null,
          gender_restriction: e.gender_restriction || null,
          other_criteria: e.other_criteria || null,
        };
      };

      const cleanWorkflow = () => {
        const w = form.workflow;
        if (!w.description && w.rounds.every(r => !r.round_name)) return null;
        return {
          description: w.description || "Round details",
          total_rounds: parseInt(w.total_rounds) || 1,
          rounds: w.rounds.map(r => ({
            round_number: parseInt(r.round_number),
            round_name: r.round_name || "Round",
            mode: r.mode || null,
            remarks: r.remarks || null,
            round_date: r.round_date || null
          }))
        };
      };

      const driveData = {
        company_id: parseInt(form.company_id),
        title: form.title,
        description: form.description || null,
        drive_date: form.drive_date || null,
        venue: form.venue,
        package: form.package || null,
        is_published: form.is_published,
        is_active: form.is_active,
        registration_open: form.registration_open,
        eligibility: cleanEligibility(),
        workflow: cleanWorkflow(),
      };

      if (editMode) {
        console.log("Updating drive:", selectedDriveId, driveData);
        await updateCompleteDrive(selectedDriveId, driveData);
        setSuccess(`✓ Drive "${form.title}" updated successfully!`);
      } else {
        console.log("Submitting complete drive data:", driveData);
        await createCompleteDrive(driveData);
        setSuccess(`✨ Drive "${form.title}" created successfully!`);
      }

      // Reset form
      resetForm();
      setEditMode(false);
      setSelectedDriveId(null);
      loadDrives();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error creating drive:", err);
      setError("Failed to create drive: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections({ ...expandedSections, [section]: !expandedSections[section] });
  };

  return (
    <>
      <div className="erp-page-title">
        <h1>{editMode ? "📝 Edit Placement Drive" : "Create Placement Drive"}</h1>
        <p>{editMode ? `Updating drive: ${form.title}` : "Set up drives, eligibility rules, and workflows"}</p>
      </div>

      {error && <div className="erp-alert erp-alert--danger erp-mb-4"><i className="fa-solid fa-circle-xmark"></i><span>{error}</span></div>}
      {success && <div className="erp-alert erp-alert--success erp-mb-4"><i className="fa-solid fa-circle-check"></i><span>{success}</span></div>}

      {/* COMPREHENSIVE FORM */}
      <div className="erp-card erp-mb-6">
        {/* ===== SECTION 1: DRIVE DETAILS ===== */}
        <div className="erp-card__header erp-cursor-pointer" onClick={() => toggleSection("drive")}>
          <div>
            <div className="erp-card__title">📋 Drive Details</div>
            <div className="erp-card__subtitle">Core information about the placement drive</div>
          </div>
          <i className={`fa-solid ${expandedSections.drive ? "fa-chevron-down" : "fa-chevron-right"} erp-text-muted`}></i>
        </div>
        {expandedSections.drive && (
          <div className="erp-card__body">
              <div className="erp-form-grid-2">
                <div className="erp-form-group">
                  <label>Select Company *</label>
                  <select
                    value={form.company_id}
                    onChange={handleCompanyChange}
                    className="erp-form-control"
                  >
                    <option value="">-- Select Company --</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.address || "No location"} ({c.industry})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="erp-form-group">
                  <label>Drive Title (Role) *</label>
                  <input
                    placeholder="e.g., Java Developer"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="erp-form-control"
                  />
                </div>

                <div className="erp-form-group">
                  <label>Venue/Location *</label>
                  <input
                    placeholder="e.g., Pune, Mumbai"
                    value={form.venue}
                    onChange={e => setForm({ ...form, venue: e.target.value })}
                    className="erp-form-control"
                  />
                </div>

                <div className="erp-form-group">
                  <label>Package (CTC)</label>
                  <input
                    placeholder="e.g., 12 LPA"
                    value={form.package}
                    onChange={e => setForm({ ...form, package: e.target.value })}
                    className="erp-form-control"
                  />
                </div>

                <div className="erp-form-group">
                  <label>Drive Date</label>
                  <input
                    type="date"
                    value={form.drive_date}
                    onChange={e => setForm({ ...form, drive_date: e.target.value })}
                    className="erp-form-control"
                  />
                </div>

                <div className="erp-form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Description</label>
                  <textarea
                    placeholder="Enter drive description..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="erp-form-control"
                    rows="3"
                  />
                </div>
              </div>

              {/* Status Controls */}
              <div className="erp-grid-3 erp-mb-4 erp-mt-4">
                <label className="erp-flex-center erp-gap-2 erp-cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={e => setForm({ ...form, is_published: e.target.checked })}
                    className="erp-checkbox"
                  />
                  <span className="erp-text-sm">Published</span>
                </label>

                <label className="erp-flex-center erp-gap-2 erp-cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                    className="erp-checkbox"
                  />
                  <span className="erp-text-sm">Active</span>
                </label>

                <label className="erp-flex-center erp-gap-2 erp-cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.registration_open}
                    onChange={e => setForm({ ...form, registration_open: e.target.checked })}
                    className="erp-checkbox"
                  />
                  <span className="erp-text-sm">Registration Open</span>
                </label>
              </div>

              {selectedCompany && (
                <div className="erp-alert erp-alert--info erp-mt-4">
                  <i className="fa-solid fa-circle-info"></i>
                  <span>
                    <strong>Company:</strong> {selectedCompany.name} | <strong>Location:</strong> {selectedCompany.address}
                  </span>
                </div>
              )}
            </div>
          )}

        {/* ===== SECTION 2: ELIGIBILITY RULES ===== */}
        <div className="erp-card__header erp-cursor-pointer" onClick={() => toggleSection("eligibility")}>
          <div>
            <div className="erp-card__title">✅ Eligibility Rules</div>
            <div className="erp-card__subtitle">Define criteria for candidates</div>
          </div>
          <i className={`fa-solid ${expandedSections.eligibility ? "fa-chevron-down" : "fa-chevron-right"} erp-text-muted`}></i>
        </div>
        {expandedSections.eligibility && (
          <div className="erp-card__body">
              <p style={{ fontSize: '13px', color: 'var(--erp-text-muted)', marginBottom: '16px' }}>Define criteria that students must meet to apply</p>
              <div className="erp-form-grid-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Min CGPA (e.g., 7.5)"
                  value={form.eligibility.min_cgpa}
                  onChange={e => handleEligibilityChange("min_cgpa", e.target.value)}
                  className="erp-form-control"
                />
                <input
                  type="text"
                  placeholder="Allowed Branches (e.g., CSE, IT, ECE)"
                  value={form.eligibility.allowed_branches}
                  onChange={e => handleEligibilityChange("allowed_branches", e.target.value)}
                  className="erp-form-control"
                />
                <input
                  type="number"
                  placeholder="Min Batch Year (e.g., 2023)"
                  value={form.eligibility.min_batch}
                  onChange={e => handleEligibilityChange("min_batch", e.target.value)}
                  className="erp-form-control"
                />
                <input
                  type="number"
                  placeholder="Max Batch Year (e.g., 2024)"
                  value={form.eligibility.max_batch}
                  onChange={e => handleEligibilityChange("max_batch", e.target.value)}
                  className="erp-form-control"
                />
                <input
                  type="number"
                  placeholder="Min Backlogs"
                  value={form.eligibility.min_backlogs}
                  onChange={e => handleEligibilityChange("min_backlogs", e.target.value)}
                  className="erp-form-control"
                />
                <input
                  type="number"
                  placeholder="Max Backlogs"
                  value={form.eligibility.max_backlogs}
                  onChange={e => handleEligibilityChange("max_backlogs", e.target.value)}
                  className="erp-form-control"
                />
                <div className="erp-form-group">
                  <label>Gender Restriction</label>
                  <select
                    value={form.eligibility.gender_restriction || "Any"}
                    onChange={e => handleEligibilityChange("gender_restriction", e.target.value)}
                    className="erp-form-control"
                  >
                    <option value="Any">Any (All genders allowed)</option>
                    <option value="Male">Male Only</option>
                    <option value="Female">Female Only</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <textarea
                  placeholder="Other Criteria"
                  value={form.eligibility.other_criteria}
                  onChange={e => handleEligibilityChange("other_criteria", e.target.value)}
                  className="erp-form-control"
                  style={{ gridColumn: '1 / -1' }}
                  rows="2"
                />
              </div>
            </div>
          )}

        {/* ===== SECTION 3: WORKFLOW ===== */}
        <div className="erp-card__header erp-cursor-pointer" onClick={() => toggleSection("workflow")}>
          <div>
            <div className="erp-card__title">🔄 Workflow & Rounds</div>
            <div className="erp-card__subtitle">Recruitment stages and interview rounds</div>
          </div>
          <i className={`fa-solid ${expandedSections.workflow ? "fa-chevron-down" : "fa-chevron-right"} erp-text-muted`}></i>
        </div>
        {expandedSections.workflow && (
          <div className="erp-card__body">
              <div className="erp-form-grid-2">
                <div className="erp-form-group">
                  <label>Workflow Description</label>
                  <textarea
                    placeholder="e.g., 2 rounds: Online Test + Interview"
                    value={form.workflow.description}
                    onChange={e => handleWorkflowChange("description", e.target.value)}
                    className="erp-form-control"
                    rows="2"
                  />
                </div>
                <div className="erp-form-group">
                  <label>Total Rounds</label>
                  <input
                    type="number"
                    min="1"
                    value={form.workflow.total_rounds}
                    onChange={e => handleWorkflowChange("total_rounds", parseInt(e.target.value))}
                    className="erp-form-control"
                  />
                </div>
              </div>

              {/* ROUNDS */}
              <div className="erp-mt-6">
                <h3 className="erp-card__title erp-mb-4">Define Rounds</h3>
                {form.workflow.rounds.map((round, index) => (
                  <div key={index} className="erp-card erp-mb-4 erp-animate-in">
                    <div className="erp-card__header">
                      <div className="erp-card__title">Round {round.round_number}</div>
                      {form.workflow.rounds.length > 1 && (
                        <button
                          onClick={() => removeRound(index)}
                          className="erp-btn erp-btn--danger erp-btn--sm"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      )}
                    </div>
                    <div className="erp-card__body">
                      <div className="erp-form-grid-2">
                        <div className="erp-form-group">
                          <label>Round Name</label>
                          <input
                            type="text"
                            placeholder="e.g., Online Test"
                            value={round.round_name}
                            onChange={e => handleRoundChange(index, "round_name", e.target.value)}
                            className="erp-form-control"
                          />
                        </div>
                        <div className="erp-form-group">
                          <label>Mode</label>
                          <input
                            type="text"
                            placeholder="e.g., Online"
                            value={round.mode}
                            onChange={e => handleRoundChange(index, "mode", e.target.value)}
                            className="erp-form-control"
                          />
                        </div>
                        <div className="erp-form-group">
                          <label>Round Date</label>
                          <input
                            type="date"
                            value={round.round_date}
                            onChange={e => handleRoundChange(index, "round_date", e.target.value)}
                            className="erp-form-control"
                          />
                        </div>
                        <div className="erp-form-group">
                          <label>Remarks</label>
                          <input
                            type="text"
                            placeholder="Special instructions"
                            value={round.remarks}
                            onChange={e => handleRoundChange(index, "remarks", e.target.value)}
                            className="erp-form-control"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addRound}
                  className="erp-btn erp-btn--ghost erp-btn--sm"
                >
                  <i className="fa-solid fa-plus"></i> Add Another Round
                </button>
              </div>
            </div>
          )}
        </div>

      <div className="erp-flex erp-gap-3 erp-mb-8">
        <button
          onClick={handleSubmit}
          disabled={loading || !form.company_id || !form.title || !form.venue}
          className="erp-btn erp-btn--primary erp-btn--lg"
          style={{ flex: 2 }}
        >
          {loading ? (editMode ? "Updating..." : "Creating...") : (editMode ? "💾 Update Drive Details" : "✨ Create Complete Drive")}
        </button>
        {editMode && (
          <button
            onClick={cancelEdit}
            className="erp-btn erp-btn--outline erp-btn--lg"
            style={{ flex: 1 }}
          >
            Cancel
          </button>
        )}
      </div>

      {/* DRIVES LIST */}
      <div className="erp-card">
        <div className="erp-card__header">
          <div>
            <div className="erp-card__title">Created Drives</div>
          </div>
        </div>
        
        <div className="erp-card__body">
          {drives.length === 0 ? (
            <p className="erp-text-muted">No drives created yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="erp-table" data-erp-sortable="true">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Role Title</th>
                    <th>Company</th>
                    <th>Venue</th>
                    <th>Package</th>
                    <th>Published</th>
                    <th>Active</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drives.map(d => {
                    const company = companies.find(c => c.id === d.company_id);
                    return (
                      <tr key={d.id}>
                        <td>{d.id}</td>
                        <td><strong>{d.title}</strong></td>
                        <td>{company?.name || "Unknown"}</td>
                        <td>{d.venue}</td>
                        <td>{d.package || "N/A"}</td>
                        <td>
                          <span className={`erp-pill ${d.is_published ? "erp-pill--success" : "erp-pill--ghost"}`}>
                            {d.is_published ? "Yes" : "No"}
                          </span>
                        </td>
                        <td>
                          <span className={`erp-pill ${d.is_active ? "erp-pill--success" : "erp-pill--danger"}`}>
                            {d.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => handleEditDrive(d.id)}
                            className={`erp-btn erp-btn--sm ${selectedDriveId === d.id ? "erp-btn--primary" : "erp-btn--outline"}`}
                          >
                            <i className="fa-solid fa-pen-to-square"></i> Manage
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}