// src/pages/SignalVisualization.jsx
// Visualizes real anomaly detection results from user-uploaded datasets.
// No mock, demo, or placeholder data. All charts are driven by actual inference outputs.
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import { fetchHistory, getPredictionRunDetails } from '../services/api'
import { BarChart2, Upload, RefreshCw, Loader, TrendingUp, Zap } from 'lucide-react'

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0e0e1a', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem' }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Row {label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color || 'var(--text-primary)' }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(4) : p.value}
        </div>
      ))}
    </div>
  )
}

function EmptyPanel({ onNavigate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 14, color: 'var(--text-muted)', textAlign: 'center' }}>
      <BarChart2 size={36} strokeWidth={1.2} />
      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>No Anomaly Results Available</div>
      <div style={{ fontSize: '0.82rem', maxWidth: 420 }}>
        Signal visualizations are generated from real AI inference runs on your uploaded datasets.
        Upload a dataset and run analysis to see charts here.
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
        <button className="btn-primary" style={{ fontSize: '0.8rem' }} onClick={() => onNavigate('/ingestion')}>
          <Upload size={13} /> Upload Dataset
        </button>
        <button className="btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => onNavigate('/analysis')}>
          <Zap size={13} /> Run Analysis
        </button>
      </div>
    </div>
  )
}

export default function SignalVisualization() {
  const navigate = useNavigate()
  const [history, setHistory]       = useState([])
  const [selectedRun, setSelectedRun] = useState(null)
  const [runData, setRunData]       = useState(null)
  const [loading, setLoading]       = useState(false)
  const [chartView, setChartView]   = useState('anomaly_score')

  // Load prediction run list
  useEffect(() => {
    fetchHistory()
      .then(r => {
        const runs = r.history || []
        setHistory(runs)
        if (runs.length > 0) setSelectedRun(runs[0])
      })
      .catch(() => setHistory([]))
  }, [])

  // Load detailed results for selected run
  useEffect(() => {
    if (!selectedRun) return
    setLoading(true)
    getPredictionRunDetails(selectedRun.id)
      .then(d => {
        setRunData(d)
        setLoading(false)
      })
      .catch(() => {
        setRunData(null)
        setLoading(false)
      })
  }, [selectedRun])

  const hasResults = runData && runData.results && runData.results.length > 0

  // Build chart data from real prediction rows
  const chartData = hasResults ? runData.results.map((row, i) => {
    const score = row.anomaly_score ?? row.ensemble_score ?? row.score ?? 0
    return {
      index: i,
      anomaly_score: typeof score === 'number' ? parseFloat(score.toFixed(4)) : 0,
      is_anomaly: row.anomaly === -1 ? 1 : 0,
      label: row.anomaly === -1 ? 'Anomaly' : 'Normal',
    }
  }) : []

  const anomalyPoints = chartData.filter(d => d.is_anomaly === 1)
  const normalPoints  = chartData.filter(d => d.is_anomaly === 0)

  const anomalyCount  = anomalyPoints.length
  const totalRows     = chartData.length
  const maxScore      = chartData.length > 0 ? Math.max(...chartData.map(d => d.anomaly_score)).toFixed(4) : '—'
  const avgScore      = chartData.length > 0 ? (chartData.reduce((s, d) => s + d.anomaly_score, 0) / chartData.length).toFixed(4) : '—'

  return (
    <div className="page-container">
      <h1 className="page-title">Signal <span className="gradient-text">Visualization</span></h1>
      <p className="page-subtitle">
        Real anomaly detection signal charts — driven exclusively by your uploaded datasets and ML inference outputs
      </p>

      {history.length === 0 ? (
        <div className="glow-card" style={{ padding: 24 }}>
          <EmptyPanel onNavigate={navigate} />
        </div>
      ) : (
        <>
          {/* Run selector */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Inference Run:</label>
            <select
              className="obs-input"
              style={{ flex: 1, maxWidth: 400 }}
              value={selectedRun?.id ?? ''}
              onChange={e => {
                const run = history.find(r => r.id === parseInt(e.target.value))
                setSelectedRun(run ?? null)
              }}
            >
              {history.map(r => (
                <option key={r.id} value={r.id}>
                  RUN-{r.id} · {r.dataset_name} · {r.total_anomalies} anomalies · {new Date(r.timestamp).toLocaleString()}
                </option>
              ))}
            </select>

            <div className="tab-bar">
              {[
                { key: 'anomaly_score', label: 'Score Timeline' },
                { key: 'scatter',       label: 'Scatter View' },
              ].map(v => (
                <button key={v.key} className={`tab-item ${chartView === v.key ? 'active' : ''}`} onClick={() => setChartView(v.key)}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <Loader className="animate-spin" size={28} color="var(--purple-400)" />
            </div>
          ) : !hasResults ? (
            <div className="glow-card" style={{ padding: 24 }}>
              <EmptyPanel onNavigate={navigate} />
            </div>
          ) : (
            <>
              {/* Stats row */}
              <div className="grid-4" style={{ marginBottom: 20 }}>
                {[
                  { label: 'Dataset',        value: runData.dataset_name,            color: 'var(--cyan-400)'   },
                  { label: 'Total Rows',     value: totalRows.toLocaleString(),       color: 'var(--purple-400)' },
                  { label: 'Anomalies',      value: anomalyCount,                    color: anomalyCount > 0 ? 'var(--red-400)' : 'var(--green-400)' },
                  { label: 'Max AI Score',   value: maxScore,                        color: 'var(--amber-400)'  },
                ].map(({ label, value, color }) => (
                  <motion.div key={label} className="glow-card" style={{ padding: 18 }}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="section-label">{label}</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color }}>{value}</div>
                  </motion.div>
                ))}
              </div>

              {/* Chart */}
              <motion.div className="glow-card" style={{ padding: 24, marginBottom: 20 }}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                  {chartView === 'anomaly_score'
                    ? `Ensemble Anomaly Score — ${runData.dataset_name} (${runData.dataset_type})`
                    : `Anomaly Scatter — Normal vs Flagged Points`}
                </div>

                {chartView === 'anomaly_score' && (
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <defs>
                        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="index" tick={{ fill: '#64748b', fontSize: 10 }} stroke="rgba(255,255,255,0.1)"
                        label={{ value: 'Row Index', position: 'insideBottom', offset: -12, fill: '#64748b', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
                      <Tooltip content={<Tip />} />
                      <Area type="monotone" dataKey="anomaly_score" stroke="#8b5cf6" strokeWidth={1.5}
                        fill="url(#scoreGrad)" dot={false} name="Anomaly Score" />
                      {anomalyPoints.map(p => (
                        <ReferenceLine key={p.index} x={p.index} stroke="rgba(239,68,68,0.5)" strokeWidth={1} />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                )}

                {chartView === 'scatter' && (
                  <ResponsiveContainer width="100%" height={320}>
                    <ScatterChart margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis type="number" dataKey="index" name="Row Index" tick={{ fill: '#64748b', fontSize: 10 }} stroke="rgba(255,255,255,0.1)"
                        label={{ value: 'Row Index', position: 'insideBottom', offset: -12, fill: '#64748b', fontSize: 11 }} />
                      <YAxis type="number" dataKey="anomaly_score" name="Score" tick={{ fill: '#64748b', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
                      <Tooltip content={<Tip />} cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="Normal" data={normalPoints} fill="#22d3ee" opacity={0.5} />
                      <Scatter name="Anomaly" data={anomalyPoints} fill="#f87171" opacity={0.9} />
                    </ScatterChart>
                  </ResponsiveContainer>
                )}

                <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22d3ee', display: 'inline-block' }} />
                    Normal ({normalPoints.length})
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171', display: 'inline-block' }} />
                    Anomaly ({anomalyPoints.length})
                  </span>
                  <span style={{ marginLeft: 'auto' }}>Avg score: {avgScore}</span>
                </div>
              </motion.div>

              {/* Anomaly highlights table */}
              {anomalyCount > 0 && (
                <motion.div className="glow-card" style={{ padding: 20 }}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <div className="section-label">Top Flagged Anomaly Rows</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Row</th>
                          <th>Anomaly Score</th>
                          <th>Label</th>
                        </tr>
                      </thead>
                      <tbody>
                        {anomalyPoints.slice(0, 10).map(p => (
                          <tr key={p.index}>
                            <td style={{ color: 'var(--purple-400)', fontWeight: 700 }}>{p.index}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber-400)' }}>{p.anomaly_score}</td>
                            <td><span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--red-400)', background: 'rgba(239,68,68,0.12)', padding: '2px 8px', borderRadius: 4 }}>ANOMALY</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
