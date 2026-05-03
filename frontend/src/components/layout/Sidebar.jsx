// src/components/layout/Sidebar.jsx
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Telescope, LayoutDashboard, Radio, Activity,
  Cpu, Bell, Archive, FlaskConical, Search, Microscope, X
} from 'lucide-react'
import { useObservatory } from '../../hooks/useObservatory'

const NAV = [
  { to: '/',            icon: Telescope,     label: 'Observatory',  end: true },
  { to: '/dashboard',   icon: LayoutDashboard,label: 'Dashboard'               },
  { to: '/ingestion',   icon: Radio,         label: 'Data Center'             },
  { to: '/signals',     icon: Activity,      label: 'Signals'                 },
  { to: '/ai-engine',   icon: Cpu,           label: 'AI Engine'               },
  { to: '/alerts',      icon: Bell,          label: 'Alerts'                  },
  { to: '/repository',  icon: Archive,       label: 'Repository'              },
  { to: '/xai',         icon: FlaskConical,  label: 'Explainable AI'          },
  { to: '/analysis',    icon: Microscope,    label: 'Analysis'                },
]

const S = {
  aside: {
    position: 'fixed', top: 0, left: 0, bottom: 0,
    width: 'var(--sidebar-w)', zIndex: 200,
    background: 'rgba(7,7,15,0.95)',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    backdropFilter: 'blur(20px)',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  logo: {
    padding: '20px 18px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex', alignItems: 'center', gap: 12,
  },
  logoIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, boxShadow: '0 4px 16px rgba(139,92,246,0.5)',
  },
  logoText: { fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.01em', lineHeight: 1.2 },
  logoSub:  { fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 },
  nav: { flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' },
  navLabel: { fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', padding: '10px 10px 6px' },
  footer: { padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' },
  footerRow: { display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--text-secondary)' },
}

const linkBase = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '9px 12px', borderRadius: 10,
  fontSize: '0.84rem', fontWeight: 500,
  color: 'var(--text-secondary)', textDecoration: 'none',
  transition: 'all 0.18s',
}
const linkActive = {
  background: 'linear-gradient(135deg,rgba(124,58,237,0.25),rgba(6,182,212,0.1))',
  color: '#a78bfa',
  borderLeft: '2px solid #8b5cf6',
  boxShadow: 'inset 0 0 20px rgba(139,92,246,0.06)',
}

export default function Sidebar({ mobileOpen, onClose }) {
  const { criticalAlertCount, stats, systemOnline, utcTime } = useObservatory()
  const location = useLocation()

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div onClick={onClose} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 199, backdropFilter: 'blur(4px)',
        }} />
      )}

      <motion.aside
        style={{
          ...S.aside,
          transform: mobileOpen ? 'translateX(0)' : undefined,
        }}
        className="sidebar-aside"
        aria-label="Observatory navigation"
      >
        {/* Logo */}
        <div style={S.logo}>
          <div style={S.logoIcon}>
            <Telescope size={18} color="#fff" />
          </div>
          <div>
            <div style={S.logoText}>ASTRO<span style={{ color: 'var(--cyan-400)' }}>·AI</span></div>
            <div style={S.logoSub}>Observatory v2.0</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'none' }} className="sidebar-close">
            <X size={16} />
          </button>
        </div>

        {/* Navigation */}
        <nav style={S.nav}>
          <div style={S.navLabel}>Navigation</div>
          {NAV.map(({ to, icon: Icon, label, end }) => {
            const isAlerts = to === '/alerts'
            const isActive = end ? location.pathname === to : location.pathname.startsWith(to)
            return (
              <NavLink
                key={to} to={to} end={end}
                style={({ isActive }) => ({ ...linkBase, ...(isActive ? linkActive : {}) })}
                onClick={onClose}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{label}</span>
                {isAlerts && criticalAlertCount > 0 && (
                  <span style={{
                    background: 'rgba(239,68,68,0.8)', color: '#fff',
                    fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px',
                    borderRadius: 999, minWidth: 18, textAlign: 'center',
                  }}>{criticalAlertCount}</span>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* System status footer */}
        <div style={S.footer}>
          <div style={{ ...S.footerRow, marginBottom: 6 }}>
            <span className={`status-dot ${systemOnline ? 'online' : 'offline'}`} />
            <span style={{ fontWeight: 600, color: 'var(--green-400)', fontSize: '0.78rem' }}>System Online</span>
          </div>
          <div style={{ ...S.footerRow, marginBottom: 4 }}>
            <span style={{ color: 'var(--text-muted)' }}>Active Scopes:</span>
            <span style={{ color: 'var(--cyan-400)', fontWeight: 700 }}>{stats.activeScopes}</span>
          </div>
          <div style={S.footerRow}>
            <span style={{ color: 'var(--text-muted)' }}>UTC:</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--purple-400)', fontSize: '0.72rem' }}>{utcTime}</span>
          </div>
        </div>
      </motion.aside>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-aside { transform: translateX(${mobileOpen ? '0' : '-100%'}) !important; transition: transform 0.3s ease; }
          .sidebar-close  { display: flex !important; }
        }
      `}</style>
    </>
  )
}
