import { useEffect, useState } from "react";
import { getCompanies } from "../../api/companyApi";
import { getDrives } from "../../api/driveApi";
import { getApplicationsCount } from "../../api/applicationStatusApi";
import PlacementAnalytics from "../../components/PlacementAnalytics";



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
      <div style={{ padding: '24px' }}>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="mt-4 text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <div className="erp-page-title">
        <h1>Dashboard Overview</h1>
        <p>Placement Statistics</p>
      </div>

      {error && <div className="erp-alert erp-alert--danger erp-mb-6"><i className="fa-solid fa-circle-xmark"></i><span>{error}</span></div>}

      {/* STATS CARDS */}
      <div className="erp-stats-grid erp-mb-6">
        <div className="erp-stat-card erp-stat-card--primary">
          <div className="erp-stat-card__header">
            <div className="erp-stat-card__icon"><i className="fa-solid fa-building"></i></div>
          </div>
          <div className="erp-stat-card__value">{stats.companies}</div>
          <div className="erp-stat-card__label">Total Companies</div>
        </div>

        <div className="erp-stat-card erp-stat-card--success">
          <div className="erp-stat-card__header">
            <div className="erp-stat-card__icon"><i className="fa-solid fa-briefcase"></i></div>
          </div>
          <div className="erp-stat-card__value">{stats.drives}</div>
          <div className="erp-stat-card__label">Active Drives</div>
        </div>

        <div className="erp-stat-card erp-stat-card--warning">
          <div className="erp-stat-card__header">
            <div className="erp-stat-card__icon"><i className="fa-solid fa-file-lines"></i></div>
          </div>
          <div className="erp-stat-card__value">{stats.applications}</div>
          <div className="erp-stat-card__label">Total Applications</div>
        </div>

        <div className="erp-stat-card erp-stat-card--danger">
          <div className="erp-stat-card__header">
            <div className="erp-stat-card__icon"><i className="fa-solid fa-user-graduate"></i></div>
          </div>
          <div className="erp-stat-card__value">Live</div>
          <div className="erp-stat-card__label">System Status</div>
        </div>
      </div>
      
      {/* ANALYTICS CHARTS */}
      <div className="erp-mb-6">
        <PlacementAnalytics />
      </div>

      <div className="erp-mb-6">
        {/* COMPANIES TABLE */}
        <div className="erp-card erp-mb-6">
          <div className="erp-card__header">
            <div>
              <div className="erp-card__title">Companies</div>
              <div className="erp-card__subtitle">Registered Companies</div>
            </div>
            <input
              type="text"
              placeholder="🔍 Search..."
              value={searchCompany}
              onChange={e => setSearchCompany(e.target.value)}
              className="erp-form-control"
              style={{ width: '200px' }}
            />
          </div>
          {companies.length === 0 ? (
            <p style={{ padding: '20px', color: '#666' }}>No companies yet</p>
          ) : filteredCompanies.length === 0 ? (
            <p style={{ padding: '20px', color: '#666' }}>No companies match your search</p>
          ) : (
            <>
              <table className="erp-table" data-erp-sortable="true">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Industry</th>
                    <th>Location</th>
                    <th>Website</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedCompanies.map(c => (
                    <tr key={c.id}>
                      <td>{c.id}</td>
                      <td><strong>{c.name}</strong></td>
                      <td>{c.industry}</td>
                      <td>{c.address || "—"}</td>
                      <td>
                        {c.website ? (
                          <a
                            href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--erp-primary)', fontWeight: 600, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '10px' }}></i>
                            {c.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                          </a>
                        ) : (
                          <span style={{ color: 'var(--erp-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className={`erp-pill ${c.is_approved ? "erp-pill--success" : "erp-pill--warning"}`}>
                          {c.is_approved ? "Approved" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredCompanies.length > 5 && !showAllCompanies && !searchCompany && (
                <div style={{ padding: '16px' }}>
                  <button onClick={() => setShowAllCompanies(true)} className="erp-btn erp-btn--outline">
                    View All Companies ({filteredCompanies.length})
                  </button>
                </div>
              )}
              
              {showAllCompanies && !searchCompany && (
                <div style={{ padding: '16px' }}>
                  <button onClick={() => setShowAllCompanies(false)} className="erp-btn erp-btn--ghost">
                    ↑ Show Less
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* DRIVES TABLE */}
        <div className="erp-card">
          <div className="erp-card__header">
            <div>
              <div className="erp-card__title">Placement Drives</div>
              <div className="erp-card__subtitle">Active and past drives</div>
            </div>
            <input
              type="text"
              placeholder="🔍 Search..."
              value={searchDrive}
              onChange={e => setSearchDrive(e.target.value)}
              className="erp-form-control"
              style={{ width: '200px' }}
            />
          </div>
          {drives.length === 0 ? (
            <p style={{ padding: '20px', color: '#666' }}>No drives yet</p>
          ) : filteredDrives.length === 0 ? (
            <p style={{ padding: '20px', color: '#666' }}>No drives match your search</p>
          ) : (
            <>
              <table className="erp-table" data-erp-sortable="true">
                <thead>
                  <tr>
                    <th>Role Title</th>
                    <th>Company</th>
                    <th>Date</th>
                    <th>Active</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedDrives.map(d => {
                    const company = companies.find(c => c.id === d.company_id);
                    return (
                      <tr key={d.id}>
                        <td><strong>{d.title}</strong></td>
                        <td>{company?.name || "Unknown"}</td>
                        <td>{d.drive_date || "-"}</td>
                        <td>
                          <span className={`erp-pill ${d.is_active ? "erp-pill--success" : "erp-pill--danger"}`}>
                            {d.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {filteredDrives.length > 5 && !showAllDrives && !searchDrive && (
                <div style={{ padding: '16px' }}>
                  <button onClick={() => setShowAllDrives(true)} className="erp-btn erp-btn--outline">
                    View All Drives ({filteredDrives.length})
                  </button>
                </div>
              )}
              
              {showAllDrives && !searchDrive && (
                <div style={{ padding: '16px' }}>
                  <button onClick={() => setShowAllDrives(false)} className="erp-btn erp-btn--ghost">
                    ↑ Show Less
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}