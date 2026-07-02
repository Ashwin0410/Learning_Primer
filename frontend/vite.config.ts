import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The backend runs on :8000. We proxy /api to it in dev so the frontend is
// same-origin (no CORS needed) and SSE streaming works transparently.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
});
