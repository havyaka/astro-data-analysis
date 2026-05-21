// src/pages/DataIngestion.jsx — Multi-modal data upload center
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Radio, Activity, Zap, BarChart2, Upload, CheckCircle2, Loader, Trash2, Play, Brain, RefreshCw, FileText } from 'lucide-react'
import { uploadDataset, fetchDatasets, deleteDataset, analyzeDataset } from '../services/api'
import { useObservatory } from '../hooks/useObservatory'

const TABS = [
  { id:'radio',    label:'Radio',    icon: Radio,    color:'var(--purple-400)', freq:'70 MHz – 8 GHz', telescope:'CHIME, FAST, VLA, Parkes' },
  { id:'optical',  label:'Optical',  icon: Activity, color:'var(--cyan-400)',   freq:'380 – 900 nm',   telescope:'Hubble, VLT, Keck' },
  { id:'xray',     label:'X-Ray',    icon: Zap,      color:'var(--orange-400)', freq:'0.1 – 10 keV',   telescope:'Chandra, XMM-Newton' },
  { id:'spectral', label:'Spectral', icon: BarChart2, color:'var(--green-400)', freq:'380 – 2500 nm',  telescope:'VLT ESPRESSO, HARPS' },
]

const PIPELINE_STEPS = ['Ingestion', 'Preprocessing', 'Calibration', 'Feature Extraction', 'AI Inference', 'Catalog Match', 'Alert Check']

export default function DataIngestion() {
  const [activeTab, setActiveTab] = useState('radio')
  const [uploadState, setUploadState] = useState('idle') // idle | loading | done | error
  const [uploadedMeta, setUploadedMeta] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [datasets, setDatasets] = useState([])
  const [loadingDatasets, setLoadingDatasets] = useState(false)
  const { refreshTelemetry } = useObservatory()

  const tab = TABS.find(t => t.id === activeTab)

  // Load archived datasets from SQLite database
  const loadDatasets = async () => {
    setLoadingDatasets(true)
    try {
      const data = await fetchDatasets()
      setDatasets(data)
    } catch (err) {
      console.error("Failed to load datasets:", err)
    } finally {
      setLoadingDatasets(false)
    }
  }

  useEffect(() => {
    loadDatasets()
  }, [])

  const handleFileUpload = async (file) => {
    if (!file) return
    setUploadState('loading')
    setErrorMsg('')
    try {
      const res = await uploadDataset(file)
      setUploadedMeta(res)
      setUploadState('done')
      loadDatasets() // Reload list
      if (refreshTelemetry) refreshTelemetry() // Update global stats
    } catch (err) {
      console.error(err)
      setErrorMsg(err.response?.data?.detail || "Upload and ingestion failed.")
      setUploadState('error')
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!window.confirm("Are you sure you want to permanently delete this dataset and its training/analysis logs?")) return
    try {
      await deleteDataset(id)
      loadDatasets()
      if (refreshTelemetry) refreshTelemetry()
    } catch (err) {
      alert("Failed to delete dataset: " + (err.response?.data?.detail || err.message))
    }
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Data <span className="gradient-text">Ingestion Center</span></h1>
      <p className="page-subtitle">Multi-modal astronomical data upload and preprocessing pipeline</p>

      {/* Mode tabs */}
      <div className="tab-bar" style={{ marginBottom:28 }}>
        {TABS.map(({ id, label, icon:Icon }) => (
          <button key={id} className={`tab-item ${activeTab===id?'active':''}`} onClick={() => setActiveTab(id)}>
            <Icon size={14} style={{ marginRight:6, verticalAlign:'middle' }} />{label}
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }}>
        {/* Metadata panel */}
        <div className="grid-2" style={{ marginBottom:24 }}>
          <div className="glow-card" style={{ padding:20 }}>
            <div className="section-label">{tab.label} Data Specifications</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { k:'Frequency / Wavelength', v: tab.freq },
                { k:'Supported Instruments',  v: tab.telescope },
                { k:'Accepted Formats',       v: 'CSV only (Astronomical Telemetry)' },
                { k:'Storage Mode',           v: 'Persistent SQLite & Processed CSVs' },
                { k:'Processing Pipeline',    v: 'Savitzky-Golay Denoising & Scale' },
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
            <div
              style={{
                border:`2px dashed ${uploadState==='done'?'rgba(74,222,128,0.4)':uploadState==='loading'?tab.color+'80':uploadState==='error'?'rgba(248,113,113,0.4)':'rgba(255,255,255,0.08)'}`,
                borderRadius:16, padding:'32px 24px', textAlign:'center', cursor:uploadState==='loading'?'default':'pointer',
                background: uploadState==='done' ? 'rgba(74,222,128,0.05)' : uploadState==='error' ? 'rgba(248,113,113,0.05)' : 'rgba(255,255,255,0.02)',
                transition:'all 0.3s',
              }}
              onClick={() => uploadState!=='loading' && document.getElementById('file-inp').click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); uploadState!=='loading' && handleFileUpload(e.dataTransfer.files[0]) }}
            >
              <input id="file-inp" type="file" accept=".csv" style={{ display:'none' }} onChange={e => handleFileUpload(e.target.files[0])} />
              
              {uploadState === 'idle' && (
                <>
                  <div style={{ width:52, height:52, borderRadius:'50%', background:`${tab.color}18`, border:`1px solid ${tab.color}30`, display:'flex', alignItems:'center', justifyContent:'center', color:tab.color, margin:'0 auto 12px' }}>
                    <Upload size={22} />
                  </div>
                  <p style={{ fontWeight:600, color:'var(--text-primary)', marginBottom:4 }}>Drop CSV file or click to browse</p>
                  <p style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Local offline ingestion only</p>
                </>
              )}
              
              {uploadState === 'loading' && (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                  <Loader size={32} color={tab.color} style={{ animation:'spin 1s linear infinite' }} />
                  <p style={{ color:'var(--text-secondary)', fontSize:'0.85rem' }}>Preprocessing & calibrating CSV features…</p>
                </div>
              )}
              
              {uploadState === 'done' && (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                  <CheckCircle2 size={36} color="var(--green-400)" />
                  <p style={{ color:'var(--green-400)', fontWeight:700 }}>Dataset Registered Permanently!</p>
                  <p style={{ color:'var(--text-muted)', fontSize:'0.78rem', fontFamily:'var(--font-mono)' }}>
                    Type: {uploadedMeta?.dataset_type} · {uploadedMeta?.total_rows} samples
                  </p>
                  <button className="btn-secondary" style={{ marginTop:4, fontSize:'0.78rem' }} onClick={e => { e.stopPropagation(); setUploadState('idle'); setUploadedMeta(null) }}>Upload another</button>
                </div>
              )}

              {uploadState === 'error' && (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                  <Zap size={36} color="var(--red-400)" />
                  <p style={{ color:'var(--red-400)', fontWeight:700 }}>Ingestion Failed</p>
                  <p style={{ color:'var(--text-muted)', fontSize:'0.78rem' }}>{errorMsg}</p>
                  <button className="btn-secondary" style={{ marginTop:4, fontSize:'0.78rem' }} onClick={e => { e.stopPropagation(); setUploadState('idle') }}>Try Again</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pipeline */}
        <div className="glow-card" style={{ padding:24, marginBottom:24 }}>
          <div className="section-label">Offline Ingestion Pipeline</div>
          <div style={{ display:'flex', alignItems:'center', gap:0, flexWrap:'wrap', rowGap:8 }}>
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step} style={{ display:'flex', alignItems:'center' }}>
                <div style={{ padding:'5px 12px', borderRadius:6, background:`${tab.color}15`, border:`1px solid ${tab.color}30`, fontSize:'0.72rem', fontWeight:700, color:tab.color, whiteSpace:'nowrap', textTransform:'uppercase', letterSpacing:'0.04em' }}>{step}</div>
                {i < PIPELINE_STEPS.length-1 && <div style={{ width:16, height:1, background:`${tab.color}40`, flexShrink:0 }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Saved Datasets list */}
        <div className="glow-card" style={{ padding:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div className="section-label" style={{ marginBottom:0 }}>Archived Astronomical Datasets ({datasets.length})</div>
            <button className="btn-secondary" onClick={loadDatasets} style={{ padding:'6px 12px', display:'flex', alignItems:'center', gap:6, fontSize:'0.78rem' }}>
              <RefreshCw size={12} className={loadingDatasets?'animate-spin':''} /> Refresh list
            </button>
          </div>

          {loadingDatasets && datasets.length === 0 ? (
            <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
              <Loader className="animate-spin" size={24} color="var(--purple-400)" />
            </div>
          ) : datasets.length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px', color:'var(--text-muted)', fontSize:'0.85rem' }}>
              No local datasets registered yet. Drag one above to ingest.
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {datasets.map(d => (
                <div key={d.id} style={{ display:'flex', alignItems:'center', gap:16, padding:14, borderRadius:12, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)', transition:'all 0.2s', hover:{ background:'rgba(255,255,255,0.04)' } }}>
                  <div style={{ width:40, height:40, borderRadius:8, background:'rgba(139,92,246,0.1)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--purple-400)' }}>
                    <FileText size={18} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ fontSize:'0.88rem', fontWeight:600, color:'var(--text-primary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name}</span>
                      <span style={{ fontSize:'0.65rem', padding:'2px 8px', borderRadius:20, background:'rgba(139,92,246,0.15)', color:'var(--purple-300)', fontWeight:700, textTransform:'uppercase' }}>{d.dataset_type}</span>
                    </div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:3 }}>
                      {d.total_rows} rows · Features: <code style={{ color:'var(--cyan-400)' }}>{d.features ? d.features.split(',').slice(0,4).join(', ') + '...' : 'none'}</code> · Ingested {new Date(d.uploaded_at).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <a href={`/ai-engine?dataset=${d.id}`} className="btn-secondary" style={{ padding:'6px 12px', fontSize:'0.75rem', display:'flex', alignItems:'center', gap:4, textDecoration:'none' }}>
                      <Brain size={12} /> Train/Retrain
                    </a>
                    <a href={`/analysis?dataset=${d.id}`} className="btn-secondary" style={{ padding:'6px 12px', fontSize:'0.75rem', display:'flex', alignItems:'center', gap:4, textDecoration:'none', border:'1px solid rgba(74,222,128,0.2)', color:'var(--green-400)' }}>
                      <Play size={12} /> Analyze Anomalies
                    </a>
                    <button className="btn-secondary" onClick={(e) => handleDelete(d.id, e)} style={{ padding:'6px 8px', color:'var(--red-400)', hover:{ background:'rgba(239,68,68,0.1)' } }} title="Delete from archives">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
