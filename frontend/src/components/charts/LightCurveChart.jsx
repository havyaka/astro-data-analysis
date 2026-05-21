// src/components/charts/LightCurveChart.jsx
// This chart now accepts real data as props from actual ML inference results.
// No mock data is used. Pass `data` prop containing array of { index, anomaly_score, is_anomaly }.
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const isAnomaly = payload[0]?.payload?.is_anomaly === 1
  return (
    <div style={{ background: '#0e0e1a', border: `1px solid ${isAnomaly ? 'rgba(239,68,68,0.4)' : 'rgba(139,92,246,0.3)'}`, borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Row {label}</div>
      <div style={{ color: isAnomaly ? 'var(--red-400)' : 'var(--cyan-400)', fontWeight: 700 }}>
        Score: {payload[0]?.value?.toFixed(4)}
      </div>
      {isAnomaly && <div style={{ color: 'var(--red-400)', marginTop: 4, fontSize: '0.7rem' }}>⚠ ANOMALY FLAGGED</div>}
    </div>
  )
}

export default function LightCurveChart({ data = [], height = 260 }) {
  const anomalyIndices = data.filter(d => d.is_anomaly === 1).map(d => d.index)

  if (data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
        No inference data available. Run analysis on a dataset first.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
        <defs>
          <linearGradient id="lcGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#22d3ee" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="index" stroke="rgba(255,255,255,0.15)" tick={{ fill: '#64748b', fontSize: 10 }}
          label={{ value: 'Row Index', position: 'insideBottom', offset: -12, fill: '#64748b', fontSize: 11 }} />
        <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fill: '#64748b', fontSize: 10 }}
          label={{ value: 'Score', angle: -90, position: 'insideLeft', offset: 10, fill: '#64748b', fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="anomaly_score" stroke="#22d3ee" strokeWidth={2} fill="url(#lcGrad)" dot={false} name="Anomaly Score" />
        {anomalyIndices.map(idx => (
          <ReferenceLine key={idx} x={idx} stroke="rgba(239,68,68,0.7)" strokeWidth={2} strokeDasharray="3 2"
            label={{ value: '⚠', fill: '#f87171', fontSize: 12, position: 'top' }} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
