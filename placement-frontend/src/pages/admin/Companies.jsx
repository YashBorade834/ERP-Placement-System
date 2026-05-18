import { useEffect, useState } from "react";
import { getCompanies, createCompany, deleteCompany } from "../../api/companyApi";

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [duplicates, setDuplicates] = useState(new Set());
  const [form, setForm] = useState({
    name: "",
    industry: "",
    website: "",
    address: "",
    hr_contact_name: "",
    hr_contact_email: "",
    hr_contact_phone: "",
    is_approved: false,
  });

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const res = await getCompanies();
      setCompanies(res.data);
      
      // Find duplicate companies (same name AND address)
      const companyMap = {};
      res.data.forEach(company => {
        const key = `${company.name}|${company.address}`;
        companyMap[key] = (companyMap[key] || 0) + 1;
      });
      
      const duplicateKeys = new Set();
      Object.keys(companyMap).forEach(key => {
        if (companyMap[key] > 1) {
          duplicateKeys.add(key);
        }
      });
      
      setDuplicates(duplicateKeys);
      setError("");
    } catch (err) {
      console.error("Error loading companies:", err);
      setError("Failed to load companies: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    
    // Validation
    if (!form.name || !form.industry || !form.website || !form.address) {
      setError("Name, Industry, Website, and Address are required!");
      return;
    }

    try {
      setLoading(true);
      await createCompany(form);
      setSuccess("Company added successfully!");
      setForm({
        name: "",
        industry: "",
        website: "",
        address: "",
        hr_contact_name: "",
        hr_contact_email: "",
        hr_contact_phone: "",
        is_approved: false,
      });
      loadCompanies();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error creating company:", err);
      setError("Failed to create company: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    const confirmed = window.confirm(
      `⚠️ Are you sure you want to delete "${name}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      setLoading(true);
      await deleteCompany(id);
      setSuccess(`Company "${name}" deleted successfully!`);
      loadCompanies();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error deleting company:", err);
      setError("Failed to delete company: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const isDuplicate = (company) => {
    const key = `${company.name}|${company.address}`;
    return duplicates.has(key);
  };

  return (
    <>
      <div className="erp-page-title">
        <h1>Companies</h1>
        <p>Manage registered companies</p>
      </div>

      {error && <div className="erp-alert erp-alert--danger erp-mb-4"><i className="fa-solid fa-circle-xmark"></i><span>{error}</span></div>}
      {success && <div className="erp-alert erp-alert--success erp-mb-4"><i className="fa-solid fa-circle-check"></i><span>{success}</span></div>}

      {/* FORM */}
      <div className="erp-card erp-mb-6">
        <div className="erp-card__header">
          <div>
            <div className="erp-card__title">Add New Company</div>
            <div className="erp-card__subtitle">Register a new recruitment partner</div>
          </div>
        </div>
        
        <div className="erp-card__body">
          <div className="erp-form-grid-3 erp-mb-6">
            <div className="erp-form-group">
              <label>Company Name *</label>
              <input
                placeholder="e.g. Google"
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="erp-form-control"
              />
            </div>
            <div className="erp-form-group">
              <label>Industry *</label>
              <input
                placeholder="e.g. Technology"
                value={form.industry}
                onChange={e => setForm({...form, industry: e.target.value})}
                className="erp-form-control"
              />
            </div>
            <div className="erp-form-group">
              <label>Website *</label>
              <input
                placeholder="https://..."
                value={form.website}
                onChange={e => setForm({...form, website: e.target.value})}
                className="erp-form-control"
              />
            </div>
            <div className="erp-form-group">
              <label>Address *</label>
              <input
                placeholder="Location"
                value={form.address}
                onChange={e => setForm({...form, address: e.target.value})}
                className="erp-form-control"
              />
            </div>
            <div className="erp-form-group">
              <label>HR Contact Name</label>
              <input
                placeholder="Contact Person"
                value={form.hr_contact_name}
                onChange={e => setForm({...form, hr_contact_name: e.target.value})}
                className="erp-form-control"
              />
            </div>
            <div className="erp-form-group">
              <label>HR Contact Email</label>
              <input
                placeholder="hr@company.com"
                value={form.hr_contact_email}
                onChange={e => setForm({...form, hr_contact_email: e.target.value})}
                className="erp-form-control"
              />
            </div>
            <div className="erp-form-group">
              <label>HR Contact Phone</label>
              <input
                placeholder="+91..."
                value={form.hr_contact_phone}
                onChange={e => setForm({...form, hr_contact_phone: e.target.value})}
                className="erp-form-control"
              />
            </div>
            <div className="erp-form-group erp-flex-end erp-pb-2">
              <label className="erp-flex-center erp-gap-2 erp-cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_approved}
                  onChange={e => setForm({...form, is_approved: e.target.checked})}
                  className="erp-checkbox"
                />
                <span className="erp-text-sm">Approved</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="erp-btn erp-btn--primary erp-btn--lg"
          >
            <i className="fa-solid fa-plus erp-mr-2"></i> {loading ? "Adding..." : "Add Company"}
          </button>
        </div>
      </div>

      {/* LIST */}
      <div className="erp-card">
        <div className="erp-card__header">
          <div>
            <div className="erp-card__title">Company List</div>
          </div>
        </div>

        <div className="erp-card__body">
          {duplicates.size > 0 && (
            <div className="erp-alert erp-alert--warning erp-mb-4">
              <i className="fa-solid fa-triangle-exclamation"></i>
              <div>
                <div className="erp-fw-700">Exact Duplicates Found ({duplicates.size})</div>
                <div className="erp-text-xs">Tip: Delete duplicate entries to clean up the database.</div>
              </div>
            </div>
          )}
          
          {loading && <p className="erp-text-muted erp-p-4">Loading...</p>}
          {companies.length === 0 ? (
            <p className="erp-text-muted erp-p-4">No companies found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="erp-table" data-erp-sortable="true">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Industry</th>
                    <th>Website</th>
                    <th>Location</th>
                    <th>HR Contact</th>
                    <th>Approved</th>
                    <th className="erp-text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map(c => (
                    <tr key={c.id} className={isDuplicate(c) ? "erp-bg-warning-light" : ""}>
                      <td>{c.id}</td>
                      <td>
                        <div className="erp-flex-center erp-gap-2">
                          <strong>{c.name}</strong>
                          {isDuplicate(c) && (
                            <span className="erp-pill erp-pill--warning erp-pill--sm">
                              DUPLICATE
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{c.industry}</td>
                      <td>
                        <a href={c.website} target="_blank" rel="noopener noreferrer" className="erp-link">
                          Visit
                        </a>
                      </td>
                      <td>{c.address}</td>
                      <td>{c.hr_contact_name || "-"}</td>
                      <td>
                        <span className={`erp-pill ${c.is_approved ? "erp-pill--success" : "erp-pill--warning"}`}>
                          {c.is_approved ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="erp-text-center">
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          disabled={loading}
                          className="erp-btn erp-btn--danger erp-btn--sm"
                        >
                          <i className="fa-solid fa-trash"></i>
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
    </>
  );
}