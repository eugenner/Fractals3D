import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import basicSsl from '@vitejs/plugin-basic-ssl' // plugins: [basicSsl(), vue({
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [basicSsl(), vue({
    template: {
      compilerOptions: {
        isCustomElement: (tag) => {
          return tag.startsWith('a-') // (return true)
        }
      }
    }
  })],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    base: '/f3d/',
  }
})
