import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: [
        { find: '@', replacement: path.resolve(__dirname, '.') },
        { find: /^pdfjs-dist$/, replacement: path.resolve(__dirname, 'node_modules/pdfjs-dist/legacy/build/pdf.mjs') },
        { find: /^pdfjs-dist\/build\/pdf\.worker\.min\.mjs$/, replacement: path.resolve(__dirname, 'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs') },
        { find: /^pdfjs-dist\/legacy\/build\/pdf\.worker\.min\.mjs$/, replacement: path.resolve(__dirname, 'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs') },
      ],
    },
    esbuild: {
      target: 'chrome80',
    },
    build: {
      target: ['es2020', 'chrome80', 'edge88', 'firefox78', 'safari14'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
