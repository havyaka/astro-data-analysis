// src/pages/SignalVisualization.jsx — Interactive signal charts hub
import { useState } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import LightCurveChart from '../components/charts/LightCurveChart'
import FRBChart from '../components/charts/FRBChart'
import { XRAY_DATA, SPECTRAL_DATA } from '../data/mockData'

const VIEWS = ['Light Curve', 'FRB Burst', 'X-Ray Flux', 'Spectral']

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#0e0e1a', border:'1px solid rgba(139,92,246,0.3)', borderRadius:8, padding:'8px 12px', fontSize:'0.78rem' }}>
      <div style={{ color:'var(--text-muted)', marginBottom:4 }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color:p.color||'var(--text-primary)' }}>{p.value?.toFixed(4)}</div>)}
    </div>
  )
}

export default function SignalVisualization() {
  const [view, setView] = useState('Light Curve')

  return (
    <div className="page-container">
      <h1 className="page-title">Signal <span className="gradient-text">Visualization</span></h1>
      <p className="page-subtitle">Interactive scientific signal charts with anomaly highlighting</p>

      <div className="tab-bar" style={{ marginBottom:28 }}>
        {VIEWS.map(v => (
          <button key={v} className={`tab-item ${view===v?'active':''}`} onClick={() => setView(v)}>{v}</button>
        ))}
      </div>

      <motion.div key={view} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }}>
        {/* Chart panel */}
        <div className="glow-card" style={{ padding:24, marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontSize:'1rem', fontWeight:700, color:'var(--text-primary)' }}>{view}</div>
              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:3 }}>
                {view==='Light Curve' && 'Optical flux vs time · Anomalies marked in red · Model fit in purple'}
                {view==='FRB Burst'   && 'Radio burst S/N profile · Dispersion measure 557.4 pc/cm³'}
                {view==='X-Ray Flux'  && 'Photon flux spectrum 0.2–10 keV · Chandra X-ray Observatory'}
                {view==='Spectral'    && 'Optical emission spectrum 380–1115 nm · H-α, H-β, Na I-D lines marked'}
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button className="btn-secondary" style={{ fontSize:'0.78rem', padding:'6px 14px' }}>Export</button>
              <button className="btn-secondary" style={{ fontSize:'0.78rem', padding:'6px 14px' }}>Zoom Reset</button>
            </div>
          </div>

          {view === 'Light Curve' && <LightCurveChart height={320} />}
          {view === 'FRB Burst'   && <FRBChart height={320} />}

          {view === 'X-Ray Flux' && (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={XRAY_DATA} margin={{ top:10, right:20, left:0, bottom:20 }}>
                <defs>
                  <linearGradient id="xrG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#fb923c" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="energy" tick={{ fill:'#64748b', fontSize:10 }} stroke="rgba(255,255,255,0.1)" label={{ value:'Energy (keV)', position:'insideBottom', offset:-12, fill:'#64748b', fontSize:11 }} />
                <YAxis tick={{ fill:'#64748b', fontSize:10 }} stroke="rgba(255,255,255,0.1)" />
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="flux" stroke="#fb923c" strokeWidth={2} fill="url(#xrG)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {view === 'Spectral' && (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={SPECTRAL_DATA} margin={{ top:10, right:20, left:0, bottom:20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="wavelength" tick={{ fill:'#64748b', fontSize:10 }} stroke="rgba(255,255,255,0.1)" label={{ value:'Wavelength (nm)', position:'insideBottom', offset:-12, fill:'#64748b', fontSize:11 }} />
                <YAxis tick={{ fill:'#64748b', fontSize:10 }} stroke="rgba(255,255,255,0.1)" />
                <Tooltip content={<Tip />} />
                <Line type="monotone" dataKey="intensity" stroke="#4ade80" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Info cards */}
        <div className="grid-3">
          {view === 'Light Curve' && [
            { label:'Observation Window', value:'60.0 s', color:'var(--cyan-400)' },
            { label:'Flux (median)',       value:'1.012',  color:'var(--purple-400)' },
            { label:'Anomalies Detected', value:'3',     color:'var(--red-400)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="glow-card" style={{ padding:18 }}>
              <div className="section-label">{label}</div>
              <div style={{ fontSize:'1.5rem', fontWeight:800, color }}>{value}</div>
            </div>
          ))}
          {view === 'FRB Burst' && [
            { label:'Dispersion Measure', value:'557.4 pc/cm³', color:'var(--purple-400)' },
            { label:'Peak S/N',           value:'8.2',           color:'var(--cyan-400)'   },
            { label:'Burst Duration',     value:'4.2 ms',        color:'var(--green-400)'  },
          ].map(({ label, value, color }) => (
            <div key={label} className="glow-card" style={{ padding:18 }}>
              <div className="section-label">{label}</div>
              <div style={{ fontSize:'1.2rem', fontWeight:800, color, fontFamily:'var(--font-mono)' }}>{value}</div>
            </div>
          ))}
          {view === 'X-Ray Flux' && [
            { label:'Energy Range', value:'0.2–10 keV',     color:'var(--orange-400)' },
            { label:'Peak Flux',    value:'11.8 cts/s/keV', color:'var(--red-400)'    },
            { label:'Source',       value:'Chandra CXO',    color:'var(--text-secondary)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="glow-card" style={{ padding:18 }}>
              <div className="section-label">{label}</div>
              <div style={{ fontSize:'1rem', fontWeight:800, color, fontFamily:'var(--font-mono)' }}>{value}</div>
            </div>
          ))}
          {view === 'Spectral' && [
            { label:'H-α (656.3 nm)', value:'Detected', color:'var(--red-400)'    },
            { label:'H-β (486.1 nm)', value:'Detected', color:'var(--blue-400)'   },
            { label:'Na I-D (589 nm)',value:'Detected', color:'var(--amber-400)'  },
          ].map(({ label, value, color }) => (
            <div key={label} className="glow-card" style={{ padding:18 }}>
              <div className="section-label">{label}</div>
              <div style={{ fontSize:'1rem', fontWeight:800, color }}>{value}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
