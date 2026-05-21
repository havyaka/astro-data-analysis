// src/hooks/useObservatory.jsx — Global observatory context + state
// Data comes ONLY from the FastAPI backend (real DB queries on user-uploaded datasets)
import { createContext, useContext, useState, useEffect } from 'react'
import { fetchDashboardStats, fetchAlerts, fetchLiveFeed } from '../services/api'

const ObservatoryContext = createContext(null)

// Empty-state defaults — shown when no datasets have been uploaded yet
const EMPTY_STATS = {
  uptime: '100% (Local)',
  totalEvents: 0,
  frbCandidates: 0,
  anomaliesDetected: 0,
  activeScopes: 0,
  aiModelsRunning: 0,
  dataProcessedGB: 0,
  alertsToday: 0,
}

export function ObservatoryProvider({ children }) {
  const [stats, setStats]               = useState(EMPTY_STATS)
  const [alerts, setAlerts]             = useState([])
  const [feed, setFeed]                 = useState([])
  const [systemOnline, setSystemOnline] = useState(false)
  const [utcTime, setUtcTime]           = useState(new Date().toUTCString().slice(17, 25))

  // Live UTC clock
  useEffect(() => {
    const id = setInterval(() => {
      setUtcTime(new Date().toUTCString().slice(17, 25))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // Fetch real observatory telemetry from the SQLite database
  const refreshTelemetry = async () => {
    try {
      const liveStats = await fetchDashboardStats()
      setStats(liveStats)

      const liveAlerts = await fetchAlerts()
      // Only set alerts if the array is valid (never fall back to mock)
      setAlerts(Array.isArray(liveAlerts) ? liveAlerts : [])

      const liveLogs = await fetchLiveFeed()
      setFeed(Array.isArray(liveLogs) ? liveLogs : [])

      setSystemOnline(true)
    } catch (error) {
      console.warn('FastAPI backend offline.', error)
      setSystemOnline(false)
      // Do NOT fall back to mock data. Keep whatever state we have.
    }
  }

  // Refresh on mount and every 6 seconds
  useEffect(() => {
    refreshTelemetry()
    const id = setInterval(refreshTelemetry, 6000)
    return () => clearInterval(id)
  }, [])

  const criticalAlertCount = alerts.filter(a => a.level === 'CRITICAL' || a.level === 'HIGH').length

  return (
    <ObservatoryContext.Provider value={{
      stats, alerts, feed, systemOnline, utcTime, criticalAlertCount, refreshTelemetry
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
