// src/pages/Dashboard.jsx — Mission Control overview
import { useObservatory } from '../hooks/useObservatory'
import StatCard from '../components/ui/StatCard'
import AlertBadge from '../components/ui/AlertBadge'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TIMELINE_DATA, TELESCOPE_STATUS, ALERT_RECORDS } from '../data/mockData'
import { Radio, Activity, Cpu, Zap, Bell, Database, Telescope, Wifi } from 'lucide-react'
import { motion } from 'framer-motion'

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#0e0e1a', border:'1px solid rgba(139,92,246,0.3)', borderRadius:8, padding:'8px 12px', fontSize:'0.78rem' }}>
      <div style={{ color:'var(--text-muted)', marginBottom:4 }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ color:p.color }}>{p.name}: {p.value}</div>)}
    </div>
  )
}

export default function Dashboard() {
  const { stats, feed, alerts } = useObservatory()

  return (
    <div className="page-container">
      {/* Header */}
      <h1 className="page-title">
        Mission <span className="gradient-text">Control</span>
      </h1>
      <p className="page-subtitle">Live observatory overview · Auto-refreshing telemetry</p>

      {/* Top stats */}
      <div className="grid-4" style={{ marginBottom:24 }}>
        <StatCard label="Total Events"    value={stats.totalEvents.toLocaleString()} icon={Activity} accent="var(--purple-400)" delay={0}   />
        <StatCard label="FRB Candidates"  value={stats.frbCandidates}                icon={Radio}    accent="var(--cyan-400)"   delay={0.05} />
        <StatCard label="Anomalies Found" value={stats.anomaliesDetected}            icon={Zap}      accent="var(--red-400)"    delay={0.1}  sub="This session" />
        <StatCard label="AI Models Live"  value={stats.aiModelsRunning}              icon={Cpu}      accent="var(--green-400)"  delay={0.15} />
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ marginBottom:24 }}>
        {/* Event timeline */}
        <motion.div className="glow-card" style={{ padding:20 }} initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.2 }}>
          <div className="section-label">Event Timeline — Today (UTC)</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={TIMELINE_DATA} margin={{ top:5, right:20, left:0, bottom:20 }}>
              <defs>
                <linearGradient id="frbG"  x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.35}/><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/></linearGradient>
                <linearGradient id="trG"   x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor="#22d3ee" stopOpacity={0.3}/><stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/></linearGradient>
                <linearGradient id="anG"   x1="0" y1="0" x2="0" y2="1"><stop offset="5%"  stopColor="#f87171" stopOpacity={0.3}/><stop offset="95%" stopColor="#f87171" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="hour" tick={{ fill:'#64748b', fontSize:9 }} stroke="rgba(255,255,255,0.1)" />
              <YAxis tick={{ fill:'#64748b', fontSize:9 }} stroke="rgba(255,255,255,0.1)" />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="frb"      stroke="#8b5cf6" fill="url(#frbG)" strokeWidth={2} name="FRB" />
              <Area type="monotone" dataKey="transient" stroke="#22d3ee" fill="url(#trG)"  strokeWidth={2} name="Transient" />
              <Area type="monotone" dataKey="anomaly"  stroke="#f87171" fill="url(#anG)"  strokeWidth={2} name="Anomaly" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Detections by type */}
        <motion.div className="glow-card" style={{ padding:20 }} initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.25 }}>
          <div className="section-label">Detections by Type</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={TIMELINE_DATA} margin={{ top:5, right:20, left:0, bottom:20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill:'#64748b', fontSize:9 }} stroke="rgba(255,255,255,0.1)" />
              <YAxis tick={{ fill:'#64748b', fontSize:9 }} stroke="rgba(255,255,255,0.1)" />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="frb"      fill="#8b5cf6" radius={[3,3,0,0]} maxBarSize={14} name="FRB" />
              <Bar dataKey="transient" fill="#22d3ee" radius={[3,3,0,0]} maxBarSize={14} name="Transient" />
              <Bar dataKey="xray"     fill="#fb923c" radius={[3,3,0,0]} maxBarSize={14} name="X-Ray" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Telescope + Feed + Alerts row */}
      <div className="grid-3" style={{ marginBottom:24 }}>
        {/* Telescope network */}
        <motion.div className="glow-card" style={{ padding:20 }} initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.3 }}>
          <div className="section-label">Telescope Network</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {TELESCOPE_STATUS.map(t => (
              <div key={t.id} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span className={`status-dot ${t.status}`} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.name}</div>
                  <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>{t.type} · {t.location}</div>
                </div>
                <span style={{ fontSize:'0.7rem', fontFamily:'var(--font-mono)', color: t.events > 0 ? 'var(--cyan-400)' : 'var(--text-muted)', fontWeight:700, flexShrink:0 }}>{t.events}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Live event feed */}
        <motion.div className="glow-card" style={{ padding:20 }} initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.35 }}>
          <div className="section-label">Live Event Feed</div>
          <div className="feed-list" style={{ maxHeight:260, overflowY:'auto' }}>
            {feed.slice(0,10).map((item, i) => (
              <div key={i} className={`feed-item ${item.severity}`}>
                <span className="feed-time">{item.time}</span>
                <span className="feed-type" style={{ color: item.severity==='high'?'var(--red-400)':item.severity==='medium'?'var(--amber-400)':'var(--blue-400)' }}>{item.type}</span>
                <span className="feed-msg">{item.msg}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent alerts */}
        <motion.div className="glow-card" style={{ padding:20 }} initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.4 }}>
          <div className="section-label">Recent Alerts</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {alerts.slice(0,5).map(a => (
              <div key={a.id} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 10px', borderRadius:8, background:'rgba(255,255,255,0.02)' }}>
                <AlertBadge level={a.level} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{a.title}</div>
                  <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', marginTop:2 }}>{a.scope} · {a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* AI health row */}
      <motion.div className="glow-card" style={{ padding:20 }} initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.45 }}>
        <div className="section-label">AI System Health</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:16 }}>
          {[
            { label:'FRB Net',    pct:97, color:'var(--purple-400)' },
            { label:'LC Autoenc',  pct:94, color:'var(--cyan-400)'   },
            { label:'Few-Shot',   pct:88, color:'var(--blue-400)'   },
            { label:'Transient',  pct:92, color:'var(--green-400)'  },
            { label:'Noise Flt',  pct:99, color:'var(--amber-400)'  },
            { label:'Iso Forest', pct:91, color:'var(--orange-400)' },
          ].map(({ label, pct, color }) => (
            <div key={label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:'1.2rem', fontWeight:800, color }}>{pct}%</div>
              <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', margin:'4px 0 6px', textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</div>
              <div className="progress-bar"><div className="progress-fill" style={{ width:`${pct}%`, background:`linear-gradient(90deg,${color},${color}88)` }} /></div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
