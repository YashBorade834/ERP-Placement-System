import { Link, useLocation } from "react-router-dom";
import { AUTH_FRONTEND_URL } from "../config";

export default function Sidebar({ user }) {
  const location = useLocation();

  const getNavClass = (path) => {
    return `erp-nav-item ${location.pathname === path ? 'erp-nav-item--active' : ''}`;
  };

  // const handleLogout = () => {
  //   // 1. Clear session storage
  //   localStorage.removeItem("token");
  //   localStorage.removeItem("user_role");
  //   localStorage.removeItem("user_id");

  //   // 2. Redirect to Auth Module Login
  //   window.location.href = `${AUTH_FRONTEND_URL}/login`;
  // };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("erp_user");

    window.location.href = `${AUTH_FRONTEND_URL}/login`;
  };

  return (
    <aside className="erp-sidebar">
      <div className="erp-sidebar__brand">
        <img
          src="/college_logo.png"
          className="erp-sidebar__logo"
          alt="College Logo"
        />
        <div className="erp-sidebar__brand-text">
          <h2 data-erp-college-name="short">PVGCOSC</h2>
          <span>Placement Portal</span>
        </div>
      </div>

      <nav className="erp-sidebar__nav">

        {/*================== ADMIN ==================*/}
        {(user.role === "admin" || user.role === "tpo") && (
          <>
            <div className="erp-nav-label">Admin Menu</div>
            <Link to="/admin/dashboard" className={getNavClass('/admin/dashboard')}>
              <i className="fa-solid fa-gauge-high"></i>
              <span className="erp-nav-item__text">Dashboard</span>
            </Link>
            <Link to="/admin/companies" className={getNavClass('/admin/companies')}>
              <i className="fa-solid fa-building"></i>
              <span className="erp-nav-item__text">Companies</span>
            </Link>
            <Link to="/admin/drives" className={getNavClass('/admin/drives')}>
              <i className="fa-solid fa-briefcase"></i>
              <span className="erp-nav-item__text">Drives</span>
            </Link>
            <Link to="/admin/applications" className={getNavClass('/admin/applications')}>
              <i className="fa-solid fa-file-lines"></i>
              <span className="erp-nav-item__text">Applications</span>
            </Link>
            <Link to="/admin/offers" className={getNavClass('/admin/offers')}>
              <i className="fa-solid fa-envelope-circle-check"></i>
              <span className="erp-nav-item__text">Manage Offers</span>
            </Link>
            <Link to="/admin/offer-report" className={getNavClass('/admin/offer-report')}>
              <i className="fa-solid fa-chart-bar"></i>
              <span className="erp-nav-item__text">Offer Report</span>
            </Link>
          </>
        )}

        {/* ================= STUDENT ================= */}
        {user.role === "student" && (
          <>
            <div className="erp-nav-label">Student Menu</div>
            <Link to="/student/dashboard" className={getNavClass('/student/dashboard')}>
              <i className="fa-solid fa-gauge-high"></i>
              <span className="erp-nav-item__text">Dashboard</span>
            </Link>
            <Link to="/student/applydrives" className={getNavClass('/student/applydrives')}>
              <i className="fa-solid fa-briefcase"></i>
              <span className="erp-nav-item__text">Apply Drives</span>
            </Link>
            <Link to="/student/myapplications" className={getNavClass('/student/myapplications')}>
              <i className="fa-solid fa-file-lines"></i>
              <span className="erp-nav-item__text">My Applications</span>
            </Link>
            <Link to="/student/offers" className={getNavClass('/student/offers')}>
              <i className="fa-solid fa-envelope-circle-check"></i>
              <span className="erp-nav-item__text">My Offers</span>
            </Link>
            <Link to="/student/insights" className={getNavClass('/student/insights')}>
              <i className="fa-solid fa-chart-pie"></i>
              <span className="erp-nav-item__text">Placement Insights</span>
            </Link>
            <Link to="/resume" className={getNavClass('/resume')}>
              <i className="fa-solid fa-file-pdf"></i>
              <span className="erp-nav-item__text">My Resume</span>
            </Link>
          </>
        )}

      </nav>

      <div className="erp-sidebar__footer">
        <div className="erp-flex erp-items-center erp-gap-3 erp-mb-4">
          <div className="erp-avatar erp-avatar--md">{user.name.substring(0, 2).toUpperCase()}</div>
          <div className="erp-sidebar__user-info">
            <p className="erp-fw-600">{user.name}</p>
            <span className="erp-text-xs erp-text-muted">{user.role.toUpperCase()}</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="erp-btn erp-btn--danger erp-btn--block erp-btn--sm"
          aria-label="Log out"
        >
          <i className="fa-solid fa-right-from-bracket erp-mr-2"></i>
          Logout
        </button>
      </div>
    </aside>
  );
}