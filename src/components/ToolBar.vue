<template>
  <div class="toolbar">
    <a-button type="text" class="toolbar-btn" @click="handleColorSelect">
      <template #icon>
        <BgColorsOutlined />
      </template>
      <span>颜色</span>
    </a-button>

    <a-button type="text" class="toolbar-btn" @click="handleLocate">
      <template #icon>
        <EnvironmentOutlined />
      </template>
      <span>定位</span>
    </a-button>

    <a-button
      type="text"
      class="toolbar-btn"
      :class="{ 'paused': isPaused }"
      @click="handlePause"
    >
      <template #icon>
        <PauseCircleOutlined v-if="!isPaused" />
        <PlayCircleOutlined v-else />
      </template>
      <span class="time-text">{{ elapsedTime }}</span>
    </a-button>
  </div>
</template>

<script>
import { BgColorsOutlined, EnvironmentOutlined, PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons-vue'

export default {
  name: 'ToolBar',
  components: {
    BgColorsOutlined,
    EnvironmentOutlined,
    PauseCircleOutlined,
    PlayCircleOutlined
  },
  props: {
    isPaused: {
      type: Boolean,
      default: false
    },
    elapsedTime: {
      type: String,
      default: '00:00'
    }
  },
  emits: ['color-select', 'locate', 'pause'],
  setup(props, { emit }) {
    const handleColorSelect = () => {
      emit('color-select')
    }

    const handleLocate = () => {
      emit('locate')
    }

    const handlePause = () => {
      emit('pause')
    }

    return {
      handleColorSelect,
      handleLocate,
      handlePause
    }
  }
}
</script>

<style scoped>
.toolbar {
  height: 60px;
  background: white;
  border-top: 1px solid #e8e8e8;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-around;
}

.toolbar-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #595959;
}

.toolbar-btn:hover {
  color: #1890ff;
}

.toolbar-btn.paused {
  color: #52c41a;
}

.time-text {
  font-family: monospace;
  font-size: 12px;
}
</style>

