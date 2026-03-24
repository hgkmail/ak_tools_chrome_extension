<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const tableData = computed(() => [
  {
    field: t('tool.dateCron.doc.fieldSeconds'),
    required: t('tool.dateCron.doc.yes'),
    allowedValues: '0-59',
    specialChars: ['*', ',', '-'],
    notes: [t('tool.dateCron.doc.noteStandardUnsupported')],
  },
  {
    field: t('tool.dateCron.doc.fieldMinutes'),
    required: t('tool.dateCron.doc.yes'),
    allowedValues: '0-59',
    specialChars: ['*', ',', '-'],
    notes: [],
  },
  {
    field: t('tool.dateCron.doc.fieldHours'),
    required: t('tool.dateCron.doc.yes'),
    allowedValues: '0-23',
    specialChars: ['*', ',', '-'],
    notes: [],
  },
  {
    field: t('tool.dateCron.doc.fieldDayOfMonth'),
    required: t('tool.dateCron.doc.yes'),
    allowedValues: '1-31',
    specialChars: ['*', ',', '-', '?', 'L', 'W'],
    notes: [t('tool.dateCron.doc.noteDayOfMonthSpecial')],
  },
  {
    field: t('tool.dateCron.doc.fieldMonth'),
    required: t('tool.dateCron.doc.yes'),
    allowedValues: `1-12 ${t('tool.dateCron.doc.rangeOr')} JAN-DEC`,
    specialChars: ['*', ',', '-'],
    notes: [],
  },
  {
    field: t('tool.dateCron.doc.fieldDayOfWeek'),
    required: t('tool.dateCron.doc.yes'),
    allowedValues: `0-7 ${t('tool.dateCron.doc.rangeOr')} SUN-SAT`,
    specialChars: ['*', ',', '-', '?', 'L', '#'],
    notes: [
      t('tool.dateCron.doc.noteDayOfWeekLine1'),
      t('tool.dateCron.doc.noteDayOfWeekLine2'),
      t('tool.dateCron.doc.noteDayOfWeekLine3'),
    ],
  },
  {
    field: t('tool.dateCron.doc.fieldYear'),
    required: t('tool.dateCron.doc.no'),
    allowedValues: '1970-2099',
    specialChars: ['*', ',', '-'],
    notes: [t('tool.dateCron.doc.noteStandardUnsupported')],
  },
])

const standardDescs = computed(() => [
  t('tool.dateCron.doc.commaDesc'),
  t('tool.dateCron.doc.hyphenDesc'),
  t('tool.dateCron.doc.percentDesc'),
])

const nonStandardDescs = computed(() => [
  t('tool.dateCron.doc.lDesc'),
  t('tool.dateCron.doc.wDesc'),
  t('tool.dateCron.doc.hashDesc'),
  t('tool.dateCron.doc.questionDesc'),
  t('tool.dateCron.doc.minuteStepDesc'),
])
</script>

<template>
  <div class="cron-doc">
    <el-table :data="tableData" border size="small" class="doc-table">
      <el-table-column prop="field" :label="t('tool.dateCron.doc.colField')" min-width="110" />
      <el-table-column prop="required" :label="t('tool.dateCron.doc.colRequired')" width="88" align="center" />
      <el-table-column prop="allowedValues" :label="t('tool.dateCron.doc.colAllowedValues')" min-width="150" />
      <el-table-column :label="t('tool.dateCron.doc.colSpecialChars')" min-width="170">
        <template #default="{ row }">
          <span v-for="(char, i) in row.specialChars" :key="char"><code v-if="(i as number) > 0"
              class="char-sep"> , </code><code class="char-code">{{ char }}</code></span>
        </template>
      </el-table-column>
      <el-table-column :label="t('tool.dateCron.doc.colNotes')" min-width="200">
        <template #default="{ row }">
          <div v-for="(note, i) in row.notes" :key="i" class="note-line">
            {{ note }}
          </div>
        </template>
      </el-table-column>
    </el-table>

    <div class="doc-section">
      <div class="section-title">{{ t('tool.dateCron.doc.sectionStandard') }}</div>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <p v-for="(desc, i) in standardDescs" :key="i" class="doc-paragraph" v-html="desc" />
    </div>

    <div class="doc-section">
      <div class="section-title">{{ t('tool.dateCron.doc.sectionNonStandard') }}</div>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <p v-for="(desc, i) in nonStandardDescs" :key="i" class="doc-paragraph" v-html="desc" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.cron-doc {
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.doc-table {
  width: 100%;

  :deep(td .cell),
  :deep(th .cell) {
    font-size: 13px;
    line-height: 1.6;
  }
}

.char-code {
  font-family: Monaco, Menlo, Consolas, monospace;
  font-size: 12px;
  padding: 1px 4px;
  border-radius: 3px;
  background-color: var(--el-fill-color);
  color: var(--el-text-color-primary);
}

.char-sep {
  font-family: Monaco, Menlo, Consolas, monospace;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: none;
  padding: 0;
}

.note-line {
  font-size: 13px;
  line-height: 1.6;

  &+& {
    margin-top: 4px;
  }
}

.doc-section {
  margin-top: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin-bottom: 10px;
}

.doc-paragraph {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.75;
  color: var(--el-text-color-regular);

  &:last-child {
    margin-bottom: 0;
  }

  :deep(code) {
    font-family: Monaco, Menlo, Consolas, monospace;
    font-size: 12px;
    padding: 1px 4px;
    border-radius: 3px;
    background-color: var(--el-fill-color);
    color: var(--el-text-color-primary);
  }
}
</style>
