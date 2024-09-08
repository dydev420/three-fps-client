import { defineConfig } from 'vite';
import type { UserConfig } from 'vite';
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait()
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        nested: resolve(__dirname, 'server/index.html'),
      },
    },
  },
} satisfies UserConfig);
