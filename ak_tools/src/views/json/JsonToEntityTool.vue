<script setup lang="ts">
import { Codemirror } from 'vue-codemirror'
import { json } from '@codemirror/lang-json'
import { java } from '@codemirror/lang-java'
import { oneDark } from '@codemirror/theme-one-dark'
import { useI18n } from 'vue-i18n'
import { useToolsStore } from '@/stores/tools'
import { useSettingsStore } from '@/stores/settings'
import { useClipboard } from '@/hooks/useClipboard'
import { useJavaEntityGenerator } from '@/hooks/useJavaEntityGenerator'

const { t } = useI18n()
const route = useRoute()
const toolsStore = useToolsStore()
const settingsStore = useSettingsStore()
const { copyText } = useClipboard()
const { className, packageName, javaCode, jsonError, generateJavaBean } = useJavaEntityGenerator()

const SAMPLE_JSON = `{
  "id": 1,
  "name": "Alice",
  "email": "alice@example.com",
  "active": true,
  "score": 9.5,
  "address": {
    "city": "Shanghai",
    "zipCode": "200000"
  },
  "tags": ["vip", "admin"]
}`

const jsonText = ref(SAMPLE_JSON)
const selectedLang = ref('java')
const leftWidth = ref(50)
const containerRef = ref<HTMLDivElement | null>(null)

const jsonExtensions = computed(() => [json(), ...(settingsStore.isDark ? [oneDark] : [])])
const javaExtensions = computed(() => [java(), ...(settingsStore.isDark ? [oneDark] : [])])

// ── Copy handler ───────────────────────────────────────────────────────────
function clickCopy() {
  if (!javaCode.value) return
  copyText(javaCode.value)
  ElNotification({
    title: t('common.btnCopy'),
    message: t('common.copySuccess'),
    type: 'success',
  })
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
  // Auto-generate on load so the right panel shows something immediately
  generateJavaBean(jsonText.value)
})
</script>

<template>
  <div class="json-entity-tool">
    <div ref="containerRef" class="panels-container">
      <!-- ── Left panel: JSON input ── -->
      <div class="left-panel" :style="{ width: leftWidth + '%' }">
        <div class="panel-toolbar">
          <el-input v-model="className" size="small" style="width: 180px"
            :placeholder="t('tool.jsonEntity.placeholderClass')">
            <template #prepend>{{ t('tool.jsonEntity.labelClassName') }}</template>
          </el-input>
          <el-input v-model="packageName" size="small" style="width: 200px"
            :placeholder="t('tool.jsonEntity.placeholderPackage')">
            <template #prepend>{{ t('tool.jsonEntity.labelPackageName') }}</template>
          </el-input>
          <el-divider direction="vertical" />
          <el-button size="small" type="primary" @click="generateJavaBean(jsonText)">
            {{ t('tool.jsonEntity.btnGenerate') }}
          </el-button>
        </div>
        <div class="editor-wrapper">
          <Codemirror v-model="jsonText" :extensions="jsonExtensions"
            style="flex: 1; min-height: 0; overflow: hidden" />
        </div>
      </div>

      <!-- ── Draggable divider ── -->
      <div class="split-divider" @mousedown.prevent="startDrag" />

      <!-- ── Right panel: Java code output ── -->
      <div class="right-panel">
        <div class="panel-toolbar">
          <span class="toolbar-label">{{ t('tool.jsonEntity.labelLanguage') }}</span>
          <el-select v-model="selectedLang" size="small" style="width: 100px">
            <el-option value="java" :label="t('tool.jsonEntity.langJava')" />
          </el-select>
          <el-divider direction="vertical" />
          <el-button size="small" plain type="success" :disabled="!javaCode" @click="clickCopy">
            {{ t('common.btnCopy') }}
          </el-button>
        </div>
        <div class="editor-wrapper">
          <div v-if="jsonError" class="error-bar">
            {{ jsonError }}
          </div>
          <Codemirror v-else v-model="javaCode" :extensions="javaExtensions" :disabled="true"
            style="flex: 1; min-height: 0; overflow: hidden" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.json-entity-tool {
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
  padding: 6px 8px;
  border-bottom: 1px solid var(--el-border-color);
  flex-shrink: 0;
  flex-wrap: wrap;
  background: var(--el-bg-color);
}

.toolbar-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  margin-right: 2px;
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
    background-color: var(--el-color-primary-light-7);
  }
}

.editor-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;

  :deep(.cm-editor) {
    height: 100%;
  }

  :deep(.cm-scroller) {
    overflow: auto;
  }
}

.error-bar {
  flex-shrink: 0;
  padding: 4px 10px;
  font-size: 12px;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border-top: 1px solid var(--el-color-danger-light-5);
  word-break: break-all;
}
</style>
