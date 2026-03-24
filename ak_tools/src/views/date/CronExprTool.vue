<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useToolsStore } from '@/stores/tools'
import {
  calculateNextLinuxCronRuns,
  calculateNextQuartzCronRuns,
  calculateNextSpringCronRuns,
  getLinuxCronFields,
  getQuartzCronFields,
  getSpringCronFields,
  type CronValidationErrorCode,
} from '@/hooks/cronUtils'

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

const typeFieldCountMap: Record<CronType, string | number> = {
  linux: 5,
  spring: 6,
  quartz: t('tool.dateCron.quartzFieldCountLabel'),
}

const placeholderExpression = computed(() => {
  if (selectedType.value === 'spring') return t('tool.dateCron.placeholderExpressionSpring')
  if (selectedType.value === 'quartz') return t('tool.dateCron.placeholderExpressionQuartz')
  return t('tool.dateCron.placeholderExpressionLinux')
})

const typeHint = computed(() => {
  if (selectedType.value === 'spring') return t('tool.dateCron.springHint')
  if (selectedType.value === 'quartz') return t('tool.dateCron.quartzHint')
  return t('tool.dateCron.linuxHint')
})

const syntaxHint = computed(() => {
  if (selectedType.value === 'spring') return t('tool.dateCron.springSyntaxHint')
  if (selectedType.value === 'quartz') return t('tool.dateCron.quartzSyntaxHint')
  return t('tool.dateCron.linuxSyntaxHint')
})

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

function buildSpringExplanation(expression: string): string {
  const fields = getSpringCronFields(expression)

  return [
    `${t('tool.dateCron.fieldSecond')}: ${fields.second}`,
    `${t('tool.dateCron.fieldMinute')}: ${fields.minute}`,
    `${t('tool.dateCron.fieldHour')}: ${fields.hour}`,
    `${t('tool.dateCron.fieldDayOfMonth')}: ${fields.dayOfMonth}`,
    `${t('tool.dateCron.fieldMonth')}: ${fields.month}`,
    `${t('tool.dateCron.fieldDayOfWeek')}: ${fields.dayOfWeek}`,
  ].join('，')
}

function buildQuartzExplanation(expression: string): string {
  const fields = getQuartzCronFields(expression)

  return [
    `${t('tool.dateCron.fieldSecond')}: ${fields.second}`,
    `${t('tool.dateCron.fieldMinute')}: ${fields.minute}`,
    `${t('tool.dateCron.fieldHour')}: ${fields.hour}`,
    `${t('tool.dateCron.fieldDayOfMonth')}: ${fields.dayOfMonth}`,
    `${t('tool.dateCron.fieldMonth')}: ${fields.month}`,
    `${t('tool.dateCron.fieldDayOfWeek')}: ${fields.dayOfWeek}`,
    `${t('tool.dateCron.fieldYear')}: ${fields.year}`,
  ].join('，')
}

function getTypeLabel(type: CronType): string {
  if (type === 'spring') return t('tool.dateCron.typeSpring')
  if (type === 'quartz') return t('tool.dateCron.typeQuartz')
  return t('tool.dateCron.typeLinux')
}

function getErrorMessage(errorCode: CronValidationErrorCode, errorDetail?: string): string {
  if (errorCode === 'empty') return t('tool.dateCron.errorEmpty')
  if (errorCode === 'preset') return t('tool.dateCron.errorPresetUnsupported')
  if (errorCode === 'fieldCount') {
    return t('tool.dateCron.errorFieldCount', {
      type: getTypeLabel(selectedType.value),
      count: typeFieldCountMap[selectedType.value],
    })
  }
  return t('tool.dateCron.errorInvalidExpression', { detail: errorDetail ?? '' })
}

function getExplanationBuilder(type: CronType): (expression: string) => string {
  if (type === 'spring') return buildSpringExplanation
  if (type === 'quartz') return buildQuartzExplanation
  return buildLinuxExplanation
}

function calculateByType() {
  if (selectedType.value === 'spring') {
    return calculateNextSpringCronRuns(cronExpression.value, { count: 7 })
  }

  if (selectedType.value === 'quartz') {
    return calculateNextQuartzCronRuns(cronExpression.value, { count: 7 })
  }

  return calculateNextLinuxCronRuns(cronExpression.value, { count: 7 })
}

function handleCalculate() {
  nextRunTimes.value = []
  resultError.value = ''
  normalizedExpression.value = ''
  explanationText.value = ''

  const result = calculateByType()

  if (!result.ok) {
    resultError.value = getErrorMessage(result.errorCode, result.errorDetail)
    return
  }

  normalizedExpression.value = result.normalizedExpression
  explanationText.value = getExplanationBuilder(selectedType.value)(result.normalizedExpression)
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
          <el-radio value="spring">{{ t('tool.dateCron.typeSpring') }}</el-radio>
          <el-radio value="quartz">{{ t('tool.dateCron.typeQuartz') }}</el-radio>
        </el-radio-group>
      </div>

      <div class="form-row form-row-input">
        <div class="field-label">{{ t('tool.dateCron.labelExpression') }}</div>
        <div class="expression-row">
          <el-input v-model="cronExpression" :placeholder="placeholderExpression" clearable
            @keydown.enter.prevent="handleCalculate" />
          <el-button type="primary" @click="handleCalculate">
            {{ t('tool.dateCron.btnCalculate') }}
          </el-button>
        </div>
      </div>

      <div class="helper-text">{{ typeHint }}</div>
      <div class="helper-text">{{ t('tool.dateCron.commentHint') }}</div>
      <div class="helper-text helper-text-muted">{{ syntaxHint }}</div>

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
            <span class="example-optional"> [2026]</span>
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

    <el-card class="section-card" shadow="never">
      <pre v-if="selectedType === 'linux'"><code>例子：
    # 每月的最后1天
    0 0 L * *

    说明：
    Linux
    *    *    *    *    *
    -    -    -    -    -
    |    |    |    |    |
    |    |    |    |    +----- day of week (0 - 7) (Sunday=0 or 7) OR sun,mon,tue,wed,thu,fri,sat
    |    |    |    +---------- month (1 - 12) OR jan,feb,mar,apr ...
    |    |    +--------------- day of month (1 - 31)
    |    +-------------------- hour (0 - 23)
    +------------------------- minute (0 - 59)</code></pre>
      <pre v-if="selectedType === 'spring'"><code>例子：
    # 每月的最后1天
    @Scheduled(cron = "0 0 18 28-31 * ?")
    public void doAtLastDayOfMonth() {
        final Calendar calendar = Calendar.getInstance();
        if (c.get(Calendar.DATE) == c.getActualMaximum(Calendar.DATE)) {
            // do something here...
        }
    }

    说明：
    Java(Spring)
    *    *    *    *    *    *
    -    -    -    -    -    -
    |    |    |    |    |    |
    |    |    |    |    |    +----- day of week (0 - 7) (Sunday=0 or 7) OR sun,mon,tue,wed,thu,fri,sat
    |    |    |    |    +---------- month (1 - 12) OR jan,feb,mar,apr ...
    |    |    |    +--------------- day of month (1 - 31)
    |    |    +-------------------- hour (0 - 23)
    |    +------------------------- min (0 - 59)
    +------------------------------ second (0 - 59)</code></pre>
      <pre v-if="selectedType === 'quartz'"><code>例子：
    # 每月的最后1天
    @Scheduled(cron = "0 0 18 L * ?")
    public void doAtLastDayOfMonth() {
        // do something here...
    }

    说明：
    Java(Quartz)
    *    *    *    *    *    *    *
    -    -    -    -    -    -    -
    |    |    |    |    |    |    |
    |    |    |    |    |    |    + year [optional]
    |    |    |    |    |    +----- day of week (1 - 7) sun,mon,tue,wed,thu,fri,sat
    |    |    |    |    +---------- month (1 - 12) OR jan,feb,mar,apr ...
    |    |    |    +--------------- day of month (1 - 31)
    |    |    +-------------------- hour (0 - 23)
    |    +------------------------- min (0 - 59)
    +------------------------------ second (0 - 59)</code></pre>

      <CronExprToolDoc />
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

pre {
  display: block;
  padding: 10px;
  margin: 0 0 10.5px;
  font-size: 13px;
  line-height: 1.5;
  word-break: break-all;
  word-wrap: break-word;
  color: var(--el-text-color-regular);
  background-color: var(--el-fill-color);
  border: 1px solid var(--el-border-color);
  border-radius: 2px;
}

pre code {
  padding: 0;
  font-size: inherit;
  color: inherit;
  white-space: pre-wrap;
  background-color: transparent;
  border-radius: 0;
  border: none;
}
</style>
