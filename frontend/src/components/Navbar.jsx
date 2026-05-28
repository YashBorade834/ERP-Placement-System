export default function Navbar({ user }) {
  return (
    <header className="erp-topbar">
      <button className="erp-topbar__btn" data-erp-sidebar-toggle="true" title="Toggle menu">
        <i className="fa-solid fa-bars"></i>
      </button>

      <nav className="erp-topbar__breadcrumb" data-erp-breadcrumb="true"></nav>

      <div className="erp-topbar__search">
        <i className="fa-solid fa-magnifying-glass"></i>
        <input type="text" placeholder="Search…" />
      </div>

      <div className="erp-topbar__actions">
        <div style={{ position: 'relative' }}>
          <button className="erp-topbar__btn" data-erp-notif-toggle="true" title="Notifications">
            <i className="fa-regular fa-bell"></i>
            <span className="erp-dot"></span>
          </button>
        </div>
      </div>

      <div className="erp-topbar__profile">
        <div className="erp-avatar erp-avatar--md">{user.name.substring(0, 2).toUpperCase()}</div>
        <div className="erp-profile-info">
          <p>{user.name}</p>
          <span>{user.role}</span>
        </div>
        <i className="fa-solid fa-chevron-down"></i>
      </div>
    </header>
  );
}