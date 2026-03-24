<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useToolsStore } from '@/stores/tools'
import { calculateNextLinuxCronRuns, getLinuxCronFields } from '@/hooks/cronUtils'

type CronType = 'linux' | 'spring' | 'quartz'

const { t } = useI18n()
const route = useRoute()
const toolsStore = useToolsStore()

const selectedType = ref<CronType>('linux')
const cronExpression = ref('0 */12 * * *')
const normalizedExpression = ref('')
const explanationText = ref('')
const nextRunTimes = ref<string[]>([])
const resultError = ref('')

function buildLinuxExplanation(expression: string): string {
  const fields = getLinuxCronFields(expression)

  return [
    `${t('tool.dateCron.fieldMinute')}: ${fields.minute}`,
    `${t('tool.dateCron.fieldHour')}: ${fields.hour}`,
    `${t('tool.dateCron.fieldDayOfMonth')}: ${fields.dayOfMonth}`,
    `${t('tool.dateCron.fieldMonth')}: ${fields.month}`,
    `${t('tool.dateCron.fieldDayOfWeek')}: ${fields.dayOfWeek}`,
  ].join('，')
}

function getErrorMessage(errorCode: 'empty' | 'preset' | 'fieldCount' | 'parse', errorDetail?: string): string {
  if (errorCode === 'empty') return t('tool.dateCron.errorEmpty')
  if (errorCode === 'preset') return t('tool.dateCron.errorPresetUnsupported')
  if (errorCode === 'fieldCount') return t('tool.dateCron.errorFieldCount')
  return t('tool.dateCron.errorInvalidExpression', { detail: errorDetail ?? '' })
}

function handleCalculate() {
  nextRunTimes.value = []
  resultError.value = ''
  normalizedExpression.value = ''
  explanationText.value = ''

  if (selectedType.value !== 'linux') {
    resultError.value = t('tool.dateCron.typeNotImplemented')
    return
  }

  const result = calculateNextLinuxCronRuns(cronExpression.value, { count: 7 })

  if (!result.ok) {
    resultError.value = getErrorMessage(result.errorCode, result.errorDetail)
    return
  }

  normalizedExpression.value = result.normalizedExpression
  explanationText.value = buildLinuxExplanation(result.normalizedExpression)
  nextRunTimes.value = result.nextRunTimes
}

onMounted(() => {
  toolsStore.recordUsage(route.meta.toolKey as string)
})
</script>

<template>
  <div class="cron-expr-tool">
    <el-card class="section-card" shadow="never">
      <div class="page-title">{{ t('tool.dateCron.pageTitle') }}</div>

      <div class="form-row">
        <div class="field-label">{{ t('tool.dateCron.labelType') }}</div>
        <el-radio-group v-model="selectedType">
          <el-radio value="linux">{{ t('tool.dateCron.typeLinux') }}</el-radio>
          <el-radio value="spring" disabled>{{ t('tool.dateCron.typeSpring') }}</el-radio>
          <el-radio value="quartz" disabled>{{ t('tool.dateCron.typeQuartz') }}</el-radio>
        </el-radio-group>
      </div>

      <div class="form-row form-row-input">
        <div class="field-label">{{ t('tool.dateCron.labelExpression') }}</div>
        <div class="expression-row">
          <el-input v-model="cronExpression" :placeholder="t('tool.dateCron.placeholderExpression')" clearable
            @keydown.enter.prevent="handleCalculate" />
          <el-button type="primary" @click="handleCalculate">
            {{ t('tool.dateCron.btnCalculate') }}
          </el-button>
        </div>
      </div>

      <div class="helper-text">{{ t('tool.dateCron.linuxOnlyHint') }}</div>
      <div class="helper-text">{{ t('tool.dateCron.commentHint') }}</div>
      <div class="helper-text helper-text-muted">{{ t('tool.dateCron.typeNotImplemented') }}</div>

      <div class="examples">
        <div class="example-item">
          <span class="example-label">{{ t('tool.dateCron.exampleLinuxLabel') }}</span>
          <span class="example-code">
            <span class="example-required">0 */12 * * *</span>
            <span class="example-optional"> [user] [command]</span>
          </span>
          <span class="example-note">{{ t('tool.dateCron.exampleLinuxNote') }}</span>
        </div>

        <div class="example-item">
          <span class="example-label">{{ t('tool.dateCron.exampleSpringLabel') }}</span>
          <span class="example-code">
            <span class="example-required">0 0 */12 * * *</span>
          </span>
          <span class="example-note">{{ t('tool.dateCron.exampleSpringNote') }}</span>
        </div>

        <div class="example-item">
          <span class="example-label">{{ t('tool.dateCron.exampleQuartzLabel') }}</span>
          <span class="example-code">
            <span class="example-required">0 0 18 L * ?</span>
          </span>
          <span class="example-note">{{ t('tool.dateCron.exampleQuartzNote') }}</span>
        </div>
      </div>
    </el-card>

    <el-card class="section-card" shadow="never">
      <div class="section-title">{{ t('tool.dateCron.sectionExplain') }}</div>
      <div v-if="normalizedExpression" class="normalized-expression">{{ normalizedExpression }}</div>
      <div v-if="explanationText" class="explanation-text">{{ explanationText }}</div>
      <div v-else class="empty-text">{{ t('tool.dateCron.placeholderExplain') }}</div>
    </el-card>

    <el-card class="section-card" shadow="never">
      <div class="section-title">{{ t('tool.dateCron.sectionNextRuns') }}</div>

      <div v-if="resultError" class="result-error">{{ resultError }}</div>

      <div v-else-if="nextRunTimes.length" class="result-list">
        <div v-for="runTime in nextRunTimes" :key="runTime" class="result-item">
          {{ runTime }}
        </div>
      </div>

      <div v-else class="empty-text">{{ t('tool.dateCron.placeholderResult') }}</div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.cron-expr-tool {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1200px;
}

.section-card {
  :deep(.el-card__body) {
    padding: 20px;
  }
}

.page-title,
.section-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.page-title {
  margin-bottom: 20px;
}

.section-title {
  margin-bottom: 14px;
}

.form-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;

  &+& {
    margin-top: 16px;
  }
}

.form-row-input {
  align-items: center;
}

.field-label {
  width: 100px;
  flex-shrink: 0;
  font-size: 14px;
  line-height: 32px;
  color: var(--el-text-color-regular);
}

.expression-row {
  flex: 1;
  display: flex;
  gap: 12px;
}

.helper-text {
  margin-top: 14px;
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.helper-text-muted,
.empty-text {
  color: var(--el-text-color-secondary);
}

.examples {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.example-item {
  font-size: 14px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
}

.example-label {
  margin-right: 6px;
}

.example-code {
  font-family: Monaco, Menlo, Consolas, monospace;
}

.example-required {
  color: var(--el-color-danger);
}

.example-optional {
  color: var(--el-text-color-secondary);
}

.example-note {
  margin-left: 6px;
}

.normalized-expression {
  margin-bottom: 8px;
  font-family: Monaco, Menlo, Consolas, monospace;
  font-size: 14px;
  color: var(--el-color-primary);
}

.explanation-text,
.result-error,
.result-item,
.empty-text {
  font-size: 14px;
  line-height: 1.8;
}

.result-error {
  color: var(--el-color-danger);
}

.result-list {
  border: 1px solid var(--el-border-color);
}

.result-item {
  padding: 12px 14px;
  font-variant-numeric: tabular-nums;

  &+& {
    border-top: 1px solid var(--el-border-color);
  }
}

@media (width <=768px) {

  .form-row,
  .form-row-input,
  .expression-row {
    flex-direction: column;
    align-items: stretch;
  }

  .field-label {
    width: auto;
    line-height: 1.4;
  }
}
</style>
