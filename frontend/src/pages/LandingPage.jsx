import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Telescope, Radio, Activity, Cpu, ChevronRight, Zap, Globe, Shield } from 'lucide-react'
import StarfieldCanvas from '../components/StarfieldCanvas'
import { useObservatory } from '../hooks/useObservatory'

function useCounter(target, duration = 1800) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = null
    const step = ts => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setVal(Math.floor(p * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return val
}

const FEATURES = [
  { icon: Radio,    color:'#22d3ee', title:'FRB Detection',       desc:'Real-time Fast Radio Burst detection across global telescope arrays using deep CNN architectures.' },
  { icon: Activity, color:'#a78bfa', title:'Anomaly Analysis',     desc:'Automated light curve anomaly detection using Isolation Forest and autoencoder models.' },
  { icon: Cpu,      color:'#4ade80', title:'AI Classification',    desc:'Multi-modal transient classification using few-shot meta-learning and transformer models.' },
  { icon: Globe,    color:'#fb923c', title:'Catalog Matching',     desc:'Cross-matching with SIMBAD, Gaia, NASA archives, and TNS for source identification.' },
  { icon: Shield,   color:'#f87171', title:'Alert Generation',     desc:'Priority-ranked alert system with CRITICAL/HIGH/MODERATE/LOW tiers and expert review.' },
  { icon: Zap,      color:'#fbbf24', title:'Explainable AI',       desc:'SHAP-inspired feature importance and reasoning diagrams for full AI transparency.' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { stats } = useObservatory()

  const totalRows  = useCounter(stats.totalEvents)
  const datasets   = useCounter(stats.totalDatasets ?? 0)
  const anomalies  = useCounter(stats.anomaliesDetected)
  const aiModels   = useCounter(stats.aiModelsRunning)

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <StarfieldCanvas />

      {/* Nebula blobs */}
      <div style={{ position:'fixed', width:600, height:600, top:-200, left:-100, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,0.1) 0%,transparent 70%)', pointerEvents:'none', zIndex:1 }} />
      <div style={{ position:'fixed', width:500, height:500, bottom:-100, right:-100, borderRadius:'50%', background:'radial-gradient(circle,rgba(34,211,238,0.07) 0%,transparent 70%)', pointerEvents:'none', zIndex:1 }} />

      {/* Minimal nav */}
      <nav style={{ position:'relative', zIndex:10, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 40px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#7c3aed,#06b6d4)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(139,92,246,0.5)' }}>
            <Telescope size={18} color="#fff" />
          </div>
          <span style={{ fontSize:'1rem', fontWeight:800, letterSpacing:'-0.01em' }}>
            ASTRO<span style={{ color:'var(--cyan-400)' }}>·AI</span>
          </span>
        </div>
        <button className="btn-primary" onClick={() => navigate('/dashboard')}>
          Enter Observatory <ChevronRight size={16} />
        </button>
      </nav>

      {/* Hero */}
      <section style={{ position:'relative', zIndex:10, textAlign:'center', padding:'80px 24px 60px', maxWidth:900, margin:'0 auto' }}>
        <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.7 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 18px', borderRadius:999, background:'rgba(139,92,246,0.12)', border:'1px solid rgba(139,92,246,0.25)', marginBottom:28, fontSize:'0.78rem', fontWeight:700, color:'var(--purple-400)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
            <span className="status-dot online" /> Live Observatory · All Systems Nominal
          </div>
          <h1 style={{ fontSize:'clamp(2.4rem, 6vw, 4.2rem)', fontWeight:900, letterSpacing:'-0.03em', lineHeight:1.1, marginBottom:20 }}>
            AI-Driven{' '}
            <span style={{ background:'linear-gradient(135deg,#a78bfa 0%,#22d3ee 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Astronomical
            </span>
            <br />Event Detection
          </h1>
          <p style={{ fontSize:'1.05rem', color:'var(--text-secondary)', lineHeight:1.7, maxWidth:620, margin:'0 auto 36px' }}>
            Next-generation observatory platform combining radio, optical, and X-ray astronomy 
            with AI anomaly detection for FRB discovery, transient monitoring, and spectral analysis.
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button className="btn-primary" style={{ fontSize:'1rem', padding:'14px 32px' }} onClick={() => navigate('/dashboard')}>
              <Telescope size={18} /> Mission Control
            </button>
            <button className="btn-secondary" style={{ fontSize:'1rem', padding:'14px 32px' }} onClick={() => navigate('/analysis')}>
              <Activity size={18} /> Run Analysis
            </button>
          </div>
        </motion.div>
      </section>

      {/* Stats counters */}
      <motion.section
        style={{ position:'relative', zIndex:10, maxWidth:800, margin:'0 auto', padding:'0 24px 60px' }}
        initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3, duration:0.6 }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 28, backdropFilter: 'blur(16px)' }}>
          {totalRows === 0 && datasets === 0 && anomalies === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '8px 0' }}>
              No datasets uploaded yet — upload a CSV to see real stats here
            </div>
          ) : (
            [
              { val: totalRows,  suffix: '',   label: 'Total Rows Analyzed', color: 'var(--purple-400)' },
              { val: datasets,   suffix: '',   label: 'Datasets Uploaded',   color: 'var(--cyan-400)'   },
              { val: anomalies,  suffix: '',   label: 'Anomalies Found',     color: 'var(--red-400)'    },
              { val: aiModels,   suffix: '',   label: 'Models Trained',      color: 'var(--green-400)'  },
            ].map(({ val, suffix, label, color }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(1.4rem,3vw,2rem)', fontWeight: 900, color, lineHeight: 1 }}>{val.toLocaleString()}{suffix}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</div>
              </div>
            ))
          )}
        </div>
      </motion.section>

      {/* Features grid */}
      <section style={{ position:'relative', zIndex:10, maxWidth:1100, margin:'0 auto', padding:'0 24px 100px' }}>
        <motion.h2 initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
          style={{ textAlign:'center', fontSize:'1.5rem', fontWeight:800, marginBottom:8 }}>
          Observatory Capabilities
        </motion.h2>
        <p style={{ textAlign:'center', color:'var(--text-secondary)', fontSize:'0.9rem', marginBottom:36 }}>
          Six integrated scientific modules working in concert
        </p>
        <div className="grid-3" style={{ gap:20 }}>
          {FEATURES.map(({ icon: Icon, color, title, desc }, i) => (
            <motion.div key={title} className="glow-card" style={{ padding:24 }}
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1*i+0.6, duration:0.4 }}
              whileHover={{ y:-4, borderColor:`${color}40` }}
            >
              <div style={{ width:44, height:44, borderRadius:12, background:`${color}18`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', color, marginBottom:14 }}>
                <Icon size={20} />
              </div>
              <h3 style={{ fontSize:'0.95rem', fontWeight:700, marginBottom:8 }}>{title}</h3>
              <p style={{ fontSize:'0.82rem', color:'var(--text-secondary)', lineHeight:1.65 }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ position:'relative', zIndex:10, textAlign:'center', padding:'0 24px 80px' }}>
        <div style={{ display:'inline-block', padding:'40px 60px', borderRadius:24, background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.2)', backdropFilter:'blur(16px)' }}>
          <h2 style={{ fontSize:'1.6rem', fontWeight:800, marginBottom:12 }}>Ready for mission control?</h2>
          <p style={{ color:'var(--text-secondary)', marginBottom:24 }}>Enter the observatory to monitor live events and run AI analysis.</p>
          <button className="btn-primary" style={{ fontSize:'1rem', padding:'14px 36px' }} onClick={() => navigate('/dashboard')}>
            <Telescope size={18} /> Launch Dashboard
          </button>
        </div>
      </section>
    </div>
  )
}
