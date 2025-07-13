import { defineConfig } from 'vite'
import { viteStaticCopy } from 'vite-plugin-static-copy';
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    viteStaticCopy({
      targets: [
        {
          src: 'src/assets/icons/*.svg',
          dest: 'assets/icons'
        }
      ]
    })
  ],
  build: {
    assetsInclude: ['**/*.svg'], // Explicitly include SVGs
  }
})
