import { useEffect, useState } from "react";
import { getStudentOffers, acceptOffer, rejectOffer } from "../../api/offerApi";

const offerStatusClass = (status) => {
  const map = {
    Pending: "bg-yellow-100 text-yellow-800",
    Accepted: "bg-green-100 text-green-800",
    Rejected: "bg-red-100 text-red-800",
  };
  return map[status] || "bg-gray-100 text-gray-800";
};

export default function MyOffers({ user }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const res = await getStudentOffers(user.student_id);
      setOffers(res.data);
      setError("");
    } catch (err) {
      console.error("Error loading offers:", err);
      setError(
        "Failed to load offers: " + (err.response?.data?.detail || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offerId) => {
    try {
      setLoading(true);
      await acceptOffer(offerId);
      setSuccess("Offer accepted successfully!");
      setTimeout(() => {
        setSuccess("");
        loadOffers();
      }, 3000);
    } catch (err) {
      console.error("Error accepting offer:", err);
      setError(
        "Failed to accept offer: " + (err.response?.data?.detail || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRejectClick = (offerId) => {
    setSelectedOfferId(offerId);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      setError("Please provide a reason for rejection");
      return;
    }

    try {
      setLoading(true);
      await rejectOffer(selectedOfferId, rejectReason);
      setSuccess("Offer rejected successfully!");
      setShowRejectModal(false);
      setTimeout(() => {
        setSuccess("");
        loadOffers();
      }, 3000);
    } catch (err) {
      console.error("Error rejecting offer:", err);
      setError(
        "Failed to reject offer: " + (err.response?.data?.detail || err.message)
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
          <h1 className="text-3xl font-bold text-gray-900">My Offers</h1>
          <p className="text-gray-600 mt-2">
            View and respond to job offers from companies
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

        {/* Offers Grid */}
        {!loading && offers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="erp-card"
              >
                {/* Offer Header */}
                <div className="erp-card__header">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="erp-card__title">{offer.position}</h2>
                      <p className="erp-card__subtitle">
                        Application #{offer.application_id}
                      </p>
                    </div>
                    <span
                      className={`erp-badge ${offer.status === "Pending" ? "erp-badge--warning" : offer.status === "Accepted" ? "erp-badge--success" : "erp-badge--danger"}`}
                    >
                      {offer.status}
                    </span>
                  </div>
                </div>

                {/* Offer Details */}
                <div className="p-6">
                  {/* Package */}
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600">Package</p>
                    <p className="text-2xl font-bold text-green-600">
                      {offer.package}
                    </p>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-600">Offer Date</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(offer.offer_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Issued</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(offer.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Offer Letter Path */}
                  {offer.offer_letter_path && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-600 mb-1">Offer Letter</p>
                      <a
                        href={offer.offer_letter_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-semibold text-sm break-all"
                      >
                        View Offer Letter →
                      </a>
                    </div>
                  )}

                  {/* Rejection Reason (if rejected) */}
                  {offer.status === "Rejected" && offer.reason && (
                    <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-sm text-gray-600 mb-1">
                        Reason for Rejection
                      </p>
                      <p className="text-gray-900 text-sm">{offer.reason}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {offer.status === "Pending" && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAcceptOffer(offer.id)}
                        disabled={loading}
                        className="erp-btn erp-btn--primary flex-1"
                      >
                        {loading ? "Processing..." : "✓ Accept Offer"}
                      </button>
                      <button
                        onClick={() => handleRejectClick(offer.id)}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                      >
                        {loading ? "Processing..." : "✗ Reject Offer"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Offers Message */}
        {!loading && offers.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-gray-500 text-lg">No offers yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Keep applying to drives to receive offers!
            </p>
          </div>
        )}

        {/* Reject Reason Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Reject Offer
                </h2>
                <p className="text-gray-600 mb-4">
                  Please provide a reason for rejecting this offer. This helps
                  companies understand candidate feedback.
                </p>

                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter your reason for rejection..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4 resize-none"
                  rows={5}
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 disabled:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRejectConfirm}
                    disabled={loading || !rejectReason.trim()}
                    className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                  >
                    {loading ? "Processing..." : "Confirm Rejection"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
