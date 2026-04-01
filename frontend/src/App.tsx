import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DiscoveryProvider } from './context/DiscoveryContext';
// import { NotificationProvider } from './context/NotificationContext';

import AppRouter from './router/AppRouter';
import CustomerNavbar from './components/customer/CustomerNavbar';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <AuthProvider>
        {/* <NotificationProvider> */}
          <DiscoveryProvider>
            <div className="min-h-screen bg-white">
              <CustomerNavbar />
              <Toaster position="top-right" />
              <main>
                <AppRouter />
              </main>
            </div>
          </DiscoveryProvider>
        {/* </NotificationProvider> */}

      </AuthProvider>
    </Router>
  )
}

export default App
