// src/pages/AnomalyAnalysis.jsx — Hybrid ensembled anomaly inference control center
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Brain, Zap, BarChart3, Table2, History, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Loader, ShieldAlert, Sparkles, RefreshCw, Plus } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import ResultsTable from '../components/ResultsTable'
import ChartView from '../components/ChartView'
import { analyzeDataset, fetchHistory, fetchDatasets, getPredictionRunDetails } from '../services/api'

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="glow-card" style={{ padding:'18px 20px', borderTop:`2px solid ${accent}` }}>
      <div style={{ fontSize:'1.8rem', fontWeight:800, color:accent, lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:'0.72rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-secondary)', marginTop:6 }}>{label}</div>
      {sub && <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:3 }}>{sub}</div>}
    </div>
  )
}

export default function AnomalyAnalysis() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryParams = new URLSearchParams(location.search)
  const initialDatasetId = queryParams.get('dataset') || ''

  const [datasets, setDatasets] = useState([])
  const [selectedDataset, setSelectedDataset] = useState(initialDatasetId)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('table')
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  const loadData = async () => {
    try {
      const dsList = await fetchDatasets()
      setDatasets(dsList)
      
      if (!selectedDataset && dsList.length > 0) {
        setSelectedDataset(dsList[0].id.toString())
      }
      
      const histData = await fetchHistory()
      setHistory(histData.history || [])
    } catch (err) {
      console.error("Failed to load initial analysis datasets:", err)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAnalyze = async () => {
    if (!selectedDataset) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await analyzeDataset(selectedDataset)
      setResult(data)
      setActiveTab('table')
      
      // Refresh history list
      const histData = await fetchHistory()
      setHistory(histData.history || [])
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Unknown error running hybrid inference.')
    } finally {
      setLoading(false)
    }
  }

  const handleLoadPastRun = async (runId) => {
    setLoadingHistory(true)
    setError('')
    try {
      const data = await getPredictionRunDetails(runId)
      // Adapt structure to match analyze response
      setResult({
        data: data.results,
        anomaly_count: data.total_anomalies,
        total_rows: data.results.length,
        columns: Object.keys(data.results[0] || {}).filter(k => k !== 'anomaly' && k !== 'score' && k !== 'flags'),
        message: `Loaded past ensembled prediction run #${runId} executed on ${new Date(data.timestamp).toLocaleString()}`,
        dataset_type: data.dataset_type,
        explanations: [] // Explanations can be reconstructed dynamically or left empty for simple viewing
      })
      setActiveTab('table')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      alert("Failed to load past run: " + (err.response?.data?.detail || err.message))
    } finally {
      setLoadingHistory(false)
    }
  }

  const ratio = result ? ((result.anomaly_count / result.total_rows) * 100).toFixed(1) : null

  return (
    <div className="page-container">
      <h1 className="page-title">Anomaly <span className="gradient-text">Analysis Control Center</span></h1>
      <p className="page-subtitle">Select ingested datasets · Trigger ensembled AI detection offline · Inspect explanations</p>

      {/* Control panel card */}
      <motion.div className="glow-card" style={{ padding:28, marginBottom:20 }} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <Zap size={18} color="var(--purple-400)" />
          <span style={{ fontSize:'1rem', fontWeight:700 }}>Choose Archived Dataset</span>
        </div>
        <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:20 }}>
          Pick a preprocessed astronomical CSV from the archives to launch the ensembled neural/physical anomaly engine.
        </p>
        
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <select 
            value={selectedDataset} 
            onChange={(e) => setSelectedDataset(e.target.value)}
            style={{ flex:1, minWidth:260, padding:12, borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'var(--text-primary)', outline:'none' }}
          >
            <option value="" disabled>-- Select Dataset to Analyze --</option>
            {datasets.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.dataset_type}) · {d.total_rows} rows</option>
            ))}
          </select>

          <button id="analyze-btn" className="btn-primary" onClick={handleAnalyze} disabled={!selectedDataset || loading} style={{ padding:'12px 24px' }}>
            {loading ? (
              <><Loader className="animate-spin" size={16} /> Running Hybrid AI Ensemble…</>
            ) : (
              <><Brain size={17} /> Execute Hybrid AI Inference</>
            )}
          </button>

          <button className="btn-secondary" onClick={() => navigate('/ingestion')} style={{ padding:'12px 20px', display:'inline-flex', alignItems:'center', gap:6 }}>
            <Plus size={16} /> Ingest New CSV
          </button>
        </div>

        {error && (
          <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 16px', borderRadius:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', color:'var(--red-400)', fontSize:'0.86rem', marginTop:14 }} role="alert">
            <AlertTriangle size={15} style={{ flexShrink:0, marginTop:2 }} />{error}
          </div>
        )}
      </motion.div>

      {/* Results view */}
      {result && (
        <motion.div className="glow-card" style={{ padding:28, marginBottom:20 }} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
          
          {/* Status Message */}
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', borderRadius:10, marginBottom:20, background: result.anomaly_count > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(74,222,128,0.07)', border: `1px solid ${result.anomaly_count > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(74,222,128,0.25)'}`, color: result.anomaly_count > 0 ? 'var(--red-400)' : 'var(--green-400)', fontSize:'0.88rem', fontWeight:600 }}>
            {result.anomaly_count > 0 ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}
            {result.message}
          </div>

          {/* Core Metrics Grid */}
          <div className="grid-4" style={{ marginBottom:20 }}>
            <StatCard label="Total Rows"  value={result.total_rows.toLocaleString()} accent="var(--purple-400)" />
            <StatCard label="Anomalies"   value={result.anomaly_count.toLocaleString()} sub={`${ratio}% of data`} accent="var(--red-400)" />
            <StatCard label="Normal"      value={(result.total_rows - result.anomaly_count).toLocaleString()} sub={`${(100 - parseFloat(ratio)).toFixed(1)}% of data`} accent="var(--green-400)" />
            <StatCard label="Inferred Type" value={result.dataset_type} accent="var(--cyan-400)" />
          </div>

          {/* Model Summary / Weights Info */}
          {result.model_summary && (
            <div style={{ padding:12, borderRadius:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)', marginBottom:20, fontSize:'0.75rem' }}>
              <span style={{ fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', marginRight:10 }}>Active Model Ensemble:</span>
              {result.model_summary.models_used.map(m => (
                <span key={m} style={{ padding:'2px 8px', borderRadius:20, background:'rgba(255,255,255,0.04)', color:'var(--cyan-400)', marginRight:6, fontWeight:600 }}>{m.replace('_', ' ')}</span>
              ))}
              <span style={{ color:'var(--text-muted)' }}>· Anomaly Decision Threshold Score: <b>{result.model_summary.anomaly_threshold.toFixed(4)}</b></span>
            </div>
          )}

          {/* Tab Selector */}
          <div className="tab-bar" style={{ marginBottom:20 }}>
            <button className={`tab-item ${activeTab==='table'?'active':''}`} onClick={() => setActiveTab('table')}><Table2 size={14} style={{ marginRight:6, verticalAlign:'middle' }} />Ensembled Records Table</button>
            <button className={`tab-item ${activeTab==='chart'?'active':''}`} onClick={() => setActiveTab('chart')}><BarChart3 size={14} style={{ marginRight:6, verticalAlign:'middle' }} />Interactive Chart View</button>
            {result.explanations && result.explanations.length > 0 && (
              <button className={`tab-item ${activeTab==='xai'?'active':''}`} onClick={() => setActiveTab('xai')}><ShieldAlert size={14} style={{ marginRight:6, verticalAlign:'middle' }} />Explainable AI (XAI) Reports ({result.explanations.length})</button>
            )}
          </div>

          {/* Tab Content */}
          {activeTab === 'table' && <ResultsTable data={result.data} columns={result.columns} />}
          {activeTab === 'chart' && <ChartView data={result.data} columns={result.columns} />}
          
          {activeTab === 'xai' && result.explanations && (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {result.explanations.map((x, idx) => (
                <div key={idx} style={{ padding:16, borderRadius:12, background:'rgba(255,255,255,0.02)', border:`1px solid ${x.severity === 'CRITICAL' ? 'rgba(239,68,68,0.2)' : x.severity === 'HIGH' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.04)'}`, display:'flex', gap:14 }}>
                  <div style={{ width:38, height:38, borderRadius:8, background: x.severity === 'CRITICAL' ? 'rgba(239,68,68,0.1)' : x.severity === 'HIGH' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'center', color: x.severity === 'CRITICAL' ? 'var(--red-400)' : x.severity === 'HIGH' ? 'var(--amber-400)' : 'var(--text-secondary)', flexShrink:0 }}>
                    <ShieldAlert size={18} />
                  </div>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:'0.75rem', fontWeight:800, padding:'2px 8px', borderRadius:20, background: x.severity === 'CRITICAL' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: x.severity === 'CRITICAL' ? 'var(--red-400)' : 'var(--amber-400)' }}>{x.severity}</span>
                      <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Row Index: <b>{x.index}</b></span>
                      <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>· Anomaly Score: <b style={{ color:'var(--cyan-400)' }}>{x.score.toFixed(4)}</b></span>
                    </div>
                    <p style={{ fontSize:'0.82rem', color:'var(--text-primary)', marginTop:6, lineHeight:1.4 }}>{x.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Prediction history log */}
      {history.length > 0 && (
        <motion.div className="glow-card" style={{ padding:'18px 24px' }} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}>
          <button style={{ display:'flex', alignItems:'center', gap:10, background:'none', border:'none', cursor:'pointer', color:'var(--text-secondary)', fontFamily:'var(--font-sans)', fontSize:'0.88rem', fontWeight:600, width:'100%', outline:'none' }} onClick={() => setShowHistory(v => !v)}>
            <History size={15} /><span style={{ flex:1, textAlign:'left' }}>Ensembled Prediction Archives ({history.length})</span>
            {showHistory ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          
          {showHistory && (
            <div style={{ marginTop:14, overflowX:'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Dataset Name</th>
                    <th>Astronomical Type</th>
                    <th>Anomalies</th>
                    <th>Total Rows</th>
                    <th>Timestamp (UTC)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={h.id}>
                      <td>{i + 1}</td>
                      <td style={{ color:'var(--text-primary)', fontWeight:600 }}>{h.dataset_name}</td>
                      <td><span style={{ fontSize:'0.65rem', padding:'2px 8px', borderRadius:20, background:'rgba(255,255,255,0.05)', color:'var(--text-secondary)', fontWeight:700 }}>{h.dataset_type}</span></td>
                      <td><span className={`badge badge-anomaly`} style={{ background: h.total_anomalies > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(74,222,128,0.15)', color: h.total_anomalies > 0 ? 'var(--red-400)' : 'var(--green-400)' }}>{h.total_anomalies}</span></td>
                      <td>{h.total_rows}</td>
                      <td style={{ whiteSpace:'nowrap' }}>{new Date(h.timestamp).toLocaleString()}</td>
                      <td>
                        <button className="btn-secondary" onClick={() => handleLoadPastRun(h.id)} style={{ padding:'4px 8px', fontSize:'0.72rem', display:'flex', alignItems:'center', gap:4 }}>
                          <Sparkles size={11} /> Load Results
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
