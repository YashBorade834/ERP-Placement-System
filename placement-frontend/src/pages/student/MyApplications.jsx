import { useEffect, useState } from "react";
import API from "../../api/axios";

export default function MyApplications() {
  const [apps, setApps] = useState([]);

  useEffect(() => {
    API.get("/student/application/applications/1")
      .then(res => setApps(res.data))
      .catch(err => console.log(err));
  }, []);

  return (
    <div className="p-6">
      <h1>My Applications</h1>

      {apps.map(a => (
        <div key={a.id} className="border p-3 mt-2">
          <p>Drive ID: {a.drive_id}</p>
          <p>Status: {a.application_status}</p>
        </div>
      ))}
    </div>
  );
}