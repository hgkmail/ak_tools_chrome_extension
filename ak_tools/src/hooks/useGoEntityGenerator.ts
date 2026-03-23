import { useI18n } from 'vue-i18n'

// ── Interfaces ─────────────────────────────────────────────────────────────

interface GoField {
  goType: string
  fieldName: string
  jsonTag: string
}

interface GoStructDef {
  name: string
  fields: GoField[]
}

// ── Helpers ────────────────────────────────────────────────────────────────

function toPascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, (c) => c.toUpperCase())
}

// ── Go type inference ──────────────────────────────────────────────────────

function inferGoType(value: unknown, fieldKey: string, structs: GoStructDef[]): string {
  if (value === null || value === undefined) return 'interface{}'
  if (typeof value === 'boolean') return 'bool'
  if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'float64'
  if (typeof value === 'string') return 'string'
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]interface{}'
    const first = value[0]
    if (typeof first === 'boolean') return '[]bool'
    if (typeof first === 'number') return Number.isInteger(first) ? '[]int' : '[]float64'
    if (typeof first === 'string') return '[]string'
    if (typeof first === 'object' && first !== null && !Array.isArray(first)) {
      const innerName = toPascalCase(fieldKey)
      collectGoStructs(first as Record<string, unknown>, innerName, structs)
      return `[]${innerName}`
    }
    return '[]interface{}'
  }
  if (typeof value === 'object') {
    const innerName = toPascalCase(fieldKey)
    collectGoStructs(value as Record<string, unknown>, innerName, structs)
    return innerName
  }
  return 'interface{}'
}

// Recursively collects nested structs (DFS), appends current struct last
function collectGoStructs(
  obj: Record<string, unknown>,
  name: string,
  structs: GoStructDef[],
): void {
  const fields: GoField[] = []
  for (const [key, value] of Object.entries(obj)) {
    const goType = inferGoType(value, key, structs)
    fields.push({ goType, fieldName: toPascalCase(key), jsonTag: key })
  }
  structs.push({ name, fields })
}

// ── Code generation ────────────────────────────────────────────────────────

function renderGoStruct(s: GoStructDef): string {
  if (s.fields.length === 0) return `type ${s.name} struct {}`
  const maxNameLen = Math.max(...s.fields.map((f) => f.fieldName.length))
  const maxTypeLen = Math.max(...s.fields.map((f) => f.goType.length))
  const fieldLines = s.fields.map((f) => {
    const namePad = f.fieldName.padEnd(maxNameLen)
    const typePad = f.goType.padEnd(maxTypeLen)
    return `\t${namePad} ${typePad} \`json:"${f.jsonTag}"\``
  })
  return `type ${s.name} struct {\n${fieldLines.join('\n')}\n}`
}

function buildGoCode(parsed: unknown, rootStructName: string, pkg: string): string {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('根节点必须是 JSON 对象')
  }
  const structs: GoStructDef[] = []
  collectGoStructs(
    parsed as Record<string, unknown>,
    toPascalCase(rootStructName) || 'MyStruct',
    structs,
  )
  // Nested structs collected first (DFS), reverse so root appears at top
  structs.reverse()

  const lines: string[] = []
  if (pkg.trim()) {
    lines.push(`package ${pkg.trim()}`)
    lines.push('')
  }
  lines.push(structs.map(renderGoStruct).join('\n\n'))
  return lines.join('\n')
}

// ── Composable ─────────────────────────────────────────────────────────────

export function useGoEntityGenerator() {
  const { t } = useI18n()

  const structName = ref('MyStruct')
  const packageName = ref('main')
  const goCode = ref('')
  const goError = ref('')

  function generateGoStruct(jsonText: string) {
    const text = jsonText.trim()
    if (!text) {
      goError.value = t('tool.jsonEntity.errorEmptyJson')
      return
    }
    try {
      const parsed = JSON.parse(text)
      goError.value = ''
      goCode.value = buildGoCode(parsed, structName.value, packageName.value)
    } catch (e) {
      goError.value = t('tool.jsonEntity.errorInvalidJson') + ': ' + (e as Error).message
      goCode.value = ''
    }
  }

  return { structName, packageName, goCode, goError, generateGoStruct }
}
