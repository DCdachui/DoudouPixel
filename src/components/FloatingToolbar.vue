<template>
  <div v-if="isManualColoringMode" class="floating-toolbar">
    <!-- 功能按钮 - 竖着排列 -->
    <div class="toolbar-buttons">
      <button
        class="toolbar-btn"
        :class="{ 'active': isPaletteOpen }"
        @click="onTogglePalette"
        :title="isPaletteOpen ? '关闭调色盘' : '打开调色盘'"
      >
        <BgColorsOutlined />
      </button>

      <button
        class="toolbar-btn"
        :class="{ 'active': isMagnifierActive }"
        @click="onToggleMagnifier"
        :title="isMagnifierActive ? '关闭放大镜' : '打开放大镜'"
      >
        <SearchOutlined />
      </button>

      <button
        class="toolbar-btn exit-btn"
        @click="onExitManualMode"
        title="退出手动编辑模式"
      >
        <CloseOutlined />
      </button>
    </div>
    
    <!-- 调色板 - 放在按钮下方 -->
    <div v-if="isPaletteOpen" class="palette-slot">
      <slot name="palette"></slot>
    </div>
  </div>
</template>

<script>
import { BgColorsOutlined, SearchOutlined, CloseOutlined } from '@ant-design/icons-vue'

export default {
  name: 'FloatingToolbar',
  components: {
    BgColorsOutlined,
    SearchOutlined,
    CloseOutlined
  },
  props: {
    isManualColoringMode: {
      type: Boolean,
      default: false
    },
    isPaletteOpen: {
      type: Boolean,
      default: false
    },
    isMagnifierActive: {
      type: Boolean,
      default: false
    }
  },
  emits: ['toggle-palette', 'toggle-magnifier', 'exit-manual-mode'],
  setup(props, { emit }) {
    const onTogglePalette = () => {
      emit('toggle-palette')
    }

    const onToggleMagnifier = () => {
      emit('toggle-magnifier')
    }

    const onExitManualMode = () => {
      emit('exit-manual-mode')
    }

    return {
      onTogglePalette,
      onToggleMagnifier,
      onExitManualMode
    }
  }
}
</script>

<style scoped>
.floating-toolbar {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  max-width: 320px;
}

.toolbar-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  order: 1;
}

.palette-slot {
  width: 88px;
  order: 2;
  display: flex;
  justify-content: center;
}

/* 手机端适配 */
@media (max-width: 1023px) {
  .palette-slot {
    width: 70px;
  }
}

.toolbar-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #595959;
  font-size: 18px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.toolbar-btn:hover {
  background: rgba(24, 144, 255, 0.1);
  color: #1890ff;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
}

.toolbar-btn.active {
  background: #1890ff;
  color: white;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
}

.toolbar-btn.exit-btn {
  background: rgba(255, 77, 79, 0.1);
  color: #ff4d4f;
}

.toolbar-btn.exit-btn:hover {
  background: #ff4d4f;
  color: white;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.4);
}

.toolbar-btn:active {
  transform: scale(0.95);
}

/* 手机端适配 */
@media (max-width: 1023px) {
  .floating-toolbar {
    top: 8px;
    right: 8px;
    max-width: calc(100% - 16px);
  }
  
  .toolbar-btn {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
  
  .toolbar-buttons {
    gap: 8px;
  }
}
</style>

