<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useToolsStore } from '@/stores/tools'
import { useClipboard } from '@/hooks/useClipboard'

const { t } = useI18n()
const route = useRoute()
const toolsStore = useToolsStore()
const { copyText } = useClipboard()

// ─── Current Timestamp ───────────────────────────────────────────────────────
type TimestampUnit = 's' | 'ms'

const displayUnit = ref<TimestampUnit>('s')
const isRunning = ref(true)
const currentTimestamp = ref(Math.floor(Date.now() / 1000))

let timer: ReturnType<typeof setInterval> | null = null

function getTimestamp() {
  return displayUnit.value === 's' ? Math.floor(Date.now() / 1000) : Date.now()
}

function startTimer() {
  if (timer) return
  timer = setInterval(() => {
    currentTimestamp.value = getTimestamp()
  }, 1000)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function switchUnit() {
  displayUnit.value = displayUnit.value === 's' ? 'ms' : 's'
  currentTimestamp.value = getTimestamp()
}

function toggleRunning() {
  if (isRunning.value) {
    stopTimer()
    isRunning.value = false
  } else {
    currentTimestamp.value = getTimestamp()
    startTimer()
    isRunning.value = true
  }
}

async function copyCurrentTimestamp() {
  await copyText(String(currentTimestamp.value))
  ElNotification({
    title: t('common.btnCopy'),
    message: t('common.copySuccess'),
    type: 'success',
  })
}

// ─── Timezone list ────────────────────────────────────────────────────────────
const TIMEZONE_LIST = [
  'UTC',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Bangkok',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Africa/Cairo',
  'Australia/Sydney',
  'Pacific/Auckland',
  'Pacific/Honolulu',
]

const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatWithTz(ms: number, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date(ms))
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00'
  const hour = get('hour') === '24' ? '00' : get('hour')
  return `${get('year')}-${get('month')}-${get('day')} ${hour}:${get('minute')}:${get('second')}`
}

// ─── Timestamp → Date ─────────────────────────────────────────────────────────
const tsInput = ref(String(Date.now()))
const tsUnit = ref<TimestampUnit>('ms')
const tsTimezone = ref(systemTimezone)
const tsResult = ref('')
const tsError = ref('')

function convertTsToDate() {
  tsError.value = ''
  tsResult.value = ''
  const raw = tsInput.value.trim()
  if (!raw) {
    tsError.value = t('tool.dateTimestamp.errorInvalidTs')
    return
  }
  const num = Number(raw)
  if (!Number.isFinite(num) || num < 0) {
    tsError.value = t('tool.dateTimestamp.errorInvalidTs')
    return
  }
  const ms = tsUnit.value === 's' ? num * 1000 : num
  try {
    tsResult.value = formatWithTz(ms, tsTimezone.value)
  } catch {
    tsError.value = t('tool.dateTimestamp.errorInvalidTs')
  }
}

// ─── Date → Timestamp ────────────────────────────────────────────────────────
function getCurrentLocalDateStr() {
  return formatWithTz(Date.now(), systemTimezone)
}

const dtInput = ref(getCurrentLocalDateStr())
const dtTimezone = ref(systemTimezone)
const dtUnit = ref<TimestampUnit>('s')
const dtResult = ref('')
const dtError = ref('')

function convertDateToTs() {
  dtError.value = ''
  dtResult.value = ''
  const raw = dtInput.value.trim()
  if (!raw) {
    dtError.value = t('tool.dateTimestamp.errorInvalidDate')
    return
  }
  try {
    // 1. Parse the input string as if it were UTC
    const naiveMs = Date.parse(raw.replace(' ', 'T') + 'Z')
    if (!Number.isFinite(naiveMs)) throw new Error('invalid')

    // 2. Format that instant in the target timezone to find the offset
    const formatted = formatWithTz(naiveMs, dtTimezone.value)

    // 3. Parse the formatted time as if it were UTC
    const formattedMs = Date.parse(formatted.replace(' ', 'T') + 'Z')

    // 4. Compute actual UTC: offset = naiveMs - formattedMs, utcMs = naiveMs + offset
    const offset = naiveMs - formattedMs
    const utcMs = naiveMs + offset

    dtResult.value = String(dtUnit.value === 's' ? Math.floor(utcMs / 1000) : utcMs)
  } catch {
    dtError.value = t('tool.dateTimestamp.errorInvalidDate')
  }
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const activeTab = ref<'single' | 'batch'>('single')

// ─── Lifecycle ───────────────────────────────────────────────────────────────
onMounted(() => {
  toolsStore.recordUsage(route.meta.toolKey as string)
  startTimer()
})

onUnmounted(() => {
  stopTimer()
})
</script>

<template>
  <div class="unix-timestamp-tool">
    <!-- ── Current Timestamp Card ── -->
    <el-card class="section-card" shadow="never">
      <div class="current-ts-label">{{ t('tool.dateTimestamp.currentTimestamp') }}</div>
      <div class="current-ts-value">
        <span class="ts-number">{{ currentTimestamp }}</span>
        <span class="ts-unit-label">
          {{ displayUnit === 's' ? t('tool.dateTimestamp.unitSecond') : t('tool.dateTimestamp.unitMs') }}
        </span>
      </div>
      <div class="current-ts-actions">
        <el-button @click="switchUnit">
          <el-icon>
            <RefreshRight />
          </el-icon>
          {{ t('tool.dateTimestamp.btnSwitchUnit') }}
        </el-button>
        <el-button @click="copyCurrentTimestamp">
          <el-icon>
            <CopyDocument />
          </el-icon>
          {{ t('common.btnCopy') }}
        </el-button>
        <el-button :type="isRunning ? 'danger' : 'primary'" @click="toggleRunning">
          <el-icon>
            <VideoPause v-if="isRunning" />
            <VideoPlay v-else />
          </el-icon>
          {{ isRunning ? t('tool.dateTimestamp.btnStop') : t('tool.dateTimestamp.btnStart') }}
        </el-button>
      </div>
    </el-card>

    <!-- ── Conversion Card ── -->
    <el-card class="section-card" shadow="never">
      <el-tabs v-model="activeTab">
        <!-- Single conversion tab -->
        <el-tab-pane :label="t('tool.dateTimestamp.tabSingle')" name="single">
          <!-- Timestamp → DateTime -->
          <div class="conv-section">
            <div class="conv-section-title">
              <el-icon>
                <Clock />
              </el-icon>
              {{ t('tool.dateTimestamp.sectionTsToDate') }}
            </div>
            <div class="conv-row">
              <el-input v-model="tsInput" :placeholder="t('tool.dateTimestamp.placeholderTs')" class="conv-input"
                clearable />
              <el-select v-model="tsUnit" style="width: 140px">
                <el-option value="ms" :label="t('tool.dateTimestamp.unitSelectMs')" />
                <el-option value="s" :label="t('tool.dateTimestamp.unitSelectSecond')" />
              </el-select>
              <el-button type="primary" @click="convertTsToDate">
                {{ t('tool.dateTimestamp.btnConvert') }}
              </el-button>
              <el-input :model-value="tsResult" :placeholder="t('tool.dateTimestamp.placeholderResult')" readonly
                class="conv-result" />
              <el-select v-model="tsTimezone" style="width: 190px">
                <el-option v-for="tz in TIMEZONE_LIST" :key="tz" :value="tz" :label="tz" />
              </el-select>
            </div>
            <div v-if="tsError" class="conv-error">{{ tsError }}</div>
          </div>

          <!-- DateTime → Timestamp -->
          <div class="conv-section">
            <div class="conv-section-title">
              <el-icon>
                <Calendar />
              </el-icon>
              {{ t('tool.dateTimestamp.sectionDateToTs') }}
            </div>
            <div class="conv-row">
              <el-input v-model="dtInput" :placeholder="t('tool.dateTimestamp.placeholderDate')" class="conv-input"
                clearable />
              <el-select v-model="dtTimezone" style="width: 190px">
                <el-option v-for="tz in TIMEZONE_LIST" :key="tz" :value="tz" :label="tz" />
              </el-select>
              <el-button type="primary" @click="convertDateToTs">
                {{ t('tool.dateTimestamp.btnConvert') }}
              </el-button>
              <el-input :model-value="dtResult" :placeholder="t('tool.dateTimestamp.placeholderResult')" readonly
                class="conv-result" />
              <el-select v-model="dtUnit" style="width: 140px">
                <el-option value="s" :label="t('tool.dateTimestamp.unitSelectSecond')" />
                <el-option value="ms" :label="t('tool.dateTimestamp.unitSelectMs')" />
              </el-select>
            </div>
            <div v-if="dtError" class="conv-error">{{ dtError }}</div>
          </div>
        </el-tab-pane>

        <!-- Batch conversion tab (placeholder) -->
        <el-tab-pane :label="t('tool.dateTimestamp.tabBatch')" name="batch">
          <div class="wip-placeholder">
            <el-icon class="wip-icon">
              <Clock />
            </el-icon>
            <p class="wip-text">{{ t('tool.wip') }}</p>
            <p class="wip-desc">{{ t('tool.wipDesc') }}</p>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.unix-timestamp-tool {
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

.current-ts-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  margin-bottom: 8px;
}

.current-ts-value {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 16px;
}

.ts-number {
  font-size: 36px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.5px;
}

.ts-unit-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.current-ts-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.conv-section {
  padding: 16px 0;

  &+& {
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

.conv-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;

  .el-icon {
    font-size: 16px;
    color: var(--el-color-primary);
  }
}

.conv-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.conv-input {
  flex: 1;
  min-width: 160px;
}

.conv-result {
  flex: 1;
  min-width: 160px;

  :deep(.el-input__wrapper) {
    background-color: var(--el-fill-color-light);
  }

  :deep(.el-input__inner) {
    color: var(--el-text-color-secondary);
  }
}

.conv-error {
  font-size: 13px;
  color: var(--el-color-danger);
  margin-top: 6px;
}

.wip-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: var(--el-text-color-secondary);
  gap: 8px;

  .wip-icon {
    font-size: 48px;
    color: var(--el-color-primary-light-5);
  }

  .wip-text {
    font-size: 16px;
    font-weight: 600;
  }

  .wip-desc {
    font-size: 13px;
    color: var(--el-text-color-placeholder);
  }
}
</style>
