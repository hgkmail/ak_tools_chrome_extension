<script setup lang="ts">
import { Codemirror } from 'vue-codemirror'
import { json } from '@codemirror/lang-json'
import { java } from '@codemirror/lang-java'
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
const javaCode = ref('')
const className = ref('MyEntity')
const packageName = ref('com.example')
const jsonError = ref('')
const selectedLang = ref('java')
const leftWidth = ref(50)
const containerRef = ref<HTMLDivElement | null>(null)

const jsonExtensions = computed(() => [json(), ...(settingsStore.isDark ? [oneDark] : [])])
const javaExtensions = computed(() => [java(), ...(settingsStore.isDark ? [oneDark] : [])])

// ── Java class name helpers ────────────────────────────────────────────────
function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (c) => c.toUpperCase())
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

// ── Java type inference ────────────────────────────────────────────────────
interface ClassDef {
  name: string
  fields: FieldDef[]
  nestedClasses: ClassDef[]
}

interface FieldDef {
  javaType: string
  fieldName: string
  originalKey: string
}

function inferType(value: unknown, fieldKey: string, nestedClasses: ClassDef[]): string {
  if (value === null || value === undefined) return 'Object'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'int' : 'double'
  }
  if (typeof value === 'string') return 'String'
  if (Array.isArray(value)) {
    if (value.length === 0) return 'List<Object>'
    const first = value[0]
    if (typeof first === 'boolean') return 'List<Boolean>'
    if (typeof first === 'number') return Number.isInteger(first) ? 'List<Integer>' : 'List<Double>'
    if (typeof first === 'string') return 'List<String>'
    if (typeof first === 'object' && first !== null && !Array.isArray(first)) {
      const innerClassName = toPascalCase(fieldKey)
      const innerClass = buildClassDef(first as Record<string, unknown>, innerClassName)
      nestedClasses.push(innerClass)
      return `List<${innerClassName}>`
    }
    return 'List<Object>'
  }
  if (typeof value === 'object') {
    const innerClassName = toPascalCase(fieldKey)
    const innerClass = buildClassDef(value as Record<string, unknown>, innerClassName)
    nestedClasses.push(innerClass)
    return innerClassName
  }
  return 'Object'
}

function buildClassDef(obj: Record<string, unknown>, name: string): ClassDef {
  const fields: FieldDef[] = []
  const nestedClasses: ClassDef[] = []

  for (const [key, value] of Object.entries(obj)) {
    const javaType = inferType(value, key, nestedClasses)
    fields.push({ javaType, fieldName: toCamelCase(key), originalKey: key })
  }

  return { name, fields, nestedClasses }
}

// ── Code generation ────────────────────────────────────────────────────────
function collectImports(classDef: ClassDef): Set<string> {
  const imports = new Set<string>()
  for (const f of classDef.fields) {
    if (f.javaType.startsWith('List<')) {
      imports.add('java.util.List')
    }
  }
  for (const nested of classDef.nestedClasses) {
    for (const imp of collectImports(nested)) {
      imports.add(imp)
    }
  }
  return imports
}

function renderGetter(field: FieldDef): string {
  const capName = field.fieldName.charAt(0).toUpperCase() + field.fieldName.slice(1)
  const prefix = field.javaType === 'boolean' ? 'is' : 'get'
  return `    public ${field.javaType} ${prefix}${capName}() {\n        return ${field.fieldName};\n    }`
}

function renderSetter(field: FieldDef): string {
  const capName = field.fieldName.charAt(0).toUpperCase() + field.fieldName.slice(1)
  return `    public void set${capName}(${field.javaType} ${field.fieldName}) {\n        this.${field.fieldName} = ${field.fieldName};\n    }`
}

function renderClass(classDef: ClassDef, isNested: boolean): string {
  const indent = isNested ? '    ' : ''
  const modifier = isNested ? `${indent}public static class` : 'public class'

  const fieldLines = classDef.fields.map((f) => `${indent}    private ${f.javaType} ${f.fieldName};`)
  const accessorLines: string[] = []
  for (const f of classDef.fields) {
    accessorLines.push(
      renderGetter(f)
        .split('\n')
        .map((l) => `${indent}${l}`)
        .join('\n'),
    )
    accessorLines.push(
      renderSetter(f)
        .split('\n')
        .map((l) => `${indent}${l}`)
        .join('\n'),
    )
  }

  const nestedLines = classDef.nestedClasses.map((nc) => renderClass(nc, true))

  const parts: string[] = []
  parts.push(`${modifier} ${classDef.name} {`)
  if (fieldLines.length) {
    parts.push(fieldLines.join('\n'))
  }
  if (accessorLines.length) {
    parts.push('')
    parts.push(accessorLines.join('\n\n'))
  }
  if (nestedLines.length) {
    parts.push('')
    parts.push(nestedLines.join('\n\n'))
  }
  parts.push(`${indent}}`)

  return parts.join('\n')
}

function buildJavaCode(parsed: unknown, rootClassName: string, pkg: string): string {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('根节点必须是 JSON 对象')
  }

  const rootClass = buildClassDef(parsed as Record<string, unknown>, toPascalCase(rootClassName) || 'MyEntity')
  const imports = collectImports(rootClass)

  const lines: string[] = []
  if (pkg.trim()) {
    lines.push(`package ${pkg.trim()};`)
    lines.push('')
  }
  if (imports.size > 0) {
    for (const imp of [...imports].sort()) {
      lines.push(`import ${imp};`)
    }
    lines.push('')
  }
  lines.push(renderClass(rootClass, false))

  return lines.join('\n')
}

// ── Generate button handler ────────────────────────────────────────────────
function generateJavaBean() {
  const text = jsonText.value.trim()
  if (!text) {
    jsonError.value = t('tool.jsonEntity.errorEmptyJson')
    return
  }
  try {
    const parsed = JSON.parse(text)
    jsonError.value = ''
    javaCode.value = buildJavaCode(parsed, className.value, packageName.value)
  } catch (e) {
    jsonError.value = t('tool.jsonEntity.errorInvalidJson') + ': ' + (e as Error).message
    javaCode.value = ''
  }
}

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
  generateJavaBean()
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
          <el-button size="small" type="primary" @click="generateJavaBean">
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
