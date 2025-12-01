<template>
  <div class="progress-bar">
    <div class="progress-left">
      <div
        v-for="(dot, index) in progressDots"
        :key="index"
        class="progress-dot"
        :class="{ 'filled': dot.isFilled }"
      />
      <span class="progress-text">{{ progressPercentage }}%</span>
    </div>
    
    <div class="progress-right">
      <span v-if="recommendedCell" class="recommend-text">
        下一块 → {{ recommendedCell.row + 1 }},{{ recommendedCell.col + 1 }}
      </span>
      <span v-else class="recommend-text">已完成当前颜色</span>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'ProgressBar',
  props: {
    progressPercentage: {
      type: Number,
      default: 0
    },
    recommendedCell: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    const progressDots = computed(() => {
      return Array.from({ length: 7 }, (_, index) => {
        const threshold = (index + 1) * (100 / 7)
        return {
          isFilled: props.progressPercentage >= threshold
        }
      })
    })

    return {
      progressDots
    }
  }
}
</script>

<style scoped>
.progress-bar {
  height: 40px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.progress-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #d9d9d9;
}

.progress-dot.filled {
  background: #1890ff;
}

.progress-text {
  margin-left: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.progress-right {
  font-size: 12px;
  color: #8c8c8c;
}

.recommend-text {
  font-size: 12px;
  color: #8c8c8c;
}
</style>

