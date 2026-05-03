// src/hooks/useObservatory.js — Global observatory context + state
import { createContext, useContext, useState, useEffect } from 'react'
import { OBSERVATORY_STATS, ALERT_RECORDS, LIVE_FEED } from '../data/mockData'

const ObservatoryContext = createContext(null)

export function ObservatoryProvider({ children }) {
  const [stats, setStats]         = useState(OBSERVATORY_STATS)
  const [alerts]                  = useState(ALERT_RECORDS)
  const [feed, setFeed]           = useState(LIVE_FEED)
  const [systemOnline]            = useState(true)
  const [utcTime, setUtcTime]     = useState(new Date().toUTCString().slice(17, 25))

  // Live UTC clock
  useEffect(() => {
    const id = setInterval(() => {
      setUtcTime(new Date().toUTCString().slice(17, 25))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // Simulate occasional telemetry changes
  useEffect(() => {
    const id = setInterval(() => {
      setStats(s => ({
        ...s,
        totalEvents:      s.totalEvents + Math.floor(Math.random() * 3),
        dataProcessedGB:  s.dataProcessedGB + Math.floor(Math.random() * 2),
      }))
    }, 8000)
    return () => clearInterval(id)
  }, [])

  // Simulate live feed ticker
  useEffect(() => {
    const types = ['FRB', 'AI', 'Scope', 'Alert', 'Catalog']
    const msgs  = [
      'Candidate pulse detected — verifying',
      'Model inference complete — 3 flagged',
      'Telescope slew to new coordinates',
      'Alert threshold crossed',
      'Catalog cross-match returned 1 hit',
    ]
    const id = setInterval(() => {
      const now = new Date().toUTCString().slice(17, 25)
      const newEntry = {
        time:     now,
        type:     types[Math.floor(Math.random() * types.length)],
        msg:      msgs[Math.floor(Math.random() * msgs.length)],
        severity: ['high', 'medium', 'info'][Math.floor(Math.random() * 3)],
      }
      setFeed(f => [newEntry, ...f.slice(0, 19)])
    }, 12000)
    return () => clearInterval(id)
  }, [])

  const criticalAlertCount = alerts.filter(a => a.level === 'CRITICAL' || a.level === 'HIGH').length

  return (
    <ObservatoryContext.Provider value={{
      stats, alerts, feed, systemOnline, utcTime, criticalAlertCount,
    }}>
      {children}
    </ObservatoryContext.Provider>
  )
}

export function useObservatory() {
  const ctx = useContext(ObservatoryContext)
  if (!ctx) throw new Error('useObservatory must be used inside ObservatoryProvider')
  return ctx
}
