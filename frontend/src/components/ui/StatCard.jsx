// src/components/ui/StatCard.jsx
import { motion } from 'framer-motion'

export default function StatCard({ label, value, sub, accent = 'var(--purple-400)', icon: Icon, delay = 0 }) {
  return (
    <motion.div
      className="glow-card"
      style={{ padding: '18px 20px', borderTop: `2px solid ${accent}`, cursor: 'default' }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -3, boxShadow: `0 12px 32px rgba(0,0,0,0.4)` }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: '1.9rem', fontWeight: 800, color: accent, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
          <div style={{ fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginTop: 6 }}>{label}</div>
          {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>{sub}</div>}
        </div>
        {Icon && (
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `${accent}18`, border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, flexShrink: 0 }}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </motion.div>
  )
}
