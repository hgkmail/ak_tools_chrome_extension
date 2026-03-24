<script setup lang="ts">
import { Codemirror } from 'vue-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { useI18n } from 'vue-i18n'
import { useToolsStore } from '@/stores/tools'
import { useSettingsStore } from '@/stores/settings'
import { useClipboard } from '@/hooks/useClipboard'

// js-beautify is loaded via CDN script tag in index.html
type JsBeautifyOptions = {
  indent_with_tabs?: boolean
  indent_size?: number
}

declare const js_beautify: (source: string, options?: JsBeautifyOptions) => string

const { t } = useI18n()
const route = useRoute()
const toolsStore = useToolsStore()
const settingsStore = useSettingsStore()
const { copyText } = useClipboard()

interface IndentOption {
  label: string
  value: JsBeautifyOptions
}

const indentOptions = computed<IndentOption[]>(() => [
  { label: t('tool.formatJs.indentTab'), value: { indent_with_tabs: true } },
  { label: t('tool.formatJs.indent2'), value: { indent_size: 2, indent_with_tabs: false } },
  { label: t('tool.formatJs.indent4'), value: { indent_size: 4, indent_with_tabs: false } },
  { label: t('tool.formatJs.indent6'), value: { indent_size: 6, indent_with_tabs: false } },
  { label: t('tool.formatJs.indent8'), value: { indent_size: 8, indent_with_tabs: false } },
])

const selectedIndentIndex = ref(0)
const currentIndentOption = computed<JsBeautifyOptions>(
  () => indentOptions.value[selectedIndentIndex.value]?.value ?? indentOptions.value[0]!.value,
)

const SAMPLE_JS = `function greet(name){return "Hello, "+name+"!";}console.log(greet("World"));`

const code = ref(SAMPLE_JS)

const extensions = computed(() => [javascript(), ...(settingsStore.isDark ? [oneDark] : [])])

function format() {
  code.value = js_beautify(code.value, currentIndentOption.value)
}

function compress() {
  code.value = code.value
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}();,=+\-*/<>!&|?:[\]])\s*/g, '$1')
    .trim()
}

function loadExample() {
  code.value = SAMPLE_JS
}

function openLocalFile() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.js,.ts,.mjs,.cjs,.txt'
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
  const blob = new Blob([code.value], { type: 'text/javascript;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'formatted.js'
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
  <div class="js-format-tool">
    <div class="toolbar">
      <el-select v-model="selectedIndentIndex" size="small" style="width: 130px">
        <el-option v-for="(opt, idx) in indentOptions" :key="idx" :label="opt.label" :value="idx" />
      </el-select>

      <el-dropdown trigger="click">
        <el-button size="small" plain>
          {{ t('tool.formatJs.btnSelect') }}
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="loadExample">{{ t('tool.formatJs.menuExample') }}</el-dropdown-item>
            <el-dropdown-item @click="openLocalFile">{{ t('tool.formatJs.menuLocalFile') }}</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-button size="small" plain type="primary" @click="format">
        {{ t('tool.formatJs.btnFormat') }}
      </el-button>
      <el-button size="small" plain @click="compress">
        {{ t('tool.formatJs.btnCompress') }}
      </el-button>
      <el-button size="small" plain type="success" @click="clickCopy">
        {{ t('common.btnCopy') }}
      </el-button>
      <el-button size="small" plain @click="download">
        {{ t('tool.formatJs.btnDownload') }}
      </el-button>
      <el-button size="small" plain type="danger" @click="clear">
        {{ t('tool.formatJs.btnClear') }}
      </el-button>
    </div>

    <div class="editor-wrapper">
      <Codemirror v-model="code" :extensions="extensions" style="height: 100%; width: 100%" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.js-format-tool {
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
