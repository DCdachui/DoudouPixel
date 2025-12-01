<template>
  <div class="color-status-bar">
    <template v-if="!colorInfo">
      <div class="status-placeholder">请选择颜色</div>
    </template>
    
    <template v-else>
      <div class="status-content">
        <div class="status-left">
          <div
            class="color-circle"
            :style="{ backgroundColor: currentColor }"
          />
          <div class="color-name">{{ colorInfo.name }}</div>
          <div class="color-stats">
            <div class="stats-main">{{ colorInfo.completed }}/{{ colorInfo.total }}</div>
            <div class="stats-sub">预计还需 {{ estimatedTime }}分钟</div>
          </div>
        </div>
        
        <div class="status-right">
          <div class="progress-percentage">{{ progressPercentage }}%</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'ColorStatusBar',
  props: {
    currentColor: {
      type: String,
      required: true
    },
    colorInfo: {
      type: Object,
      default: null
    },
    progressPercentage: {
      type: Number,
      default: 0
    }
  },
  setup(props) {
    const estimatedTime = computed(() => {
      if (!props.colorInfo) return 0
      return Math.ceil((props.colorInfo.total - props.colorInfo.completed) * 0.1)
    })

    return {
      estimatedTime
    }
  }
}
</script>

<style scoped>
.color-status-bar {
  height: 48px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  padding: 8px 16px;
  display: flex;
  align-items: center;
}

.status-placeholder {
  color: #8c8c8c;
}

.status-content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #d9d9d9;
}

.color-name {
  font-size: 14px;
  font-family: monospace;
  font-weight: bold;
  color: #262626;
  padding: 0 8px;
}

.color-stats {
  display: flex;
  flex-direction: column;
}

.stats-main {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.stats-sub {
  font-size: 12px;
  color: #8c8c8c;
}

.status-right {
  text-align: right;
}

.progress-percentage {
  font-size: 18px;
  font-weight: bold;
  color: #1890ff;
}
</style>

