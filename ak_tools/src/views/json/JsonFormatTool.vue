<script setup lang="ts">
import { Codemirror } from 'vue-codemirror'
import { json } from '@codemirror/lang-json'
import { oneDark } from '@codemirror/theme-one-dark'
import JsonEditorVue from 'json-editor-vue'
import 'vanilla-jsoneditor/themes/jse-theme-dark.css'
import { useI18n } from 'vue-i18n'
import { useToolsStore } from '@/stores/tools'
import { useSettingsStore } from '@/stores/settings'

const { t } = useI18n()
const route = useRoute()
const toolsStore = useToolsStore()
const settingsStore = useSettingsStore()

const SAMPLE_JSON = {
  name: 'AK Tools',
  version: '1.0.0',
  features: ['JSON Formatter', 'Timestamp', 'Cron'],
  nested: { enabled: true, count: 42 },
}

const editorText = ref(JSON.stringify(SAMPLE_JSON, null, 2))
const jsonValue = ref<unknown>(JSON.parse(JSON.stringify(SAMPLE_JSON)))
const jsonError = ref('')
const indentSize = ref(2)
const leftWidth = ref(50)
// Prevents two-way watch from forming an update loop:
// 'editor' = editor just triggered a tree update, skip tree→editor sync
// 'tree'   = tree just triggered an editor update, skip editor→tree sync
const syncLock = ref<'editor' | 'tree' | null>(null)

const containerRef = ref<HTMLDivElement | null>(null)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const jsonEditorRef = useTemplateRef<any>('jsonEditorRef')

const extensions = computed(() => [json(), ...(settingsStore.isDark ? [oneDark] : [])])

// ── Editor → Tree sync (debounced 300 ms) ──────────────────────────────────
const debouncedSyncToTree = useDebounceFn((text: string) => {
  if (syncLock.value === 'tree') return
  try {
    const parsed = JSON.parse(text)
    syncLock.value = 'editor'
    jsonValue.value = parsed
    jsonError.value = ''
    nextTick(() => {
      syncLock.value = null
    })
  } catch (e) {
    jsonError.value = t('tool.jsonFormat.errorInvalidJson') + ': ' + (e as Error).message
  }
}, 300)

watch(editorText, (text) => {
  debouncedSyncToTree(text)
})

// ── Tree → Editor sync ─────────────────────────────────────────────────────
watch(jsonValue, (val) => {
  if (syncLock.value === 'editor') return
  syncLock.value = 'tree'
  editorText.value = JSON.stringify(val, null, indentSize.value)
  jsonError.value = ''
  nextTick(() => {
    syncLock.value = null
  })
})

// ── Indent change → reformat editor (JSON value itself is unchanged) ────────
watch(indentSize, (size) => {
  try {
    const parsed = JSON.parse(editorText.value)
    syncLock.value = 'tree'
    editorText.value = JSON.stringify(parsed, null, size)
    nextTick(() => {
      syncLock.value = null
    })
  } catch {
    // invalid JSON in editor, skip reformatting
  }
})

// ── Toolbar helpers ────────────────────────────────────────────────────────
function withParsed(callback: (parsed: unknown) => void) {
  try {
    callback(JSON.parse(editorText.value))
    jsonError.value = ''
  } catch (e) {
    jsonError.value = t('tool.jsonFormat.errorInvalidJson') + ': ' + (e as Error).message
  }
}

function format() {
  withParsed((parsed) => {
    editorText.value = JSON.stringify(parsed, null, indentSize.value)
  })
}

function compress() {
  withParsed((parsed) => {
    editorText.value = JSON.stringify(parsed)
  })
}

function example() {
  editorText.value = JSON.stringify(SAMPLE_JSON, null, indentSize.value)
}

/** Escape the entire JSON text as a JSON string literal (adds outer quotes, escapes inner ones). */
function escapeString() {
  editorText.value = JSON.stringify(editorText.value)
}

/** Replace non-ASCII characters with \uXXXX escape sequences. */
function escapeUnicode() {
  editorText.value = editorText.value.replace(
    /[\u0080-\uFFFF]/g,
    (ch) => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0'),
  )
}

function expandAll() {
  jsonEditorRef?.value?.jsonEditor?.expand?.([], () => true)
}

function collapseAll() {
  jsonEditorRef?.value?.jsonEditor?.collapse?.([], () => true)
}

// ── Drag-to-resize divider ─────────────────────────────────────────────────
function startDrag(e: MouseEvent) {
  const startX = e.clientX
  const startWidth = leftWidth.value
  const containerWidth = containerRef.value?.getBoundingClientRect().width ?? 0
  if (containerWidth === 0) return

  document.body.style.userSelect = 'none'
  document.body.style.cursor = 'col-resize'

  function onMove(ev: MouseEvent) {
    const delta = ((ev.clientX - startX) / containerWidth) * 100
    leftWidth.value = Math.min(80, Math.max(20, startWidth + delta))
  }

  function onUp() {
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

onMounted(() => {
  const toolKey = route.meta?.toolKey as string | undefined
  if (toolKey) toolsStore.recordUsage(toolKey)
})
</script>

<template>
  <div class="json-format-tool">
    <div ref="containerRef" class="panels-container">
      <!-- ── Left panel: JSON text editor ── -->
      <div class="left-panel" :style="{ width: leftWidth + '%' }">
        <div class="panel-toolbar">
          <el-button size="small" type="primary" plain @click="format">
            {{ t('tool.jsonFormat.btnFormat') }}
          </el-button>
          <el-button size="small" plain @click="compress">
            {{ t('tool.jsonFormat.btnCompress') }}
          </el-button>
          <el-button size="small" plain @click="example">
            {{ t('tool.jsonFormat.btnExample') }}
          </el-button>
          <el-divider direction="vertical" />
          <el-button size="small" plain @click="escapeString">
            {{ t('tool.jsonFormat.btnEscape') }}
          </el-button>
          <el-button size="small" plain @click="escapeUnicode">
            {{ t('tool.jsonFormat.btnUnicodeEscape') }}
          </el-button>
        </div>
        <div class="editor-wrapper">
          <Codemirror v-model="editorText" :extensions="extensions" style="flex: 1; min-height: 0; overflow: hidden" />
          <div v-if="jsonError" class="error-hint">{{ jsonError }}</div>
        </div>
      </div>

      <!-- ── Draggable divider ── -->
      <div class="split-divider" @mousedown.prevent="startDrag" />

      <!-- ── Right panel: JSON tree view ── -->
      <div class="right-panel">
        <div class="panel-toolbar">
          <el-button size="small" plain @click="expandAll">
            {{ t('tool.jsonFormat.btnExpandAll') }}
          </el-button>
          <el-button size="small" plain @click="collapseAll">
            {{ t('tool.jsonFormat.btnCollapseAll') }}
          </el-button>
          <el-divider direction="vertical" />
          <span class="indent-label">{{ t('tool.jsonFormat.labelIndent') }}</span>
          <el-input-number v-model="indentSize" :min="1" :max="8" size="small" controls-position="right"
            style="width: 80px" />
        </div>
        <div class="tree-wrapper" :class="{ 'jse-theme-dark': settingsStore.isDark }">
          <JsonEditorVue ref="jsonEditorRef" v-model="jsonValue" :main-menu-bar="false" :navigation-bar="true"
            style="height: 100%" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.json-format-tool {
  height: calc(100vh - #{$app-header-height} - #{$breadcrumb-bar-height});
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panels-container {
  flex: 1;
  display: flex;
  overflow: hidden;
  height: 100%;
}

.left-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  flex-shrink: 0;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.panel-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-left: 8px;
  height: $tool-panel-header-height;
  border-bottom: 1px solid var(--el-border-color);
  flex-shrink: 0;
  flex-wrap: wrap;
  background: var(--el-bg-color);
}

.split-divider {
  width: 5px;
  cursor: col-resize;
  background-color: var(--el-border-color-lighter);
  border-left: 1px solid var(--el-border-color);
  border-right: 1px solid var(--el-border-color);
  flex-shrink: 0;
  transition: background-color 0.15s;

  &:hover {
    background-color: var(--el-color-primary-light-5);
  }
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

.error-hint {
  flex-shrink: 0;
  color: var(--el-color-danger);
  font-size: 12px;
  line-height: 1.5;
  padding: 4px 8px;
  background: var(--el-color-danger-light-9);
  border-top: 1px solid var(--el-color-danger-light-7);
}

.tree-wrapper {
  flex: 1;
  overflow: hidden;
  min-height: 0;

  :deep(.jse-main) {
    height: 100%;
  }
}

.indent-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}
</style>
