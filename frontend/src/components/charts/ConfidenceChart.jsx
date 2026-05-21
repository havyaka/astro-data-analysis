// src/components/charts/ConfidenceChart.jsx
// Displays real model training metrics from the backend.
// Accepts `data` prop: array of { name, accuracy, precision } from actual training sessions.
// No mock AI_MODELS data.
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0e0e1a', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem' }}>
      <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}%</div>
      ))}
    </div>
  )
}

export default function ConfidenceChart({ data = [], height = 220 }) {
  if (data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '0 20px' }}>
        No training sessions found. Train a model on an uploaded dataset to see accuracy metrics here.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 60 }} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="name" stroke="rgba(255,255,255,0.15)" tick={{ fill: '#64748b', fontSize: 9 }} angle={-35} textAnchor="end" interval={0} />
        <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.15)" tick={{ fill: '#64748b', fontSize: 10 }} unit="%" />
        <Tooltip content={<Tip />} />
        <Bar dataKey="accuracy"  fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={20} name="Accuracy" />
        <Bar dataKey="precision" fill="#22d3ee" radius={[4, 4, 0, 0]} maxBarSize={20} name="Precision" />
      </BarChart>
    </ResponsiveContainer>
  )
}
