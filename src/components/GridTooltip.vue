<template>
  <div
    v-if="tooltipData"
    class="grid-tooltip"
    :style="{
      left: `${tooltipData.x}px`,
      top: `${tooltipData.y - 25}px`,
      transform: 'translate(-50%, -100%)'
    }"
  >
    <span
      class="color-swatch"
      :style="{ backgroundColor: tooltipData.color }"
    ></span>
    <span class="color-key">{{ getDisplayColorKey(tooltipData.color, selectedColorSystem) }}</span>
  </div>
</template>

<script>
import { getDisplayColorKey } from '../utils/colorSystemUtils'

export default {
  name: 'GridTooltip',
  props: {
    tooltipData: {
      type: Object,
      default: null
    },
    selectedColorSystem: {
      type: String,
      default: 'MARD'
    }
  },
  setup(props) {
    return {
      getDisplayColorKey
    }
  }
}
</script>

<style scoped>
.grid-tooltip {
  position: absolute;
  background: #1f2937;
  color: white;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  z-index: 50;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}

.color-swatch {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
}

.color-key {
  font-family: monospace;
  font-weight: 600;
}
</style>

