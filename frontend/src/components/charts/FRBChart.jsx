// src/components/charts/FRBChart.jsx
// Accepts real anomaly score data as props. No mock data.
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0e0e1a', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem' }}>
      <div style={{ color: 'var(--text-muted)' }}>Row {label}</div>
      <div style={{ color: 'var(--purple-400)', fontWeight: 700 }}>Score: {payload[0]?.value?.toFixed(4)}</div>
    </div>
  )
}

export default function FRBChart({ data = [], height = 220 }) {
  if (data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
        No inference data available. Run analysis on a Radio/FRB dataset first.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
        <defs>
          <linearGradient id="frbGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="index" stroke="rgba(255,255,255,0.15)" tick={{ fill: '#64748b', fontSize: 10 }}
          label={{ value: 'Row Index', position: 'insideBottom', offset: -12, fill: '#64748b', fontSize: 11 }} />
        <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fill: '#64748b', fontSize: 10 }}
          label={{ value: 'Score', angle: -90, position: 'insideLeft', offset: 10, fill: '#64748b', fontSize: 11 }} />
        <Tooltip content={<Tip />} />
        <Area type="monotone" dataKey="anomaly_score" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#frbGrad)" dot={false} name="Anomaly Score" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
