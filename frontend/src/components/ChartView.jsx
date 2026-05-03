/**
 * ChartView.jsx
 * -------------
 * Recharts-based scatter plot visualising data points.
 * Anomaly points are rendered in red, normal points in cyan/purple.
 * Users can pick which column to plot on each axis.
 */

import { useState, useMemo } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import styles from './ChartView.module.css'

/* ── Custom Tooltip ─────────────────────────────────────── */
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className={styles.tooltip}>
      {Object.entries(d)
        .filter(([k]) => k !== 'anomaly')
        .map(([k, v]) => (
          <div key={k} className={styles.tooltipRow}>
            <span className={styles.tooltipKey}>{k}</span>
            <span className={styles.tooltipVal}>
              {typeof v === 'number' ? v.toFixed(4) : String(v)}
            </span>
          </div>
        ))}
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipKey}>status</span>
        <span className={`badge ${d.anomaly === -1 ? 'badge-anomaly' : 'badge-normal'}`}>
          {d.anomaly === -1 ? '⚠ Anomaly' : '✓ Normal'}
        </span>
      </div>
    </div>
  )
}

export default function ChartView({ data, columns }) {
  // Only numeric columns (excluding 'anomaly' and 'score') for axis selection
  const numericCols = useMemo(() => {
    if (!data.length) return []
    return columns.filter(c => c !== 'anomaly' && typeof data[0][c] === 'number')
  }, [data, columns])

  const [xCol, setXCol] = useState(() => numericCols[0] ?? '')
  const [yCol, setYCol] = useState(() => numericCols[1] ?? numericCols[0] ?? '')

  // Split into normal vs anomaly datasets
  const { normal, anomalies } = useMemo(() => {
    const normal = [], anomalies = []
    data.forEach(row => {
      if (row.anomaly === -1) anomalies.push(row)
      else normal.push(row)
    })
    return { normal, anomalies }
  }, [data])

  if (numericCols.length === 0) {
    return (
      <div className={styles.empty}>No numeric columns available for charting.</div>
    )
  }

  return (
    <div className={styles.wrapper}>
      {/* Axis selectors */}
      <div className={styles.controls}>
        <div className={styles.selectGroup}>
          <label className={styles.label} htmlFor="x-axis-select">X Axis</label>
          <select
            id="x-axis-select"
            className={styles.select}
            value={xCol}
            onChange={e => setXCol(e.target.value)}
          >
            {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className={styles.selectGroup}>
          <label className={styles.label} htmlFor="y-axis-select">Y Axis</label>
          <select
            id="y-axis-select"
            className={styles.select}
            value={yCol}
            onChange={e => setYCol(e.target.value)}
          >
            {numericCols.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className={styles.legend}>
          <span className={styles.legendDot} style={{ background: '#22d3ee' }} />
          <span>Normal ({normal.length})</span>
          <span className={styles.legendDot} style={{ background: '#ef4444', marginLeft: 12 }} />
          <span>Anomaly ({anomalies.length})</span>
        </div>
      </div>

      {/* Chart */}
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={380}>
          <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey={xCol}
              name={xCol}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
              label={{ value: xCol, position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 12 }}
            />
            <YAxis
              dataKey={yCol}
              name={yCol}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickLine={false}
              label={{ value: yCol, angle: -90, position: 'insideLeft', offset: 10, fill: '#94a3b8', fontSize: 12 }}
            />
            <ZAxis range={[40, 40]} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(139,92,246,0.3)' }} />
            <Legend
              wrapperStyle={{ display: 'none' }} /* using custom legend above */
            />
            <Scatter
              name="Normal"
              data={normal}
              fill="#22d3ee"
              fillOpacity={0.7}
              strokeWidth={0}
            />
            <Scatter
              name="Anomaly"
              data={anomalies}
              fill="#ef4444"
              fillOpacity={0.85}
              strokeWidth={0}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Score distribution bar */}
      {data[0]?.score !== undefined && (
        <div className={styles.scoreBars}>
          <p className={styles.scoreBarsTitle}>Anomaly Score Distribution (lower = more anomalous)</p>
          <div className={styles.scoreBarsGrid}>
            {data.slice(0, 80).map((row, i) => {
              const pct = Math.min(100, Math.max(0, ((row.score + 0.5) / 1) * 100))
              return (
                <div
                  key={i}
                  title={`Score: ${row.score?.toFixed(4)}`}
                  className={styles.scoreBar}
                  style={{
                    height: `${Math.max(4, pct * 0.6)}px`,
                    background: row.anomaly === -1
                      ? 'rgba(239,68,68,0.7)'
                      : 'rgba(34,211,238,0.5)',
                  }}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
