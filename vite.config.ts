import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React and ALL React-based libraries together to avoid dependency issues
          if (id.includes('react') || 
              id.includes('react-dom') ||
              id.includes('react-router') ||
              id.includes('@radix-ui') ||
              id.includes('@tanstack/react-query') ||
              id.includes('react-hook-form') ||
              id.includes('@hookform') ||
              id.includes('react-helmet-async') ||
              id.includes('next-themes') ||
              id.includes('sonner') ||
              id.includes('vaul') ||
              id.includes('embla-carousel-react') ||
              id.includes('input-otp') ||
              id.includes('react-day-picker') ||
              id.includes('react-resizable-panels') ||
              id.includes('recharts') ||
              id.includes('cmdk')) {
            return 'vendor-react';
          }
          // UI and utility libraries
          if (id.includes('lucide-react') ||
              id.includes('date-fns') || 
              id.includes('clsx') || 
              id.includes('class-variance-authority') ||
              id.includes('zod') ||
              id.includes('axios')) {
            return 'vendor-utils';
          }
          // Other vendor code
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        },
      },
    },
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : [],
      },
      mangle: {
        safari10: true,
      },
    },
    target: 'es2020',
    chunkSizeWarningLimit: 600,
  },
}));
