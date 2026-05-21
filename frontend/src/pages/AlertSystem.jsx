// src/pages/AlertSystem.jsx — Priority alert management center
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useObservatory } from '../hooks/useObservatory'
import AlertBadge from '../components/ui/AlertBadge'
import { Bell, CheckCircle2, Clock, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'

const ACTIONS = {
  immediate_followup: 'Immediate Follow-Up Required',
  schedule_toa:       'Schedule Target-of-Opportunity',
  expert_review:      'Queue for Expert Review',
  catalog_match:      'Run Catalog Cross-Match',
  spectral_analysis:  'Initiate Spectral Analysis',
  rfi_flagging:       'Apply RFI Flagging',
  recalibrate:        'Recalibrate Instrument',
  sensor_recalibration: 'Calibrate Detector Sensors',
}

function AlertCard({ alert, delay }) {
  const [expanded, setExpanded] = useState(false)
  const [status, setStatus] = useState('pending')

  const glowColor = {
    CRITICAL: 'rgba(239,68,68,0.15)',
    HIGH:     'rgba(251,146,60,0.1)',
    MODERATE: 'rgba(251,191,36,0.08)',
    LOW:      'rgba(96,165,250,0.08)',
  }[alert.level] || 'rgba(255,255,255,0.03)'

  return (
    <motion.div
      className="glow-card"
      style={{ padding:20, background:glowColor }}
      initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay, duration:0.35 }}
    >
      <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
        <AlertBadge level={alert.level} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:4 }}>
            <span style={{ fontSize:'0.88rem', fontWeight:700, color:'var(--text-primary)' }}>{alert.title}</span>
          </div>
          <div style={{ display:'flex', gap:12, fontSize:'0.72rem', color:'var(--text-muted)', flexWrap:'wrap' }}>
            <span>{alert.id}</span>
            <span>·</span>
            <span>{alert.scope}</span>
            <span>·</span>
            <span>{alert.timestamp}</span>
            <span>·</span>
            <span>Confidence: <b style={{ color:'var(--cyan-400)' }}>{(alert.confidence*100).toFixed(0)}%</b></span>
          </div>
        </div>
        <button onClick={() => setExpanded(e => !e)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', flexShrink:0 }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} style={{ marginTop:16, paddingTop:16, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginBottom:14 }}>
            <div className="glow-card" style={{ flex:1, minWidth:200, padding:14 }}>
              <div className="section-label">Recommended Action</div>
              <div style={{ fontSize:'0.85rem', color:'var(--amber-400)', fontWeight:600 }}>{ACTIONS[alert.action] || alert.action}</div>
            </div>
            <div className="glow-card" style={{ flex:1, minWidth:200, padding:14 }}>
              <div className="section-label">Event Type</div>
              <div style={{ fontSize:'0.85rem', color:'var(--text-primary)', fontWeight:600 }}>{alert.type}</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn-primary" style={{ fontSize:'0.8rem', padding:'8px 16px' }}
              onClick={() => setStatus('approved')} disabled={status!=='pending'}>
              <CheckCircle2 size={14} /> Approve
            </button>
            <button className="btn-secondary" style={{ fontSize:'0.8rem', padding:'8px 16px' }}
              onClick={() => setStatus('deferred')} disabled={status!=='pending'}>
              <Clock size={14} /> Defer
            </button>
            <button className="btn-secondary" style={{ fontSize:'0.8rem', padding:'8px 16px' }}>
              <ExternalLink size={14} /> TNS Link
            </button>
            {status !== 'pending' && (
              <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.78rem', color: status==='approved'?'var(--green-400)':'var(--text-muted)' }}>
                <CheckCircle2 size={13} /> {status==='approved'?'Approved':'Deferred'}
              </span>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default function AlertSystem() {
  const { alerts } = useObservatory()
  const [filter, setFilter] = useState('ALL')
  const levels = ['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW']
  const filtered = filter === 'ALL' ? alerts : alerts.filter(a => a.level === filter)

  const counts = { CRITICAL:0, HIGH:0, MODERATE:0, LOW:0 }
  alerts.forEach(a => { if (counts[a.level] !== undefined) counts[a.level]++ })

  return (
    <div className="page-container">
      <h1 className="page-title">Alert <span className="gradient-text">Management</span></h1>
      <p className="page-subtitle">Priority-ranked astronomical event alerts with expert review workflow</p>

      {/* Summary stats */}
      <div className="grid-4" style={{ marginBottom:24 }}>
        {[
          { level:'CRITICAL', count:counts.CRITICAL, color:'var(--red-400)'    },
          { level:'HIGH',     count:counts.HIGH,     color:'var(--orange-400)' },
          { level:'MODERATE', count:counts.MODERATE, color:'var(--amber-400)'  },
          { level:'LOW',      count:counts.LOW,      color:'var(--blue-400)'   },
        ].map(({ level, count, color }, i) => (
          <motion.div key={level} className="glow-card" style={{ padding:18, borderTop:`2px solid ${color}`, cursor:'pointer' }}
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
            onClick={() => setFilter(level)}
            whileHover={{ y:-2 }}
          >
            <div style={{ fontSize:'1.8rem', fontWeight:900, color }}>{count}</div>
            <div style={{ fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-secondary)', marginTop:4 }}>{level}</div>
          </motion.div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display:'flex', gap:8, marginBottom:20, alignItems:'center', flexWrap:'wrap' }}>
        <Bell size={16} color="var(--text-muted)" />
        <div className="tab-bar">
          {levels.map(l => (
            <button key={l} className={`tab-item ${filter===l?'active':''}`} onClick={() => setFilter(l)}>{l}</button>
          ))}
        </div>
        <span style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginLeft:'auto' }}>{filtered.length} alert{filtered.length!==1?'s':''}</span>
      </div>

      {/* Alert list */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)', fontSize:'0.85rem' }} className="glow-card">
            No alerts found for the selected severity level.
          </div>
        ) : (
          filtered.map((a, i) => <AlertCard key={a.id} alert={a} delay={i*0.05} />)
        )}
      </div>
    </div>
  )
}
