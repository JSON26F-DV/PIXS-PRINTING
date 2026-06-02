import { BrowserRouter as Router } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'

import AppRouter from './router/AppRouter'
import { Toaster } from 'react-hot-toast'

function App() {
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
