import react from '@vitejs/plugin-react'
import { copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'

const pagesFallback: Plugin = {
  name: 'github-pages-spa-fallback',
  closeBundle() {
    const indexPath = fileURLToPath(new URL('./dist/index.html', import.meta.url))
    copyFileSync(indexPath, fileURLToPath(new URL('./dist/404.html', import.meta.url)))
  },
}

export default defineConfig({
  base: '/mp2/',
  plugins: [react()],
  build: {
    rollupOptions: {
      plugins: [pagesFallback],
    },
  },
})
