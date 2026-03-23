<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Grid, User } from '@element-plus/icons-vue'
const router = useRouter()

const { t } = useI18n()

/**
 * 路由到首页
 */
function goHome() {
  router.push('/')
}
</script>

<template>
  <el-header class="app-header">
    <div class="header-left cursor-pointer" @click="goHome">
      <el-icon class="app-icon" :size="28">
        <Grid />
      </el-icon>
      <span class="app-name">{{ t('app.name') }}</span>
    </div>
    <div class="header-right">
      <el-button type="default" :icon="User">
        {{ t('header.login') }}
      </el-button>
    </div>
  </el-header>
</template>

<style scoped lang="scss">
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: $app-header-height;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-icon {
  color: var(--el-color-primary);
}

.app-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  letter-spacing: 0.5px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
