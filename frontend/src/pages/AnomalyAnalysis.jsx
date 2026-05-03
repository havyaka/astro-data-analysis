// src/pages/AnomalyAnalysis.jsx — Enhanced CSV upload + Isolation Forest (real API)
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Brain, Zap, BarChart3, Table2, History, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import FileUpload from '../components/FileUpload'
import ResultsTable from '../components/ResultsTable'
import ChartView from '../components/ChartView'
import { analyzeFile, fetchHistory } from '../services/api'

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
  const [file,       setFile]       = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [result,     setResult]     = useState(null)
  const [error,      setError]      = useState('')
  const [activeTab,  setActiveTab]  = useState('table')
  const [history,    setHistory]    = useState([])
  const [showHistory,setShowHistory]= useState(false)

  useEffect(() => {
    fetchHistory().then(r => setHistory(r.history||[])).catch(()=>{})
  }, [])

  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true); setError(''); setResult(null)
    try {
      const data = await analyzeFile(file)
      setResult(data); setActiveTab('table')
      fetchHistory().then(r => setHistory(r.history||[])).catch(()=>{})
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const ratio = result ? ((result.anomaly_count / result.total_rows)*100).toFixed(1) : null

  return (
    <div className="page-container">
      <h1 className="page-title">Anomaly <span className="gradient-text">Analysis</span></h1>
      <p className="page-subtitle">Upload a CSV dataset · Run Isolation Forest · Inspect results</p>

      {/* Upload card */}
      <motion.div className="glow-card" style={{ padding:28, marginBottom:20 }} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <Zap size={18} color="var(--purple-400)" />
          <span style={{ fontSize:'1rem', fontWeight:700 }}>Upload Dataset</span>
        </div>
        <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:20 }}>
          Upload a CSV file to detect anomalies using Isolation Forest. Numeric columns are used as features.
        </p>
        <FileUpload onFileSelect={setFile} isLoading={loading} />
        <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:16, flexWrap:'wrap' }}>
          <button id="analyze-btn" className="btn-primary" onClick={handleAnalyze} disabled={!file || loading} aria-busy={loading}>
            {loading ? <><span className="spinner" /> Analyzing…</> : <><Brain size={17} /> Analyze Dataset</>}
          </button>
          {result && <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.82rem', fontWeight:600, color:'var(--green-400)', padding:'6px 14px', borderRadius:999, background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.25)' }}><CheckCircle2 size={14} /> Analysis complete</span>}
        </div>
        {error && (
          <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 16px', borderRadius:10, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', color:'var(--red-400)', fontSize:'0.86rem', marginTop:14 }} role="alert">
            <AlertTriangle size={15} style={{ flexShrink:0, marginTop:2 }} />{error}
          </div>
        )}
      </motion.div>

      {/* Results */}
      {result && (
        <motion.div className="glow-card" style={{ padding:28, marginBottom:20 }} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px', borderRadius:10, marginBottom:20, background: result.anomaly_count>0?'rgba(239,68,68,0.08)':'rgba(74,222,128,0.07)', border:`1px solid ${result.anomaly_count>0?'rgba(239,68,68,0.3)':'rgba(74,222,128,0.25)'}`, color: result.anomaly_count>0?'var(--red-400)':'var(--green-400)', fontSize:'0.88rem', fontWeight:600 }}>
            {result.anomaly_count>0 ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}
            {result.message}
          </div>
          <div className="grid-4" style={{ marginBottom:20 }}>
            <StatCard label="Total Rows"  value={result.total_rows.toLocaleString()} accent="var(--purple-400)" />
            <StatCard label="Anomalies"   value={result.anomaly_count.toLocaleString()} sub={`${ratio}% of data`} accent="var(--red-400)" />
            <StatCard label="Normal"      value={(result.total_rows-result.anomaly_count).toLocaleString()} sub={`${(100-parseFloat(ratio)).toFixed(1)}% of data`} accent="var(--green-400)" />
            <StatCard label="Columns"     value={result.columns.length} accent="var(--cyan-400)" />
          </div>
          <div className="tab-bar" style={{ marginBottom:20 }}>
            <button className={`tab-item ${activeTab==='table'?'active':''}`} onClick={() => setActiveTab('table')}><Table2 size={14} style={{ marginRight:6, verticalAlign:'middle' }} />Data Table</button>
            <button className={`tab-item ${activeTab==='chart'?'active':''}`} onClick={() => setActiveTab('chart')}><BarChart3 size={14} style={{ marginRight:6, verticalAlign:'middle' }} />Chart View</button>
          </div>
          {activeTab==='table' && <ResultsTable data={result.data} columns={result.columns} />}
          {activeTab==='chart' && <ChartView   data={result.data} columns={result.columns} />}
        </motion.div>
      )}

      {/* History */}
      {history.length > 0 && (
        <motion.div className="glow-card" style={{ padding:'18px 24px' }} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}>
          <button style={{ display:'flex', alignItems:'center', gap:10, background:'none', border:'none', cursor:'pointer', color:'var(--text-secondary)', fontFamily:'var(--font-sans)', fontSize:'0.88rem', fontWeight:600, width:'100%' }} onClick={() => setShowHistory(v=>!v)}>
            <History size={15} /><span style={{ flex:1, textAlign:'left' }}>Analysis History ({history.length})</span>
            {showHistory ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {showHistory && (
            <div style={{ marginTop:14, overflowX:'auto' }}>
              <table className="data-table">
                <thead><tr><th>#</th><th>Filename</th><th>Anomalies</th><th>Total Rows</th><th>Timestamp (UTC)</th></tr></thead>
                <tbody>
                  {history.map((h,i) => (
                    <tr key={h.id}>
                      <td>{i+1}</td>
                      <td style={{ color:'var(--text-primary)', fontWeight:600 }}>{h.filename}</td>
                      <td><span className={`badge ${h.anomaly_count>0?'badge-anomaly':'badge-normal'}`}>{h.anomaly_count}</span></td>
                      <td>{h.total_rows}</td>
                      <td style={{ whiteSpace:'nowrap' }}>{h.timestamp}</td>
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
