import { BrowserRouter, Routes, Route } from "react-router-dom";

// Admin
import AdminDashboard from "../pages/admin/Dashboard";
import Companies from "../pages/admin/Companies";
import Drives from "../pages/admin/Drives";
import ManageApplications from "../pages/admin/ManageApplications";
import Applications from "../pages/admin/Applications";
import Offers from "../pages/admin/Offers";

// Student
import StudentDashboard from "../pages/student/Dashboard";
import ApplyDrive from "../pages/student/ApplyDrive";
import MyApplications from "../pages/student/MyApplications";
import MyResume from "../pages/student/MyResume";
import MyOffers from "../pages/student/MyOffers";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Admin */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/companies" element={<Companies />} />
        <Route path="/admin/drives" element={<Drives />} />
        <Route path="/admin/applications" element={<Applications />} />
        <Route path="/admin/offers" element={<Offers />} />
        
        {/* Student */}
        <Route path="/" element={<StudentDashboard />} />
        <Route path="/apply" element={<ApplyDrive />} />
        <Route path="/applications" element={<MyApplications />} />
        <Route path="/resume" element={<MyResume />} />
        <Route path="/offers" element={<MyOffers />} />

      </Routes>
    </BrowserRouter>
  );
}

