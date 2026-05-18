import React, { useEffect, useState } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { getAnalyticsSummary } from '../api/analyticsApi';

// 🎨 Premium Color Palette
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function PlacementAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await getAnalyticsSummary();
      setData(res.data);
    } catch (err) {
      console.error("Error loading analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 flex-col gap-4">
        <div className="erp-loader"></div>
        <p className="text-gray-400 animate-pulse">Designing your insights...</p>
      </div>
    );
  }

  if (!data) return <div className="erp-alert erp-alert--danger">Analysis engine offline.</div>;

  return (
    <div className="flex flex-col gap-8">
      
      {/* 🚀 QUICK STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="analytics-mini-card">
          <div className="icon-box blue"><i className="fa-solid fa-rocket"></i></div>
          <div className="content">
            <span className="label">Active Pulse</span>
            <span className="value">{data.monthly_drives.reduce((a, b) => a + b.count, 0)} Total Drives</span>
          </div>
        </div>
        <div className="analytics-mini-card">
          <div className="icon-box green"><i className="fa-solid fa-leaf"></i></div>
          <div className="content">
            <span className="label">Diversity</span>
            <span className="value">{data.industries.length} Industries</span>
          </div>
        </div>
        <div className="analytics-mini-card">
          <div className="icon-box amber"><i className="fa-solid fa-bolt"></i></div>
          <div className="content">
            <span className="label">Live Status</span>
            <span className="value">Real-time Data</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 🟢 THE DONUT (Industry Share) */}
        <div className="analytics-card glass">
          <div className="analytics-card-header">
            <h3>🏢 Industry Landscape</h3>
            <p>Hiring distribution across sectors</p>
          </div>
          <div className="chart-container" style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.industries}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data.industries.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
                  }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🔵 THE GLOW AREA (Activity Trend) */}
        <div className="analytics-card glass">
          <div className="analytics-card-header">
            <h3>📅 Recruitment Momentum</h3>
            <p>Drive frequency over time</p>
          </div>
          <div className="chart-container" style={{ height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthly_drives} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 🔮 CUSTOM CSS STYLES FOR ANALYTICS */}
      <style dangerouslySetInnerHTML={{ __html: `
        .analytics-mini-card {
          background: white;
          padding: 20px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s;
        }
        .analytics-mini-card:hover { transform: translateY(-5px); }
        
        .icon-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }
        .icon-box.blue { background: #eef2ff; color: #6366f1; }
        .icon-box.green { background: #ecfdf5; color: #10b981; }
        .icon-box.amber { background: #fffbeb; color: #f59e0b; }
        
        .content .label { display: block; font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
        .content .value { font-size: 18px; font-weight: 700; color: #1e293b; }

        .analytics-card.glass {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          padding: 24px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05);
        }
        .analytics-card-header { margin-bottom: 24px; }
        .analytics-card-header h3 { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
        .analytics-card-header p { font-size: 13px; color: #64748b; }
      `}} />
    </div>
  );
}
