import { useI18n } from 'vue-i18n'

export function useClipboard() {
  const { t } = useI18n()

  async function copyText(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text)
      console.log(t('common.copySuccess'))
    } catch {
      console.error(t('common.copyFailed'))
    }
  }

  return { copyText }
}
