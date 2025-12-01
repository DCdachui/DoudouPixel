<template>
  <canvas
    ref="canvasRef"
    :width="canvasWidth"
    :height="canvasHeight"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
    @click="handleClick"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    class="pixelated-canvas"
  ></canvas>
</template>

<script>
import { ref, watch, nextTick, onMounted } from 'vue'

export default {
  name: 'PixelatedPreviewCanvas',
  props: {
    mappedPixelData: {
      type: Array,
      default: null
    },
    gridDimensions: {
      type: Object,
      default: null
    },
    isManualColoringMode: {
      type: Boolean,
      default: false
    },
    highlightColorKey: {
      type: String,
      default: null
    }
  },
  emits: ['interaction', 'highlight-complete'],
  setup(props, { emit }) {
    const canvasRef = ref(null)
    const canvasWidth = ref(800)
    const canvasHeight = ref(600)
    const touchStartPosRef = ref(null)
    const touchMovedRef = ref(false)
    const isHighlighting = ref(false)
    
    // 组件挂载时输出日志
    console.log('PixelatedPreviewCanvas setup called:', {
      hasMappedPixelData: !!props.mappedPixelData,
      mappedPixelDataRows: props.mappedPixelData?.length,
      hasGridDimensions: !!props.gridDimensions,
      gridDimensions: props.gridDimensions
    });
    
    // 计算画布尺寸的函数
    const calculateCanvasSize = () => {
      const isMobile = window.innerWidth < 1024;
      const { N, M } = props.gridDimensions;
      const aspectRatio = N / M;
      
      let maxSize;
      if (isMobile) {
        // 手机端：使用屏幕宽度减去边距，但确保最小尺寸
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const padding = 40; // 左右边距
        const headerHeight = 48; // 头部高度
        const footerHeight = 32; // 底部高度
        const controlPanelHeight = screenHeight * 0.55; // 控制面板高度
        const availableHeight = screenHeight - headerHeight - controlPanelHeight - footerHeight - 20; // 可用高度
        const availableWidth = screenWidth - padding; // 可用宽度
        
        // 根据宽高比和可用空间计算合适的尺寸
        if (aspectRatio > 1) {
          // 横向图片
          maxSize = Math.min(availableWidth, availableHeight * aspectRatio);
        } else {
          // 纵向图片
          maxSize = Math.min(availableWidth / aspectRatio, availableHeight);
        }
        // 确保最小尺寸，但不超过屏幕宽度
        maxSize = Math.max(Math.min(maxSize, availableWidth), 200);
      } else {
        // PC端：保持原有逻辑
        maxSize = Math.max(window.innerWidth - 100, 600);
      }
      
      let newWidth, newHeight;
      if (aspectRatio > 1) {
        newWidth = maxSize;
        newHeight = maxSize / aspectRatio;
      } else {
        newHeight = maxSize;
        newWidth = maxSize * aspectRatio;
      }
      
      return { newWidth, newHeight };
    };

    // 使用 onMounted 确保组件已挂载
    onMounted(() => {
      console.log('PixelatedPreviewCanvas mounted:', {
        hasCanvasRef: !!canvasRef.value,
        canvasWidth: canvasWidth.value,
        canvasHeight: canvasHeight.value,
        hasMappedPixelData: !!props.mappedPixelData,
        hasGridDimensions: !!props.gridDimensions
      });
      
      // 如果数据已经存在，立即绘制
      if (props.mappedPixelData && props.gridDimensions && canvasRef.value) {
        console.log('PixelatedPreviewCanvas: Data available on mount, drawing immediately');
        const { newWidth, newHeight } = calculateCanvasSize();
        
        canvasWidth.value = newWidth;
        canvasHeight.value = newHeight;
        
        nextTick(() => {
          if (canvasRef.value) {
            canvasRef.value.width = newWidth;
            canvasRef.value.height = newHeight;
            drawPixelatedCanvas(
              props.mappedPixelData,
              canvasRef.value,
              props.gridDimensions,
              props.highlightColorKey,
              isHighlighting.value
            );
          }
        });
      }
    });

    // 绘制像素化画布的函数
    const drawPixelatedCanvas = (dataToDraw, canvas, dims, highlightColorKey, isHighlighting) => {
      if (!canvas || !dims || !dataToDraw) {
        console.warn("drawPixelatedCanvas: Missing required parameters", { canvas: !!canvas, dims, dataToDraw: !!dataToDraw })
        return
      }
      
      const pixelatedCtx = canvas.getContext('2d', { alpha: true })
      if (!pixelatedCtx) {
        console.error("Failed to get 2D context for pixelated canvas")
        return
      }

      // 禁用图像平滑，确保像素完美渲染
      pixelatedCtx.imageSmoothingEnabled = false
      pixelatedCtx.webkitImageSmoothingEnabled = false
      pixelatedCtx.mozImageSmoothingEnabled = false
      pixelatedCtx.msImageSmoothingEnabled = false

      const { N, M } = dims
      const outputWidth = canvas.width
      const outputHeight = canvas.height
      const cellWidthOutput = outputWidth / N
      const cellHeightOutput = outputHeight / M

      console.log('开始绘制画布:', { N, M, outputWidth, outputHeight, cellWidthOutput, cellHeightOutput, dataRows: dataToDraw.length })

      // 填充纯白背景
      pixelatedCtx.fillStyle = '#FFFFFF'
      pixelatedCtx.fillRect(0, 0, outputWidth, outputHeight)

      pixelatedCtx.lineWidth = 1
      pixelatedCtx.strokeStyle = 'rgba(0,0,0,0.02)' // 极浅的网格线，几乎不可见

      let drawnCells = 0
      for (let j = 0; j < M; j++) {
        for (let i = 0; i < N; i++) {
          const cellData = dataToDraw[j]?.[i]
          
          const drawX = Math.round(i * cellWidthOutput)
          const drawY = Math.round(j * cellHeightOutput)
          const cellW = Math.round(cellWidthOutput)
          const cellH = Math.round(cellHeightOutput)

          // 如果单元格数据为空或null，使用白色背景
          if (!cellData || cellData === null) {
            pixelatedCtx.fillStyle = '#FFFFFF'
            pixelatedCtx.fillRect(drawX, drawY, cellW, cellH)
            // 绘制网格线（极浅，几乎不可见）
            pixelatedCtx.strokeStyle = 'rgba(0,0,0,0.02)'
            pixelatedCtx.strokeRect(drawX, drawY, cellW, cellH)
            continue
          }

          // 如果是外部区域，使用白色背景
          if (cellData.isExternal) {
            pixelatedCtx.fillStyle = '#FFFFFF'
          } else {
            // 使用单元格的颜色，确保颜色值正确
            let cellColor = cellData.color || cellData.hex || '#FFFFFF'
            // 确保颜色值是有效的hex格式
            if (!cellColor.startsWith('#')) {
              cellColor = '#' + cellColor
            }
            // 验证hex颜色格式
            if (!/^#[0-9A-Fa-f]{6}$/.test(cellColor)) {
              cellColor = '#FFFFFF'
            }
            pixelatedCtx.fillStyle = cellColor
          }
          
          // 使用整数坐标确保像素完美对齐
          pixelatedCtx.fillRect(drawX, drawY, cellW, cellH)
          drawnCells++

          if (isHighlighting && highlightColorKey) {
            let shouldDim = false
            
            if (cellData.isExternal) {
              shouldDim = true
            } else {
              const cellColor = (cellData.color || cellData.hex || '').toUpperCase()
              shouldDim = cellColor !== highlightColorKey.toUpperCase()
            }
            
            if (shouldDim) {
              pixelatedCtx.fillStyle = 'rgba(0, 0, 0, 0.6)'
              pixelatedCtx.fillRect(drawX, drawY, cellW, cellH)
            }
          }

          // 绘制网格线（使用整数坐标，极浅，几乎不可见）
          pixelatedCtx.strokeStyle = 'rgba(0,0,0,0.02)'
          pixelatedCtx.strokeRect(drawX, drawY, cellW, cellH)
        }
      }
      console.log(`绘制完成，共绘制 ${drawnCells} 个单元格`)
    }

    // 监听数据变化并重绘画布
    watch(
      [() => props.mappedPixelData, () => props.gridDimensions, () => props.highlightColorKey, () => isHighlighting.value],
      (newValues, oldValues) => {
        console.log('PixelatedPreviewCanvas watch triggered:', {
          hasMappedPixelData: !!props.mappedPixelData,
          mappedPixelDataRows: props.mappedPixelData?.length,
          hasGridDimensions: !!props.gridDimensions,
          gridDimensions: props.gridDimensions,
          hasCanvasRef: !!canvasRef.value
        });
        
        if (props.mappedPixelData && props.gridDimensions && canvasRef.value) {
          // 计算画布尺寸（使用统一的函数）
          const { newWidth, newHeight } = calculateCanvasSize()
          
          console.log('Calculated canvas size:', { newWidth, newHeight, N: props.gridDimensions.N, M: props.gridDimensions.M });
          
          canvasWidth.value = newWidth
          canvasHeight.value = newHeight
          
          // 等待 DOM 更新后绘制
          nextTick(() => {
            if (canvasRef.value) {
              console.log('Drawing canvas in nextTick:', {
                canvasWidth: canvasRef.value.width,
                canvasHeight: canvasRef.value.height,
                newWidth,
                newHeight
              });
              
              // 确保画布的实际尺寸和显示尺寸一致
              canvasRef.value.width = newWidth
              canvasRef.value.height = newHeight
              
              drawPixelatedCanvas(
                props.mappedPixelData,
                canvasRef.value,
                props.gridDimensions,
                props.highlightColorKey,
                isHighlighting.value
              )
            } else {
              console.error('canvasRef.value is null in nextTick');
            }
          })
        } else {
          console.warn('PixelatedPreviewCanvas: Missing required props or canvas ref', {
            hasMappedPixelData: !!props.mappedPixelData,
            hasGridDimensions: !!props.gridDimensions,
            hasCanvasRef: !!canvasRef.value
          });
        }
      },
      { immediate: true, deep: true }
    )

    // 处理高亮效果
    watch(() => props.highlightColorKey, (newVal) => {
      if (newVal && props.mappedPixelData && props.gridDimensions) {
        isHighlighting.value = true
        const timer = setTimeout(() => {
          isHighlighting.value = false
          emit('highlight-complete')
        }, 300)
        return () => clearTimeout(timer)
      }
    })

    // 事件处理函数
    const handleMouseMove = (event) => {
      if (!props.isManualColoringMode) {
        emit('interaction', event.clientX, event.clientY, event.pageX, event.pageY, false)
      }
    }

    const handleMouseLeave = () => {
      emit('interaction', 0, 0, 0, 0, false, true)
    }

    const handleClick = (event) => {
      emit('interaction', event.clientX, event.clientY, event.pageX, event.pageY, props.isManualColoringMode, true)
    }

    const handleTouchStart = (event) => {
      const touch = event.touches[0]
      if (!touch) return

      touchStartPosRef.value = {
        x: touch.clientX,
        y: touch.clientY,
        pageX: touch.pageX,
        pageY: touch.pageY
      }
      touchMovedRef.value = false

      if (!props.isManualColoringMode) {
        emit('interaction', touch.clientX, touch.clientY, touch.pageX, touch.pageY, false)
      }
    }

    const handleTouchMove = (event) => {
      if (!touchStartPosRef.value) return
      
      const touch = event.touches[0]
      if (!touch) return

      const dx = Math.abs(touch.clientX - touchStartPosRef.value.x)
      const dy = Math.abs(touch.clientY - touchStartPosRef.value.y)
      
      if (dx > 10 || dy > 10) {
        touchMovedRef.value = true
      }

      if (!props.isManualColoringMode && !touchMovedRef.value) {
        emit('interaction', touch.clientX, touch.clientY, touch.pageX, touch.pageY, false)
      }
    }

    const handleTouchEnd = (event) => {
      if (!touchStartPosRef.value) return

      if (!touchMovedRef.value && props.isManualColoringMode) {
        const touch = event.changedTouches[0]
        if (touch) {
          emit('interaction', touch.clientX, touch.clientY, touch.pageX, touch.pageY, props.isManualColoringMode, true)
        }
      } else if (!touchMovedRef.value) {
        const touch = event.changedTouches[0]
        if (touch) {
          emit('interaction', touch.clientX, touch.clientY, touch.pageX, touch.pageY, false, false)
        }
      }

      touchStartPosRef.value = null
      touchMovedRef.value = false
    }

    // 暴露canvasRef给父组件
    return {
      canvasRef,
      canvasWidth,
      canvasHeight,
      handleMouseMove,
      handleMouseLeave,
      handleClick,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd
    }
  }
}
</script>

<style scoped>
.pixelated-canvas {
  display: block;
  cursor: crosshair;
  touch-action: none;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  background-color: #FFFFFF;
  /* 确保像素完美渲染，不模糊 */
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  image-rendering: -webkit-optimize-contrast;
}
</style>

