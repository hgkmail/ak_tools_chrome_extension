import { useI18n } from 'vue-i18n'

// ── Interfaces ─────────────────────────────────────────────────────────────

interface TsField {
  tsType: string
  fieldName: string
}

interface TsInterfaceDef {
  name: string
  fields: TsField[]
}

// ── Helpers ────────────────────────────────────────────────────────────────

function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (c) => c.toUpperCase())
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

// ── TypeScript type inference ──────────────────────────────────────────────

function inferTsType(value: unknown, fieldKey: string, interfaces: TsInterfaceDef[]): string {
  if (value === null || value === undefined) return 'unknown'
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'string') return 'string'
  if (Array.isArray(value)) {
    if (value.length === 0) return 'unknown[]'
    const first = value[0]
    if (typeof first === 'boolean') return 'boolean[]'
    if (typeof first === 'number') return 'number[]'
    if (typeof first === 'string') return 'string[]'
    if (typeof first === 'object' && first !== null && !Array.isArray(first)) {
      const innerName = toPascalCase(fieldKey)
      collectTsInterfaces(first as Record<string, unknown>, innerName, interfaces)
      return `${innerName}[]`
    }
    return 'unknown[]'
  }
  if (typeof value === 'object') {
    const innerName = toPascalCase(fieldKey)
    collectTsInterfaces(value as Record<string, unknown>, innerName, interfaces)
    return innerName
  }
  return 'unknown'
}

// Recursively collects nested interfaces (DFS), appends current last
function collectTsInterfaces(
  obj: Record<string, unknown>,
  name: string,
  interfaces: TsInterfaceDef[],
): void {
  const fields: TsField[] = []
  for (const [key, value] of Object.entries(obj)) {
    const tsType = inferTsType(value, key, interfaces)
    fields.push({ tsType, fieldName: toCamelCase(key) })
  }
  interfaces.push({ name, fields })
}

// ── Code generation ────────────────────────────────────────────────────────

function renderTsInterface(iface: TsInterfaceDef): string {
  if (iface.fields.length === 0) return `export interface ${iface.name} {}`
  const fieldLines = iface.fields.map((f) => `  ${f.fieldName}: ${f.tsType}`)
  return `export interface ${iface.name} {\n${fieldLines.join('\n')}\n}`
}

function buildTsCode(parsed: unknown, rootInterfaceName: string): string {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('根节点必须是 JSON 对象')
  }
  const interfaces: TsInterfaceDef[] = []
  collectTsInterfaces(
    parsed as Record<string, unknown>,
    toPascalCase(rootInterfaceName) || 'MyInterface',
    interfaces,
  )
  // Nested interfaces collected first (DFS), reverse so root appears at top
  interfaces.reverse()
  return interfaces.map(renderTsInterface).join('\n\n')
}

// ── Composable ─────────────────────────────────────────────────────────────

export function useTsEntityGenerator() {
  const { t } = useI18n()

  const interfaceName = ref('MyInterface')
  const tsCode = ref('')
  const tsError = ref('')

  function generateTsInterface(jsonText: string) {
    const text = jsonText.trim()
    if (!text) {
      tsError.value = t('tool.jsonEntity.errorEmptyJson')
      return
    }
    try {
      const parsed = JSON.parse(text)
      tsError.value = ''
      tsCode.value = buildTsCode(parsed, interfaceName.value)
    } catch (e) {
      tsError.value = t('tool.jsonEntity.errorInvalidJson') + ': ' + (e as Error).message
      tsCode.value = ''
    }
  }

  return { interfaceName, tsCode, tsError, generateTsInterface }
}
