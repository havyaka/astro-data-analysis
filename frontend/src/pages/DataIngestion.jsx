// src/pages/DataIngestion.jsx — Multi-modal data upload center
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Radio, Activity, Zap, BarChart2, Upload, CheckCircle2, Loader } from 'lucide-react'

const TABS = [
  { id:'radio',    label:'Radio',    icon: Radio,    color:'var(--purple-400)', freq:'70 MHz – 8 GHz', telescope:'CHIME, FAST, VLA, Parkes' },
  { id:'optical',  label:'Optical',  icon: Activity, color:'var(--cyan-400)',   freq:'380 – 900 nm',   telescope:'Hubble, VLT, Keck' },
  { id:'xray',     label:'X-Ray',    icon: Zap,      color:'var(--orange-400)', freq:'0.1 – 10 keV',   telescope:'Chandra, XMM-Newton' },
  { id:'spectral', label:'Spectral', icon: BarChart2, color:'var(--green-400)', freq:'380 – 2500 nm',  telescope:'VLT ESPRESSO, HARPS' },
]

const PIPELINE_STEPS = ['Ingestion', 'Preprocessing', 'Calibration', 'Feature Extraction', 'AI Inference', 'Catalog Match', 'Alert Check']

function UploadZone({ color, accept = '.csv,.fits,.hdf5' }) {
  const [state, setState] = useState('idle') // idle | loading | done
  const [filename, setFilename] = useState(null)

  const handle = (file) => {
    if (!file) return
    setFilename(file.name)
    setState('loading')
    setTimeout(() => setState('done'), 2200)
  }

  return (
    <div>
      <div
        style={{
          border:`2px dashed ${state==='done'?'rgba(74,222,128,0.4)':state==='loading'?color+'80':'rgba(255,255,255,0.08)'}`,
          borderRadius:16, padding:'32px 24px', textAlign:'center', cursor:'pointer',
          background: state==='done' ? 'rgba(74,222,128,0.05)' : 'rgba(255,255,255,0.02)',
          transition:'all 0.3s',
        }}
        onClick={() => state==='idle' && document.getElementById('file-inp').click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); handle(e.dataTransfer.files[0]) }}
      >
        <input id="file-inp" type="file" accept={accept} style={{ display:'none' }} onChange={e => handle(e.target.files[0])} />
        {state === 'idle' && (
          <>
            <div style={{ width:52, height:52, borderRadius:'50%', background:`${color}18`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', color, margin:'0 auto 12px' }}>
              <Upload size={22} />
            </div>
            <p style={{ fontWeight:600, color:'var(--text-primary)', marginBottom:4 }}>Drop file or click to browse</p>
            <p style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Accepts {accept}</p>
          </>
        )}
        {state === 'loading' && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
            <Loader size={32} color={color} style={{ animation:'spin 1s linear infinite' }} />
            <p style={{ color:'var(--text-secondary)', fontSize:'0.85rem' }}>Processing <b>{filename}</b>…</p>
          </div>
        )}
        {state === 'done' && (
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
            <CheckCircle2 size={36} color="var(--green-400)" />
            <p style={{ color:'var(--green-400)', fontWeight:700 }}>File ingested successfully</p>
            <p style={{ color:'var(--text-muted)', fontSize:'0.78rem' }}>{filename}</p>
            <button className="btn-secondary" style={{ marginTop:4, fontSize:'0.78rem' }} onClick={e => { e.stopPropagation(); setState('idle'); setFilename(null) }}>Upload another</button>
          </div>
        )}
      </div>
    </div>
  )
}

function PipelineViz({ color }) {
  return (
    <div>
      <div className="section-label">Processing Pipeline</div>
      <div style={{ display:'flex', alignItems:'center', gap:0, flexWrap:'wrap', rowGap:8 }}>
        {PIPELINE_STEPS.map((step, i) => (
          <div key={step} style={{ display:'flex', alignItems:'center' }}>
            <div style={{ padding:'5px 12px', borderRadius:6, background:`${color}15`, border:`1px solid ${color}30`, fontSize:'0.72rem', fontWeight:700, color, whiteSpace:'nowrap', textTransform:'uppercase', letterSpacing:'0.04em' }}>{step}</div>
            {i < PIPELINE_STEPS.length-1 && <div style={{ width:16, height:1, background:`${color}40`, flexShrink:0 }} />}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DataIngestion() {
  const [activeTab, setActiveTab] = useState('radio')
  const tab = TABS.find(t => t.id === activeTab)

  return (
    <div className="page-container">
      <h1 className="page-title">Data <span className="gradient-text">Ingestion Center</span></h1>
      <p className="page-subtitle">Multi-modal astronomical data upload and preprocessing pipeline</p>

      {/* Mode tabs */}
      <div className="tab-bar" style={{ marginBottom:28 }}>
        {TABS.map(({ id, label, icon:Icon, color }) => (
          <button key={id} className={`tab-item ${activeTab===id?'active':''}`} onClick={() => setActiveTab(id)} style={activeTab!==id?{}:{}}>
            <Icon size={14} style={{ marginRight:6, verticalAlign:'middle' }} />{label}
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }}>
        {/* Metadata panel */}
        <div className="grid-2" style={{ marginBottom:20 }}>
          <div className="glow-card" style={{ padding:20 }}>
            <div className="section-label">{tab.label} Data Specifications</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { k:'Frequency / Wavelength', v: tab.freq },
                { k:'Supported Instruments',  v: tab.telescope },
                { k:'Accepted Formats',       v: 'CSV, FITS, HDF5, ASCII' },
                { k:'Max File Size',          v: '2 GB per upload' },
                { k:'Processing Mode',        v: 'Real-time AI inference' },
              ].map(({k,v}) => (
                <div key={k} style={{ display:'flex', gap:12, fontSize:'0.82rem' }}>
                  <span style={{ color:'var(--text-muted)', minWidth:180, flexShrink:0 }}>{k}</span>
                  <span style={{ color:'var(--text-primary)', fontFamily:'var(--font-mono)', fontWeight:600 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glow-card" style={{ padding:20 }}>
            <div className="section-label">Upload {tab.label} Data</div>
            <UploadZone color={tab.color} />
          </div>
        </div>

        {/* Pipeline */}
        <div className="glow-card" style={{ padding:24, marginBottom:20 }}>
          <PipelineViz color={tab.color} />
        </div>

        {/* Stream simulation cards */}
        <div className="grid-3">
          {['Buffer Status', 'Queue Depth', 'Throughput'].map((label, i) => (
            <div key={label} className="glow-card" style={{ padding:18 }}>
              <div className="section-label">{label}</div>
              <div style={{ fontSize:'1.6rem', fontWeight:800, color: tab.color }}>
                {i===0 ? '73%' : i===1 ? '14 jobs' : '2.4 GB/s'}
              </div>
              <div className="progress-bar" style={{ marginTop:8 }}>
                <div className="progress-fill" style={{ width: i===0?'73%':i===1?'40%':'80%', background:`linear-gradient(90deg,${tab.color},${tab.color}88)` }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
