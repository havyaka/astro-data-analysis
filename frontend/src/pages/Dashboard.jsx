// src/pages/Dashboard.jsx — Mission Control overview
// All data is sourced exclusively from user-uploaded datasets and real ML inference outputs.
import { useObservatory } from '../hooks/useObservatory'
import StatCard from '../components/ui/StatCard'
import AlertBadge from '../components/ui/AlertBadge'
import { Radio, Activity, Cpu, Zap, Database, Wifi, WifiOff, Upload } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

// Empty state panel shown when no datasets have been uploaded
function EmptyState({ icon: Icon, title, message, actionLabel, onAction }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 20px', gap: 12,
      color: 'var(--text-muted)', textAlign: 'center',
    }}>
      <Icon size={28} strokeWidth={1.2} />
      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</div>
      <div style={{ fontSize: '0.76rem' }}>{message}</div>
      {actionLabel && (
        <button className="btn-primary" style={{ marginTop: 8, fontSize: '0.78rem', padding: '8px 18px' }} onClick={onAction}>
          <Upload size={13} /> {actionLabel}
        </button>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { stats, feed, alerts, systemOnline } = useObservatory()
  const navigate = useNavigate()

  const hasData      = stats.totalEvents > 0 || stats.anomaliesDetected > 0
  const hasAlerts    = alerts.length > 0
  const hasFeed      = feed.length > 0

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          Mission <span className="gradient-text">Control</span>
        </h1>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', fontWeight: 700,
          color: systemOnline ? 'var(--green-400)' : 'var(--red-400)',
          background: systemOnline ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
          padding: '3px 10px', borderRadius: 20,
        }}>
          {systemOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
          {systemOnline ? 'Backend Online' : 'Backend Offline'}
        </span>
      </div>
      <p className="page-subtitle">
        {hasData
          ? 'Live observatory telemetry — data from your uploaded datasets'
          : 'Upload a dataset to begin. All telemetry is generated from your data only.'}
      </p>

      {/* Top stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <StatCard label="Total Events"    value={stats.totalEvents > 0 ? stats.totalEvents.toLocaleString() : '—'} icon={Activity} accent="var(--purple-400)" delay={0}    />
        <StatCard label="Datasets Loaded" value={stats.frbCandidates > 12 ? stats.frbCandidates - 12 : stats.totalDatasets ?? 0} icon={Database} accent="var(--cyan-400)" delay={0.05} />
        <StatCard label="Anomalies Found" value={stats.anomaliesDetected > 0 ? stats.anomaliesDetected : '—'} icon={Zap} accent="var(--red-400)" delay={0.1} sub={stats.anomaliesDetected > 0 ? 'From ML inference' : 'No data yet'} />
        <StatCard label="AI Models Live"  value={stats.aiModelsRunning > 0 ? stats.aiModelsRunning : '—'} icon={Cpu} accent="var(--green-400)" delay={0.15} />
      </div>

      {/* Feed + Alerts row */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Live event feed */}
        <motion.div className="glow-card" style={{ padding: 20 }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="section-label">Live Event Feed</div>
          {hasFeed ? (
            <div className="feed-list" style={{ maxHeight: 280, overflowY: 'auto' }}>
              {feed.slice(0, 12).map((item, i) => (
                <div key={item.id ?? i} className={`feed-item ${item.severity}`}>
                  <span className="feed-time">{item.timestamp ?? item.time}</span>
                  <span className="feed-type" style={{
                    color: item.severity === 'high' ? 'var(--red-400)'
                         : item.severity === 'medium' ? 'var(--amber-400)'
                         : 'var(--blue-400)'
                  }}>{item.type}</span>
                  <span className="feed-msg">{item.msg}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Radio}
              title="No activity yet"
              message="No datasets uploaded. Upload a CSV dataset and run inference to see live feed events."
              actionLabel="Upload Dataset"
              onAction={() => navigate('/ingestion')}
            />
          )}
        </motion.div>

        {/* Recent alerts */}
        <motion.div className="glow-card" style={{ padding: 20 }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="section-label">Recent Alerts</div>
          {hasAlerts ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.slice(0, 6).map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
                  <AlertBadge level={a.level} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {a.scope} · {a.timestamp} · {a.confidence ? `${(a.confidence * 100).toFixed(0)}% confidence` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Zap}
              title="No alerts generated"
              message="Alerts are generated automatically when anomalies are detected during inference. Run analysis on a dataset to trigger real alerts."
              actionLabel="Run Analysis"
              onAction={() => navigate('/analysis')}
            />
          )}
        </motion.div>
      </div>

      {/* No-data CTA */}
      {!hasData && (
        <motion.div className="glow-card" style={{ padding: 32, textAlign: 'center', borderTop: '2px solid rgba(139,92,246,0.3)' }}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
            No Datasets Uploaded
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 500, margin: '0 auto 20px' }}>
            This observatory is empty. Upload a CSV astronomical dataset to start running AI-powered anomaly detection.
            All dashboard stats, alerts, and feed entries are generated exclusively from your uploaded data.
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => navigate('/ingestion')}>
              <Upload size={14} /> Upload Dataset
            </button>
            <button className="btn-secondary" onClick={() => navigate('/analysis')}>
              View Analysis
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
