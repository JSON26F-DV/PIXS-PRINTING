import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { DiscoveryProvider } from './context/DiscoveryContext';
import { NotificationProvider } from './context/NotificationContext';

import AppRouter from './router/AppRouter';
import { Toaster } from 'react-hot-toast';
import { useLenis } from './hooks/useLenis';

function App() {
  // Initialise Lenis smooth scroll for the entire app
  useLenis();

  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <DiscoveryProvider>
            <div className="min-h-screen bg-white pb-16 lg:pb-0 lg:pt-0">
              <Toaster position="top-right" />
              <main>
                <AppRouter />
              </main>
            </div>
          </DiscoveryProvider>
        </NotificationProvider>

      </AuthProvider>
    </Router>
  )
}

export default App

