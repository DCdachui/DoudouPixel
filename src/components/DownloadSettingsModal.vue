<template>
  <a-modal
    v-model:open="isOpen"
    title="下载图纸设置"
    :width="500"
    @ok="handleSave"
    @cancel="handleCancel"
  >
    <a-form :model="tempOptions" layout="vertical">
      <a-form-item label="显示网格线">
        <a-switch v-model:checked="tempOptions.showGrid" />
      </a-form-item>

      <template v-if="tempOptions.showGrid">
        <a-form-item label="网格线间隔 (每 N 格画一条线)">
          <a-slider
            v-model:value="tempOptions.gridInterval"
            :min="5"
            :max="20"
            :marks="{ 5: '5', 10: '10', 15: '15', 20: '20' }"
          />
        </a-form-item>

        <a-form-item label="网格线颜色">
          <a-radio-group v-model:value="tempOptions.gridLineColor">
            <a-radio
              v-for="option in gridLineColorOptions"
              :key="option.value"
              :value="option.value"
            >
              <span :style="{ color: option.value }">{{ option.name }}</span>
            </a-radio>
          </a-radio-group>
        </a-form-item>
      </template>

      <a-form-item label="显示坐标">
        <a-switch v-model:checked="tempOptions.showCoordinates" />
      </a-form-item>

      <a-form-item label="包含统计信息">
        <a-switch v-model:checked="tempOptions.includeStats" />
      </a-form-item>

      <a-form-item label="导出分辨率 (DPI)">
        <a-radio-group v-model:value="tempOptions.dpi">
          <a-radio
            v-for="option in dpiOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item label="同时导出 CSV">
        <a-switch v-model:checked="tempOptions.exportCsv" />
      </a-form-item>
    </a-form>

    <template #footer>
      <a-button @click="handleCancel">取消</a-button>
      <a-button type="primary" @click="handleSave">下载</a-button>
    </template>
  </a-modal>
</template>

<script>
import { ref, watch } from 'vue'

export const gridLineColorOptions = [
  { name: '深灰色', value: '#555555' },
  { name: '红色', value: '#FF0000' },
  { name: '蓝色', value: '#0000FF' },
  { name: '绿色', value: '#008000' },
  { name: '紫色', value: '#800080' },
  { name: '橙色', value: '#FFA500' },
]

const dpiOptions = [
  { label: '标准 96 DPI', value: 96 },
  { label: '高清 150 DPI', value: 150 },
  { label: '超清 180 DPI', value: 180 }
]

export default {
  name: 'DownloadSettingsModal',
  props: {
    open: {
      type: Boolean,
      default: false
    },
    options: {
      type: Object,
      required: true
    }
  },
  emits: ['update:open', 'options-change', 'download'],
  setup(props, { emit }) {
    const isOpen = ref(props.open)
    const tempOptions = ref({ ...props.options })

    watch(() => props.open, (newVal) => {
      isOpen.value = newVal
      if (newVal) {
        tempOptions.value = { ...props.options }
      }
    })

    watch(() => props.options, (newVal) => {
      if (isOpen.value) {
        tempOptions.value = { ...newVal }
      }
    }, { deep: true })

    const handleSave = () => {
      emit('options-change', { ...tempOptions.value })
      emit('download', { ...tempOptions.value })
      isOpen.value = false
      emit('update:open', false)
    }

    const handleCancel = () => {
      isOpen.value = false
      emit('update:open', false)
    }

    return {
      isOpen,
      tempOptions,
      gridLineColorOptions,
      dpiOptions,
      handleSave,
      handleCancel
    }
  }
}
</script>

