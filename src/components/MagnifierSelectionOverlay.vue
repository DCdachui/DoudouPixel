<template>
  <template v-if="isActive">
    <!-- 覆盖层 -->
    <div
      ref="overlayRef"
      class="selection-overlay"
      @mousedown="handleMouseDown"
      @touchstart="handleTouchStart"
      @wheel.prevent
      @touchmove.prevent
      @scroll.prevent
    />
    
    <!-- 选择框 -->
    <div
      v-if="isSelecting && selectionStart && selectionEnd"
      :style="getSelectionStyle()"
    />
  </template>
</template>

<script>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { clientToGridCoords } from '../utils/canvasUtils'

export default {
  name: 'MagnifierSelectionOverlay',
  props: {
    isActive: {
      type: Boolean,
      default: false
    },
    canvasRef: {
      type: Object,
      default: null
    },
    gridDimensions: {
      type: Object,
      default: null
    },
    cellSize: {
      type: Number,
      default: 20
    }
  },
  emits: ['selection-complete'],
  setup(props, { emit }) {
    const overlayRef = ref(null)
    const isSelecting = ref(false)
    const selectionStart = ref(null)
    const selectionEnd = ref(null)
    const scrollDisabledRef = ref(false)

    const preventScrolling = (e) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const disableScroll = () => {
      if (scrollDisabledRef.current) return
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      document.addEventListener('wheel', preventScrolling, { passive: false })
      document.addEventListener('touchmove', preventScrolling, { passive: false })
      scrollDisabledRef.current = true
    }

    const enableScroll = () => {
      if (!scrollDisabledRef.current) return
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      document.removeEventListener('wheel', preventScrolling)
      document.removeEventListener('touchmove', preventScrolling)
      scrollDisabledRef.current = false
    }

    const getCanvasCoordinates = (clientX, clientY) => {
      if (!props.canvasRef?.value) return null
      const canvas = props.canvasRef.value
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const x = (clientX - rect.left) * scaleX
      const y = (clientY - rect.top) * scaleY
      return {
        x: Math.max(0, Math.min(canvas.width, x)),
        y: Math.max(0, Math.min(canvas.height, y))
      }
    }

    const pixelToGrid = (x, y) => {
      if (!props.gridDimensions || !props.canvasRef?.value) return null
      const canvas = props.canvasRef.value
      const canvasWidth = canvas.width
      const canvasHeight = canvas.height
      const cellWidth = canvasWidth / props.gridDimensions.N
      const cellHeight = canvasHeight / props.gridDimensions.M
      const col = Math.floor(x / cellWidth)
      const row = Math.floor(y / cellHeight)
      return {
        row: Math.max(0, Math.min(props.gridDimensions.M - 1, row)),
        col: Math.max(0, Math.min(props.gridDimensions.N - 1, col))
      }
    }

    const handleMouseDown = (event) => {
      if (!props.isActive) return
      const coords = getCanvasCoordinates(event.clientX, event.clientY)
      if (!coords) return
      isSelecting.value = true
      selectionStart.value = coords
      selectionEnd.value = coords
      disableScroll()
      event.preventDefault()
    }

    const handleMouseMove = (event) => {
      if (!isSelecting.value || !selectionStart.value) return
      const coords = getCanvasCoordinates(event.clientX, event.clientY)
      if (!coords) return
      selectionEnd.value = coords
    }

    const handleMouseUp = () => {
      if (!isSelecting.value || !selectionStart.value || !selectionEnd.value) {
        enableScroll()
        return
      }
      const startGrid = pixelToGrid(selectionStart.value.x, selectionStart.value.y)
      const endGrid = pixelToGrid(selectionEnd.value.x, selectionEnd.value.y)
      if (startGrid && endGrid) {
        const area = {
          startRow: Math.min(startGrid.row, endGrid.row),
          startCol: Math.min(startGrid.col, endGrid.col),
          endRow: Math.max(startGrid.row, endGrid.row),
          endCol: Math.max(startGrid.col, endGrid.col)
        }
        emit('selection-complete', area)
      }
      isSelecting.value = false
      selectionStart.value = null
      selectionEnd.value = null
      enableScroll()
    }

    const handleTouchStart = (event) => {
      if (!props.isActive) return
      event.preventDefault()
      event.stopPropagation()
      const touch = event.touches[0]
      if (!touch) return
      const coords = getCanvasCoordinates(touch.clientX, touch.clientY)
      if (!coords) return
      isSelecting.value = true
      selectionStart.value = coords
      selectionEnd.value = coords
      disableScroll()
    }

    const handleTouchMove = (event) => {
      if (!isSelecting.value || !selectionStart.value) return
      event.preventDefault()
      event.stopPropagation()
      const touch = event.touches[0]
      if (!touch) return
      const coords = getCanvasCoordinates(touch.clientX, touch.clientY)
      if (!coords) return
      selectionEnd.value = coords
    }

    const handleTouchEnd = () => {
      handleMouseUp()
    }

    watch(() => isSelecting.value, (newVal) => {
      if (newVal) {
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        document.addEventListener('touchmove', handleTouchMove)
        document.addEventListener('touchend', handleTouchEnd)
      } else {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
        enableScroll()
      }
    })

    watch(() => props.isActive, (newVal) => {
      if (!newVal) {
        enableScroll()
        isSelecting.value = false
        selectionStart.value = null
        selectionEnd.value = null
      }
    })

    const getSelectionStyle = () => {
      if (!selectionStart.value || !selectionEnd.value || !props.canvasRef?.value) return {}
      const canvas = props.canvasRef.value
      const rect = canvas.getBoundingClientRect()
      const scaleX = rect.width / canvas.width
      const scaleY = rect.height / canvas.height
      const screenStartX = selectionStart.value.x * scaleX
      const screenStartY = selectionStart.value.y * scaleY
      const screenEndX = selectionEnd.value.x * scaleX
      const screenEndY = selectionEnd.value.y * scaleY
      const minX = Math.min(screenStartX, screenEndX)
      const minY = Math.min(screenStartY, screenEndY)
      const maxX = Math.max(screenStartX, screenEndX)
      const maxY = Math.max(screenStartY, screenEndY)
      return {
        left: `${rect.left + minX}px`,
        top: `${rect.top + minY}px`,
        width: `${maxX - minX}px`,
        height: `${maxY - minY}px`,
        position: 'fixed',
        border: '2px solid #10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        pointerEvents: 'none',
        zIndex: 1000
      }
    }

    onMounted(() => {
      // 初始化
    })

    onUnmounted(() => {
      enableScroll()
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    })

    return {
      overlayRef,
      isSelecting,
      selectionStart,
      selectionEnd,
      handleMouseDown,
      handleTouchStart,
      getSelectionStyle
    }
  }
}
</script>

<style scoped>
.selection-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  cursor: crosshair;
}
</style>

