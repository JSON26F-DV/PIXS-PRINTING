import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { LazyMotion, domAnimation } from 'framer-motion'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import AppRouter from './router/AppRouter'
import { Toaster } from 'react-hot-toast'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <NotificationProvider>
            <LazyMotion features={domAnimation}>
              <div className="AppRoot relative isolate flex min-h-screen w-full flex-col bg-white">
                <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} />
                <AppRouter />
              </div>
            </LazyMotion>
          </NotificationProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  )
}

export default App

