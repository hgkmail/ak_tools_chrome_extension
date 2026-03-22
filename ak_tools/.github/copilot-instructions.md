# AK Tools — Chrome 扩展开发指引

基于 **Vue 3 + Vite + TypeScript + Element Plus** 的 Chrome 扩展，核心是**开发者小工具集**（JSON 格式化、日期转换、代码格式化等）。

## 构建 & 测试命令

```bash
npm run dev          # 开发服务器
npm run build        # 类型检查 + 构建（生产）
npm run type-check   # 仅 vue-tsc 类型检查
npm run test:unit    # Vitest 单元测试（jsdom 环境）
npm run test:e2e     # Playwright E2E 测试
npm run lint         # oxlint --fix，再 eslint --fix
npm run format       # Prettier 格式化 src/
```

## 架构说明

```
src/
├── views/          # 页面 —— 每个工具一个 .vue 文件，按类别分子目录
│   └── json/       # 例：JsonFormatTool.vue
├── components/     # 共享组件（AppHeader、AppSidebar、SettingsDrawer 等）
├── layouts/        # AdminLayout.vue —— 全局框架（Header + Sidebar + ScrollArea）
├── stores/         # Pinia stores（settings.ts、tools.ts）
├── router/         # router/index.ts —— 所有路由集中定义
├── hooks/          # 可复用组合式函数（useXxx.ts）
├── i18n/           # i18n 初始化
├── locales/        # zh-CN.ts、en-US.ts
└── assets/         # 静态资源、variables.scss（全局 SCSS 变量，无需手动 @import）
```

## 添加新工具（必须同时修改 5 处）

**无任何自动发现机制**——每项都要手动维护：

1. **`stores/tools.ts`** — 在 `TOOL_LIST` 末尾追加工具元数据：

   ```ts
   { key: 'jsonDiff', path: '/json/diff', nameKey: 'tool.jsonDiff.name',
     descKey: 'tool.jsonDiff.desc', icon: 'DocumentCopy',
     category: 'json', categoryKey: 'nav.json' }
   ```

2. **`router/index.ts`** — 在 `AdminLayout` 的 `children` 追加路由，`meta` 必须包含：

   ```ts
   meta: { title: '...', toolKey: 'jsonDiff',
           breadcrumb: '...', parentBreadcrumbs: [{ title: '...', path: null }] }
   ```

3. **`components/AppSidebar.vue`** — 在对应分组的 `children` 数组中追加菜单项。

4. **`locales/zh-CN.ts` + `en-US.ts`** — 同步新增 `nav.jsonDiff` 和 `tool.jsonDiff.{name, desc}`。

5. **`views/json/JsonDiffTool.vue`** — 创建工具视图，必须在 `onMounted` 中调用：
   ```ts
   toolsStore.recordUsage(route.meta.toolKey as string)
   ```

## 代码规范

### 组件写法

所有 `.vue` 文件统一使用 `<script setup lang="ts">`，禁止 Options API。

### 自动导入（无需手动 import）

- Vue 核心 API：`ref`、`computed`、`watch`、`onMounted` 等
- Vue Router：`useRouter`、`useRoute`
- Pinia：`defineStore`、`storeToRefs`
- Element Plus 组件（`unplugin-vue-components` 自动注册）

### 路径别名

始终使用 `@/` 访问 `src/` 下的模块。

### 样式约定

- 优先使用 **UnoCSS 原子类**处理工具性样式
- 组件私有样式写在 `<style scoped>` 块内
- `@/assets/variables.scss` 通过 Vite 全局注入，无需手动 import

### 国际化

- 所有用户可见文案必须走 i18n，不得硬编码中文或英文字符串
- 翻译 key 嵌套结构，工具文案格式：`tool.{toolKey}.name` / `tool.{toolKey}.desc`
- `zh-CN.ts` 与 `en-US.ts` 必须同步维护

## Chrome 扩展注意事项

- `vite.config.ts` 中 `base: './'` **不得修改**（Chrome 扩展以本地文件协议加载资源）
- 路由使用 `createMemoryHistory`（非 `createWebHistory`）——扩展没有 URL 地址栏
- 暂无 `manifest.json`；如需多入口（popup/options/content script/background），在 `vite.config.ts` 的 `build.rollupOptions.input` 中配置
- Content Script 与页面 DOM 交互，不可使用 `chrome.storage` 以外的跨域 API

## Lint & 格式化

- **两套 Linter 串行执行**：`oxlint`（Rust，快）先跑，再 `eslint`（含 Vue/TS 规则）
- Prettier 仅负责格式化，不做语义检查（`skipFormatting` 已在 ESLint 中配置）
- 提交前运行 `npm run lint && npm run format` 保证代码风格一致
