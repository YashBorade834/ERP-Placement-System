import { useEffect, useState } from "react";
import { getCompanies, createCompany, deleteCompany } from "../../api/companyApi";
import { getMOUs, createMOU, deleteMOU } from "../../api/mouApi";
import { API_URL } from "../../config";

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [mousMap, setMousMap] = useState({});
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

  const [mouForm, setMouForm] = useState({
    addMou: false,
    file: null,
    signedDate: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  // Modal for managing existing company MOUs
  const [showMouModal, setShowMouModal] = useState(false);
  const [selectedCompanyForMou, setSelectedCompanyForMou] = useState(null);
  const [modalForm, setModalForm] = useState({
    file: null,
    signedDate: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const [compRes, mouRes] = await Promise.all([
        getCompanies(),
        getMOUs()
      ]);
      setCompanies(compRes.data);
      
      // Create a map of company_id -> mou
      const map = {};
      mouRes.data.forEach(m => {
        map[m.company_id] = m;
      });
      setMousMap(map);
      
      // Find duplicate companies (same name AND address)
      const companyMap = {};
      compRes.data.forEach(company => {
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
      console.error("Error loading companies & MOUs:", err);
      setError("Failed to load companies and MOUs: " + (err.response?.data?.detail || err.message));
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

    if (mouForm.addMou && !mouForm.file) {
      setError("Please select an MOU file to upload!");
      return;
    }

    try {
      setLoading(true);
      const res = await createCompany(form);
      
      // If MOU checked, upload the MOU file
      if (mouForm.addMou && mouForm.file) {
        const companyId = res.data.id;
        const formData = new FormData();
        formData.append("company_id", companyId);
        formData.append("signed_date", mouForm.signedDate);
        formData.append("file", mouForm.file);
        if (mouForm.remarks) {
          formData.append("remarks", mouForm.remarks);
        }
        await createMOU(formData);
        setSuccess("Company and MOU added successfully!");
      } else {
        setSuccess("Company added successfully!");
      }

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

      setMouForm({
        addMou: false,
        file: null,
        signedDate: new Date().toISOString().split("T")[0],
        remarks: "",
      });

      loadCompanies();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error creating company or MOU:", err);
      setError("Failed to create company/MOU: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMou = async (mouId, companyName) => {
    const confirmed = window.confirm(
      `⚠️ Are you sure you want to delete the MOU for "${companyName}"?\n\nThis will remove the file from the system.`
    );
    
    if (!confirmed) return;

    try {
      setLoading(true);
      await deleteMOU(mouId);
      setSuccess(`MOU for "${companyName}" deleted successfully!`);
      loadCompanies();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error deleting MOU:", err);
      setError("Failed to delete MOU: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMouModal = (company) => {
    setSelectedCompanyForMou(company);
    const existingMou = mousMap[company.id];
    setModalForm({
      file: null,
      signedDate: existingMou ? existingMou.signed_date : new Date().toISOString().split("T")[0],
      remarks: existingMou ? existingMou.remarks || "" : "",
    });
    setShowMouModal(true);
  };

  const handleModalSubmit = async () => {
    if (!modalForm.file && !mousMap[selectedCompanyForMou.id]) {
      setError("Please select an MOU file!");
      return;
    }

    try {
      setLoading(true);
      const existingMou = mousMap[selectedCompanyForMou.id];
      
      // If updating, delete the old MOU record (and file) first to avoid orphans
      if (existingMou && modalForm.file) {
        await deleteMOU(existingMou.id);
      }

      const formData = new FormData();
      formData.append("company_id", selectedCompanyForMou.id);
      formData.append("signed_date", modalForm.signedDate);
      
      if (modalForm.file) {
        formData.append("file", modalForm.file);
      } else {
        setError("Please select a file to upload!");
        return;
      }
      
      if (modalForm.remarks) {
        formData.append("remarks", modalForm.remarks);
      }

      await createMOU(formData);
      setSuccess(`MOU for "${selectedCompanyForMou.name}" updated successfully!`);
      setShowMouModal(false);
      setSelectedCompanyForMou(null);
      loadCompanies();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error saving MOU:", err);
      setError("Failed to save MOU: " + (err.response?.data?.detail || err.message));
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

            {/* MOU Upload Section */}
            <div className="erp-form-group" style={{ gridColumn: 'span 3' }}>
              <label className="erp-flex-center erp-gap-2 erp-cursor-pointer erp-mb-2">
                <input
                  type="checkbox"
                  checked={mouForm.addMou}
                  onChange={e => setMouForm({...mouForm, addMou: e.target.checked})}
                  className="erp-checkbox"
                />
                <span className="erp-fw-700">Add MOU (Memorandum of Understanding)</span>
              </label>
              
              {mouForm.addMou && (
                <div className="erp-form-grid-3 erp-p-4 erp-mt-2" style={{ background: 'rgba(0, 0, 0, 0.02)', border: '1px dashed var(--erp-border)', borderRadius: '8px' }}>
                  <div className="erp-form-group">
                    <label>MOU File *</label>
                    <input
                      type="file"
                      onChange={e => setMouForm({...mouForm, file: e.target.files[0]})}
                      className="erp-form-control"
                      accept=".pdf,.doc,.docx"
                    />
                  </div>
                  <div className="erp-form-group">
                    <label>Signed Date *</label>
                    <input
                      type="date"
                      value={mouForm.signedDate}
                      onChange={e => setMouForm({...mouForm, signedDate: e.target.value})}
                      className="erp-form-control"
                    />
                  </div>
                  <div className="erp-form-group">
                    <label>Remarks</label>
                    <input
                      placeholder="e.g. Valid for 3 years"
                      value={mouForm.remarks}
                      onChange={e => setMouForm({...mouForm, remarks: e.target.value})}
                      className="erp-form-control"
                    />
                  </div>
                </div>
              )}
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
                    <th>MOU</th>
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
                      <td>
                        {mousMap[c.id] ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div className="erp-flex-center erp-gap-2">
                              <a 
                                href={`${API_URL}/${mousMap[c.id].file_path}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="erp-btn erp-btn--success erp-btn--sm erp-flex-center erp-gap-1"
                                title="Download/View MOU"
                                style={{ padding: '4px 8px', fontSize: '11px' }}
                              >
                                <i className="fa-solid fa-file-pdf"></i> View
                              </a>
                              <button
                                onClick={() => handleOpenMouModal(c)}
                                className="erp-btn erp-btn--warning erp-btn--sm"
                                title="Update MOU"
                                style={{ padding: '4px 6px', fontSize: '10px' }}
                              >
                                <i className="fa-solid fa-pen"></i>
                              </button>
                              <button
                                onClick={() => handleDeleteMou(mousMap[c.id].id, c.name)}
                                className="erp-btn erp-btn--danger erp-btn--sm"
                                title="Delete MOU"
                                style={{ padding: '4px 6px', fontSize: '10px' }}
                              >
                                <i className="fa-solid fa-trash-can"></i>
                              </button>
                            </div>
                            <div className="erp-text-xs erp-text-muted" style={{ fontSize: '10px' }}>
                              Signed: {new Date(mousMap[c.id].signed_date).toLocaleDateString()}
                            </div>
                            {mousMap[c.id].remarks && (
                              <div className="erp-text-xs erp-text-muted" style={{ fontSize: '10px', fontStyle: 'italic', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={mousMap[c.id].remarks}>
                                "{mousMap[c.id].remarks}"
                              </div>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenMouModal(c)}
                            className="erp-btn erp-btn--primary erp-btn--sm erp-flex-center erp-gap-1"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                          >
                            <i className="fa-solid fa-plus"></i> Add MOU
                          </button>
                        )}
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

      {/* MOU MODAL */}
      {showMouModal && selectedCompanyForMou && (
        <div className="erp-modal-overlay erp-modal--open" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="erp-modal" style={{ width: '100%', maxWidth: '500px', backgroundColor: 'var(--erp-card-bg, #fff)', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
            <div className="erp-modal__header" style={{ padding: '16px', borderBottom: '1px solid var(--erp-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="erp-modal__title" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                {mousMap[selectedCompanyForMou.id] ? "Update MOU" : "Add MOU"} for {selectedCompanyForMou.name}
              </div>
              <button 
                className="erp-modal__close" 
                onClick={() => { setShowMouModal(false); setSelectedCompanyForMou(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <div className="erp-modal__body" style={{ padding: '16px' }}>
              <div className="erp-form-group erp-mb-4">
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>MOU File * (PDF/Doc)</label>
                <input
                  type="file"
                  onChange={e => setModalForm({...modalForm, file: e.target.files[0]})}
                  className="erp-form-control"
                  accept=".pdf,.doc,.docx"
                />
                {mousMap[selectedCompanyForMou.id] && (
                  <p className="erp-text-xs erp-text-muted erp-mt-1" style={{ fontSize: '11px', marginTop: '4px' }}>
                    Note: Replacing MOU requires uploading a new file.
                  </p>
                )}
              </div>
              
              <div className="erp-form-group erp-mb-4">
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Signed Date *</label>
                <input
                  type="date"
                  value={modalForm.signedDate}
                  onChange={e => setModalForm({...modalForm, signedDate: e.target.value})}
                  className="erp-form-control"
                />
              </div>
              
              <div className="erp-form-group erp-mb-4">
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500' }}>Remarks</label>
                <input
                  placeholder="e.g. Active for 3 years"
                  value={modalForm.remarks}
                  onChange={e => setModalForm({...modalForm, remarks: e.target.value})}
                  className="erp-form-control"
                />
              </div>
            </div>
            
            <div className="erp-modal__footer" style={{ padding: '16px', borderTop: '1px solid var(--erp-border)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                onClick={() => { setShowMouModal(false); setSelectedCompanyForMou(null); }} 
                className="erp-btn erp-btn--ghost"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                onClick={handleModalSubmit} 
                className="erp-btn erp-btn--primary"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save MOU"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}