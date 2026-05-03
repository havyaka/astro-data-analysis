// src/App.jsx — Root router with observatory layout
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import LandingPage         from './pages/LandingPage'
import Dashboard           from './pages/Dashboard'
import DataIngestion       from './pages/DataIngestion'
import SignalVisualization from './pages/SignalVisualization'
import AIDetectionEngine   from './pages/AIDetectionEngine'
import AlertSystem         from './pages/AlertSystem'
import EventRepository     from './pages/EventRepository'
import ExplainableAI       from './pages/ExplainableAI'
import AnomalyAnalysis     from './pages/AnomalyAnalysis'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing — standalone (no sidebar/topbar) */}
        <Route path="/" element={<LandingPage />} />

        {/* Observatory pages — wrapped in Layout (sidebar + topbar) */}
        <Route element={<Layout />}>
          <Route path="/dashboard"  element={<Dashboard />}           />
          <Route path="/ingestion"  element={<DataIngestion />}       />
          <Route path="/signals"    element={<SignalVisualization />}  />
          <Route path="/ai-engine"  element={<AIDetectionEngine />}   />
          <Route path="/alerts"     element={<AlertSystem />}         />
          <Route path="/repository" element={<EventRepository />}     />
          <Route path="/xai"        element={<ExplainableAI />}       />
          <Route path="/analysis"   element={<AnomalyAnalysis />}     />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
