import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env so VITE_BACKEND_URL is available at config time
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:8000'

  // Shared proxy options — all API paths forward to Laravel
  const proxyTarget = {
    target: backendUrl,
    changeOrigin: true,
    secure: false,
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/login':    proxyTarget,
        '/logout':   proxyTarget,
        '/register': proxyTarget,
        '/user':     proxyTarget,
        '/api':      proxyTarget,
        '/sanctum':  proxyTarget,
      },
    },
  }
})
