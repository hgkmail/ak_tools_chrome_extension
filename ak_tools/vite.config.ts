import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import UnoCSS from 'unocss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    UnoCSS(),
    // 配置 AutoImport 插件（自动导入 Element Plus API）
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
      resolvers: [ElementPlusResolver()],
      dts: 'auto-imports.d.ts',
    }),
    // 自动按需引入 Element Plus 组件
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/assets/variables" as *;`,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: 'js/[name]-[hash].js', // 引入文件名的名称
        entryFileNames: 'js/[name]-[hash].js', // 包的入口文件名称
        assetFileNames: '[ext]/[name]-[hash].[ext]', // 资源文件像 字体，图片等
        manualChunks: {
          '@vueuse/core': ['@vueuse/core'],
          '@element-plus/icons-vue': ['@element-plus/icons-vue'],
          'vue-i18n': ['vue-i18n'],
          'fuse.js': ['fuse.js'],
          codemirror: [
            'codemirror',
            '@codemirror/language',
            '@codemirror/lang-javascript',
            '@codemirror/lang-css',
            '@codemirror/lang-html',
            '@codemirror/lang-yaml',
            '@codemirror/lang-java',
            '@codemirror/lang-json',
            '@codemirror/theme-one-dark',
            'vue-codemirror',
            'json-editor-vue',
          ],
          'highlight.js': ['highlight.js'],
          'cron-parser': ['cron-parser'],
          'sql-formatter': ['sql-formatter'],
          'js-yaml': ['js-yaml'],
        },
      },
    },
  },
})
