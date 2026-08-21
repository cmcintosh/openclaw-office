import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  server: {
    port: 8843,
    host: '0.0.0.0',
    cors: true,
    allowedHosts: ['ai.wembassy.com', 'localhost', '127.0.0.1', '192.168.1.136'],
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