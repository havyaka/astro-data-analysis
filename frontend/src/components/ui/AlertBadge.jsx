// src/components/ui/AlertBadge.jsx
const LEVELS = {
  CRITICAL: { cls: 'badge badge-critical', label: 'CRITICAL' },
  HIGH:     { cls: 'badge badge-high',     label: 'HIGH'     },
  MODERATE: { cls: 'badge badge-moderate', label: 'MODERATE' },
  LOW:      { cls: 'badge badge-low',      label: 'LOW'      },
  INFO:     { cls: 'badge badge-info',     label: 'INFO'     },
}

export default function AlertBadge({ level }) {
  const cfg = LEVELS[level?.toUpperCase()] ?? LEVELS.INFO
  return <span className={cfg.cls}>{cfg.label}</span>
}
