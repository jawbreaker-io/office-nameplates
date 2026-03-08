/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      'three': path.resolve(__dirname, 'node_modules/three'),
      'three-mesh-bvh': path.resolve(__dirname, 'node_modules/three-mesh-bvh/src/index.js'),
      'three-bvh-csg': path.resolve(__dirname, 'node_modules/three-bvh-csg/src/index.js'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    globals: true,
    server: {
      deps: {
        inline: ['three', 'three-mesh-bvh', 'three-bvh-csg'],
      },
    },
  },
})
