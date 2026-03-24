<script setup lang="ts">
import { format as sqlFormat } from 'sql-formatter'
import { Codemirror } from 'vue-codemirror'
import { StreamLanguage } from '@codemirror/language'
import { sql as sqlMode } from '@codemirror/legacy-modes/mode/sql'
import { oneDark } from '@codemirror/theme-one-dark'
import { useI18n } from 'vue-i18n'
import { useToolsStore } from '@/stores/tools'
import { useSettingsStore } from '@/stores/settings'
import { useClipboard } from '@/hooks/useClipboard'

const { t } = useI18n()
const route = useRoute()
const toolsStore = useToolsStore()
const settingsStore = useSettingsStore()
const { copyText } = useClipboard()

type SqlLanguage = 'sql' | 'mysql' | 'postgresql' | 'sqlite' | 'tsql' | 'plsql' | 'mariadb'

interface LanguageOption {
  label: string
  value: SqlLanguage
}

interface IndentOption {
  label: string
  tabWidth: number
  useTabs: boolean
}

const languageOptions = computed<LanguageOption[]>(() => [
  { label: t('tool.formatSql.langSql'), value: 'sql' },
  { label: t('tool.formatSql.langMysql'), value: 'mysql' },
  { label: t('tool.formatSql.langPostgresql'), value: 'postgresql' },
  { label: t('tool.formatSql.langSqlite'), value: 'sqlite' },
  { label: t('tool.formatSql.langTsql'), value: 'tsql' },
  { label: t('tool.formatSql.langPlsql'), value: 'plsql' },
  { label: t('tool.formatSql.langMariadb'), value: 'mariadb' },
])

const indentOptions = computed<IndentOption[]>(() => [
  { label: t('tool.formatSql.indent2'), tabWidth: 2, useTabs: false },
  { label: t('tool.formatSql.indent4'), tabWidth: 4, useTabs: false },
  { label: t('tool.formatSql.indentTab'), tabWidth: 2, useTabs: true },
])

const selectedLanguage = ref<SqlLanguage>('sql')
const selectedIndentIndex = ref(0)
const currentIndent = computed<IndentOption>(() => indentOptions.value[selectedIndentIndex.value]!)

const SAMPLE_SQL = `SELECT u.id,u.name,u.email,o.id AS order_id,o.total FROM users u LEFT JOIN orders o ON u.id=o.user_id WHERE u.status='active' ORDER BY u.name ASC LIMIT 20;`

const code = ref(SAMPLE_SQL)

const extensions = computed(() => [
  StreamLanguage.define(sqlMode({})),
  ...(settingsStore.isDark ? [oneDark] : []),
])

function format() {
  try {
    code.value = sqlFormat(code.value, {
      language: selectedLanguage.value,
      tabWidth: currentIndent.value.tabWidth,
      useTabs: currentIndent.value.useTabs,
      keywordCase: 'upper',
    })
  } catch {
    ElNotification({
      title: t('tool.formatSql.errorTitle'),
      message: t('tool.formatSql.errorInvalidSql'),
      type: 'error',
      duration: 3000,
    })
  }
}

function compress() {
  code.value = code.value
    .replace(/--[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function loadExample() {
  code.value = SAMPLE_SQL
}

function openLocalFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.sql,.txt'
  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      code.value = (e.target?.result as string) ?? ''
    }
    reader.readAsText(file)
  }
  input.click()
}

function download() {
  const blob = new Blob([code.value], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'formatted.sql'
  a.click()
  URL.revokeObjectURL(url)
}

function clickCopy() {
  copyText(code.value)
  ElNotification({
    title: t('common.btnCopy'),
    message: t('common.copySuccess'),
    type: 'success',
    duration: 2000,
  })
}

function clear() {
  code.value = ''
}

onMounted(() => {
  const toolKey = route.meta?.toolKey as string | undefined
  if (toolKey) toolsStore.recordUsage(toolKey)
})
</script>

<template>
  <div class="sql-format-tool">
    <div class="toolbar">
      <el-select v-model="selectedLanguage" size="small" style="width: 130px">
        <el-option v-for="opt in languageOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>

      <el-select v-model="selectedIndentIndex" size="small" style="width: 120px">
        <el-option v-for="(opt, idx) in indentOptions" :key="idx" :label="opt.label" :value="idx" />
      </el-select>

      <el-dropdown trigger="click">
        <el-button size="small" plain>
          {{ t('tool.formatSql.btnSelect') }}
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="loadExample">{{ t('tool.formatSql.menuExample') }}</el-dropdown-item>
            <el-dropdown-item @click="openLocalFile">{{ t('tool.formatSql.menuLocalFile') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-button size="small" plain type="primary" @click="format">
        {{ t('tool.formatSql.btnFormat') }}
      </el-button>
      <el-button size="small" plain @click="compress">
        {{ t('tool.formatSql.btnCompress') }}
      </el-button>
      <el-button size="small" plain type="success" @click="clickCopy">
        {{ t('common.btnCopy') }}
      </el-button>
      <el-button size="small" plain @click="download">
        {{ t('tool.formatSql.btnDownload') }}
      </el-button>
      <el-button size="small" plain type="danger" @click="clear">
        {{ t('tool.formatSql.btnClear') }}
      </el-button>
    </div>

    <div class="editor-wrapper">
      <Codemirror v-model="code" :extensions="extensions" style="height: 100%; width: 100%" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.sql-format-tool {
  height: calc(100vh - #{$app-header-height} - #{$breadcrumb-bar-height});
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--el-border-color);
  flex-shrink: 0;
  flex-wrap: wrap;
  background: var(--el-bg-color);
}

.editor-wrapper {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background-color: var(--el-bg-color);

  :deep(.cm-editor) {
    height: 100%;
  }

  :deep(.cm-scroller) {
    overflow: auto;
  }
}
</style>
