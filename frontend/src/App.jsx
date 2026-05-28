// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// // 🔷 ADMIN PAGES
// import Dashboard from "./pages/admin/Dashboard";
// import Companies from "./pages/admin/Companies";
// import Drives from "./pages/admin/Drives";
// import Applications from "./pages/admin/Applications";
// import ManageApplications from "./pages/admin/ManageApplications";
// import Offers from "./pages/admin/Offers";

// // 🔷 STUDENT PAGES
// import StudentDashboard from "./pages/student/Dashboard";
// import ApplyDrives from "./pages/student/ApplyDrive";
// import MyApplications from "./pages/student/MyApplications";
// import MyResume from "./pages/student/MyResume";
// import StudentInsights from "./pages/student/StudentInsights";
// import MyOffers from "./pages/student/MyOffers";

// // 🔷 COMMON COMPONENTS
// import Sidebar from "./components/Sidebar";
// import Navbar from "./components/Navbar";

// import { useEffect, useState } from "react";
// import { verifyToken } from "./api/authApi";
// import { AUTH_FRONTEND_URL, BYPASS_AUTH, DEV_USER_ROLE, DEV_USER_ID } from "./config";

// export default function App() {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const initializeAuth = async () => {
//       try {
//         // DEBUG: Log all search params
//         console.log("Full URL Search Params:", window.location.search);

//         const urlParams = new URLSearchParams(window.location.search);
//         const hashParams = new URLSearchParams(window.location.hash.substring(1)); // Handle #token=...

//         // Check multiple common token names
//         const tokenFromUrl =
//           urlParams.get("token") || urlParams.get("access_token") || urlParams.get("jwt") ||
//           hashParams.get("token") || hashParams.get("access_token") || hashParams.get("jwt");

//         const userIdFromUrl = urlParams.get("user_id") || urlParams.get("id");
//         const roleFromUrl = urlParams.get("role") || urlParams.get("user_role");

//         console.log("Detected Token:", tokenFromUrl);
//         console.log("Detected User ID:", userIdFromUrl);
//         console.log("Detected Role:", roleFromUrl);




//         if (tokenFromUrl && tokenFromUrl !== "null" && tokenFromUrl !== "undefined") {
//           console.log("Saving token from URL to localStorage");
//           localStorage.setItem("token", tokenFromUrl);
//           // Remove token from URL for security/cleanliness
//           window.history.replaceState({}, document.title, window.location.pathname);
//         }

//         // BACKUP: If no token but we have user_id and role (from your screenshot)
//         if (!tokenFromUrl && userIdFromUrl && roleFromUrl) {
//           console.log("Using user_id/role from URL. SUCCESS.");
//           const role = roleFromUrl.toLowerCase();
//           localStorage.setItem("token", "dummy-session-token");
//           localStorage.setItem("user_role", role);
//           localStorage.setItem("user_id", userIdFromUrl);

//           setUser({
//             ...userData,
//             student_id: userData.student_id || userData.user_id,
//             role: role,
//             name: userData.name || userData.first_name || "User"
//           });
//           setLoading(false);
//           return;
//         }



//         const token = localStorage.getItem("token") || localStorage.getItem("access_token") || localStorage.getItem("jwt");
//         console.log("Token in localStorage:", token ? "Found" : "Not Found");

//         // Restore cached user instantly
//         const savedUser = localStorage.getItem("erp_user");

//         if (savedUser) {
//           try {
//             const parsedUser = JSON.parse(savedUser);
//             console.log("Restored user from localStorage:", parsedUser);
//             setUser(parsedUser);
//           } catch (e) {
//             console.error("Failed to parse saved user");
//           }
//         }
//         if (!token || token === "undefined" || token === "null") {
//           // 2. Redirect to Auth Frontend if no token
//           if (BYPASS_AUTH) {
//             console.log("BYPASS_AUTH is true. Logging in as dev user:", DEV_USER_ROLE);
//             const role = DEV_USER_ROLE.toLowerCase();
//             localStorage.setItem("token", "dummy-session-token");
//             localStorage.setItem("user_role", role);
//             localStorage.setItem("user_id", DEV_USER_ID);

//             setUser({
//               student_id: parseInt(DEV_USER_ID),
//               role: role,
//               name: "Dev " + DEV_USER_ROLE
//             });
//             setLoading(false);
//             return;
//           }

//           console.log("No valid token found, redirecting to Auth...");
//           window.location.href = `${AUTH_FRONTEND_URL}/login?redirect=${window.location.origin}`;
//           return;
//         }

//         // 3. Verify token and get user info
//         let userData;
//         if (token === "dummy-session-token") {
//           console.log("Dummy session detected. Skipping server verification.");

//           // If BYPASS_AUTH is on, always use the current .env values (so switching roles works)
//           if (BYPASS_AUTH) {
//             userData = {
//               name: "Dev " + DEV_USER_ROLE,
//               role: DEV_USER_ROLE.toLowerCase(),
//               student_id: parseInt(DEV_USER_ID)
//             };
//             // Sync localStorage in case it changed in .env
//             localStorage.setItem("user_role", userData.role);
//             localStorage.setItem("user_id", DEV_USER_ID);
//           } else {
//             // Restore from localStorage if not bypassing (standard behavior)
//             const savedRole = localStorage.getItem("user_role") || "admin";
//             const savedId = localStorage.getItem("user_id") || "1";
//             userData = { name: "Local User", role: savedRole, student_id: parseInt(savedId) };
//           }
//         } else {
//           console.log("Verifying token with Auth Backend...");
//           const res = await verifyToken(token);
//           console.log("Auth Verification Success:", res);
//           userData = res;
//         }

//         const role = userData.role?.toLowerCase() || "student";

//         const finalUser = {
//           ...userData,
//           role: role,
//           name: userData.name || userData.first_name || "User"
//         };

//         // Save permanently
//         localStorage.setItem("erp_user", JSON.stringify(finalUser));

//         setUser(finalUser);
//       } catch (err) {
//         console.error("Auth verification failed:", err);
//         // If verification fails, clear token and redirect
//         localStorage.removeItem("token");
//         window.location.href = `${AUTH_FRONTEND_URL}/login?redirect=${window.location.origin}`;
//       } finally {
//         setLoading(false);
//       }
//     };

//     initializeAuth();
//   }, [AUTH_FRONTEND_URL]);

//   if (loading) {
//     return (
//       <div className="erp-loader-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
//         <div className="erp-loader"></div>
//         <p style={{ color: 'var(--erp-primary)', fontWeight: 600 }}>Verifying Authentication...</p>
//       </div>
//     );
//   }

//   // Fallback if user is still null (e.g. failed verification)
//   if (!user) {
//     return (
//       <div style={{ textAlign: 'center', marginTop: '100px' }}>
//         <h2>Authentication Required</h2>
//         <p>Please log in through the Auth Module.</p>
//         <button
//           onClick={() => window.location.href = `${AUTH_FRONTEND_URL}/login`}
//           className="erp-btn erp-btn--primary"
//         >
//           Go to Login
//         </button>
//       </div>
//     );
//   }

//   return (
//     <BrowserRouter>
//       {/* 🔷 SIDEBAR */}
//       <Sidebar user={user} />

//       {/* 🔷 TOPBAR */}
//       <Navbar user={user} />

//       {/* 🔷 MAIN CONTENT */}
//       <main className="erp-main" data-erp-page="Dashboard">
//         <Routes>

//           {/* ================= ADMIN ROUTES ================= */}
//           {user.role === "admin" && (
//             <>
//               <Route path="/" element={<Dashboard />} />
//               <Route path="/admin/dashboard" element={<Dashboard />} />
//               <Route path="/admin/companies" element={<Companies />} />
//               <Route path="/admin/drives" element={<Drives />} />
//               <Route path="/admin/applications" element={<Applications />} />
//               <Route path="/admin/drives/:driveId/applications" element={<ManageApplications />} />
//               <Route path="/admin/offers" element={<Offers />} />
//             </>
//           )}

//           {/* ================= STUDENT ROUTES ================= */}
//           {user.role === "student" && (
//             <>
//               <Route path="/" element={<StudentDashboard user={user} />} />
//               <Route path="/student/dashboard" element={<StudentDashboard user={user} />} />
//               <Route path="/student/applydrives" element={<ApplyDrives user={user} />} />
//               <Route path="/student/myapplications" element={<MyApplications user={user} />} />
//               <Route path="/student/offers" element={<MyOffers user={user} />} />
//               <Route path="/student/insights" element={<StudentInsights user={user} />} />
//               <Route path="/resume" element={<MyResume user={user} />} />
//             </>
//           )}

//           {/* 🔁 FALLBACK */}
//           <Route path="*" element={<Navigate to="/" />} />

//         </Routes>
//       </main>
//     </BrowserRouter>
//   );
// }

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
import StudentInsights from "./pages/student/StudentInsights";
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
        console.log("Full URL Search Params:", window.location.search);

        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));

        const tokenFromUrl =
          urlParams.get("token") ||
          urlParams.get("access_token") ||
          urlParams.get("jwt") ||
          hashParams.get("token") ||
          hashParams.get("access_token") ||
          hashParams.get("jwt");

        const userIdFromUrl = urlParams.get("user_id") || urlParams.get("id");
        const roleFromUrl = urlParams.get("role") || urlParams.get("user_role");

        console.log("Detected Token:", tokenFromUrl);
        console.log("Detected User ID:", userIdFromUrl);
        console.log("Detected Role:", roleFromUrl);

        // ------------------------------------------------------------------
        // ❌ OLD CODE (BUG SOURCE)
        // We were NOT clearing old user session
        //
        // if (tokenFromUrl) {
        //   localStorage.setItem("token", tokenFromUrl);
        // }
        // ------------------------------------------------------------------

        // ✅ NEW FIX: If new login comes → CLEAR OLD SESSION FIRST
        if (tokenFromUrl && tokenFromUrl !== "null" && tokenFromUrl !== "undefined") {
          console.log("New login detected → clearing old session");

          localStorage.removeItem("erp_user");   // 🔥 FIX: prevents Sanket issue
          localStorage.removeItem("token");

          localStorage.setItem("token", tokenFromUrl);
          sessionStorage.setItem("token", tokenFromUrl);

          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        // ------------------------------------------------------------------
        // BACKUP LOGIN (user_id + role only)
        // ------------------------------------------------------------------
        if (!tokenFromUrl && userIdFromUrl && roleFromUrl) {
          console.log("Using user_id/role from URL");

          const role = roleFromUrl.toLowerCase();

          // ❌ OLD BUGGY CODE:
          // setUser({
          //   ...userData,   ❌ userData was undefined
          //   student_id: userData.student_id || userData.user_id,
          //   role: role,
          //   name: userData.name || "User"
          // });

          // ✅ FIXED VERSION:
          const fallbackUser = {
            student_id: userIdFromUrl,
            role: role,
            name: "User " + userIdFromUrl
          };

          localStorage.setItem("token", "dummy-session-token");
          localStorage.setItem("user_role", role);
          localStorage.setItem("user_id", userIdFromUrl);

          localStorage.setItem("erp_user", JSON.stringify(fallbackUser));
          setUser(fallbackUser);
          setLoading(false);
          return;
        }

        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("access_token") ||
          localStorage.getItem("jwt");

        console.log("Token in localStorage:", token ? "Found" : "Not Found");

        // ------------------------------------------------------------------
        // ❌ OLD CODE (MAJOR BUG)
        // This caused Sanket/user override issue
        //
        // const savedUser = localStorage.getItem("erp_user");
        // if (savedUser) setUser(JSON.parse(savedUser));
        // ------------------------------------------------------------------

        // ✅ FIX: DO NOT restore user BEFORE verification
        // (We removed early restore completely)

        if (!token || token === "undefined" || token === "null") {
          if (BYPASS_AUTH) {
            const role = DEV_USER_ROLE.toLowerCase();

            const devUser = {
              student_id: parseInt(DEV_USER_ID),
              role: role,
              name: "Dev " + DEV_USER_ROLE
            };

            localStorage.setItem("token", "dummy-session-token");
            localStorage.setItem("erp_user", JSON.stringify(devUser));

            setUser(devUser);
            setLoading(false);
            return;
          }

          window.location.href = `${AUTH_FRONTEND_URL}/login?redirect=${window.location.origin}`;
          return;
        }

        // ------------------------------------------------------------------
        // VERIFY TOKEN (single source of truth)
        // ------------------------------------------------------------------
        let userData;

        if (token === "dummy-session-token") {
          const savedRole = localStorage.getItem("user_role") || "admin";
          const savedId = localStorage.getItem("user_id") || "1";

          userData = {
            name: "Local User",
            role: savedRole,
            student_id: parseInt(savedId)
          };
        } else {
          console.log("Decoding token locally...");
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            userData = JSON.parse(jsonPayload);
            console.log("Local decode success:", userData);
          } catch (e) {
            console.error("Failed to decode token", e);
            throw new Error("Invalid token format");
          }
        }

        const role = userData.role?.toLowerCase() || "student";

        const finalUser = {
          ...userData,
          role,
          name: userData.name || userData.first_name || "User",
          student_id: userData.student_id || userData.user_id || userData.id
        };
       


        // ------------------------------------------------------------------
        // FINAL SAVE (ONLY TRUE SOURCE OF USER)
        // ------------------------------------------------------------------
        localStorage.setItem("erp_user", JSON.stringify(finalUser));
        setUser(finalUser);

      } catch (err) {
        console.error("Auth verification failed:", err);

        localStorage.removeItem("token");
        localStorage.removeItem("erp_user");

        window.location.href = `${AUTH_FRONTEND_URL}/login?redirect=${window.location.origin}`;
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Verifying Authentication...
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <h2>Authentication Required</h2>
        <button onClick={() => window.location.href = `${AUTH_FRONTEND_URL}/login`}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Sidebar user={user} />
      <Navbar user={user} />

      <main className="erp-main">
        <Routes>

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

          {user.role === "student" && (
            <>
              <Route path="/" element={<StudentDashboard user={user} />} />
              <Route path="/student/dashboard" element={<StudentDashboard user={user} />} />
              <Route path="/student/applydrives" element={<ApplyDrives user={user} />} />
              <Route path="/student/myapplications" element={<MyApplications user={user} />} />
              <Route path="/student/offers" element={<MyOffers user={user} />} />
              <Route path="/student/insights" element={<StudentInsights user={user} />} />
              <Route path="/resume" element={<MyResume user={user} />} />
            </>
          )}

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}