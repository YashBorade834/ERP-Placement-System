import { useState } from "react";
import API from "../../api/axios";

export default function ApplyDrive() {
  const [driveId, setDriveId] = useState("");

  const apply = () => {
    API.post("/student/apply", {
      student_id: 1,
      drive_id: Number(driveId),
    })
      .then(res => alert(res.data.message))
      .catch(err => alert(err.response.data.detail));
  };

  return (
    <div className="p-6">
      <h1>Apply for Drive</h1>

      <input
        type="number"
        placeholder="Drive ID"
        onChange={e => setDriveId(e.target.value)}
        className="border p-2 mr-2"
      />

      <button onClick={apply} className="bg-blue-500 text-white px-4 py-2">
        Apply
      </button>
    </div>
  );
}