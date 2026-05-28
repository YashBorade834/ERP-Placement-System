import React from 'react';
import PlacementAnalytics from '../../components/PlacementAnalytics';

export default function StudentInsights() {
  return (
    <>
      <div className="erp-page-title">
        <h1>📈 Placement Insights</h1>
        <p>Real-time analytics and recruitment trends for this session</p>
      </div>

      <div className="erp-alert erp-alert--info erp-mb-6">
        <i className="fa-solid fa-chart-line"></i>
        <span>
          Use these insights to understand which industries are most active and plan your preparation accordingly.
        </span>
      </div>

      <div className="erp-card erp-mb-6">
        <div className="erp-card__body">
          <PlacementAnalytics />
        </div>
      </div>

      <div className="erp-card">
        <div className="erp-card__header">
          <div className="erp-card__title">💡 Success Tips</div>
        </div>
        <div className="erp-card__body">
          <ul className="erp-list erp-text-sm erp-text-muted">
            <li className="erp-mb-2"><strong>Target Industries</strong>: Focus your resume keywords based on the top industries appearing in the charts.</li>
            <li className="erp-mb-2"><strong>Monthly Trends</strong>: Notice the peak recruitment months and ensure your preparation is completed before them.</li>
            <li><strong>Diverse Opportunities</strong>: While IT is often dominant, keep an eye on emerging industries for unique roles.</li>
          </ul>
        </div>
      </div>
    </>
  );
}
