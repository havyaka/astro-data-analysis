// src/data/mockData.js — Centralized mock data for the AI Observatory

// ── Observatory-wide stats ────────────────────────────────────────────────
export const OBSERVATORY_STATS = {
  uptime: '99.7%',
  totalEvents: 14823,
  frbCandidates: 247,
  anomaliesDetected: 89,
  activeScopes: 4,
  aiModelsRunning: 6,
  dataProcessedGB: 1847,
  alertsToday: 12,
}

// ── Telescope network ─────────────────────────────────────────────────────
export const TELESCOPE_STATUS = [
  { id: 'CHIME',   name: 'CHIME Array',            type: 'Radio',   location: 'British Columbia, CA', status: 'online',       events: 89  },
  { id: 'FAST',    name: 'FAST 500m Telescope',     type: 'Radio',   location: 'Guizhou, China',       status: 'online',       events: 124 },
  { id: 'VLA',     name: 'Karl G. Jansky VLA',      type: 'Radio',   location: 'New Mexico, USA',      status: 'maintenance',  events: 0   },
  { id: 'PARKES',  name: 'Parkes 64m Murriyang',    type: 'Radio',   location: 'NSW, Australia',       status: 'online',       events: 34  },
  { id: 'HUBBLE',  name: 'Hubble Space Telescope',  type: 'Optical', location: 'LEO 547 km',           status: 'online',       events: 7   },
  { id: 'CHANDRA', name: 'Chandra X-ray Observatory',type: 'X-Ray', location: 'HEO 139,000 km',       status: 'online',       events: 12  },
]

// ── FRB event records ─────────────────────────────────────────────────────
export const FRB_EVENTS = [
  { id: 'FRB20240101A', ra: '05h31m58.7s', dec: '+33°08′52″', dm: 557.4,  fluence: 12.3, duration: 4.2, confidence: 0.97, telescope: 'CHIME',  detected: '2024-01-01T14:23Z', status: 'confirmed'  },
  { id: 'FRB20240112B', ra: '12h18m02.1s', dec: '-07°22′14″', dm: 341.2,  fluence: 8.7,  duration: 2.1, confidence: 0.89, telescope: 'FAST',   detected: '2024-01-12T08:55Z', status: 'candidate'  },
  { id: 'FRB20240119C', ra: '23h44m31.5s', dec: '+60°50′23″', dm: 819.6,  fluence: 22.1, duration: 8.9, confidence: 0.94, telescope: 'PARKES', detected: '2024-01-19T22:11Z', status: 'confirmed'  },
  { id: 'FRB20240203A', ra: '09h02m11.8s', dec: '-14°36′48″', dm: 432.8,  fluence: 6.2,  duration: 1.8, confidence: 0.76, telescope: 'FAST',   detected: '2024-02-03T03:44Z', status: 'candidate'  },
  { id: 'FRB20240218B', ra: '17h55m48.3s', dec: '+28°11′02″', dm: 701.3,  fluence: 18.5, duration: 6.4, confidence: 0.92, telescope: 'CHIME',  detected: '2024-02-18T11:28Z', status: 'confirmed'  },
  { id: 'FRB20240301C', ra: '01h09m27.6s', dec: '-47°15′38″', dm: 289.1,  fluence: 4.1,  duration: 1.2, confidence: 0.68, telescope: 'CHIME',  detected: '2024-03-01T19:03Z', status: 'reviewing'  },
  { id: 'FRB20240315D', ra: '14h22m09.3s', dec: '+12°44′57″', dm: 623.7,  fluence: 15.8, duration: 5.1, confidence: 0.91, telescope: 'FAST',   detected: '2024-03-15T06:17Z', status: 'confirmed'  },
  { id: 'FRB20240402E', ra: '22h37m55.1s', dec: '-55°18′29″', dm: 1102.3, fluence: 31.2, duration: 11.4,confidence: 0.99, telescope: 'PARKES', detected: '2024-04-02T16:42Z', status: 'confirmed'  },
]

// ── Light curve (optical flux vs time) ───────────────────────────────────
export const LIGHT_CURVE_DATA = Array.from({ length: 120 }, (_, i) => {
  const base = 1.0 + Math.sin(i * 0.15) * 0.2
  const noise = (Math.random() - 0.5) * 0.08
  const isFlare = [42, 78, 95].includes(i)
  return {
    time: parseFloat((i * 0.5).toFixed(1)),
    flux: parseFloat((isFlare ? base + 2.1 + Math.random() * 0.4 : base + noise).toFixed(4)),
    model: parseFloat((base).toFixed(4)),
    anomaly: isFlare,
  }
})

// ── FRB dispersion sweep ──────────────────────────────────────────────────
export const FRB_BURST_DATA = Array.from({ length: 60 }, (_, i) => ({
  time:      parseFloat((-1.5 + i * 0.05).toFixed(2)),
  intensity: parseFloat((Math.max(0, 8 * Math.exp(-((i - 30) ** 2) / 40) + (Math.random() - 0.5) * 0.8)).toFixed(3)),
  baseline:  0,
}))

// ── X-ray flux spectrum ───────────────────────────────────────────────────
export const XRAY_DATA = Array.from({ length: 60 }, (_, i) => ({
  energy: parseFloat((0.2 + i * 0.16).toFixed(2)),
  flux:   parseFloat((Math.max(0, 12 * Math.exp(-i * 0.07) * (1 + (Math.random() - 0.5) * 0.25))).toFixed(3)),
}))

// ── Spectral emission lines ───────────────────────────────────────────────
export const SPECTRAL_DATA = Array.from({ length: 100 }, (_, i) => {
  const wl = 380 + i * 7.5
  const peaks = [486.1, 589.3, 656.3]
  const peakContrib = peaks.reduce((s, p) => s + 3 * Math.exp(-((wl - p) ** 2) / 30), 0)
  return {
    wavelength: parseFloat(wl.toFixed(1)),
    intensity:  parseFloat((0.15 + Math.random() * 0.08 + peakContrib).toFixed(3)),
  }
})

// ── AI models ─────────────────────────────────────────────────────────────
export const AI_MODELS = [
  { id: 'frb-net',    name: 'FRB Detection Network',     type: 'CNN',              accuracy: 97.3, precision: 96.1, recall: 98.4, status: 'running',  inferences: 14203 },
  { id: 'lc-ae',     name: 'Light Curve Autoencoder',   type: 'Autoencoder',      accuracy: 94.7, precision: 93.2, recall: 95.8, status: 'running',  inferences: 8871  },
  { id: 'few-shot',  name: 'Few-Shot Classifier',        type: 'Meta-Learning',    accuracy: 88.2, precision: 87.4, recall: 89.1, status: 'running',  inferences: 3241  },
  { id: 'transient', name: 'Transient Classifier',       type: 'Transformer',      accuracy: 92.5, precision: 91.8, recall: 93.2, status: 'running',  inferences: 6102  },
  { id: 'noise-flt', name: 'Noise Filtering Engine',    type: 'Signal Processing', accuracy: 99.1, precision: 99.0, recall: 99.2, status: 'running',  inferences: 89032 },
  { id: 'iso-forest',name: 'Anomaly Isolation Forest',  type: 'Ensemble',          accuracy: 91.4, precision: 90.2, recall: 92.7, status: 'idle',     inferences: 22417 },
]

// ── Alert records ─────────────────────────────────────────────────────────
export const ALERT_RECORDS = [
  { id: 'ALT-0041', level: 'CRITICAL', type: 'FRB',           title: 'Repeating FRB Detected — FRB20240402E',           time: '2 min ago',  scope: 'PARKES', confidence: 0.99, action: 'immediate_followup' },
  { id: 'ALT-0040', level: 'HIGH',     type: 'Transient',      title: 'Optical Transient — AT2024abc',                   time: '18 min ago', scope: 'HUBBLE', confidence: 0.91, action: 'schedule_toa'       },
  { id: 'ALT-0039', level: 'HIGH',     type: 'Anomaly',        title: 'Anomalous Light Curve in AT Microscopii',         time: '47 min ago', scope: 'HUBBLE', confidence: 0.87, action: 'expert_review'      },
  { id: 'ALT-0038', level: 'MODERATE', type: 'X-Ray',          title: 'X-ray Flux Enhancement — IGR J17480-2446',        time: '1.2 hr ago', scope: 'CHANDRA',confidence: 0.74, action: 'catalog_match'      },
  { id: 'ALT-0037', level: 'MODERATE', type: 'Spectral',       title: 'Emission Line Anomaly — Hα/Hβ Ratio Deviation',  time: '2.8 hr ago', scope: 'VLT',    confidence: 0.71, action: 'spectral_analysis'  },
  { id: 'ALT-0036', level: 'LOW',      type: 'Noise',          title: 'RFI Spike Detected in L-band — FAST',            time: '4.1 hr ago', scope: 'FAST',   confidence: 0.62, action: 'rfi_flagging'       },
  { id: 'ALT-0035', level: 'LOW',      type: 'Calibration',    title: 'Flux Calibration Drift — CHIME West Arm',        time: '6.0 hr ago', scope: 'CHIME',  confidence: 0.55, action: 'recalibrate'        },
]

// ── Event repository ──────────────────────────────────────────────────────
export const EVENT_RECORDS = [
  { id: 'EVT-2024-001', type: 'FRB',       name: 'FRB20240101A', ra: '05h31m', dec: '+33°08′', date: '2024-01-01', telescope: 'CHIME',   priority: 'HIGH',  reviewed: true  },
  { id: 'EVT-2024-002', type: 'Transient', name: 'AT2024abc',    ra: '14h52m', dec: '-21°14′', date: '2024-01-08', telescope: 'HUBBLE',  priority: 'HIGH',  reviewed: false },
  { id: 'EVT-2024-003', type: 'FRB',       name: 'FRB20240112B', ra: '12h18m', dec: '-07°22′', date: '2024-01-12', telescope: 'FAST',    priority: 'MED',   reviewed: true  },
  { id: 'EVT-2024-004', type: 'X-Ray',     name: 'XRT-J0503+67', ra: '05h03m', dec: '+67°41′', date: '2024-01-17', telescope: 'CHANDRA', priority: 'MED',   reviewed: true  },
  { id: 'EVT-2024-005', type: 'FRB',       name: 'FRB20240119C', ra: '23h44m', dec: '+60°50′', date: '2024-01-19', telescope: 'PARKES',  priority: 'HIGH',  reviewed: true  },
  { id: 'EVT-2024-006', type: 'Spectral',  name: 'SPT-J0438-53', ra: '04h38m', dec: '-53°05′', date: '2024-01-25', telescope: 'VLT',     priority: 'LOW',   reviewed: false },
  { id: 'EVT-2024-007', type: 'FRB',       name: 'FRB20240203A', ra: '09h02m', dec: '-14°36′', date: '2024-02-03', telescope: 'FAST',    priority: 'MED',   reviewed: false },
  { id: 'EVT-2024-008', type: 'Transient', name: 'AT2024xyz',    ra: '21h09m', dec: '+12°33′', date: '2024-02-11', telescope: 'HUBBLE',  priority: 'HIGH',  reviewed: false },
  { id: 'EVT-2024-009', type: 'FRB',       name: 'FRB20240218B', ra: '17h55m', dec: '+28°11′', date: '2024-02-18', telescope: 'CHIME',   priority: 'HIGH',  reviewed: true  },
  { id: 'EVT-2024-010', type: 'X-Ray',     name: 'XRT-J1748-24', ra: '17h48m', dec: '-24°46′', date: '2024-02-26', telescope: 'CHANDRA', priority: 'MED',   reviewed: true  },
]

// ── XAI feature importance ────────────────────────────────────────────────
export const XAI_FEATURES = [
  { feature: 'Dispersion Measure',      importance: 0.312, direction: 'positive' },
  { feature: 'Fluence',                 importance: 0.248, direction: 'positive' },
  { feature: 'Pulse Duration',          importance: 0.189, direction: 'positive' },
  { feature: 'Spectral Index',          importance: 0.121, direction: 'negative' },
  { feature: 'Scattering Timescale',    importance: 0.089, direction: 'positive' },
  { feature: 'Signal-to-Noise Ratio',   importance: 0.076, direction: 'positive' },
  { feature: 'Bandwidth',              importance: 0.054, direction: 'negative' },
  { feature: 'Peak Frequency',         importance: 0.031, direction: 'negative' },
]

// ── Real-time event feed (for dashboard ticker) ───────────────────────────
export const LIVE_FEED = [
  { time: '21:04:32', type: 'FRB',      msg: 'FRB candidate detected — DM=557.4 pc/cm³',   severity: 'high'   },
  { time: '21:02:11', type: 'AI',       msg: 'Isolation Forest flagged 3 anomalies in LC',  severity: 'medium' },
  { time: '20:58:47', type: 'Scope',    msg: 'FAST Telescope acquired new target field',     severity: 'info'   },
  { time: '20:55:19', type: 'Alert',    msg: 'CRITICAL alert ALT-0041 dispatched',           severity: 'high'   },
  { time: '20:51:03', type: 'Catalog',  msg: 'SIMBAD match: SN 2024ab at z=0.042',          severity: 'medium' },
  { time: '20:47:38', type: 'AI',       msg: 'Transient Classifier: 94.1% confidence',      severity: 'info'   },
  { time: '20:43:22', type: 'Scope',    msg: 'Chandra X-ray: new source IGR J17480-2446',   severity: 'medium' },
]

// ── Dashboard event timeline ──────────────────────────────────────────────
export const TIMELINE_DATA = [
  { hour: '00:00', frb: 2, transient: 1, xray: 0, anomaly: 1 },
  { hour: '02:00', frb: 0, transient: 0, xray: 1, anomaly: 0 },
  { hour: '04:00', frb: 1, transient: 2, xray: 0, anomaly: 2 },
  { hour: '06:00', frb: 3, transient: 1, xray: 2, anomaly: 1 },
  { hour: '08:00', frb: 1, transient: 0, xray: 1, anomaly: 0 },
  { hour: '10:00', frb: 4, transient: 3, xray: 1, anomaly: 3 },
  { hour: '12:00', frb: 2, transient: 1, xray: 0, anomaly: 1 },
  { hour: '14:00', frb: 1, transient: 2, xray: 3, anomaly: 0 },
  { hour: '16:00', frb: 5, transient: 1, xray: 1, anomaly: 2 },
  { hour: '18:00', frb: 3, transient: 0, xray: 0, anomaly: 1 },
  { hour: '20:00', frb: 2, transient: 4, xray: 2, anomaly: 3 },
  { hour: '21:04', frb: 1, transient: 1, xray: 1, anomaly: 1 },
]
