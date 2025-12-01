<template>
  <div class="color-palette-container">
    <template v-if="!colors || colors.length === 0">
      <p class="empty-message">当前图纸无可用颜色。</p>
    </template>
    
    <template v-else>
      <!-- 色板切换按钮区域 -->
      <div v-if="fullPaletteColors && fullPaletteColors.length > 0" class="palette-toggle-area">
        <button
          class="toggle-btn"
          :class="{ 'active': showFullPalette }"
          @click="handleToggleFullPalette"
        >
          <AppstoreOutlined v-if="!showFullPalette" />
          <FileTextOutlined v-else />
          <span>{{ showFullPalette ? '只显示图中颜色' : `展开完整色板 (${fullPaletteColors.length}色)` }}</span>
        </button>
      </div>
      
      <!-- 状态提示区域 -->
      <div v-if="colorReplaceState?.isActive || isEraseMode || (selectedColor?.key === transparentKey && !isEraseMode && !colorReplaceState?.isActive)" class="status-banner">
        <div v-if="colorReplaceState?.isActive" class="status-item info">
          <span class="status-text">
            {{ colorReplaceState.step === 'select-source' ? '步骤 1/2：点击图中要被替换的颜色' : `步骤 2/2：选择替换颜色 (被替换: ${getDisplayColorKey(colorReplaceState.sourceColor?.color || '', selectedColorSystem)})` }}
          </span>
        </div>
        <div v-else-if="isEraseMode" class="status-item warning">
          <span class="status-text">背景擦除模式：点击图中任意颜色，删除整个颜色块</span>
        </div>
        <div v-else-if="selectedColor?.key === transparentKey" class="status-item info">
          <span class="status-text">橡皮擦模式：点击图中任意位置清除单个格子</span>
        </div>
      </div>
      
      <!-- 功能按钮区域 - 置顶，圆球状 -->
      <div class="function-buttons">
        <button
          class="function-btn"
          :class="{ 'active': isEraseMode }"
          @click="handleEraseToggle"
          :title="isEraseMode ? '退出一键擦除模式' : '一键擦除'"
        >
          <DeleteOutlined />
        </button>
        
        <button
          class="function-btn"
          :class="{ 'active': colorReplaceState?.isActive }"
          @click="handleColorReplaceToggle"
          :title="colorReplaceState?.isActive ? '退出颜色替换模式' : '颜色替换'"
        >
          <SwapOutlined />
        </button>
      </div>
      
      <!-- 颜色按钮区域 - 单列布局，单个独立呈现 -->
      <div 
        ref="colorButtonsRef"
        class="color-buttons"
        @wheel="handleWheel"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <button
          v-for="colorData in colorsToShow"
          :key="colorData.key"
          class="color-btn"
          :class="{ 'selected': selectedColor?.key === colorData.key }"
          @click="handleColorSelect(colorData)"
          :title="getColorTitle(colorData)"
        >
          <template v-if="isTransparent(colorData)">
            <div class="color-ball eraser-ball">
              <CloseOutlined class="eraser-icon" />
            </div>
          </template>
          <template v-else>
            <div class="color-ball" :style="{ backgroundColor: colorData.color }">
              <span class="color-code">{{ getDisplayColorKey(colorData.color, selectedColorSystem) }}</span>
            </div>
          </template>
        </button>
      </div>
    </template>
  </div>
</template>

<script>
import { computed, ref } from 'vue'
import { getDisplayColorKey } from '../utils/colorSystemUtils'
import { FileTextOutlined, AppstoreOutlined, DeleteOutlined, SwapOutlined, CloseOutlined } from '@ant-design/icons-vue'

export default {
  name: 'ColorPalette',
  components: {
    FileTextOutlined,
    AppstoreOutlined,
    DeleteOutlined,
    SwapOutlined,
    CloseOutlined
  },
  props: {
    colors: {
      type: Array,
      default: () => []
    },
    selectedColor: {
      type: Object,
      default: null
    },
    transparentKey: {
      type: String,
      default: 'ERASE'
    },
    selectedColorSystem: {
      type: String,
      default: 'MARD'
    },
    isEraseMode: {
      type: Boolean,
      default: false
    },
    fullPaletteColors: {
      type: Array,
      default: null
    },
    showFullPalette: {
      type: Boolean,
      default: false
    },
    colorReplaceState: {
      type: Object,
      default: null
    }
  },
  emits: ['color-select', 'erase-toggle', 'highlight-color', 'toggle-full-palette', 'color-replace-toggle', 'color-replace'],
  setup(props, { emit }) {
    const colorButtonsRef = ref(null)
    const isHovering = ref(false)
    const colorsToShow = computed(() => {
      if (props.showFullPalette && props.fullPaletteColors) {
        const transparent = props.colors.find(c => props.transparentKey && c.key === props.transparentKey)
        return [transparent, ...props.fullPaletteColors].filter(Boolean)
      }
      return props.colors
    })

    const isTransparent = (colorData) => {
      return props.transparentKey && colorData.key === props.transparentKey
    }

    const getContrastColor = (hex) => {
      const rgb = {
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16)
      }
      const luma = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255
      return luma > 0.5 ? '#000000' : '#FFFFFF'
    }

    const getColorTitle = (colorData) => {
      if (isTransparent(colorData)) {
        return '选择橡皮擦 (清除单元格)'
      }
      const displayKey = getDisplayColorKey(colorData.color, props.selectedColorSystem)
      return `选择 ${displayKey} (${colorData.color})`
    }

    const handleColorSelect = (colorData) => {
      if (props.colorReplaceState?.isActive && props.colorReplaceState.step === 'select-target' && !isTransparent(colorData) && props.colorReplaceState.sourceColor) {
        emit('color-replace', props.colorReplaceState.sourceColor, colorData)
        return
      }
      
      emit('color-select', colorData)
      
      if (!isTransparent(colorData)) {
        emit('highlight-color', colorData.color)
      }
    }

    const handleEraseToggle = () => {
      emit('erase-toggle')
    }

    const handleToggleFullPalette = () => {
      emit('toggle-full-palette')
    }

    const handleColorReplaceToggle = () => {
      emit('color-replace-toggle')
    }

    // 处理鼠标滚轮事件 - 支持平滑滚动
    let scrollTimeout = null
    const handleWheel = (event) => {
      if (!colorButtonsRef.value) return
      
      // 阻止默认滚动行为
      event.preventDefault()
      event.stopPropagation()
      
      // 获取滚动容器
      const container = colorButtonsRef.value
      
      // 计算滚动距离（平滑滚动，根据滚动速度调整）
      const delta = event.deltaY
      const scrollAmount = delta * 0.6
      
      // 使用 requestAnimationFrame 实现平滑滚动
      if (scrollTimeout) {
        cancelAnimationFrame(scrollTimeout)
      }
      
      scrollTimeout = requestAnimationFrame(() => {
        container.scrollTop += scrollAmount
        
        // 限制滚动范围
        const maxScroll = container.scrollHeight - container.clientHeight
        if (container.scrollTop < 0) {
          container.scrollTop = 0
        } else if (container.scrollTop > maxScroll) {
          container.scrollTop = maxScroll
        }
      })
    }

    // 鼠标进入时添加样式类
    const handleMouseEnter = () => {
      isHovering.value = true
    }

    // 鼠标离开时移除样式类
    const handleMouseLeave = () => {
      isHovering.value = false
    }

    return {
      colorButtonsRef,
      isHovering,
      colorsToShow,
      isTransparent,
      getContrastColor,
      getColorTitle,
      getDisplayColorKey,
      handleColorSelect,
      handleEraseToggle,
      handleToggleFullPalette,
      handleColorReplaceToggle,
      handleWheel,
      handleMouseEnter,
      handleMouseLeave
    }
  }
}
</script>

<style scoped>
.color-palette-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.empty-message {
  text-align: center;
  color: #8c8c8c;
  padding: 24px;
  margin: 0;
  font-size: 14px;
}

.palette-toggle-area {
  padding: 10px 6px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: center;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%);
  backdrop-filter: blur(12px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 1.5px solid rgba(0, 0, 0, 0.12);
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
  color: #595959;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  width: 100%;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}

.toggle-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(24, 144, 255, 0.15);
}

.toggle-btn.active {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border-color: #1890ff;
  color: white;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.status-banner {
  padding: 6px 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.status-item {
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 10px;
  text-align: center;
  line-height: 1.4;
}

.status-item.info {
  background: #e6f7ff;
  color: #1890ff;
}

.status-item.warning {
  background: #fff7e6;
  color: #fa8c16;
}

.status-text {
  line-height: 1.5;
}

.function-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%);
  z-index: 10;
  align-items: center;
  backdrop-filter: blur(12px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.function-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2.5px solid rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #595959;
  font-size: 18px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12), 
              inset 0 1px 0 rgba(255, 255, 255, 0.6);
  padding: 0;
  position: relative;
  overflow: hidden;
}

.function-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 60%);
  pointer-events: none;
}

.function-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
  transform: scale(1.08) translateY(-2px);
  box-shadow: 0 6px 12px rgba(24, 144, 255, 0.25),
              inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.function-btn.active {
  background: #ff4d4f;
  border-color: #ff4d4f;
  color: white;
  box-shadow: 0 4px 12px rgba(255, 77, 79, 0.4);
}

.function-btn:active {
  transform: scale(0.95);
}

.color-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 12px 16px 12px;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  align-items: center;
  scroll-behavior: smooth;
  /* 自定义滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: rgba(24, 144, 255, 0.3) transparent;
  /* 添加顶部和底部渐变遮罩 */
  position: relative;
  /* 优化滚动性能 */
  -webkit-overflow-scrolling: touch;
  will-change: scroll-position;
  /* 鼠标悬停时显示滚动条 */
  transition: scrollbar-color 0.3s ease;
}

/* Webkit 滚动条样式 */
.color-buttons::-webkit-scrollbar {
  width: 5px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.color-buttons:hover::-webkit-scrollbar {
  opacity: 1;
}

.color-buttons::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 10px;
  margin: 8px 0;
}

.color-buttons::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(24, 144, 255, 0.5) 0%, rgba(24, 144, 255, 0.3) 100%);
  border-radius: 10px;
  transition: background 0.3s ease;
}

.color-buttons::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(24, 144, 255, 0.7) 0%, rgba(24, 144, 255, 0.5) 100%);
}

.color-buttons::before,
.color-buttons::after {
  content: '';
  position: sticky;
  left: 0;
  right: 0;
  height: 24px;
  pointer-events: none;
  z-index: 1;
  flex-shrink: 0;
}

.color-buttons::before {
  top: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.6) 40%, rgba(255, 255, 255, 0.2) 70%, transparent 100%);
  margin-bottom: -24px;
  border-radius: 0 0 12px 12px;
}

.color-buttons::after {
  bottom: 0;
  background: linear-gradient(0deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.6) 40%, rgba(255, 255, 255, 0.2) 70%, transparent 100%);
  margin-top: -24px;
  border-radius: 12px 12px 0 0;
}

.color-btn {
  width: 64px;
  height: 64px;
  border: none;
  background: transparent;
  border-radius: 50%;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
  position: relative;
  flex-shrink: 0;
}

.color-btn:hover {
  transform: scale(1.08);
}

.color-btn:hover .color-ball {
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3), 
              0 2px 6px rgba(0, 0, 0, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.5),
              inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  border-color: rgba(255, 255, 255, 1);
  transform: translateY(-2px);
}

.color-btn.selected {
  transform: scale(1.12);
}

.color-btn.selected .color-ball {
  box-shadow: 0 0 0 4px rgba(24, 144, 255, 0.5), 
              0 0 0 8px rgba(24, 144, 255, 0.2), 
              0 8px 24px rgba(24, 144, 255, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.5);
  border-color: rgba(255, 255, 255, 1);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(24, 144, 255, 0.5), 
                0 0 0 8px rgba(24, 144, 255, 0.2), 
                0 8px 24px rgba(24, 144, 255, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.5);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(24, 144, 255, 0.6), 
                0 0 0 8px rgba(24, 144, 255, 0.3), 
                0 8px 28px rgba(24, 144, 255, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.5);
  }
}

.color-ball {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.18), 
              0 1px 3px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.4),
              inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  position: relative;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.color-ball::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3) 0%, transparent 50%);
  pointer-events: none;
}

.color-ball .color-code {
  font-size: 11px;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6), 0 0 2px rgba(0, 0, 0, 0.8);
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  line-height: 1;
  letter-spacing: 0.5px;
}

.eraser-ball {
  background: linear-gradient(45deg, #e0e0e0 25%, transparent 25%, transparent 75%, #e0e0e0 75%, #e0e0e0), 
              linear-gradient(-45deg, #e0e0e0 25%, transparent 25%, transparent 75%, #e0e0e0 75%, #e0e0e0);
  background-size: 10px 10px;
  background-position: 0 0, 5px 5px;
  border-color: #999;
}

.eraser-icon {
  color: #666;
  font-size: 22px;
}

/* 手机端适配 */
@media (max-width: 1023px) {
  .color-btn {
    width: 56px;
    height: 56px;
  }
  
  .color-ball {
    width: 56px;
    height: 56px;
  }
  
  .color-ball .color-code {
    font-size: 9px;
  }
  
  .function-btn {
    width: 44px;
    height: 44px;
    font-size: 16px;
  }
  
  .color-buttons {
    gap: 8px;
    padding: 10px 6px;
  }
}
</style>

