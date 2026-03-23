import { useI18n } from 'vue-i18n'

// ── Interfaces ─────────────────────────────────────────────────────────────

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

// ── Java type inference ────────────────────────────────────────────────────

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

  const fieldLines = classDef.fields.map(
    (f) => `${indent}    private ${f.javaType} ${f.fieldName};`,
  )
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

  const rootClass = buildClassDef(
    parsed as Record<string, unknown>,
    toPascalCase(rootClassName) || 'MyEntity',
  )
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

// ── Composable ─────────────────────────────────────────────────────────────

export function useJavaEntityGenerator() {
  const { t } = useI18n()

  const className = ref('MyEntity')
  const packageName = ref('com.example')
  const javaCode = ref('')
  const jsonError = ref('')

  function generateJavaBean(jsonText: string) {
    const text = jsonText.trim()
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

  return { className, packageName, javaCode, jsonError, generateJavaBean }
}
