import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 引入自动引入HOOK
import AutoImport from "unplugin-auto-import/vite";

// 引入自动生成路由
import Pages from "vite-plugin-pages";
import path from 'path'
import { fileURLToPath } from 'url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    AutoImport({
      // 自动导入相关API
      imports: ["react", "react-router-dom"],
      // 生成全局自动引入配置文件
      dts: "./src/auto-imports.d.ts",
    }),
    Pages({
        dirs: "src/views", // 需要生成路由的组件目录
        exclude: ["**/components/*.tsx"], // 排除在外的目录，即所有 components 目录下的 .tsx 文件都不会生成路由
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(fileURLToPath(new URL('.', import.meta.url)), 'src'),
    },
  },
  // 配置服务器以自动打开浏览器
  server: {
    open: true,
  },
})
