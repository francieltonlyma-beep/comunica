import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const buildId = globalThis.process?.env?.GITHUB_SHA?.slice(0, 12) || new Date().toISOString().replace(/\D/g, '').slice(0, 14)

const versionManifest = () => ({
  name: 'comunica-version-manifest',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: JSON.stringify({ buildId, builtAt: new Date().toISOString() }),
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  define: { 'import.meta.env.VITE_COMUNICA_BUILD_ID': JSON.stringify(buildId) },
  plugins: [react(), versionManifest()],
})
