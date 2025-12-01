<template>
  <template v-if="isActive">
    <!-- 选择区域提示 -->
    <div v-if="!selectionArea" class="magnifier-hint">
      <SearchOutlined />
      <span>在画布上拖拽选择要放大的区域</span>
    </div>

    <!-- 放大视图窗口 -->
    <div
      v-if="selectionArea"
      ref="magnifierRef"
      class="magnifier-window"
      :class="{ 'active': isFloatingActive }"
      :style="{
        left: `${magnifierPosition.x}px`,
        top: `${magnifierPosition.y}px`,
        zIndex: isFloatingActive ? 60 : 50
      }"
      @click="handleActivateFloating"
    >
      <!-- 标题栏 -->
      <div
        class="magnifier-header"
        @mousedown="handleTitleBarMouseDown"
        @touchstart="handleTitleBarTouchStart"
      >
        <div class="header-left">
          <SearchOutlined />
          <span>放大镜 ({{ getSelectionDimensions().width }}×{{ getSelectionDimensions().height }})</span>
        </div>
        
        <div class="header-right">
          <a-button
            type="text"
            size="small"
            @click="handleClearSelection"
            title="重新选择区域"
          >
            <template #icon>
              <ReloadOutlined />
            </template>
          </a-button>
          
          <a-button
            type="text"
            size="small"
            @click="handleToggle"
            title="关闭放大镜"
          >
            <template #icon>
              <CloseOutlined />
            </template>
          </a-button>
        </div>
      </div>

      <!-- 放大视图内容 -->
      <div class="magnifier-content">
        <div class="canvas-container">
          <canvas
            ref="canvasRef"
            @click="handleMagnifiedClick"
            class="magnifier-canvas"
          />
        </div>
        
        <!-- 当前选中颜色信息 -->
        <div v-if="selectedColor" class="color-info">
          <div class="color-swatch" :style="{ backgroundColor: selectedColor.color }" />
          <span>当前: {{ getColorKeyByHex(selectedColor.color, selectedColorSystem) }}</span>
        </div>
      </div>
    </div>
  </template>
</template>

<script>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { getColorKeyByHex } from '../utils/colorSystemUtils'
import { SearchOutlined, ReloadOutlined, CloseOutlined } from '@ant-design/icons-vue'

export default {
  name: 'MagnifierTool',
  components: {
    SearchOutlined,
    ReloadOutlined,
    CloseOutlined
  },
  props: {
    isActive: {
      type: Boolean,
      default: false
    },
    mappedPixelData: {
      type: Array,
      default: null
    },
    gridDimensions: {
      type: Object,
      default: null
    },
    selectedColor: {
      type: Object,
      default: null
    },
    selectedColorSystem: {
      type: String,
      default: 'MARD'
    },
    cellSize: {
      type: Number,
      default: 20
    },
    selectionArea: {
      type: Object,
      default: null
    },
    isFloatingActive: {
      type: Boolean,
      default: false
    },
    highlightColorKey: {
      type: String,
      default: null
    }
  },
  emits: ['toggle', 'pixel-edit', 'clear-selection', 'activate-floating'],
  setup(props, { emit }) {
    const magnifierRef = ref(null)
    const canvasRef = ref(null)
    const isDragging = ref(false)
    const dragOffset = ref({ x: 0, y: 0 })

    const getInitialPosition = () => ({
      x: Math.max(50, (window.innerWidth - 400) / 2),
      y: Math.max(50, (window.innerHeight - 400) / 2)
    })

    const magnifierPosition = ref(getInitialPosition())

    watch(() => props.isActive, (newVal) => {
      if (newVal) {
        magnifierPosition.value = getInitialPosition()
      }
    })

    const getSelectionDimensions = () => {
      if (!props.selectionArea) return { width: 0, height: 0 }
      return {
        width: Math.abs(props.selectionArea.endCol - props.selectionArea.startCol) + 1,
        height: Math.abs(props.selectionArea.endRow - props.selectionArea.startRow) + 1
      }
    }

    const renderMagnifiedView = () => {
      if (!props.selectionArea || !props.mappedPixelData || !canvasRef.value) return

      const canvas = canvasRef.value
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const { width, height } = getSelectionDimensions()
      const magnifiedCellSize = 20

      canvas.width = width * magnifiedCellSize
      canvas.height = height * magnifiedCellSize
      canvas.style.width = `${canvas.width}px`
      canvas.style.height = `${canvas.height}px`

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const startRow = Math.min(props.selectionArea.startRow, props.selectionArea.endRow)
      const endRow = Math.max(props.selectionArea.startRow, props.selectionArea.endRow)
      const startCol = Math.min(props.selectionArea.startCol, props.selectionArea.endCol)
      const endCol = Math.max(props.selectionArea.startCol, props.selectionArea.endCol)

      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          if (row >= 0 && row < props.mappedPixelData.length && col >= 0 && col < props.mappedPixelData[0].length) {
            const pixel = props.mappedPixelData[row][col]
            const canvasRow = row - startRow
            const canvasCol = col - startCol

            ctx.fillStyle = pixel.color
            ctx.fillRect(
              canvasCol * magnifiedCellSize,
              canvasRow * magnifiedCellSize,
              magnifiedCellSize,
              magnifiedCellSize
            )

            if (props.highlightColorKey && pixel.color.toUpperCase() !== props.highlightColorKey.toUpperCase()) {
              ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
              ctx.fillRect(
                canvasCol * magnifiedCellSize,
                canvasRow * magnifiedCellSize,
                magnifiedCellSize,
                magnifiedCellSize
              )
            }

            ctx.strokeStyle = '#e0e0e0'
            ctx.lineWidth = 1
            ctx.strokeRect(
              canvasCol * magnifiedCellSize,
              canvasRow * magnifiedCellSize,
              magnifiedCellSize,
              magnifiedCellSize
            )
          }
        }
      }
    }

    const handleMagnifiedClick = (event) => {
      if (!props.selectionArea || !props.mappedPixelData || !props.selectedColor || !canvasRef.value) return

      const canvas = canvasRef.value
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const x = (event.clientX - rect.left) * scaleX
      const y = (event.clientY - rect.top) * scaleY

      const magnifiedCellSize = 20
      const clickedCol = Math.floor(x / magnifiedCellSize)
      const clickedRow = Math.floor(y / magnifiedCellSize)

      const startRow = Math.min(props.selectionArea.startRow, props.selectionArea.endRow)
      const startCol = Math.min(props.selectionArea.startCol, props.selectionArea.endCol)
      const actualRow = startRow + clickedRow
      const actualCol = startCol + clickedCol

      if (actualRow >= 0 && actualRow < props.mappedPixelData.length && 
          actualCol >= 0 && actualCol < props.mappedPixelData[0].length) {
        emit('pixel-edit', actualRow, actualCol, props.selectedColor)
      }
    }

    const handleTitleBarMouseDown = (event) => {
      const target = event.target
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        return
      }
      
      if (magnifierRef.value) {
        const rect = magnifierRef.value.getBoundingClientRect()
        dragOffset.value = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        }
      }
      
      emit('activate-floating')
      isDragging.value = true
      document.body.style.overflow = 'hidden'
      event.preventDefault()
    }

    const handleTitleBarTouchStart = (event) => {
      const target = event.target
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        return
      }
      
      const touch = event.touches[0]
      if (!touch) return
      
      if (magnifierRef.value) {
        const rect = magnifierRef.value.getBoundingClientRect()
        dragOffset.value = {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top
        }
      }
      
      emit('activate-floating')
      isDragging.value = true
      document.body.style.overflow = 'hidden'
      event.preventDefault()
    }

    const handleMouseMove = (event) => {
      if (isDragging.value) {
        event.preventDefault()
        event.stopPropagation()
        const newX = event.clientX - dragOffset.value.x
        const newY = event.clientY - dragOffset.value.y
        magnifierPosition.value = { x: newX, y: newY }
      }
    }

    const handleTouchMove = (event) => {
      if (isDragging.value) {
        event.preventDefault()
        event.stopPropagation()
        const touch = event.touches[0]
        if (!touch) return
        const newX = touch.clientX - dragOffset.value.x
        const newY = touch.clientY - dragOffset.value.y
        magnifierPosition.value = { x: newX, y: newY }
      }
    }

    const handleMouseUp = () => {
      isDragging.value = false
      document.body.style.overflow = ''
    }

    const handleTouchEnd = () => {
      isDragging.value = false
      document.body.style.overflow = ''
    }

    watch(() => isDragging.value, (newVal) => {
      if (newVal) {
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        document.addEventListener('touchmove', handleTouchMove, { passive: false })
        document.addEventListener('touchend', handleTouchEnd)
      } else {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
        document.body.style.overflow = ''
      }
    })

    watch(
      [() => props.selectionArea, () => props.mappedPixelData, () => props.highlightColorKey],
      () => {
        nextTick(() => {
          renderMagnifiedView()
        })
      },
      { deep: true }
    )

    const handleToggle = () => {
      emit('toggle')
    }

    const handleClearSelection = () => {
      emit('clear-selection')
    }

    const handleActivateFloating = () => {
      emit('activate-floating')
    }

    onMounted(() => {
      renderMagnifiedView()
    })

    onUnmounted(() => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      document.body.style.overflow = ''
    })

    return {
      magnifierRef,
      canvasRef,
      magnifierPosition,
      getSelectionDimensions,
      handleMagnifiedClick,
      handleTitleBarMouseDown,
      handleTitleBarTouchStart,
      handleToggle,
      handleClearSelection,
      handleActivateFloating,
      getColorKeyByHex
    }
  }
}
</script>

<style scoped>
.magnifier-hint {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: #1890ff;
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 70;
  display: flex;
  align-items: center;
  gap: 8px;
}

.magnifier-window {
  position: fixed;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  border: 1px solid #e8e8e8;
  user-select: none;
}

.magnifier-window.active {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
}

.magnifier-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: linear-gradient(to right, #52c41a, #13c2c2);
  color: white;
  border-radius: 12px 12px 0 0;
  cursor: move;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.magnifier-content {
  padding: 12px;
}

.canvas-container {
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  overflow: auto;
  max-height: 384px;
}

.magnifier-canvas {
  display: block;
  cursor: crosshair;
}

.color-info {
  margin-top: 8px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.color-swatch {
  width: 16px;
  height: 16px;
  border-radius: 2px;
  border: 1px solid #d9d9d9;
}
</style>

