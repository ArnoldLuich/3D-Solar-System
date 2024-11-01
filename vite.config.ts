import { defineConfig } from 'vite';
import vitePluginString from 'vite-plugin-string'
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  build: {
    target: 'esnext',
  },
  plugins: [glsl()],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  }
});