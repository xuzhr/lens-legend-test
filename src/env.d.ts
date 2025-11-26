/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // 告诉 TS：.vue 文件导出的就是一个 Vue 组件
  const component: DefineComponent<{}, {}, any>
  export default component
}