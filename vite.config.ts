import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  server: {
    port: 8843,
    host: '0.0.0.0', // Listen on all interfaces for remote access
    cors: true,
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 100000,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});