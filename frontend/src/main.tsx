import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import axios from 'axios'
import './bones/registry'

// ── Global Axios Config (Laravel API) ─────────────────────────────────────────
// No baseURL — use relative paths so all requests pass through the Vite proxy
// to Laravel at http://localhost:8000, keeping same-origin for session cookies.
axios.defaults.withCredentials = true // Required for session cookie auth
axios.defaults.headers.common['Accept'] = 'application/json'
axios.defaults.headers.common['Content-Type'] = 'application/json'

import { GoogleOAuthProvider } from '@react-oauth/google'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Failed to find the root element')

createRoot(rootElement).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
