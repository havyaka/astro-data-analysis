// src/components/charts/FRBChart.jsx — FRB radio burst profile
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { FRB_BURST_DATA } from '../../data/mockData'

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#0e0e1a', border:'1px solid rgba(139,92,246,0.3)', borderRadius:8, padding:'8px 12px', fontSize:'0.78rem' }}>
      <div style={{ color:'var(--text-muted)' }}>t = {label}s</div>
      <div style={{ color:'var(--purple-400)', fontWeight:700 }}>S/N: {payload[0]?.value?.toFixed(3)}</div>
    </div>
  )
}

export default function FRBChart({ height = 220 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={FRB_BURST_DATA} margin={{ top:10, right:20, left:0, bottom:20 }}>
        <defs>
          <linearGradient id="frbGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="time" stroke="rgba(255,255,255,0.15)" tick={{ fill:'#64748b', fontSize:10 }} label={{ value:'Time (s)', position:'insideBottom', offset:-12, fill:'#64748b', fontSize:11 }} />
        <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fill:'#64748b', fontSize:10 }} label={{ value:'S/N', angle:-90, position:'insideLeft', offset:10, fill:'#64748b', fontSize:11 }} />
        <Tooltip content={<Tip />} />
        <Area type="monotone" dataKey="intensity" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#frbGrad)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
