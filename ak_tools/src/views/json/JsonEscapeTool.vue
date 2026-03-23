<script setup lang="ts">
import { Codemirror } from 'vue-codemirror'
import { json } from '@codemirror/lang-json'
import { oneDark } from '@codemirror/theme-one-dark'
import { useI18n } from 'vue-i18n'
import { useToolsStore } from '@/stores/tools'
import { useSettingsStore } from '@/stores/settings'
import { useClipboard } from '@/hooks/useClipboard'
import { strAddBackslash, strRemoveBackslash } from '@/hooks/useString'

const { t } = useI18n()
const route = useRoute()
const toolsStore = useToolsStore()
const settingsStore = useSettingsStore()
const { copyText } = useClipboard()

const SAMPLE_JSON = {
  name: 'AK Tools',
  version: '1.0.0',
  features: ['JSON Formatter', 'Timestamp', 'Cron'],
  nested: { enabled: true, count: 42 },
}

const editorText = ref(JSON.stringify(SAMPLE_JSON, null, 2))
const jsonError = ref('')
const indentSize = ref(2)
const leftWidth = ref(50)

const extensions = computed(() => [json(), ...(settingsStore.isDark ? [oneDark] : [])])

// ── Indent change → reformat editor (JSON value itself is unchanged) ────────
watch(indentSize, (size) => {
  try {
    const parsed = JSON.parse(editorText.value)
    editorText.value = JSON.stringify(parsed, null, size)
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

watch(editorText, (text) => {
  useDebounceFn((text: string) => {
    if (text.trim() === '') {
      jsonError.value = ''
      return
    }
    withParsed(() => { })
  }, 300)(text)
})

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



/** Compress JSON then add backslashes. */
function compressAndEscape() {
  withParsed((parsed) => {
    editorText.value = strAddBackslash(JSON.stringify(parsed))
  })
}

/** Add backslashes to escape characters in the JSON string. */
function addBackslash() {
  editorText.value = strAddBackslash(editorText.value)
}
function removeBackslash() {
  editorText.value = strRemoveBackslash(editorText.value)
}

/** Convert Chinese characters to Unicode escape sequences. */
function chinese2Unicode() {
  editorText.value = editorText.value.replace(/[\u4e00-\u9fa5]/g, (char) => {
    return '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0')
  })
}

/** Convert Unicode escape sequences back to Chinese characters. */
function unicode2Chinese() {
  editorText.value = editorText.value.replace(/\\u([\dA-Fa-f]{4})/g, (match, group) => {
    return String.fromCharCode(parseInt(group, 16))
  })
}

onMounted(() => {
  const toolKey = route.meta?.toolKey as string | undefined
  if (toolKey) toolsStore.recordUsage(toolKey)
})

function clickCopy() {
  copyText(editorText.value)
  ElNotification({
    title: t('common.btnCopy'),
    message: t('common.copySuccess'),
    type: 'success',
  })
}
</script>

<template>
  <div class="json-format-tool">
    <div class="panels-container">
      <!-- ── Left panel: JSON text editor ── -->
      <div class="left-panel" :style="{ width: leftWidth + '%' }">
        <div class="panel-toolbar">
          <el-button size="small" type="primary" plain @click="format">
            {{ t('tool.jsonFormat.btnFormat') }}
          </el-button>
          <el-button size="small" plain @click="compress">
            {{ t('tool.jsonFormat.btnCompress') }}
          </el-button>
          <el-button size="small" plain @click="compressAndEscape">
            {{ t('tool.jsonFormat.btnCompressAndEscape') }}
          </el-button>
          <el-button size="small" plain @click="example">
            {{ t('tool.jsonFormat.btnExample') }}
          </el-button>
          <el-button size="small" plain type="success" @click="clickCopy">
            {{ t('common.btnCopy') }}
          </el-button>
          <el-divider direction="vertical" />
          <el-dropdown trigger="click">
            <el-button size="small" plain>
              {{ t('tool.jsonFormat.btnUnicodeEscape') }}<el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="chinese2Unicode">{{ t('tool.jsonFormat.chinese2Unicode') }}</el-dropdown-item>
                <el-dropdown-item @click="unicode2Chinese">{{ t('tool.jsonFormat.unicode2Chinese') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-dropdown trigger="click">
            <el-button size="small" plain>
              {{ t('tool.jsonFormat.btnEscape') }}<el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="addBackslash">{{ t('tool.jsonFormat.addBackslash') }}</el-dropdown-item>
                <el-dropdown-item @click="removeBackslash">{{ t('tool.jsonFormat.removeBackslash') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-divider direction="vertical" />
          <span class="indent-label">{{ t('tool.jsonFormat.labelIndent') }}</span>
          <el-input-number v-model="indentSize" :min="1" :max="8" size="small" controls-position="right"
            style="width: 80px" />
        </div>
        <div class="editor-wrapper">
          <Codemirror v-model="editorText" :extensions="extensions" style="flex: 1; min-height: 0; overflow: hidden" />
          <div v-if="jsonError" class="error-hint">{{ jsonError }}</div>
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
  flex: 1;
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
  font-size: 14px;
  line-height: 1.5;
  padding: 4px 8px;
  background: var(--el-color-danger-light-9);
  border-top: 1px solid var(--el-color-danger-light-7);
}

.indent-label {
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}
</style>
