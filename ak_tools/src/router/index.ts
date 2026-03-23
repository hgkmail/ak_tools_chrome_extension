import { createRouter, createMemoryHistory } from 'vue-router'
import AdminLayout from '@/layouts/AdminLayout.vue'
import HomePage from '@/views/HomePage.vue'
import ToolPlaceholder from '@/views/ToolPlaceholder.vue'
import JsonFormatTool from '@/views/json/JsonFormatTool.vue'
import JsonEscapeTool from '@/views/json/JsonEscapeTool.vue'
import JsonToEntityTool from '@/views/json/JsonToEntityTool.vue'
import UnixTimestampTool from '@/views/date/UnixTimestampTool.vue'

const router = createRouter({
  history: createMemoryHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AdminLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: HomePage,
          meta: { title: '首页', breadcrumb: null },
        },
        // JSON
        {
          path: 'json/format',
          name: 'jsonFormat',
          component: JsonFormatTool,
          meta: {
            title: 'JSON 格式化',
            toolKey: 'jsonFormat',
            breadcrumb: 'JSON 格式化',
            parentBreadcrumbs: [{ title: 'JSON', path: null }],
          },
        },
        {
          path: 'json/escape',
          name: 'jsonEscape',
          component: JsonEscapeTool,
          meta: {
            title: 'JSON 转义',
            toolKey: 'jsonEscape',
            breadcrumb: 'JSON 转义',
            parentBreadcrumbs: [{ title: 'JSON', path: null }],
          },
        },
        {
          path: 'json/entity',
          name: 'jsonEntity',
          component: JsonToEntityTool,
          meta: {
            title: 'JSON 生成实体类',
            toolKey: 'jsonEntity',
            breadcrumb: 'JSON 生成实体类',
            parentBreadcrumbs: [{ title: 'JSON', path: null }],
          },
        },
        // Date
        {
          path: 'date/timestamp',
          name: 'dateTimestamp',
          component: UnixTimestampTool,
          meta: {
            title: 'Unix 时间戳',
            toolKey: 'dateTimestamp',
            breadcrumb: 'Unix 时间戳',
            parentBreadcrumbs: [{ title: '日期', path: null }],
          },
        },
        {
          path: 'date/cron',
          name: 'dateCron',
          component: ToolPlaceholder,
          meta: {
            title: 'Cron 表达式',
            toolKey: 'dateCron',
            breadcrumb: 'Cron 表达式',
            parentBreadcrumbs: [{ title: '日期', path: null }],
          },
        },
        // Format
        {
          path: 'format/html',
          name: 'formatHtml',
          component: ToolPlaceholder,
          meta: {
            title: 'HTML 格式化',
            toolKey: 'formatHtml',
            breadcrumb: 'HTML 格式化',
            parentBreadcrumbs: [{ title: '格式化', path: null }],
          },
        },
        {
          path: 'format/javascript',
          name: 'formatJs',
          component: ToolPlaceholder,
          meta: {
            title: 'JavaScript 格式化',
            toolKey: 'formatJs',
            breadcrumb: 'JavaScript 格式化',
            parentBreadcrumbs: [{ title: '格式化', path: null }],
          },
        },
        {
          path: 'format/css',
          name: 'formatCss',
          component: ToolPlaceholder,
          meta: {
            title: 'CSS 格式化',
            toolKey: 'formatCss',
            breadcrumb: 'CSS 格式化',
            parentBreadcrumbs: [{ title: '格式化', path: null }],
          },
        },
        {
          path: 'format/sql',
          name: 'formatSql',
          component: ToolPlaceholder,
          meta: {
            title: 'SQL 格式化',
            toolKey: 'formatSql',
            breadcrumb: 'SQL 格式化',
            parentBreadcrumbs: [{ title: '格式化', path: null }],
          },
        },
      ],
    },
  ],
})

export default router
