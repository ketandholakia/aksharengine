import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      include: ['src/engine/**', 'src/types/**'],
    }),
  ],
  build: {
    outDir: 'dist-lib', // Outputs to a different folder than the web app
    lib: {
      entry: path.resolve(__dirname, 'src/engine/index.ts'),
      name: 'AksharEngine',
      formats: ['es', 'cjs'],
      fileName: (format) => `akshar-engine.${format}.js`,
    },
    rollupOptions: {
      // Ensure we don't bundle any frontend dependencies by accident
      external: ['react', 'react-dom', 'lucide-react'],
    },
  },
});
