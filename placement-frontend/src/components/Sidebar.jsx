import { Link } from "react-router-dom";

export default function Sidebar({ user }) {
  return (
<div className="w-64 bg-blue-600 text-white h-screen p-5">

      {/* 🔷 LOGO */}
      <h1 className="text-2xl font-bold mb-8">Placement</h1>

      {/* 🔷 MENU */}
      <ul className="space-y-4">

        {/*================== ADMIN ==================*/}
        {user.role === "admin" && (
          <>
            <li>
              <Link to="/admin/dashboard" className="hover:text-purple-400">
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/admin/companies" className="hover:text-purple-400">
                Companies
              </Link>
            </li>
            <li>
              <Link to="/admin/drives" className="hover:text-purple-400">
                Drives
              </Link>
            </li>
            <li>
              <Link to="/admin/applications" className="hover:text-purple-400">
                Applications
              </Link>
            </li>
          </>
        )}

        {/* ================= STUDENT ================= */}
        {user.role === "student" && (
          <>
            <li>
              <Link to="/student/dashboard" className="hover:text-purple-400">
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/student/drives" className="hover:text-purple-400">
                Apply Drives
              </Link>
            </li>
            <li>
              <Link to="/student/applications" className="hover:text-purple-400">
                My Applications
              </Link>
            </li>
          </>
        )}

      </ul>
    </div>
  );
}