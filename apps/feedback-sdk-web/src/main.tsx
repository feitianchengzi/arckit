import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { installFeedbackSDKBridge } from '@/lib/sdk'
import { resolveRouterBase } from '@/lib/sdk/router'
import App from './App'
import './globals.css'

installFeedbackSDKBridge()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={resolveRouterBase()}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
