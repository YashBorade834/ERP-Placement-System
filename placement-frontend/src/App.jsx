import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// 🔷 ADMIN PAGES
import Dashboard from "./pages/admin/Dashboard";
import Companies from "./pages/admin/Companies";
import Drives from "./pages/admin/Drives";
import Applications from "./pages/admin/Applications";
import ManageApplications from "./pages/admin/ManageApplications";
import Offers from "./pages/admin/Offers";

// 🔷 STUDENT PAGES
import StudentDashboard from "./pages/student/Dashboard";
import ApplyDrives from "./pages/student/ApplyDrive";
import MyApplications from "./pages/student/MyApplications";
import MyResume from "./pages/student/MyResume";
import StudentInsights from "./pages/student/Insights";
import MyOffers from "./pages/student/MyOffers";

// 🔷 COMMON COMPONENTS
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

import { useEffect, useState } from "react";
import { verifyToken } from "./api/authApi";
import { AUTH_FRONTEND_URL, BYPASS_AUTH, DEV_USER_ROLE, DEV_USER_ID } from "./config";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // DEBUG: Log all search params
        console.log("Full URL Search Params:", window.location.search);

        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1)); // Handle #token=...

        // Check multiple common token names
        const tokenFromUrl =
          urlParams.get("token") || urlParams.get("access_token") || urlParams.get("jwt") ||
          hashParams.get("token") || hashParams.get("access_token") || hashParams.get("jwt");

        const userIdFromUrl = urlParams.get("user_id") || urlParams.get("id");
        const roleFromUrl = urlParams.get("role") || urlParams.get("user_role");

        console.log("Detected Token:", tokenFromUrl);
        console.log("Detected User ID:", userIdFromUrl);
        console.log("Detected Role:", roleFromUrl);

        if (tokenFromUrl && tokenFromUrl !== "null" && tokenFromUrl !== "undefined") {
          console.log("Saving token from URL to localStorage");
          localStorage.setItem("token", tokenFromUrl);
          // Remove token from URL for security/cleanliness
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        // BACKUP: If no token but we have user_id and role (from your screenshot)
        if (userIdFromUrl && roleFromUrl) {
          console.log("Using user_id/role from URL. SUCCESS.");
          const role = roleFromUrl.toLowerCase();
          localStorage.setItem("token", "dummy-session-token");
          localStorage.setItem("user_role", role);
          localStorage.setItem("user_id", userIdFromUrl);

          setUser({
            student_id: parseInt(userIdFromUrl),
            role: role,
            name: "User " + userIdFromUrl
          });
          setLoading(false);
          return;
        }

        const token = localStorage.getItem("token") || localStorage.getItem("access_token") || localStorage.getItem("jwt");
        console.log("Token in localStorage:", token ? "Found" : "Not Found");

        if (!token || token === "undefined" || token === "null") {
          // 2. Redirect to Auth Frontend if no token
          if (BYPASS_AUTH) {
            console.log("BYPASS_AUTH is true. Logging in as dev user:", DEV_USER_ROLE);
            const role = DEV_USER_ROLE.toLowerCase();
            localStorage.setItem("token", "dummy-session-token");
            localStorage.setItem("user_role", role);
            localStorage.setItem("user_id", DEV_USER_ID);

            setUser({
              student_id: parseInt(DEV_USER_ID),
              role: role,
              name: "Dev " + DEV_USER_ROLE
            });
            setLoading(false);
            return;
          }

          console.log("No valid token found, redirecting to Auth...");
          window.location.href = `${AUTH_FRONTEND_URL}/login?redirect=${window.location.origin}`;
          return;
        }

        // 3. Verify token and get user info
        let userData;
        if (token === "dummy-session-token") {
          console.log("Dummy session detected. Skipping server verification.");
          
          // If BYPASS_AUTH is on, always use the current .env values (so switching roles works)
          if (BYPASS_AUTH) {
            userData = { 
              name: "Dev " + DEV_USER_ROLE, 
              role: DEV_USER_ROLE.toLowerCase(), 
              student_id: parseInt(DEV_USER_ID) 
            };
            // Sync localStorage in case it changed in .env
            localStorage.setItem("user_role", userData.role);
            localStorage.setItem("user_id", DEV_USER_ID);
          } else {
            // Restore from localStorage if not bypassing (standard behavior)
            const savedRole = localStorage.getItem("user_role") || "admin";
            const savedId = localStorage.getItem("user_id") || "1";
            userData = { name: "Local User", role: savedRole, student_id: parseInt(savedId) };
          }
        } else {
          console.log("Verifying token with Auth Backend...");
          const res = await verifyToken(token);
          console.log("Auth Verification Success:", res.data);
          userData = res.data;
        }

        const role = userData.role?.toLowerCase() || "student";

        setUser({
          ...userData,
          role: role,
          name: userData.name || userData.first_name || "User"
        });
      } catch (err) {
        console.error("Auth verification failed:", err);
        // If verification fails, clear token and redirect
        localStorage.removeItem("token");
        window.location.href = `${AUTH_FRONTEND_URL}/login?redirect=${window.location.origin}`;
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [AUTH_FRONTEND_URL]);

  if (loading) {
    return (
      <div className="erp-loader-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
        <div className="erp-loader"></div>
        <p style={{ color: 'var(--erp-primary)', fontWeight: 600 }}>Verifying Authentication...</p>
      </div>
    );
  }

  // Fallback if user is still null (e.g. failed verification)
  if (!user) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <h2>Authentication Required</h2>
        <p>Please log in through the Auth Module.</p>
        <button
          onClick={() => window.location.href = `${AUTH_FRONTEND_URL}/login`}
          className="erp-btn erp-btn--primary"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* 🔷 SIDEBAR */}
      <Sidebar user={user} />

      {/* 🔷 TOPBAR */}
      <Navbar user={user} />

      {/* 🔷 MAIN CONTENT */}
      <main className="erp-main" data-erp-page="Dashboard">
        <Routes>

          {/* ================= ADMIN ROUTES ================= */}
          {user.role === "admin" && (
            <>
              <Route path="/" element={<Dashboard />} />
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/companies" element={<Companies />} />
              <Route path="/admin/drives" element={<Drives />} />
              <Route path="/admin/applications" element={<Applications />} />
              <Route path="/admin/drives/:driveId/applications" element={<ManageApplications />} />
              <Route path="/admin/offers" element={<Offers />} />
            </>
          )}

          {/* ================= STUDENT ROUTES ================= */}
          {user.role === "student" && (
            <>
              <Route path="/" element={<StudentDashboard user={user} />} />
              <Route path="/student/dashboard" element={<StudentDashboard user={user} />} />
              <Route path="/student/ApplyDrives" element={<ApplyDrives user={user} />} />
              <Route path="/student/MyApplications" element={<MyApplications user={user} />} />
              <Route path="/offers" element={<MyOffers user={user} />} />
              <Route path="/student/insights" element={<StudentInsights user={user} />} />
              <Route path="/resume" element={<MyResume user={user} />} />
            </>
          )}

          {/* 🔁 FALLBACK */}
          <Route path="*" element={<Navigate to="/" />} />

        </Routes>
      </main>
    </BrowserRouter>
  );
}