import { defineStore } from 'pinia'
import { computed, watch } from 'vue'
import { useLocalStorage, usePreferredDark } from '@vueuse/core'

export type Theme = 'light' | 'dark' | 'system'
export type Language = 'zhCN' | 'enUS'

export const useSettingsStore = defineStore('settings', () => {
  const theme = useLocalStorage<Theme>('ak-tools-theme', 'system')
  const language = useLocalStorage<Language>('ak-tools-language', 'zhCN')

  const prefersDark = usePreferredDark()

  const isDark = computed(() => {
    if (theme.value === 'dark') return true
    if (theme.value === 'light') return false
    return prefersDark.value
  })

  function applyTheme() {
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  watch(isDark, applyTheme, { immediate: true })

  return { theme, language, isDark }
})
