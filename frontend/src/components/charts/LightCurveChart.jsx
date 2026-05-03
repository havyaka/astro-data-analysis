// src/components/charts/LightCurveChart.jsx
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts'
import { LIGHT_CURVE_DATA } from '../../data/mockData'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const isAnomaly = payload[0]?.payload?.anomaly
  return (
    <div style={{ background:'#0e0e1a', border:`1px solid ${isAnomaly?'rgba(239,68,68,0.4)':'rgba(139,92,246,0.3)'}`, borderRadius:8, padding:'8px 12px', fontSize:'0.78rem' }}>
      <div style={{ color:'var(--text-muted)', marginBottom:4 }}>t = {label}s</div>
      <div style={{ color: isAnomaly ? 'var(--red-400)' : 'var(--cyan-400)', fontWeight:700 }}>
        Flux: {payload[0]?.value?.toFixed(4)}
      </div>
      {isAnomaly && <div style={{ color:'var(--red-400)', marginTop:4, fontSize:'0.7rem' }}>⚠ ANOMALY FLAGGED</div>}
    </div>
  )
}

export default function LightCurveChart({ height = 260 }) {
  const anomalyTimes = LIGHT_CURVE_DATA.filter(d => d.anomaly).map(d => d.time)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={LIGHT_CURVE_DATA} margin={{ top:10, right:20, left:0, bottom:20 }}>
        <defs>
          <linearGradient id="lcGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#22d3ee" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="modelGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="time" stroke="rgba(255,255,255,0.15)" tick={{ fill:'#64748b', fontSize:10 }} label={{ value:'Time (s)', position:'insideBottom', offset:-12, fill:'#64748b', fontSize:11 }} />
        <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fill:'#64748b', fontSize:10 }} label={{ value:'Flux', angle:-90, position:'insideLeft', offset:10, fill:'#64748b', fontSize:11 }} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="model" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="4 2" fill="url(#modelGrad)" dot={false} name="Model" />
        <Area type="monotone" dataKey="flux"  stroke="#22d3ee" strokeWidth={2} fill="url(#lcGrad)" dot={false} name="Observed" />
        {anomalyTimes.map(t => (
          <ReferenceLine key={t} x={t} stroke="rgba(239,68,68,0.7)" strokeWidth={2} strokeDasharray="3 2" label={{ value:'⚠', fill:'#f87171', fontSize:12, position:'top' }} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
