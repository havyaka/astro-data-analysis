// src/pages/AIDetectionEngine.jsx — AI models with live inference simulation
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AI_MODELS } from '../data/mockData'
import ConfidenceChart from '../components/charts/ConfidenceChart'
import { Cpu, Play, Pause, CheckCircle2, Clock } from 'lucide-react'

function ModelCard({ model, delay }) {
  const [inferences, setInferences] = useState(model.inferences)
  const [running, setRunning] = useState(model.status === 'running')

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setInferences(n => n + Math.floor(Math.random() * 3)), 2000)
    return () => clearInterval(id)
  }, [running])

  const typeColors = {
    'CNN':              'var(--purple-400)',
    'Autoencoder':      'var(--cyan-400)',
    'Meta-Learning':    'var(--blue-400)',
    'Transformer':      'var(--green-400)',
    'Signal Processing':'var(--amber-400)',
    'Ensemble':         'var(--orange-400)',
  }
  const color = typeColors[model.type] || 'var(--purple-400)'

  return (
    <motion.div className="glow-card" style={{ padding:22 }}
      initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay, duration:0.4 }}
      whileHover={{ y:-3 }}
    >
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:14 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:'0.88rem', fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{model.name}</div>
          <span style={{ fontSize:'0.68rem', fontWeight:700, padding:'2px 8px', borderRadius:999, background:`${color}18`, color, border:`1px solid ${color}30`, textTransform:'uppercase', letterSpacing:'0.05em' }}>{model.type}</span>
        </div>
        <button
          onClick={() => setRunning(r => !r)}
          style={{ width:30, height:30, borderRadius:8, border:`1px solid ${running?'rgba(74,222,128,0.3)':'var(--border-subtle)'}`, background: running?'rgba(74,222,128,0.1)':'rgba(255,255,255,0.04)', color: running?'var(--green-400)':'var(--text-muted)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
          title={running ? 'Pause' : 'Run'}
        >
          {running ? <Pause size={13} /> : <Play size={13} />}
        </button>
      </div>

      {/* Metrics */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
        {[['Accuracy', model.accuracy], ['Precision', model.precision], ['Recall', model.recall]].map(([k,v]) => (
          <div key={k} style={{ textAlign:'center', padding:'8px 4px', borderRadius:8, background:'rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize:'1rem', fontWeight:800, color }}>{v}%</div>
            <div style={{ fontSize:'0.62rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.04em', marginTop:2 }}>{k}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div style={{ marginBottom:12 }}>
        <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.68rem', color:'var(--text-muted)', marginBottom:5 }}>
          <span>Accuracy</span><span style={{ color }}>{model.accuracy}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width:`${model.accuracy}%`, background:`linear-gradient(90deg,${color},${color}88)` }} />
        </div>
      </div>

      {/* Inference count */}
      <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.75rem', color:'var(--text-muted)' }}>
        {running ? <CheckCircle2 size={13} color="var(--green-400)" /> : <Clock size={13} />}
        <span style={{ fontFamily:'var(--font-mono)' }}>{inferences.toLocaleString()} inferences</span>
        <span style={{ marginLeft:'auto', padding:'2px 8px', borderRadius:999, fontSize:'0.65rem', fontWeight:700, background: running?'rgba(74,222,128,0.12)':'rgba(255,255,255,0.04)', color: running?'var(--green-400)':'var(--text-muted)' }}>{running?'RUNNING':'IDLE'}</span>
      </div>
    </motion.div>
  )
}

export default function AIDetectionEngine() {
  return (
    <div className="page-container">
      <h1 className="page-title">AI <span className="gradient-text">Detection Engine</span></h1>
      <p className="page-subtitle">Six specialized neural models running in production · Click ▶/⏸ to toggle inference</p>

      {/* Model cards */}
      <div className="grid-3" style={{ marginBottom:28 }}>
        {AI_MODELS.map((m, i) => <ModelCard key={m.id} model={m} delay={i*0.07} />)}
      </div>

      {/* Performance chart */}
      <motion.div className="glow-card" style={{ padding:24 }} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.5 }}>
        <div className="section-label" style={{ marginBottom:16 }}>Model Performance Comparison (Accuracy vs Precision)</div>
        <ConfidenceChart height={260} />
      </motion.div>

      {/* Workflow diagram */}
      <motion.div className="glow-card" style={{ padding:24, marginTop:20 }} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}>
        <div className="section-label" style={{ marginBottom:16 }}>AI Inference Pipeline</div>
        <div style={{ display:'flex', alignItems:'center', gap:0, flexWrap:'wrap', rowGap:12 }}>
          {[
            { label:'Raw Signal',          color:'var(--text-muted)'   },
            { label:'Noise Filtering',     color:'var(--amber-400)'    },
            { label:'Feature Extraction',  color:'var(--purple-400)'   },
            { label:'FRB CNN',             color:'var(--cyan-400)'     },
            { label:'Anomaly Detection',   color:'var(--red-400)'      },
            { label:'Classification',      color:'var(--green-400)'    },
            { label:'Alert Generation',    color:'var(--orange-400)'   },
            { label:'Expert Review',       color:'var(--blue-400)'     },
          ].map((step, i, arr) => (
            <div key={step.label} style={{ display:'flex', alignItems:'center' }}>
              <div style={{ padding:'8px 14px', borderRadius:8, background:`${step.color}15`, border:`1px solid ${step.color}30`, fontSize:'0.75rem', fontWeight:700, color:step.color, whiteSpace:'nowrap' }}>{step.label}</div>
              {i < arr.length-1 && (
                <div style={{ display:'flex', alignItems:'center', gap:2, padding:'0 6px', color:'var(--text-muted)', fontSize:'0.9rem' }}>→</div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
