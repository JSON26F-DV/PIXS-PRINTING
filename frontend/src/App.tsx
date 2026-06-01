import { useEffect } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'

import AppRouter from './router/AppRouter'
import { Toaster } from 'react-hot-toast'
import Lenis from '@studio-freight/lenis'

function App() {
  useEffect(() => {
    const lenis = new Lenis()

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <div className="AppRoot relative isolate flex min-h-screen w-full flex-col bg-white">
            <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} />
            <AppRouter />
          </div>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
