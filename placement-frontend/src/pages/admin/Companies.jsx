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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Companies</h1>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-4 rounded mb-4">{success}</div>}

      {/* FORM */}
      <div className="bg-white p-6 rounded shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Add New Company</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input
            placeholder="Company Name *"
            value={form.name}
            onChange={e => setForm({...form, name: e.target.value})}
            className="border p-2 rounded"
          />
          <input
            placeholder="Industry *"
            value={form.industry}
            onChange={e => setForm({...form, industry: e.target.value})}
            className="border p-2 rounded"
          />
          <input
            placeholder="Website *"
            value={form.website}
            onChange={e => setForm({...form, website: e.target.value})}
            className="border p-2 rounded"
          />
          <input
            placeholder="Address *"
            value={form.address}
            onChange={e => setForm({...form, address: e.target.value})}
            className="border p-2 rounded"
          />
          <input
            placeholder="HR Contact Name"
            value={form.hr_contact_name}
            onChange={e => setForm({...form, hr_contact_name: e.target.value})}
            className="border p-2 rounded"
          />
          <input
            placeholder="HR Contact Email"
            value={form.hr_contact_email}
            onChange={e => setForm({...form, hr_contact_email: e.target.value})}
            className="border p-2 rounded"
          />
          <input
            placeholder="HR Contact Phone"
            value={form.hr_contact_phone}
            onChange={e => setForm({...form, hr_contact_phone: e.target.value})}
            className="border p-2 rounded"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_approved}
              onChange={e => setForm({...form, is_approved: e.target.checked})}
              className="w-4 h-4"
            />
            Approved
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? "Adding..." : "Add Company"}
        </button>
      </div>

      {/* LIST */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-lg font-semibold mb-4">Company List</h2>
        {duplicates.size > 0 && (
          <div className="bg-yellow-50 border border-yellow-300 p-3 rounded mb-4 text-yellow-800 text-sm">
            ⚠️ <strong>Exact Duplicates Found:</strong> {duplicates.size} duplicate(s)
            <br />
            💡 Tip: Delete the duplicate entry (same name AND address) to clean up your database
          </div>
        )}
        
        {loading && <p>Loading...</p>}
        {companies.length === 0 ? (
          <p className="text-gray-500">No companies found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2 text-left">ID</th>
                  <th className="border p-2 text-left">Name</th>
                  <th className="border p-2 text-left">Industry</th>
                  <th className="border p-2 text-left">Website</th>
                  <th className="border p-2 text-left">Address/Location</th>
                  <th className="border p-2 text-left">HR Contact</th>
                  <th className="border p-2 text-left">Approved</th>
                  <th className="border p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(c => (
                  <tr
                    key={c.id}
                    className={`hover:bg-gray-50 ${isDuplicate(c) ? "bg-yellow-100" : ""}`}
                  >
                    <td className="border p-2">{c.id}</td>
                    <td className="border p-2 font-medium">
                      {c.name}
                      {isDuplicate(c) && (
                        <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-1 rounded">
                          DUPLICATE
                        </span>
                      )}
                    </td>
                    <td className="border p-2">{c.industry}</td>
                    <td className="border p-2">
                      <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        Visit
                      </a>
                    </td>
                    <td className="border p-2">{c.address}</td>
                    <td className="border p-2">{c.hr_contact_name || "-"}</td>
                    <td className="border p-2">{c.is_approved ? "Yes" : "No"}</td>
                    <td className="border p-2 text-center">
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        disabled={loading}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        🗑️ Delete
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
  );
}