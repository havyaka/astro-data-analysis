// src/pages/AIDetectionEngine.jsx — AI models manager with real-time retraining panel
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { fetchModelsStatus, fetchDatasets, trainModel } from '../services/api'
import { Cpu, Play, CheckCircle2, Clock, Loader, RefreshCw, Sliders, LineChart } from 'lucide-react'
import { useLocation } from 'react-router-dom'

export default function AIDetectionEngine() {
  const location = useLocation()
  
  // Parse pre-selected dataset ID from URL query if available
  const queryParams = new URLSearchParams(location.search)
  const initialDatasetId = queryParams.get('dataset') || ''

  const [models, setModels] = useState([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [datasets, setDatasets] = useState([])
  
  // Retraining state
  const [selectedDataset, setSelectedDataset] = useState(initialDatasetId)
  const [selectedModel, setSelectedModel] = useState('isolation_forest')
  const [epochs, setEpochs] = useState(15)
  const [batchSize, setBatchSize] = useState(32)
  const [sequenceLength, setSequenceLength] = useState(10)
  const [contamination, setContamination] = useState(0.05)
  const [trainingState, setTrainingState] = useState('idle') // idle | training | success | error
  const [trainedResult, setTrainedResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const loadData = async () => {
    setLoadingModels(true)
    try {
      const modelData = await fetchModelsStatus()
      setModels(modelData)
      
      const datasetData = await fetchDatasets()
      setDatasets(datasetData)
      
      // Auto-select first dataset if none selected
      if (!selectedDataset && datasetData.length > 0) {
        setSelectedDataset(datasetData[0].id.toString())
      }
    } catch (err) {
      console.error("Failed to load models/datasets status:", err)
    } finally {
      setLoadingModels(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleTrain = async (e) => {
    e.preventDefault()
    if (!selectedDataset) {
      alert("Please select a dataset to train on.")
      return
    }
    
    setTrainingState('training')
    setErrorMsg('')
    setTrainedResult(null)
    
    const params = {}
    if (selectedModel === 'isolation_forest') {
      params.contamination = parseFloat(contamination)
    } else {
      params.epochs = parseInt(epochs)
      params.batchSize = parseInt(batchSize)
      if (selectedModel === 'lstm') {
        params.sequenceLength = parseInt(sequenceLength)
      }
    }

    try {
      const res = await trainModel(selectedDataset, selectedModel, params)
      setTrainedResult(res)
      setTrainingState('success')
      loadData() // Refresh trained status list
    } catch (err) {
      console.error(err)
      setErrorMsg(err.response?.data?.detail || "Local retraining failed. Verify dataset shape and columns.")
      setTrainingState('error')
    }
  }

  const getModelLabel = (name) => {
    if (name === 'isolation_forest') return 'Isolation Forest Outlier Detector'
    if (name === 'autoencoder') return 'Dense Autoencoder Neural Network'
    if (name === 'lstm') return 'LSTM Window Sequence Autoencoder'
    return name
  }

  const getModelColor = (name) => {
    if (name === 'isolation_forest') return 'var(--orange-400)'
    if (name === 'autoencoder') return 'var(--cyan-400)'
    if (name === 'lstm') return 'var(--purple-400)'
    return 'var(--purple-400)'
  }

  return (
    <div className="page-container">
      <h1 className="page-title">AI <span className="gradient-text">Detection Engine</span></h1>
      <p className="page-subtitle">Offline model calibration panel · Train and deploy custom weights locally</p>

      {/* Main Grid */}
      <div className="grid-2" style={{ marginBottom:28, alignItems:'stretch' }}>
        
        {/* Retraining Console */}
        <motion.div className="glow-card" style={{ padding:24, display:'flex', flexDirection:'column' }} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <Sliders size={20} color="var(--purple-400)" />
            <div className="section-label" style={{ marginBottom:0 }}>Calibrate & Train Local Model</div>
          </div>

          <form onSubmit={handleTrain} style={{ display:'flex', flexDirection:'column', gap:16, flex:1 }}>
            {/* Dataset Select */}
            <div>
              <label style={{ display:'block', fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:6 }}>Select Astronomical Dataset</label>
              <select 
                value={selectedDataset} 
                onChange={(e) => setSelectedDataset(e.target.value)}
                style={{ width:'100%', padding:10, borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'var(--text-primary)', outline:'none' }}
              >
                <option value="" disabled>-- Choose Ingested Dataset --</option>
                {datasets.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.dataset_type})</option>
                ))}
              </select>
            </div>

            {/* Model Type select */}
            <div>
              <label style={{ display:'block', fontSize:'0.82rem', color:'var(--text-secondary)', marginBottom:6 }}>Select Local Model Architecture</label>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
                {[
                  { id: 'isolation_forest', label: 'Isolation Forest', color: 'var(--orange-400)' },
                  { id: 'autoencoder', label: 'Dense AE', color: 'var(--cyan-400)' },
                  { id: 'lstm', label: 'LSTM Sequence', color: 'var(--purple-400)' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedModel(m.id)}
                    style={{
                      padding:'10px 8px', borderRadius:8, fontSize:'0.78rem', fontWeight:700, cursor:'pointer', transition:'all 0.2s',
                      background: selectedModel === m.id ? `${m.color}15` : 'rgba(255,255,255,0.02)',
                      border: selectedModel === m.id ? `1px solid ${m.color}` : '1px solid rgba(255,255,255,0.06)',
                      color: selectedModel === m.id ? m.color : 'var(--text-muted)'
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic hyperparameters panel */}
            <div style={{ padding:14, borderRadius:8, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.04em' }}>Hyperparameters Panel</div>
              
              {selectedModel === 'isolation_forest' && (
                <div>
                  <label style={{ display:'flex', justifyContent:'space-between', fontSize:'0.8rem', color:'var(--text-secondary)', marginBottom:6 }}>
                    <span>Contamination (Estimated Outlier %): <b>{contamination * 100}%</b></span>
                  </label>
                  <input 
                    type="range" min="0.01" max="0.20" step="0.01" 
                    value={contamination} 
                    onChange={(e) => setContamination(parseFloat(e.target.value))}
                    style={{ width:'100%', accentColor:'var(--orange-400)' }} 
                  />
                  <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', marginTop:6 }}>
                    Defines the threshold proportion of outliers in the data. Higher contamination increases anomaly flags.
                  </div>
                </div>
              )}

              {(selectedModel === 'autoencoder' || selectedModel === 'lstm') && (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div className="grid-2">
                    <div>
                      <label style={{ display:'block', fontSize:'0.8rem', color:'var(--text-secondary)', marginBottom:4 }}>Epochs</label>
                      <input 
                        type="number" min="5" max="100" 
                        value={epochs} 
                        onChange={(e) => setEpochs(parseInt(e.target.value))}
                        style={{ width:'100%', padding:8, borderRadius:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', color:'var(--text-primary)', outline:'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ display:'block', fontSize:'0.8rem', color:'var(--text-secondary)', marginBottom:4 }}>Batch Size</label>
                      <input 
                        type="number" min="8" max="128" step="8" 
                        value={batchSize} 
                        onChange={(e) => setBatchSize(parseInt(e.target.value))}
                        style={{ width:'100%', padding:8, borderRadius:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', color:'var(--text-primary)', outline:'none' }}
                      />
                    </div>
                  </div>
                  {selectedModel === 'lstm' && (
                    <div>
                      <label style={{ display:'block', fontSize:'0.8rem', color:'var(--text-secondary)', marginBottom:4 }}>Sliding Window Length (Sequence Length)</label>
                      <input 
                        type="number" min="3" max="50" 
                        value={sequenceLength} 
                        onChange={(e) => setSequenceLength(parseInt(e.target.value))}
                        style={{ width:'100%', padding:8, borderRadius:6, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', color:'var(--text-primary)', outline:'none' }}
                      />
                      <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', marginTop:4 }}>
                        Duration of the temporal sequence context used by the LSTM cells for encoding.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ marginTop:'auto', paddingTop:10 }}>
              {trainingState === 'training' ? (
                <button type="button" disabled style={{ width:'100%', padding:12, borderRadius:8, background:'rgba(139,92,246,0.2)', border:'1px solid var(--purple-500)', color:'var(--purple-400)', display:'flex', alignItems:'center', justifyContent:'center', gap:10, fontWeight:700 }}>
                  <Loader className="animate-spin" size={16} /> Optimizing local weights offline...
                </button>
              ) : (
                <button type="submit" className="btn-primary" style={{ width:'100%', padding:12, display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'linear-gradient(135deg, var(--purple-600), var(--cyan-600))' }}>
                  <Cpu size={16} /> Retrain & Calibrate Offline
                </button>
              )}
            </div>
          </form>
        </motion.div>

        {/* Retraining Feedback & Training logs */}
        <motion.div className="glow-card" style={{ padding:24, display:'flex', flexDirection:'column' }} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3, delay:0.1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <LineChart size={20} color="var(--cyan-400)" />
            <div className="section-label" style={{ marginBottom:0 }}>Training Session Log / Loss History</div>
          </div>

          <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', border:'1px dashed rgba(255,255,255,0.04)', borderRadius:12, padding:20, background:'rgba(255,255,255,0.01)' }}>
            {trainingState === 'idle' && (
              <div style={{ textAlign:'center', color:'var(--text-muted)' }}>
                <Clock size={40} strokeWidth={1} style={{ marginBottom:12, color:'var(--text-muted)' }} />
                <p style={{ fontSize:'0.85rem' }}>No active training session.</p>
                <p style={{ fontSize:'0.75rem', marginTop:4 }}>Configure parameters on the left to calibrate model parameters.</p>
              </div>
            )}

            {trainingState === 'training' && (
              <div style={{ textAlign:'center' }}>
                <Loader className="animate-spin" size={40} color="var(--purple-400)" style={{ marginBottom:16 }} />
                <p style={{ fontSize:'0.9rem', color:'var(--text-primary)', fontWeight:700 }}>Training Local Neural Network...</p>
                <p style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:6 }}>Gradient descent optimizer is calculating weight updates using local CPU acceleration.</p>
              </div>
            )}

            {trainingState === 'success' && trainedResult && (
              <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, color:'var(--green-400)', fontSize:'0.9rem', fontWeight:700 }}>
                  <CheckCircle2 size={18} /> Training Completed successfully!
                </div>
                
                <div style={{ display:'flex', flexDirection:'column', gap:8, fontSize:'0.82rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'var(--text-muted)' }}>Model Architecture:</span>
                    <span style={{ color:'var(--text-primary)', fontWeight:600 }}>{trainedResult.model_name}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'var(--text-muted)' }}>Associated Dataset:</span>
                    <span style={{ color:'var(--text-primary)', fontWeight:600 }}>{trainedResult.dataset_name}</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ color:'var(--text-muted)' }}>Trained Weights File:</span>
                    <code style={{ fontSize:'0.7rem', color:'var(--cyan-400)' }}>{trainedResult.model_path}</code>
                  </div>
                </div>

                {/* Print final metrics */}
                {trainedResult.metrics && (
                  <div style={{ padding:12, borderRadius:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', marginBottom:8, textTransform:'uppercase' }}>Final Session Metrics</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:8, fontSize:'0.78rem' }}>
                      {Object.entries(trainedResult.metrics).map(([k, v]) => {
                        if (k === 'loss_history') return null
                        return (
                          <div key={k} style={{ padding:6, background:'rgba(255,255,255,0.02)', borderRadius:4 }}>
                            <div style={{ color:'var(--text-muted)', fontSize:'0.65rem', textTransform:'uppercase' }}>{k.replace('_', ' ')}</div>
                            <div style={{ color:'var(--text-primary)', fontWeight:700, fontSize:'0.9rem', marginTop:2 }}>
                              {typeof v === 'number' ? v.toFixed(6) : String(v)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Render quick loss loss curve visualization if neural network trained */}
                {trainedResult.metrics?.loss_history && (
                  <div style={{ flex:1, display:'flex', flexDirection:'column', gap:6 }}>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', textTransform:'uppercase' }}>Loss Descent Curve</div>
                    <div style={{ display:'flex', alignItems:'flex-end', gap:4, flex:1, borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:4 }}>
                      {trainedResult.metrics.loss_history.map((loss, idx, arr) => {
                        const maxVal = Math.max(...arr)
                        const minVal = Math.min(...arr)
                        const range = maxVal - minVal || 1.0
                        const pct = ((loss - minVal) / range) * 80 + 10 // scale between 10% and 90% height
                        return (
                          <div 
                            key={idx} 
                            style={{ flex:1, height:`${100 - pct}%`, background:'var(--cyan-500)', opacity:0.8, borderRadius:'2px 2px 0 0' }}
                            title={`Epoch ${idx+1}: Loss ${loss.toFixed(6)}`}
                          />
                        )
                      })}
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.62rem', color:'var(--text-muted)' }}>
                      <span>Epoch 1</span>
                      <span>Epoch {trainedResult.metrics.loss_history.length}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {trainingState === 'error' && (
              <div style={{ textAlign:'center', color:'var(--red-400)', padding:10 }}>
                <Cpu size={40} strokeWidth={1} style={{ marginBottom:12 }} />
                <p style={{ fontSize:'0.85rem', fontWeight:700 }}>Training Calibration Failed</p>
                <p style={{ fontSize:'0.75rem', marginTop:6, color:'var(--text-muted)' }}>{errorMsg}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Weights on Disk Grid */}
      <motion.div className="glow-card" style={{ padding:20 }} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3, delay:0.2 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Cpu size={20} color="var(--orange-400)" />
            <div className="section-label" style={{ marginBottom:0 }}>Archived Weights Files on Local Disk</div>
          </div>
          <button className="btn-secondary" onClick={loadData} style={{ padding:'6px 12px', display:'flex', alignItems:'center', gap:6, fontSize:'0.78rem' }}>
            <RefreshCw size={12} className={loadingModels?'animate-spin':''} /> Refresh list
          </button>
        </div>

        {loadingModels && models.length === 0 ? (
          <div style={{ display:'flex', justifyContent:'center', padding:40 }}>
            <Loader className="animate-spin" size={24} color="var(--purple-400)" />
          </div>
        ) : models.length === 0 ? (
          <div style={{ textAlign:'center', padding:30, color:'var(--text-muted)', fontSize:'0.82rem' }}>
            No model weights saved yet. Run calibration above to train model parameters.
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:12 }}>
            {models.map((m) => {
              const color = getModelColor(m.model_name)
              return (
                <div key={m.id} style={{ padding:14, borderRadius:10, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)', display:'flex', flexDirection:'column', gap:8 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{getModelLabel(m.model_name)}</div>
                      <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:2 }}>Trained on: <b>{m.dataset_name}</b></div>
                    </div>
                    <span style={{ fontSize:'0.62rem', fontWeight:700, padding:'2px 8px', borderRadius:20, background:`${color}15`, color, border:`1px solid ${color}30`, textTransform:'uppercase' }}>{m.status}</span>
                  </div>
                  
                  <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontFamily:'var(--font-mono)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', background:'rgba(0,0,0,0.2)', padding:'4px 8px', borderRadius:4 }}>
                    {m.model_filepath}
                  </div>

                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.72rem', color:'var(--text-muted)', borderTop:'1px solid rgba(255,255,255,0.04)', paddingTop:8, marginTop:4 }}>
                    <span>Calibrated: {new Date(m.timestamp).toLocaleDateString()}</span>
                    <span style={{ color:'var(--cyan-400)', fontWeight:600 }}>ID: {m.id}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>
    </div>
  )
}
