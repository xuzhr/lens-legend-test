import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

import { cloudflare } from "@cloudflare/vite-plugin"

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		vueDevTools(),
		cloudflare()
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url))
		},
	},

// 🟢 重点是这里！新增 server 配置
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8788', // 转发给 Wrangler
        changeOrigin: true,
      }
    }
  }
})

