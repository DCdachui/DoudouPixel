<template>
  <a-modal
    v-model:open="isOpen"
    title="色板管理中心"
    :width="800"
    :footer="null"
    @cancel="handleClose"
  >
    <div class="custom-palette-editor">
      <div class="editor-header">
        <a-input-search
          v-model:value="searchTerm"
          placeholder="搜索颜色..."
          style="margin-bottom: 16px"
        />
        <div class="action-buttons">
          <a-button @click="handleSelectAll">全选</a-button>
          <a-button @click="handleDeselectAll">全不选</a-button>
          <a-button type="primary" @click="handleSave">保存</a-button>
          <a-button @click="handleExport">导出</a-button>
          <a-button @click="handleImport">导入</a-button>
        </div>
      </div>

      <div class="color-groups">
        <a-collapse v-model:activeKey="expandedGroups">
          <a-collapse-panel
            v-for="(groupColors, prefix) in colorGroups"
            :key="prefix"
            :header="`${prefix} (${groupColors.length} 色)`"
          >
            <div class="color-list">
              <a-button
                v-for="color in groupColors"
                :key="color.hex || color.color || color.key"
                :class="['color-item', { 'selected': currentSelections[(color.hex || color.color || '').toUpperCase()] }]"
                :style="{ backgroundColor: color.hex || color.color }"
                @click="handleColorToggle(color.hex || color.color)"
              >
                <span class="color-key">{{ getDisplayColorKey(color.hex || color.color, selectedColorSystem) }}</span>
              </a-button>
            </div>
          </a-collapse-panel>
        </a-collapse>
      </div>
    </div>
  </a-modal>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { getDisplayColorKey } from '../utils/colorSystemUtils'

function groupColorsByPrefix(colors, selectedColorSystem) {
  const groups = {}
  
  if (!colors || !Array.isArray(colors)) {
    return groups;
  }
  
  colors.forEach(color => {
    if (!color || !color.hex) {
      return; // 跳过无效的颜色对象
    }
    const displayKey = getDisplayColorKey(color.hex || color.color, selectedColorSystem)
    let prefix
    
    if (selectedColorSystem === '盼盼' || selectedColorSystem === '咪小窝') {
      if (/^\d+$/.test(displayKey)) {
        const num = parseInt(displayKey, 10)
        if (num <= 20) prefix = '1-20'
        else if (num <= 50) prefix = '21-50'
        else if (num <= 100) prefix = '51-100'
        else if (num <= 200) prefix = '101-200'
        else prefix = '200+'
      } else {
        prefix = '其他'
      }
    } else {
      prefix = displayKey.match(/^[A-Z]+/)?.[0] || '其他'
    }
    
    if (!groups[prefix]) {
      groups[prefix] = []
    }
    groups[prefix].push(color)
  })
  
  Object.keys(groups).forEach(prefix => {
    groups[prefix].sort((a, b) => {
      const displayKeyA = getDisplayColorKey(a.hex, selectedColorSystem)
      const displayKeyB = getDisplayColorKey(b.hex, selectedColorSystem)
      
      if (selectedColorSystem === '盼盼' || selectedColorSystem === '咪小窝') {
        const numA = parseInt(displayKeyA, 10) || 0
        const numB = parseInt(displayKeyB, 10) || 0
        return numA - numB
      } else {
        const numA = parseInt(displayKeyA.replace(/^[A-Z]+/, ''), 10) || 0
        const numB = parseInt(displayKeyB.replace(/^[A-Z]+/, ''), 10) || 0
        return numA - numB
      }
    })
  })
  
  return groups
}

export default {
  name: 'CustomPaletteEditor',
  props: {
    open: {
      type: Boolean,
      default: false
    },
    allColors: {
      type: Array,
      required: true
    },
    currentSelections: {
      type: Object,
      required: true
    },
    selectedColorSystem: {
      type: String,
      default: 'MARD'
    }
  },
  emits: ['update:open', 'selection-change', 'save', 'export', 'import'],
  setup(props, { emit }) {
    const isOpen = ref(props.open)
    const searchTerm = ref('')
    const expandedGroups = ref([])

    watch(() => props.open, (newVal) => {
      isOpen.value = newVal
    })

    const filteredColors = computed(() => {
      if (!searchTerm.value) return props.allColors
      return props.allColors.filter(color => {
        const originalKey = color.key.toLowerCase()
        const displayKey = getDisplayColorKey(color.hex, props.selectedColorSystem).toLowerCase()
        const searchLower = searchTerm.value.toLowerCase()
        return originalKey.includes(searchLower) || displayKey.includes(searchLower)
      })
    })

    const colorGroups = computed(() => {
      return groupColorsByPrefix(filteredColors.value, props.selectedColorSystem)
    })

    const handleColorToggle = (hex) => {
      if (!hex || typeof hex !== 'string') {
        console.warn('handleColorToggle: Invalid hex value', hex);
        return;
      }
      const normalizedHex = hex.toUpperCase()
      const isSelected = props.currentSelections[normalizedHex]
      emit('selection-change', normalizedHex, !isSelected)
    }

    const handleSelectAll = () => {
      if (!props.allColors || !Array.isArray(props.allColors)) {
        console.warn('handleSelectAll: allColors is not a valid array');
        return;
      }
      props.allColors.forEach(color => {
        const hex = color?.hex || color?.color;
        if (hex && typeof hex === 'string') {
          emit('selection-change', hex.toUpperCase(), true)
        }
      })
    }

    const handleDeselectAll = () => {
      if (!props.allColors || !Array.isArray(props.allColors)) {
        console.warn('handleDeselectAll: allColors is not a valid array');
        return;
      }
      props.allColors.forEach(color => {
        const hex = color?.hex || color?.color;
        if (hex && typeof hex === 'string') {
          emit('selection-change', hex.toUpperCase(), false)
        }
      })
    }

    const handleSave = () => {
      emit('save')
      isOpen.value = false
      emit('update:open', false)
    }

    const handleExport = () => {
      emit('export')
    }

    const handleImport = () => {
      emit('import')
    }

    const handleClose = () => {
      isOpen.value = false
      emit('update:open', false)
    }

    return {
      isOpen,
      searchTerm,
      expandedGroups,
      colorGroups,
      handleColorToggle,
      handleSelectAll,
      handleDeselectAll,
      handleSave,
      handleExport,
      handleImport,
      handleClose,
      getDisplayColorKey
    }
  }
}
</script>

<style scoped>
.custom-palette-editor {
  max-height: 70vh;
  overflow-y: auto;
}

.editor-header {
  margin-bottom: 16px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.color-groups {
  margin-top: 16px;
}

.color-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-item {
  width: 60px;
  height: 60px;
  border: 2px solid #d9d9d9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.color-item:hover {
  transform: scale(1.1);
  border-color: #40a9ff;
}

.color-item.selected {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.color-key {
  font-size: 10px;
  font-weight: bold;
  font-family: monospace;
  color: white;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
}
</style>

