<template>
  <div
    ref="paletteRef"
    class="floating-color-palette"
    :class="{ 'active': isActive }"
  >
    <!-- 内容区域，直接显示，不需要头部按钮 -->
    <div class="palette-content">
      <ColorPalette
        :colors="colors"
        :selected-color="selectedColor"
        :transparent-key="TRANSPARENT_KEY"
        :selected-color-system="selectedColorSystem"
        :is-erase-mode="isEraseMode"
        :full-palette-colors="fullPaletteColors"
        :show-full-palette="showFullPalette"
        :color-replace-state="colorReplaceState"
        @color-select="handleColorSelect"
        @erase-toggle="handleEraseToggle"
        @highlight-color="handleHighlightColor"
        @toggle-full-palette="handleToggleFullPalette"
        @color-replace-toggle="handleColorReplaceToggle"
        @color-replace="handleColorReplace"
      />
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { TRANSPARENT_KEY } from '../utils/pixelEditingUtils'
import ColorPalette from './ColorPalette.vue'

export default {
  name: 'FloatingColorPalette',
  components: {
    ColorPalette
  },
  props: {
    colors: {
      type: Array,
      required: true
    },
    selectedColor: {
      type: Object,
      default: null
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
    },
    isActive: {
      type: Boolean,
      default: false
    }
  },
  emits: ['color-select', 'erase-toggle', 'highlight-color', 'toggle-full-palette', 'color-replace-toggle', 'color-replace', 'activate'],
  setup(props, { emit }) {
    const paletteRef = ref(null)

    const handleColorSelect = (colorData) => {
      emit('color-select', colorData)
    }

    const handleEraseToggle = () => {
      emit('erase-toggle')
    }

    const handleHighlightColor = (colorHex) => {
      emit('highlight-color', colorHex)
    }

    const handleToggleFullPalette = () => {
      emit('toggle-full-palette')
    }

    const handleColorReplaceToggle = () => {
      emit('color-replace-toggle')
    }

    const handleColorReplace = (sourceColor, targetColor) => {
      emit('color-replace', sourceColor, targetColor)
    }

    return {
      paletteRef,
      TRANSPARENT_KEY,
      handleColorSelect,
      handleEraseToggle,
      handleHighlightColor,
      handleToggleFullPalette,
      handleColorReplaceToggle,
      handleColorReplace
    }
  }
}
</script>

<style scoped>
.floating-color-palette {
  position: relative;
  user-select: none;
  animation: slideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.floating-color-palette.active {
  /* 激活状态样式 */
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.palette-content {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.96) 50%, rgba(255, 255, 255, 0.94) 100%);
  border-radius: 32px 32px 0 0;
  box-shadow: 0 -6px 32px rgba(0, 0, 0, 0.15), 
              0 -2px 8px rgba(0, 0, 0, 0.1),
              0 0 0 1px rgba(0, 0, 0, 0.05), 
              inset 0 2px 4px rgba(255, 255, 255, 0.9),
              inset 0 -1px 0 rgba(0, 0, 0, 0.05);
  width: 88px;
  height: 520px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(24px) saturate(180%);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.palette-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
  pointer-events: none;
  z-index: 1;
  border-radius: 32px 32px 0 0;
}

.palette-content::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at top center, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
  border-radius: 32px 32px 0 0;
}

/* 手机端适配 */
@media (max-width: 1023px) {
  .palette-content {
    width: 70px;
    height: 400px;
  }
}

/* 滚动条样式 - 更细更美观 */
.palette-content::-webkit-scrollbar {
  width: 4px;
}

.palette-content::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(24, 144, 255, 0.6), rgba(24, 144, 255, 0.3));
  border-radius: 2px;
  transition: background 0.3s ease;
}

.palette-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(24, 144, 255, 0.8), rgba(24, 144, 255, 0.5));
}

.palette-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.02);
  border-radius: 2px;
}
</style>

