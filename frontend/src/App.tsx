import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { DiscoveryProvider } from './context/DiscoveryContext'
import { NotificationProvider } from './context/NotificationContext'

import AppRouter from './router/AppRouter'
import { Toaster } from 'react-hot-toast'
import { useLenis } from './hooks/useLenis'

function App() {
  // Initialise Lenis smooth scroll for the entire app
  useLenis()

  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <DiscoveryProvider>
            <div className="AppRoot relative isolate flex min-h-screen w-full flex-col overflow-x-hidden bg-white">
              <Toaster position="top-right" />
              <AppRouter />
            </div>
          </DiscoveryProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
