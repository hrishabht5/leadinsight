import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#161622',
            color: '#eeeef5',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            fontFamily: 'Figtree, sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#00f5a0', secondary: '#000' } },
          error:   { iconTheme: { primary: '#f87171', secondary: '#000' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
