// src/pages/EventRepository.jsx — Searchable astronomical event archive
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { EVENT_RECORDS } from '../data/mockData'
import AlertBadge from '../components/ui/AlertBadge'
import { Search, Archive, CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react'

const TYPE_COLORS = {
  FRB:       'var(--purple-400)',
  Transient: 'var(--cyan-400)',
  'X-Ray':   'var(--orange-400)',
  Spectral:  'var(--green-400)',
}

const PAGE_SIZE = 6

export default function EventRepository() {
  const [query,     setQuery]     = useState('')
  const [typeFilter,setTypeFilter]= useState('ALL')
  const [sort,      setSort]      = useState({ col:'date', dir:'desc' })
  const [page,      setPage]      = useState(1)
  const [expanded,  setExpanded]  = useState(null)

  const types = ['ALL', 'FRB', 'Transient', 'X-Ray', 'Spectral']

  const filtered = useMemo(() => {
    let d = EVENT_RECORDS
    if (typeFilter !== 'ALL') d = d.filter(e => e.type === typeFilter)
    if (query.trim()) {
      const q = query.toLowerCase()
      d = d.filter(e => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.telescope.toLowerCase().includes(q))
    }
    d = [...d].sort((a, b) => {
      const av = a[sort.col], bv = b[sort.col]
      return sort.dir === 'asc' ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1)
    })
    return d
  }, [query, typeFilter, sort])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageData   = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE)

  const handleSort = col => {
    setSort(s => s.col === col ? { col, dir: s.dir==='asc'?'desc':'asc' } : { col, dir:'asc' })
    setPage(1)
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Event <span className="gradient-text">Repository</span></h1>
      <p className="page-subtitle">Searchable archive of all detected astronomical events</p>

      {/* Search & filters */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:220 }}>
          <Search size={15} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }} />
          <input
            className="obs-input"
            style={{ paddingLeft:34 }}
            placeholder="Search events, IDs, instruments…"
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1) }}
          />
        </div>
        <div className="tab-bar">
          {types.map(t => (
            <button key={t} className={`tab-item ${typeFilter===t?'active':''}`} onClick={() => { setTypeFilter(t); setPage(1) }}>{t}</button>
          ))}
        </div>
        <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', flexShrink:0 }}>
          {filtered.length} event{filtered.length!==1?'s':''}
        </div>
      </div>

      {/* Table */}
      <motion.div className="glow-card" style={{ padding:0, overflow:'hidden', marginBottom:16 }}
        initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
      >
        <div style={{ overflowX:'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                {[['id','Event ID'],['type','Type'],['name','Name'],['telescope','Telescope'],['date','Date'],['priority','Priority'],['reviewed','Reviewed']].map(([col, label]) => (
                  <th key={col} onClick={() => handleSort(col)} style={{ cursor:'pointer', userSelect:'none', whiteSpace:'nowrap' }}>
                    {label} {sort.col===col ? (sort.dir==='asc'?'↑':'↓') : ''}
                  </th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {pageData.map((evt, i) => (
                <>
                  <tr key={evt.id} style={{ background: expanded===evt.id?'rgba(139,92,246,0.05)':undefined }}>
                    <td style={{ color:'var(--purple-400)', fontWeight:700 }}>{evt.id}</td>
                    <td>
                      <span style={{ color:TYPE_COLORS[evt.type]||'var(--text-secondary)', fontWeight:700, fontSize:'0.75rem' }}>{evt.type}</span>
                    </td>
                    <td style={{ color:'var(--text-primary)', fontWeight:600 }}>{evt.name}</td>
                    <td>{evt.telescope}</td>
                    <td>{evt.date}</td>
                    <td>
                      <AlertBadge level={evt.priority==='HIGH'?'HIGH':evt.priority==='MED'?'MODERATE':'LOW'} />
                    </td>
                    <td>
                      {evt.reviewed
                        ? <CheckCircle2 size={15} color="var(--green-400)" />
                        : <Clock size={15} color="var(--text-muted)" />}
                    </td>
                    <td>
                      <button style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }} onClick={() => setExpanded(expanded===evt.id?null:evt.id)}>
                        {expanded===evt.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </td>
                  </tr>
                  {expanded === evt.id && (
                    <tr key={`${evt.id}-exp`}>
                      <td colSpan={8} style={{ padding:0 }}>
                        <div style={{ padding:'16px 20px', background:'rgba(139,92,246,0.04)', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ display:'flex', gap:24, flexWrap:'wrap', fontSize:'0.82rem' }}>
                            <div><span style={{ color:'var(--text-muted)' }}>RA: </span><span style={{ color:'var(--text-primary)', fontFamily:'var(--font-mono)' }}>{evt.ra}</span></div>
                            <div><span style={{ color:'var(--text-muted)' }}>Dec: </span><span style={{ color:'var(--text-primary)', fontFamily:'var(--font-mono)' }}>{evt.dec}</span></div>
                            <div><span style={{ color:'var(--text-muted)' }}>Status: </span><span style={{ color: evt.reviewed?'var(--green-400)':'var(--amber-400)' }}>{evt.reviewed?'Reviewed':'Pending Review'}</span></div>
                            <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
                              <button className="btn-secondary" style={{ fontSize:'0.75rem', padding:'5px 12px' }}>View Details</button>
                              <button className="btn-primary"   style={{ fontSize:'0.75rem', padding:'5px 12px' }}>Run Analysis</button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:'0.82rem', color:'var(--text-secondary)' }}>
          <span>Page {page} of {totalPages} · {filtered.length} events</span>
          <div style={{ display:'flex', gap:6 }}>
            <button className="btn-secondary" style={{ padding:'6px 14px' }} onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>Prev</button>
            <button className="btn-secondary" style={{ padding:'6px 14px' }} onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}>Next</button>
          </div>
        </div>
      )}
    </div>
  )
}
