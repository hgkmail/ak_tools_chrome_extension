<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToolsStore } from '@/stores/tools'
import JsonEditorVue from 'json-editor-vue'
import 'vanilla-jsoneditor/themes/jse-theme-dark.css'

const { t } = useI18n()
const route = useRoute()
const toolsStore = useToolsStore()
const value = ref({})

onMounted(() => {
  // Record usage when visiting a tool page
  const toolKey = route.meta?.toolKey as string | undefined
  if (toolKey) toolsStore.recordUsage(toolKey)
})

</script>

<template>
  <div class="tool-placeholder">
    <JsonEditorVue v-model="value" v-bind="{/* local props & attrs */ }" />
  </div>
</template>

<style scoped>
.tool-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: 20px;
}

.wip-icon {
  color: var(--el-color-primary);
}
</style>
