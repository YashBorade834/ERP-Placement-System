import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCompanies } from "../../api/companyApi";
import { createCompleteDrive, getDrives } from "../../api/driveApi";

export default function Drives() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedCompany, setSelectedCompany] = useState(null);
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
      const driveData = {
        company_id: parseInt(form.company_id),
        title: form.title,
        description: form.description || null,
        drive_date: form.drive_date || null,
        venue: form.venue,
        is_published: form.is_published,
        is_active: form.is_active,
        registration_open: form.registration_open,
        eligibility: Object.values(form.eligibility).some(v => v)
          ? form.eligibility
          : null,
        workflow: form.workflow.description
          ? form.workflow
          : null,
      };

      console.log("Submitting complete drive data:", driveData);
      await createCompleteDrive(driveData);
      setSuccess("Drive created successfully with all configurations!");

      // Reset form
      setForm({
        company_id: "",
        title: "",
        description: "",
        drive_date: "",
        venue: "",
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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Create Placement Drive</h1>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-4 rounded mb-4">{success}</div>}

      {/* COMPREHENSIVE FORM */}
      <div className="bg-white rounded shadow mb-6">
        {/* ===== SECTION 1: DRIVE DETAILS ===== */}
        <div className="border-b">
          <button
            onClick={() => toggleSection("drive")}
            className="w-full p-4 flex justify-between items-center hover:bg-gray-50 font-semibold text-lg"
          >
            <span>📋 Drive Details</span>
            <span>{expandedSections.drive ? "▼" : "▶"}</span>
          </button>
          {expandedSections.drive && (
            <div className="p-6 space-y-4 bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Select Company *</label>
                  <select
                    value={form.company_id}
                    onChange={handleCompanyChange}
                    className="w-full border p-2 rounded"
                  >
                    <option value="">-- Select Company --</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.address || "No location"} ({c.industry})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Drive Title (Role) *</label>
                  <input
                    placeholder="e.g., Java Developer"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full border p-2 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Venue/Location *</label>
                  <input
                    placeholder="e.g., Pune, Mumbai"
                    value={form.venue}
                    onChange={e => setForm({ ...form, venue: e.target.value })}
                    className="w-full border p-2 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Drive Date</label>
                  <input
                    type="date"
                    value={form.drive_date}
                    onChange={e => setForm({ ...form, drive_date: e.target.value })}
                    className="w-full border p-2 rounded"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    placeholder="Enter drive description..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full border p-2 rounded"
                    rows="3"
                  />
                </div>
              </div>

              {/* Status Controls */}
              <div className="grid grid-cols-2 gap-4 bg-white p-3 rounded border">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_published}
                    onChange={e => setForm({ ...form, is_published: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Published (show to students)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={e => setForm({ ...form, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Active (allow applications)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.registration_open}
                    onChange={e => setForm({ ...form, registration_open: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Registration Open</span>
                </label>
              </div>

              {selectedCompany && (
                <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                  <p className="text-sm text-blue-700"><strong>Company:</strong> {selectedCompany.name}</p>
                  <p className="text-sm text-blue-700"><strong>Location:</strong> {selectedCompany.address}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===== SECTION 2: ELIGIBILITY RULES ===== */}
        <div className="border-b">
          <button
            onClick={() => toggleSection("eligibility")}
            className="w-full p-4 flex justify-between items-center hover:bg-gray-50 font-semibold text-lg"
          >
            <span>✅ Eligibility Rules (Optional)</span>
            <span>{expandedSections.eligibility ? "▼" : "▶"}</span>
          </button>
          {expandedSections.eligibility && (
            <div className="p-6 space-y-4 bg-gray-50">
              <p className="text-sm text-gray-600">Define criteria that students must meet to apply</p>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Min CGPA (e.g., 7.5)"
                  value={form.eligibility.min_cgpa}
                  onChange={e => handleEligibilityChange("min_cgpa", e.target.value)}
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  placeholder="Allowed Branches (e.g., CSE, IT, ECE)"
                  value={form.eligibility.allowed_branches}
                  onChange={e => handleEligibilityChange("allowed_branches", e.target.value)}
                  className="border p-2 rounded"
                />
                <input
                  type="number"
                  placeholder="Min Batch Year (e.g., 2023)"
                  value={form.eligibility.min_batch}
                  onChange={e => handleEligibilityChange("min_batch", e.target.value)}
                  className="border p-2 rounded"
                />
                <input
                  type="number"
                  placeholder="Max Batch Year (e.g., 2024)"
                  value={form.eligibility.max_batch}
                  onChange={e => handleEligibilityChange("max_batch", e.target.value)}
                  className="border p-2 rounded"
                />
                <input
                  type="number"
                  placeholder="Min Backlogs"
                  value={form.eligibility.min_backlogs}
                  onChange={e => handleEligibilityChange("min_backlogs", e.target.value)}
                  className="border p-2 rounded"
                />
                <input
                  type="number"
                  placeholder="Max Backlogs"
                  value={form.eligibility.max_backlogs}
                  onChange={e => handleEligibilityChange("max_backlogs", e.target.value)}
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  placeholder="Gender Restriction (e.g., Male, Female, Any)"
                  value={form.eligibility.gender_restriction}
                  onChange={e => handleEligibilityChange("gender_restriction", e.target.value)}
                  className="border p-2 rounded"
                />
                <textarea
                  placeholder="Other Criteria"
                  value={form.eligibility.other_criteria}
                  onChange={e => handleEligibilityChange("other_criteria", e.target.value)}
                  className="border p-2 rounded col-span-2"
                  rows="2"
                />
              </div>
            </div>
          )}
        </div>

        {/* ===== SECTION 3: WORKFLOW ===== */}
        <div className="border-b">
          <button
            onClick={() => toggleSection("workflow")}
            className="w-full p-4 flex justify-between items-center hover:bg-gray-50 font-semibold text-lg"
          >
            <span>🔄 Workflow & Rounds (Optional)</span>
            <span>{expandedSections.workflow ? "▼" : "▶"}</span>
          </button>
          {expandedSections.workflow && (
            <div className="p-6 space-y-4 bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Workflow Description</label>
                  <textarea
                    placeholder="e.g., 2 rounds: Online Test + Interview"
                    value={form.workflow.description}
                    onChange={e => handleWorkflowChange("description", e.target.value)}
                    className="w-full border p-2 rounded"
                    rows="2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Total Rounds</label>
                  <input
                    type="number"
                    min="1"
                    value={form.workflow.total_rounds}
                    onChange={e => handleWorkflowChange("total_rounds", parseInt(e.target.value))}
                    className="w-full border p-2 rounded"
                  />
                </div>
              </div>

              {/* ROUNDS */}
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold text-gray-700">Define Rounds</h3>
                {form.workflow.rounds.map((round, index) => (
                  <div key={index} className="p-4 bg-white border rounded">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold">Round {round.round_number}</h4>
                      {form.workflow.rounds.length > 1 && (
                        <button
                          onClick={() => removeRound(index)}
                          className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                        >
                          🗑️ Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Round Name (e.g., Online Test)"
                        value={round.round_name}
                        onChange={e => handleRoundChange(index, "round_name", e.target.value)}
                        className="border p-2 rounded"
                      />
                      <input
                        type="text"
                        placeholder="Mode (e.g., Online, Offline)"
                        value={round.mode}
                        onChange={e => handleRoundChange(index, "mode", e.target.value)}
                        className="border p-2 rounded"
                      />
                      <input
                        type="date"
                        value={round.round_date}
                        onChange={e => handleRoundChange(index, "round_date", e.target.value)}
                        className="border p-2 rounded"
                      />
                      <input
                        type="text"
                        placeholder="Remarks"
                        value={round.remarks}
                        onChange={e => handleRoundChange(index, "remarks", e.target.value)}
                        className="border p-2 rounded"
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={addRound}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  + Add Round
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SUBMIT BUTTON */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={handleSubmit}
          disabled={loading || !form.company_id || !form.title || !form.venue}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-semibold cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Creating Drive..." : "✨ Create Complete Drive"}
        </button>
      </div>

      {/* DRIVES LIST */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Created Drives</h2>
        {drives.length === 0 ? (
          <p className="text-gray-500">No drives created yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">ID</th>
                  <th className="p-2 text-left">Role Title</th>
                  <th className="p-2 text-left">Company</th>
                  <th className="p-2 text-left">Venue</th>
                  <th className="p-2 text-left">Published</th>
                  <th className="p-2 text-left">Active</th>
                  <th className="p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {drives.map(d => {
                  const company = companies.find(c => c.id === d.company_id);
                  return (
                    <tr key={d.id} className="border-t hover:bg-gray-50">
                      <td className="p-2">{d.id}</td>
                      <td className="p-2 font-medium">{d.title}</td>
                      <td className="p-2">{company?.name || "Unknown"}</td>
                      <td className="p-2">{d.venue}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${d.is_published ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                          {d.is_published ? "✓ Yes" : "✗ No"}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${d.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {d.is_active ? "✓ Active" : "✗ Inactive"}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <button
                          onClick={() => navigate(`/admin/applications/${d.id}`)}
                          className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-xs font-semibold transition"
                        >
                          📊 Manage
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
  );
}