import { defineConfig } from 'vite';
import type { UserConfig, PluginOption } from 'vite';
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { visualizer } from "rollup-plugin-visualizer";
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    visualizer() as PluginOption,
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        server: resolve(__dirname, 'server/index.html'),
      },
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
  },
} satisfies UserConfig);
