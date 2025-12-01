<template>
  <a-drawer
    v-model:open="isOpen"
    title="颜色选择"
    placement="bottom"
    :height="600"
    @close="handleClose"
  >
    <a-input-search
      v-model:value="searchTerm"
      placeholder="搜索颜色..."
      style="margin-bottom: 16px"
    />

    <a-select
      v-model:value="sortBy"
      style="width: 100%; margin-bottom: 16px"
    >
      <a-select-option value="progress">按进度排序</a-select-option>
      <a-select-option value="name">按名称排序</a-select-option>
      <a-select-option value="total">按数量排序</a-select-option>
    </a-select>

    <div class="color-list">
      <a-card
        v-for="colorInfo in filteredAndSortedColors"
        :key="colorInfo.color"
        :class="['color-card', { 'selected': colorInfo.color === currentColor, 'completed': isCompleted(colorInfo) }]"
        @click="handleColorSelect(colorInfo.color)"
      >
        <div class="color-card-content">
          <div class="color-circle" :style="{ backgroundColor: colorInfo.color }" />
          <div class="color-info">
            <div class="color-name">{{ colorInfo.name }}</div>
            <div class="color-stats">
              {{ colorInfo.completed }}/{{ colorInfo.total }} ({{ getProgressPercentage(colorInfo) }}%)
            </div>
          </div>
          <div class="color-status">
            <CheckCircleOutlined v-if="isCompleted(colorInfo)" class="completed-icon" />
            <CheckOutlined v-if="colorInfo.color === currentColor" class="selected-icon" />
          </div>
        </div>
        <a-progress
          :percent="getProgressPercentage(colorInfo)"
          :stroke-color="isCompleted(colorInfo) ? '#52c41a' : '#1890ff'"
          :show-info="false"
        />
      </a-card>
    </div>
  </a-drawer>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { CheckCircleOutlined, CheckOutlined } from '@ant-design/icons-vue'

export default {
  name: 'ColorPanel',
  components: {
    CheckCircleOutlined,
    CheckOutlined
  },
  props: {
    open: {
      type: Boolean,
      default: false
    },
    colors: {
      type: Array,
      required: true
    },
    currentColor: {
      type: String,
      required: true
    }
  },
  emits: ['update:open', 'color-select', 'close'],
  setup(props, { emit }) {
    const isOpen = ref(props.open)
    const searchTerm = ref('')
    const sortBy = ref('progress')

    watch(() => props.open, (newVal) => {
      isOpen.value = newVal
    })

    const filteredAndSortedColors = computed(() => {
      return props.colors
        .filter(color => 
          color.name.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
          color.color.toLowerCase().includes(searchTerm.value.toLowerCase())
        )
        .sort((a, b) => {
          switch (sortBy.value) {
            case 'progress':
              const progressA = (a.completed / a.total) * 100
              const progressB = (b.completed / b.total) * 100
              return progressA - progressB
            case 'name':
              return a.name.localeCompare(b.name)
            case 'total':
              return b.total - a.total
            default:
              return 0
          }
        })
    })

    const getProgressPercentage = (colorInfo) => {
      return Math.round((colorInfo.completed / colorInfo.total) * 100)
    }

    const isCompleted = (colorInfo) => {
      return getProgressPercentage(colorInfo) === 100
    }

    const handleColorSelect = (color) => {
      emit('color-select', color)
    }

    const handleClose = () => {
      isOpen.value = false
      emit('update:open', false)
      emit('close')
    }

    return {
      isOpen,
      searchTerm,
      sortBy,
      filteredAndSortedColors,
      getProgressPercentage,
      isCompleted,
      handleColorSelect,
      handleClose
    }
  }
}
</script>

<style scoped>
.color-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.color-card {
  cursor: pointer;
  transition: all 0.2s;
}

.color-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.color-card.selected {
  border-color: #1890ff;
  background-color: #e6f7ff;
}

.color-card.completed {
  opacity: 0.6;
}

.color-card-content {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.color-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #d9d9d9;
  flex-shrink: 0;
}

.color-info {
  flex: 1;
  text-align: left;
}

.color-name {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  font-family: monospace;
  margin-bottom: 4px;
}

.color-stats {
  font-size: 12px;
  color: #8c8c8c;
}

.color-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.completed-icon {
  color: #52c41a;
  font-size: 20px;
}

.selected-icon {
  color: #1890ff;
  font-size: 20px;
}
</style>

