// src/components/layout/TopBar.jsx
import { useState } from 'react'
import { Menu, Bell, Wifi, WifiOff, Search } from 'lucide-react'
import { useObservatory } from '../../hooks/useObservatory'

export default function TopBar({ onMenuClick }) {
  const { utcTime, criticalAlertCount, stats, systemOnline } = useObservatory()
  const [searchOpen, setSearchOpen] = useState(false)



  return (
    <header style={{
      position: 'fixed',
      top: 0, left: 'var(--sidebar-w)', right: 0,
      height: 'var(--topbar-h)',
      background: 'rgba(7,7,15,0.92)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(20px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '0 20px',
    }}>

      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'none', flexShrink: 0 }}
        className="topbar-menu-btn"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Backend status pill */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '3px 9px', borderRadius: 999,
          background: systemOnline ? 'rgba(74,222,128,0.08)' : 'rgba(239,68,68,0.08)',
          border: `1px solid ${systemOnline ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)'}`,
          fontSize: '0.7rem', fontWeight: 700,
          color: systemOnline ? 'var(--green-400)' : 'var(--red-400)',
        }}>
          {systemOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
          {systemOnline ? 'AI Engine Online' : 'Backend Offline'}
        </div>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Search */}
      {searchOpen ? (
        <input
          className="obs-input"
          style={{ maxWidth: 220 }}
          placeholder="Search events, FRBs…"
          autoFocus
          onBlur={() => setSearchOpen(false)}
        />
      ) : (
        <button onClick={() => setSearchOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }} aria-label="Search">
          <Search size={17} />
        </button>
      )}

      {/* Dataset info — real row count from uploaded datasets only */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: 1 }} className="topbar-meta">
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {stats.totalDatasets > 0 ? `${stats.totalDatasets} Dataset${stats.totalDatasets !== 1 ? 's' : ''}` : 'No Data'}
        </span>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: stats.totalEvents > 0 ? 'var(--cyan-400)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {stats.totalEvents > 0 ? `${stats.totalEvents.toLocaleString()} rows` : '—'}
        </span>
      </div>

      {/* Alert bell */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button style={{ background: 'none', border: 'none', color: criticalAlertCount > 0 ? 'var(--orange-400)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
          <Bell size={18} />
        </button>
        {criticalAlertCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: 'var(--red-500)', color: '#fff',
            fontSize: '0.58rem', fontWeight: 700,
            width: 16, height: 16, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{criticalAlertCount}</span>
        )}
      </div>

      {/* UTC clock */}
      <div style={{
        padding: '4px 12px', borderRadius: 8,
        background: 'rgba(139,92,246,0.1)',
        border: '1px solid rgba(139,92,246,0.2)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.78rem', fontWeight: 600,
        color: 'var(--purple-400)', flexShrink: 0,
      }}>
        UTC {utcTime}
      </div>

      {/* Status dot */}
      <span className={`status-dot ${systemOnline ? 'online' : 'offline'}`} style={{ flexShrink: 0 }} />

      <style>{`
        @media (max-width: 768px) {
          .topbar-menu-btn { display: flex !important; }
          .topbar-meta { display: none; }
          header { left: 0 !important; }
        }
      `}</style>
    </header>
  )
}
