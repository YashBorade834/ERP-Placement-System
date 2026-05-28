// src/components/InsightsCharts.jsx
import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

// Helper to generate mock data if not provided
const generateMockData = () => ({
  drives_per_month: [
    { month: 'Jan', count: 4 },
    { month: 'Feb', count: 2 },
    { month: 'Mar', count: 5 },
    { month: 'Apr', count: 3 },
    { month: 'May', count: 6 },
    { month: 'Jun', count: 2 },
    { month: 'Jul', count: 4 },
    { month: 'Aug', count: 5 },
    { month: 'Sep', count: 3 },
    { month: 'Oct', count: 4 },
    { month: 'Nov', count: 2 },
    { month: 'Dec', count: 1 },
  ],
  company_selections: [
    { company: 'Acme Corp', selected: 12 },
    { company: 'Beta Ltd', selected: 8 },
    { company: 'Gamma Inc', selected: 6 },
    { company: 'Delta LLC', selected: 4 },
  ],
  yearly_placements: [
    { year: 2022, count: 30 },
    { year: 2023, count: 45 },
    { year: 2024, count: 38 },
    { year: 2025, count: 50 },
  ],
});

const COLORS = [
  'var(--erp-primary)',
  'var(--erp-success)',
  'var(--erp-warning)',
  'var(--erp-danger)',
];

export default function InsightsCharts({ insightsData }) {
  const mock = generateMockData();
  const data = {
    drives_per_month: insightsData?.drives_per_month || mock.drives_per_month,
    company_selections: insightsData?.company_selections || mock.company_selections,
    yearly_placements: insightsData?.yearly_placements || mock.yearly_placements,
  };

  return (
    <div className="erp-grid-2 gap-6 mt-8">
      {/* Drives per month – Bar Chart */}
      <div className="erp-card p-4">
        <h2 className="erp-card__title mb-3">Drives per Month</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.drives_per_month} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <XAxis dataKey="month" stroke="var(--erp-text)" />
            <YAxis stroke="var(--erp-text)" />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="var(--erp-primary)" name="Drives" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Company selections – Pie Chart */}
      <div className="erp-card p-4">
        <h2 className="erp-card__title mb-3">Company Selections</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Tooltip />
            <Legend />
            <Pie
              data={data.company_selections}
              dataKey="selected"
              nameKey="company"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {(data.company_selections || []).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Yearly placements – Line Chart */}
      <div className="erp-card p-4 erp-col-span-2">
        <h2 className="erp-card__title mb-3">Yearly Placements</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.yearly_placements} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <XAxis dataKey="year" stroke="var(--erp-text)" />
            <YAxis stroke="var(--erp-text)" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="var(--erp-success)" name="Placements" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
