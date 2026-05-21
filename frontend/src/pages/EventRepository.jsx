// src/pages/EventRepository.jsx — Searchable astronomical ensembled predictions archive
import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { fetchHistory } from '../services/api'
import AlertBadge from '../components/ui/AlertBadge'
import { Search, History, Clock, ChevronDown, ChevronUp, Sparkles, RefreshCw, Loader } from 'lucide-react'

const PAGE_SIZE = 8

export default function EventRepository() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [sort, setSort] = useState({ col: 'timestamp', dir: 'desc' })
  const [page, setPage] = useState(1)

  const types = ['ALL', 'Light Curve', 'Radio/FRB Signal', 'Telescope Telemetry', 'Spectral Data']

  const loadHistory = async () => {
    setLoading(true)
    try {
      const data = await fetchHistory()
      setHistory(data.history || [])
    } catch (err) {
      console.error("Failed to fetch prediction history:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const filtered = useMemo(() => {
    let d = history
    if (typeFilter !== 'ALL') {
      d = d.filter(e => e.dataset_type === typeFilter)
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      d = d.filter(e => 
        e.dataset_name.toLowerCase().includes(q) || 
        e.dataset_type.toLowerCase().includes(q) ||
        String(e.id).includes(q)
      )
    }
    d = [...d].sort((a, b) => {
      let av = a[sort.col]
      let bv = b[sort.col]
      if (typeof av === 'string') {
        return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      return sort.dir === 'asc' ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1)
    })
    return d
  }, [history, query, typeFilter, sort])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSort = col => {
    setSort(s => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' })
    setPage(1)
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Event <span className="gradient-text">Repository</span></h1>
      <p className="page-subtitle">Searchable, persistent archive of all offline ensembled AI anomaly runs</p>

      {/* Search & filters */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:220 }}>
          <Search size={15} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
          <input
            className="obs-input"
            style={{ paddingLeft:34 }}
            placeholder="Search prediction runs, dataset names, types…"
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1) }}
          />
        </div>
        
        <div className="tab-bar">
          {types.map(t => (
            <button key={t} className={`tab-item ${typeFilter===t?'active':''}`} onClick={() => { setTypeFilter(t); setPage(1) }}>
              {t === 'ALL' ? 'ALL' : t.split('/')[0]}
            </button>
          ))}
        </div>

        <button className="btn-secondary" onClick={loadHistory} style={{ padding:'10px 14px', display:'flex', alignItems:'center', gap:6, fontSize:'0.78rem' }}>
          <RefreshCw size={12} className={loading?'animate-spin':''} /> Refresh
        </button>
      </div>

      {/* Table */}
      <motion.div className="glow-card" style={{ padding:0, overflow:'hidden', marginBottom:16 }}
        initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
      >
        <div style={{ overflowX:'auto' }}>
          {loading && history.length === 0 ? (
            <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
              <Loader className="animate-spin" size={24} color="var(--purple-400)" />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)', fontSize:'0.85rem' }}>
              No local prediction records matching filters.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  {[
                    ['id', 'Run ID'],
                    ['dataset_name', 'Dataset Name'],
                    ['dataset_type', 'Astronomical Type'],
                    ['total_anomalies', 'Outliers Found'],
                    ['total_rows', 'Sample Count'],
                    ['timestamp', 'Inference Date']
                  ].map(([col, label]) => (
                    <th key={col} onClick={() => handleSort(col)} style={{ cursor:'pointer', userSelect:'none', whiteSpace:'nowrap' }}>
                      {label} {sort.col===col ? (sort.dir==='asc'?'↑':'↓') : ''}
                    </th>
                  ))}
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((evt) => (
                  <tr key={evt.id}>
                    <td style={{ color:'var(--purple-400)', fontWeight:700 }}>RUN-{evt.id}</td>
                    <td style={{ color:'var(--text-primary)', fontWeight:600 }}>{evt.dataset_name}</td>
                    <td>
                      <span style={{ fontSize:'0.72rem', color:'var(--cyan-400)', fontWeight:700 }}>{evt.dataset_type}</span>
                    </td>
                    <td>
                      <span className="badge badge-anomaly" style={{ background: evt.total_anomalies > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(74,222,128,0.15)', color: evt.total_anomalies > 0 ? 'var(--red-400)' : 'var(--green-400)' }}>
                        {evt.total_anomalies} anomalies
                      </span>
                    </td>
                    <td>{evt.total_rows.toLocaleString()}</td>
                    <td>{new Date(evt.timestamp).toLocaleString()}</td>
                    <td>
                      <a href={`/analysis?dataset=${evt.dataset_id}`} className="btn-secondary" style={{ padding:'5px 10px', fontSize:'0.72rem', display:'inline-flex', alignItems:'center', gap:4, textDecoration:'none' }}>
                        <Sparkles size={11} /> Load Results
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:'0.82rem', color:'var(--text-secondary)' }}>
          <span>Page {page} of {totalPages} · {filtered.length} runs archived</span>
          <div style={{ display:'flex', gap:6 }}>
            <button className="btn-secondary" style={{ padding:'6px 14px' }} onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>Prev</button>
            <button className="btn-secondary" style={{ padding:'6px 14px' }} onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}>Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
