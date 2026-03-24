export interface ToolMeta {
  key: string
  path: string
  nameKey: string
  descKey: string
  icon: string
  category: string
  categoryKey: string
}

export const TOOL_LIST: ToolMeta[] = [
  {
    key: 'jsonFormat',
    path: '/json/format',
    nameKey: 'tool.jsonFormat.name',
    descKey: 'tool.jsonFormat.desc',
    icon: 'Memo',
    category: 'json',
    categoryKey: 'nav.json',
  },
  {
    key: 'jsonEscape',
    path: '/json/escape',
    nameKey: 'tool.jsonEscape.name',
    descKey: 'tool.jsonEscape.desc',
    icon: 'EditPen',
    category: 'json',
    categoryKey: 'nav.json',
  },
  {
    key: 'jsonEntity',
    path: '/json/entity',
    nameKey: 'tool.jsonEntity.name',
    descKey: 'tool.jsonEntity.desc',
    icon: 'Files',
    category: 'json',
    categoryKey: 'nav.json',
  },
  {
    key: 'dateTimestamp',
    path: '/date/timestamp',
    nameKey: 'tool.dateTimestamp.name',
    descKey: 'tool.dateTimestamp.desc',
    icon: 'Timer',
    category: 'date',
    categoryKey: 'nav.date',
  },
  {
    key: 'dateCron',
    path: '/date/cron',
    nameKey: 'tool.dateCron.name',
    descKey: 'tool.dateCron.desc',
    icon: 'Calendar',
    category: 'date',
    categoryKey: 'nav.date',
  },
  {
    key: 'formatHtml',
    path: '/format/html',
    nameKey: 'tool.formatHtml.name',
    descKey: 'tool.formatHtml.desc',
    icon: 'Document',
    category: 'format',
    categoryKey: 'nav.format',
  },
  {
    key: 'formatJs',
    path: '/format/javascript',
    nameKey: 'tool.formatJs.name',
    descKey: 'tool.formatJs.desc',
    icon: 'Cpu',
    category: 'format',
    categoryKey: 'nav.format',
  },
  {
    key: 'formatCss',
    path: '/format/css',
    nameKey: 'tool.formatCss.name',
    descKey: 'tool.formatCss.desc',
    icon: 'MagicStick',
    category: 'format',
    categoryKey: 'nav.format',
  },
  {
    key: 'formatSql',
    path: '/format/sql',
    nameKey: 'tool.formatSql.name',
    descKey: 'tool.formatSql.desc',
    icon: 'DataLine',
    category: 'format',
    categoryKey: 'nav.format',
  },
]

import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'

export const useToolsStore = defineStore('tools', () => {
  const recentlyUsed = useLocalStorage<string[]>('ak-tools-recently-used', [])

  function recordUsage(toolKey: string) {
    const list = recentlyUsed.value.filter((k) => k !== toolKey)
    list.unshift(toolKey)
    recentlyUsed.value = list.slice(0, 4)
  }

  const recentTools = computed(
    () =>
      recentlyUsed.value
        .map((key) => TOOL_LIST.find((t) => t.key === key))
        .filter(Boolean) as ToolMeta[],
  )

  return { recentlyUsed, recentTools, recordUsage }
})
