import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,ico}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/maps\.(googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'maps-tiles', expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 7 } }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/.*/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'storage-assets', expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 7 } }
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30 } }
          }
        ]
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          maps: ['@googlemaps/js-api-loader'],
          charts: ['recharts'],
          qrcode: ['qrcode', 'html5-qrcode']
        }
      }
    }
  }
});
