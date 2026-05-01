import { useEffect, useState } from "react";
import { getCompanies } from "../../api/companyApi";
import { getDrives } from "../../api/driveApi";
import { getApplicationsCount } from "../../api/applicationStatusApi";



export default function Dashboard() {
  const [stats, setStats] = useState({
    companies: 0,
    drives: 0,
    applications: 0,
  });
  const [companies, setCompanies] = useState([]);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchCompany, setSearchCompany] = useState("");
  const [searchDrive, setSearchDrive] = useState("");
  const [showAllCompanies, setShowAllCompanies] = useState(false);
  const [showAllDrives, setShowAllDrives] = useState(false);

  
  // useEffect(() => {
  //   const loadData = async () => {
  //     try {
  //       setLoading(true);
  //       const companiesRes = await getCompanies();
  //       const drivesRes = await getDrives();
  //       const applicationsRes = await getApplicationsCount();

  //       setCompanies(companiesRes.data);
  //       setDrives(drivesRes.data);
  //       setStats({
  //         companies: companiesRes.data.length,
  //         drives: drivesRes.data.length,
  //         applications: applicationsRes.data.total_applications,
  //       });
  //       setError("");
  //     } catch (err) {
  //       console.error("Error loading dashboard data:", err);
  //       setError("Failed to load dashboard data");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   loadData();
  // }, []);




useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);

      const [companiesRes, drivesRes, applicationsRes] = await Promise.all([
        getCompanies(),
        getDrives(),
        getApplicationsCount(),
      ]);

      setCompanies(companiesRes.data);
      setDrives(drivesRes.data);
      setStats({
        companies: companiesRes.data.length,
        drives: drivesRes.data.length,
        applications: applicationsRes.data.total_applications,
      });

      setError("");
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Failed to load dashboard data. Retrying...");
    } finally {
      setLoading(false);
    }
  };

  // ⏳ Delay to avoid ngrok cold start issue
  const timer = setTimeout(() => {
    loadData();
  }, 500);

  return () => clearTimeout(timer);
}, []);








  // Filter companies based on search
  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchCompany.toLowerCase()) ||
    c.industry.toLowerCase().includes(searchCompany.toLowerCase()) ||
    c.address.toLowerCase().includes(searchCompany.toLowerCase())
  );

  // Filter drives based on search
  const filteredDrives = drives.filter(d => {
    const company = companies.find(c => c.id === d.company_id);
    return (
      d.title.toLowerCase().includes(searchDrive.toLowerCase()) ||
      company?.name.toLowerCase().includes(searchDrive.toLowerCase()) ||
      d.venue?.toLowerCase().includes(searchDrive.toLowerCase())
    );
  });

  // Display logic: show 5 by default or all if "More" clicked or search is active
  const displayedCompanies = (showAllCompanies || searchCompany) ? filteredCompanies : filteredCompanies.slice(0, 5);
  const displayedDrives = (showAllDrives || searchDrive) ? filteredDrives : filteredDrives.slice(0, 5);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-4 text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

      {/* STATS CARDS */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded shadow">
          <h3 className="text-gray-500 text-sm font-semibold">Total Companies</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{stats.companies}</p>
        </div>

        <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded shadow">
          <h3 className="text-gray-500 text-sm font-semibold">Active Drives</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.drives}</p>
        </div>

        <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded shadow">
          <h3 className="text-gray-500 text-sm font-semibold">Applications</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">{stats.applications}</p>
        </div>
      </div>

      {/* COMPANIES TABLE */}
      <div className="bg-white p-6 rounded shadow mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Companies</h2>
          <input
            type="text"
            placeholder="🔍 Search companies..."
            value={searchCompany}
            onChange={e => setSearchCompany(e.target.value)}
            className="border p-2 rounded w-80"
          />
        </div>
        {companies.length === 0 ? (
          <p className="text-gray-500">No companies yet</p>
        ) : filteredCompanies.length === 0 ? (
          <p className="text-gray-500">No companies match your search</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">ID</th>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Industry</th>
                    <th className="p-2 text-left">Website</th>
                    <th className="p-2 text-left">Location</th>
                    <th className="p-2 text-left">HR Contact</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedCompanies.map(c => (
                    <tr key={c.id} className="border-t hover:bg-gray-50">
                      <td className="p-2">{c.id}</td>
                      <td className="p-2 font-medium">{c.name}</td>
                      <td className="p-2">{c.industry}</td>
                      <td className="p-2">
                        <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          Visit
                        </a>
                      </td>
                      <td className="p-2">{c.address || "-"}</td>
                      <td className="p-2">{c.hr_contact_name || "-"}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${c.is_approved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {c.is_approved ? "Approved" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredCompanies.length > 5 && !showAllCompanies && !searchCompany && (
              <button
                onClick={() => setShowAllCompanies(true)}
                className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded cursor-pointer"
              >
                📋 View All Companies ({filteredCompanies.length})
              </button>
            )}
            
            {showAllCompanies && !searchCompany && (
              <button
                onClick={() => setShowAllCompanies(false)}
                className="mt-4 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded cursor-pointer"
              >
                ↑ Show Less
              </button>
            )}
          </>
        )}
      </div>

      {/* DRIVES TABLE */}
      <div className="bg-white p-6 rounded shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Placement Drives</h2>
          <input
            type="text"
            placeholder="🔍 Search drives..."
            value={searchDrive}
            onChange={e => setSearchDrive(e.target.value)}
            className="border p-2 rounded w-80"
          />
        </div>
        {drives.length === 0 ? (
          <p className="text-gray-500">No drives yet</p>
        ) : filteredDrives.length === 0 ? (
          <p className="text-gray-500">No drives match your search</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">ID</th>
                    <th className="p-2 text-left">Role Title</th>
                    <th className="p-2 text-left">Company</th>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Venue</th>
                    <th className="p-2 text-left">Published</th>
                    <th className="p-2 text-left">Active</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedDrives.map(d => {
                    const company = companies.find(c => c.id === d.company_id);
                    return (
                      <tr key={d.id} className="border-t hover:bg-gray-50">
                        <td className="p-2">{d.id}</td>
                        <td className="p-2 font-medium">{d.title}</td>
                        <td className="p-2">{company?.name || "Unknown"}</td>
                        <td className="p-2">{d.drive_date || "-"}</td>
                        <td className="p-2">{d.venue || "-"}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${d.is_published ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>
                            {d.is_published ? "✓ Yes" : "✗ No"}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${d.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                            {d.is_active ? "✓ Active" : "✗ Inactive"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {filteredDrives.length > 5 && !showAllDrives && !searchDrive && (
              <button
                onClick={() => setShowAllDrives(true)}
                className="mt-4 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded cursor-pointer"
              >
                📋 View All Drives ({filteredDrives.length})
              </button>
            )}
            
            {showAllDrives && !searchDrive && (
              <button
                onClick={() => setShowAllDrives(false)}
                className="mt-4 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded cursor-pointer"
              >
                ↑ Show Less
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}