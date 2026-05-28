import { useEffect, useState } from "react";
import {
  getDrivesWithSelectedStudents,
  getSelectedStudentsForDrive,
  releaseOffers,
} from "../../api/offerApi";

export default function Offers() {
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [expandedDrive, setExpandedDrive] = useState(null);
  const [offerForm, setOfferForm] = useState({
    offer_date: new Date().toISOString().split("T")[0],
    offers: {},
  });

  // Load drives with selected students
  const loadDrives = async () => {
    try {
      setLoading(true);
      const res = await getDrivesWithSelectedStudents();
      setDrives(res.data);
      setError("");
    } catch (err) {
      console.error("Error loading drives:", err);
      setError(
        "Failed to load drives: " + (err.response?.data?.detail || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrives();
  }, []);

  // Load selected students for a drive
  const handleDriveExpand = async (drive) => {
    if (expandedDrive?.drive_id === drive.drive_id) {
      setExpandedDrive(null);
      return;
    }

    try {
      setLoading(true);
      const res = await getSelectedStudentsForDrive(drive.drive_id);
      setSelectedStudents(res.data);
      setExpandedDrive(drive);
      setSelectedDrive(drive);

      // Initialize offer form
      const offers = {};
      res.data.forEach((student) => {
        offers[student.application_id] = {
          position: "",
          package: drive.package || "",
          offer_letter_path: "",
        };
      });
      setOfferForm({
        offer_date: new Date().toISOString().split("T")[0],
        offers,
      });
      setError("");
    } catch (err) {
      console.error("Error loading selected students:", err);
      setError(
        "Failed to load students: " + (err.response?.data?.detail || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle form changes
  const handleOfferChange = (applicationId, field, value) => {
    setOfferForm({
      ...offerForm,
      offers: {
        ...offerForm.offers,
        [applicationId]: {
          ...offerForm.offers[applicationId],
          [field]: value,
        },
      },
    });
  };

  // Release offers
  const handleReleaseOffers = async () => {
    if (!selectedDrive) {
      setError("Please select a drive first");
      return;
    }

    // Validate all offers have required fields
    const offersArray = Object.entries(offerForm.offers)
      .filter(([_, offer]) => offer.position && offer.package)
      .map(([appId, offer]) => ({
        application_id: parseInt(appId),
        position: offer.position,
        package: offer.package,
        offer_letter_path: offer.offer_letter_path || "",
      }));

    if (offersArray.length === 0) {
      setError("Please fill in position and package for at least one student");
      return;
    }

    try {
      setLoading(true);
      const res = await releaseOffers({
        drive_id: selectedDrive.drive_id,
        offer_date: offerForm.offer_date,
        offers: offersArray,
      });

      setSuccess(
        `Successfully created ${res.data.created_count} offer(s)!`
      );
      if (res.data.errors.length > 0) {
        setError(`Some offers had errors: ${res.data.errors.join(", ")}`);
      }
      setTimeout(() => {
        setSuccess("");
        loadDrives();
        setExpandedDrive(null);
      }, 3000);
    } catch (err) {
      console.error("Error releasing offers:", err);
      setError(
        "Failed to release offers: " + (err.response?.data?.detail || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Offers</h1>
          <p className="text-gray-600 mt-2">
            Release offers to students with "Selected" status
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          </div>
        )}

        {/* Drives List */}
        {!loading && drives.length > 0 && (
          <div className="space-y-4">
            {drives.map((drive) => (
              <div
                key={drive.drive_id}
                className="bg-white rounded-lg shadow border border-gray-200"
              >
                {/* Drive Summary */}
                <div
                  onClick={() => handleDriveExpand(drive)}
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {drive.title}
                        </h3>
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {drive.selected_count} Selected
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-semibold">Company:</span>{" "}
                          {drive.company_name}
                        </div>
                        <div>
                          <span className="font-semibold">Industry:</span>{" "}
                          {drive.company_industry}
                        </div>
                        <div>
                          <span className="font-semibold">Package:</span>{" "}
                          {drive.package}
                        </div>
                        <div>
                          <span className="font-semibold">Address:</span>{" "}
                          {drive.company_address}
                        </div>
                      </div>
                    </div>
                    <div>
                      {expandedDrive?.drive_id === drive.drive_id ? (
                        <svg
                          className="w-6 h-6 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 14l-7 7m0 0l-7-7m7 7V3"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-6 h-6 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 10l7-7m0 0l7 7m-7-7v18"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedDrive?.drive_id === drive.drive_id && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    {/* Offer Date */}
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Offer Date
                      </label>
                      <input
                        type="date"
                        value={offerForm.offer_date}
                        onChange={(e) =>
                          setOfferForm({
                            ...offerForm,
                            offer_date: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Selected Students Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-white border-b border-gray-300">
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">
                              Student
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">
                              Position
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">
                              Package
                            </th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-700">
                              Offer Letter Path
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedStudents.map((student) => (
                            <tr
                              key={student.application_id}
                              className="border-b border-gray-200 bg-white"
                            >
                              <td className="px-4 py-3 text-gray-900">
                                <div className="font-bold">{student.student_name}</div>
                                <div className="text-xs text-gray-500">ID: {student.student_id}</div>
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  placeholder="e.g., Software Engineer"
                                  value={
                                    offerForm.offers[student.application_id]
                                      ?.position || ""
                                  }
                                  onChange={(e) =>
                                    handleOfferChange(
                                      student.application_id,
                                      "position",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  placeholder="e.g., 8 LPA"
                                  value={
                                    offerForm.offers[student.application_id]
                                      ?.package || ""
                                  }
                                  onChange={(e) =>
                                    handleOfferChange(
                                      student.application_id,
                                      "package",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  placeholder="Path to offer letter"
                                  value={
                                    offerForm.offers[student.application_id]
                                      ?.offer_letter_path || ""
                                  }
                                  onChange={(e) =>
                                    handleOfferChange(
                                      student.application_id,
                                      "offer_letter_path",
                                      e.target.value
                                    )
                                  }
                                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Release Button */}
                    <div className="mt-6 flex justify-end">
                      <button
                        onClick={handleReleaseOffers}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                      >
                        {loading ? "Releasing..." : "Release Offers"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* No Drives Message */}
        {!loading && drives.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No drives with selected students found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
