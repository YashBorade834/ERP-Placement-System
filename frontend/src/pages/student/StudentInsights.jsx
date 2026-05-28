import React, { useEffect, useState } from "react";
import axios from "../../api/axios";
import InsightsCharts from "../../components/InsightsCharts";

export default function StudentInsights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/student/insights/")
      .then((res) => setData(res.data))
      .catch((err) => console.error("Failed to load insights:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading insights...</p>;

  return (
    <div className="erp-page-title">
      <h1 className="erp-text-primary text-2xl font-bold mb-4">📈 Placement Insights</h1>
      {data ? (
        <>
          <div className="erp-card">
            <h2 className="erp-card__title mb-3">Statistics</h2>
            <div className="erp-grid-2 gap-4">
              <div>
                <p className="erp-text-muted mb-1">Applications Submitted</p>
                <p className="erp-fw-700 text-lg">{data.statistics.applications_submitted}</p>
              </div>
              <div>
                <p className="erp-text-muted mb-1">Offers Received</p>
                <p className="erp-fw-700 text-lg">{data.statistics.offers_received}</p>
              </div>
            </div>
          </div>
          {/* Charts */}
          <InsightsCharts insightsData={data} />
        </>
      ) : (
        <p>No insights data available.</p>
      )}
    </div>
  );
}
