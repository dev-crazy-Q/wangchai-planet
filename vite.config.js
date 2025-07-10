import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 3000
  },
  build: {
    // 启用代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          // 将Three.js单独打包
          'three': ['three'],
          // 将Tween.js单独打包
          'tween': ['@tweenjs/tween.js'],
          // Vue相关单独打包
          'vue-vendor': ['vue']
        }
      }
    },
    // 启用压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除console
        drop_debugger: true
      }
    },
    // 设置chunk大小警告限制
    chunkSizeWarningLimit: 1000,
    // 启用CSS代码分割
    cssCodeSplit: true
  },
  // 开启预构建优化
  optimizeDeps: {
    include: ['three', '@tweenjs/tween.js', 'vue']
  }
}) 