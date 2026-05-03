import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ObservatoryProvider } from './hooks/useObservatory.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ObservatoryProvider>
      <App />
    </ObservatoryProvider>
  </React.StrictMode>,
)
