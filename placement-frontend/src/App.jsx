import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// 🔷 ADMIN PAGES
import Dashboard from "./pages/admin/Dashboard";
import Companies from "./pages/admin/Companies";
import Drives from "./pages/admin/Drives";
import Applications from "./pages/admin/Applications";

// 🔷 STUDENT PAGES
import StudentDashboard from "./pages/student/Dashboard";
import ApplyDrives from "./pages/student/ApplyDrive";
import MyApplications from "./pages/student/MyApplications";

// 🔷 COMMON COMPONENTS
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

export default function App() {

  // 🔥 TEMP ROLE (CHANGE LATER WITH AUTH)
  const user = {
    name: "Yash",
    role: "admin", // change to "student" to test student UI
  };

  return (
    <BrowserRouter>
      <div className="flex h-screen">

        {/* 🔷 SIDEBAR */}
        <Sidebar user={user} />

        {/* 🔷 MAIN CONTENT */}
        <div className="flex-1 flex flex-col">

          {/* 🔷 TOPBAR */}
          <Navbar user={user} />

          {/* 🔷 PAGE CONTENT */}
          <div className="p-4 overflow-auto flex-1 bg-gray-100">

            <Routes>

              {/* ================= ADMIN ROUTES ================= */}
              {user.role === "admin" && (
                <>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/admin/dashboard" element={<Dashboard />} />
                  <Route path="/admin/companies" element={<Companies />} />
                  <Route path="/admin/drives" element={<Drives />} />
                  <Route path="/admin/applications" element={<Applications />} />
                </>
              )}

              {/* ================= STUDENT ROUTES ================= */}
              {user.role === "student" && (
                <>
                  <Route path="/" element={<StudentDashboard />} />
                  <Route path="/student/dashboard" element={<StudentDashboard />} />
                  <Route path="/student/ApplyDrives" element={<ApplyDrives />} />
                  <Route path="/student/MyApplications" element={<MyApplications />} />
                </>
              )}

              {/* 🔁 FALLBACK */}
              <Route path="*" element={<Navigate to="/" />} />

            </Routes>

          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}