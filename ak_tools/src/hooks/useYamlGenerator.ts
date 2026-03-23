import { dump } from 'js-yaml'
import { useI18n } from 'vue-i18n'

// ── Composable ─────────────────────────────────────────────────────────────

export function useYamlGenerator() {
  const { t } = useI18n()

  const yamlCode = ref('')
  const yamlError = ref('')

  function generateYaml(jsonText: string) {
    const text = jsonText.trim()
    if (!text) {
      yamlError.value = t('tool.jsonEntity.errorEmptyJson')
      return
    }
    try {
      const parsed = JSON.parse(text)
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('根节点必须是 JSON 对象')
      }
      yamlError.value = ''
      yamlCode.value = dump(parsed, { indent: 2, lineWidth: -1 })
    } catch (e) {
      yamlError.value = t('tool.jsonEntity.errorInvalidJson') + ': ' + (e as Error).message
      yamlCode.value = ''
    }
  }

  return { yamlCode, yamlError, generateYaml }
}
