import { defineConfig } from 'vite';
import vitePluginString from 'vite-plugin-string'
import glsl from 'vite-plugin-glsl';
import path from "path";


export default defineConfig({
  base: '/3D-Solar-System/',
  build: {
    target: 'esnext',
  },
  resolve: {
    alias: {
      "@assets": path.resolve(__dirname, "./src/assets"),
      "@shaders": path.resolve(__dirname, "./src/shaders")
    }
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