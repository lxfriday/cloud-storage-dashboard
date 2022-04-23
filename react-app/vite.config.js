import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import port from './port.dev'

const reactAppDist = path.resolve(__dirname, '../react-app-dist')

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [react({})],
    build: {
      cssCodeSplit: false,
      outDir: reactAppDist,
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(__dirname, 'src/main.jsx'),
        output: {
          entryFileNames: 'index.js',
          assetFileNames: 'index.[ext]',
        },
      },
    },
    css: {
      preprocessorOptions: {
        less: {
          charset: false,
          additionalData: '@import "./src/global.less";',
        },
      },
      modules: {
        generateScopedName: '[name]_[local]_[hash:base64:5]',
        hashPrefix: 'prefix',
      },
    },
    resolve: {
      // 配置路径别名
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: 'localhost',
      port: port,
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: port,
      },
    },
    define: {
      __DEV__: mode === 'development' ? 'true' : 'false',
    },
  }
})
