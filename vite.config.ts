import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Proxy configuration to hide backend URLs in development
    proxy: {
      '/api': {
        target: process.env.VITE_API_ENDPOINT,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
        ws: false
      },
      '/ws': {
        target: process.env.VITE_WEBSOCKET_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ws/, ''),
        secure: false,
        ws: true  // Enable WebSocket proxying
      },
      '/upload-proxy': {
        target: process.env.VITE_WORKER_UPLOAD_URL,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/upload-proxy/, ''),
        secure: false
      }
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize chunk splitting for better caching and parallel loading
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - separate large dependencies
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/functions'],
          'ui-vendor': ['framer-motion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
          'query': ['@tanstack/react-query'],
          // Heavy editor dependencies - only loaded when needed
          'editor': ['fabric'],
          'video': ['video.js'],
          'charts': ['recharts'],
        },
      },
    },
    // Increase chunk size warning limit (default is 500kb)
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging (optional, increases build size)
    sourcemap: false,
  },
}));
