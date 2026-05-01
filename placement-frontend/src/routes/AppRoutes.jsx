import { BrowserRouter, Routes, Route } from "react-router-dom";

// Admin
import AdminDashboard from "../pages/admin/Dashboard";
import Companies from "../pages/admin/Companies";
import Drives from "../pages/admin/Drives";
import ManageApplications from "../pages/admin/ManageApplications";

// Student
import StudentDashboard from "../pages/student/Dashboard";
import ApplyDrive from "../pages/student/ApplyDrive";
import MyApplications from "../pages/student/MyApplications";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/companies" element={<Companies />} />
        <Route path="/admin/drives" element={<Drives />} />
        
        {/* Student */}
        <Route path="/" element={<StudentDashboard />} />
        <Route path="/apply" element={<ApplyDrive />} />
        <Route path="/applications" element={<MyApplications />} />

      </Routes>
    </BrowserRouter>
  );
}

