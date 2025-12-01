<template>
  <a-drawer
    v-model:open="isOpen"
    title="设置"
    placement="right"
    :width="320"
    @close="handleClose"
  >
    <a-form layout="vertical">
      <a-form-item label="智能引导">
        <a-radio-group v-model:value="localGuidanceMode" @change="handleGuidanceModeChange">
          <a-radio value="nearest">
            <div>
              <div class="radio-label">最近优先</div>
              <div class="radio-desc">推荐距离最近的格子</div>
            </div>
          </a-radio>
          <a-radio value="largest">
            <div>
              <div class="radio-label">大块优先</div>
              <div class="radio-desc">优先推荐大色块区域</div>
            </div>
          </a-radio>
          <a-radio value="edge-first">
            <div>
              <div class="radio-label">边缘优先</div>
              <div class="radio-desc">先完成边缘，再填充内部</div>
            </div>
          </a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item label="显示设置">
        <a-space direction="vertical" style="width: 100%">
          <div class="setting-item">
            <span>显示分割线</span>
            <a-switch v-model:checked="localShowSectionLines" @change="handleShowSectionLinesChange" />
          </div>

          <template v-if="localShowSectionLines">
            <a-form-item label="分割间隔">
              <a-slider
                v-model:value="localGridSectionInterval"
                :min="5"
                :max="20"
                @change="handleGridSectionIntervalChange"
              />
            </a-form-item>

            <a-form-item label="分割线颜色">
              <div class="color-options">
                <div
                  v-for="colorOption in sectionLineColors"
                  :key="colorOption.color"
                  class="color-option"
                  :class="{ 'selected': localSectionLineColor === colorOption.color }"
                  :style="{ backgroundColor: colorOption.color }"
                  @click="handleSectionLineColorChange(colorOption.color)"
                  :title="colorOption.name"
                />
              </div>
            </a-form-item>
          </template>

          <div class="setting-item">
            <span>庆祝动画</span>
            <a-switch v-model:checked="localEnableCelebration" @change="handleEnableCelebrationChange" />
          </div>
        </a-space>
      </a-form-item>

      <a-form-item label="数据管理">
        <a-space direction="vertical" style="width: 100%">
          <a-button type="default" block>导出进度数据</a-button>
          <a-button type="primary" danger block>重置所有进度</a-button>
        </a-space>
      </a-form-item>

      <a-form-item label="关于">
        <div class="about-info">
          <p>专为手机设计的拼豆助手</p>
          <div class="tips">
            <p>💡 提示：长按格子可以快速标记</p>
            <p>💡 提示：双指缩放可以查看细节</p>
          </div>
        </div>
      </a-form-item>
    </a-form>
  </a-drawer>
</template>

<script>
import { ref, watch } from 'vue'

const sectionLineColors = [
  { color: '#007acc', name: '蓝色' },
  { color: '#28a745', name: '绿色' },
  { color: '#dc3545', name: '红色' },
  { color: '#6f42c1', name: '紫色' },
  { color: '#fd7e14', name: '橙色' },
  { color: '#6c757d', name: '灰色' }
]

export default {
  name: 'SettingsPanel',
  props: {
    open: {
      type: Boolean,
      default: false
    },
    guidanceMode: {
      type: String,
      default: 'nearest'
    },
    gridSectionInterval: {
      type: Number,
      default: 10
    },
    showSectionLines: {
      type: Boolean,
      default: true
    },
    sectionLineColor: {
      type: String,
      default: '#007acc'
    },
    enableCelebration: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:open', 'guidance-mode-change', 'grid-section-interval-change', 'show-section-lines-change', 'section-line-color-change', 'enable-celebration-change'],
  setup(props, { emit }) {
    const isOpen = ref(props.open)
    const localGuidanceMode = ref(props.guidanceMode)
    const localGridSectionInterval = ref(props.gridSectionInterval)
    const localShowSectionLines = ref(props.showSectionLines)
    const localSectionLineColor = ref(props.sectionLineColor)
    const localEnableCelebration = ref(props.enableCelebration)

    watch(() => props.open, (newVal) => {
      isOpen.value = newVal
    })

    watch(() => props.guidanceMode, (newVal) => {
      localGuidanceMode.value = newVal
    })

    watch(() => props.gridSectionInterval, (newVal) => {
      localGridSectionInterval.value = newVal
    })

    watch(() => props.showSectionLines, (newVal) => {
      localShowSectionLines.value = newVal
    })

    watch(() => props.sectionLineColor, (newVal) => {
      localSectionLineColor.value = newVal
    })

    watch(() => props.enableCelebration, (newVal) => {
      localEnableCelebration.value = newVal
    })

    const handleClose = () => {
      isOpen.value = false
      emit('update:open', false)
    }

    const handleGuidanceModeChange = () => {
      emit('guidance-mode-change', localGuidanceMode.value)
    }

    const handleGridSectionIntervalChange = () => {
      emit('grid-section-interval-change', localGridSectionInterval.value)
    }

    const handleShowSectionLinesChange = () => {
      emit('show-section-lines-change', localShowSectionLines.value)
    }

    const handleSectionLineColorChange = (color) => {
      localSectionLineColor.value = color
      emit('section-line-color-change', color)
    }

    const handleEnableCelebrationChange = () => {
      emit('enable-celebration-change', localEnableCelebration.value)
    }

    return {
      isOpen,
      localGuidanceMode,
      localGridSectionInterval,
      localShowSectionLines,
      localSectionLineColor,
      localEnableCelebration,
      sectionLineColors,
      handleClose,
      handleGuidanceModeChange,
      handleGridSectionIntervalChange,
      handleShowSectionLinesChange,
      handleSectionLineColorChange,
      handleEnableCelebrationChange
    }
  }
}
</script>

<style scoped>
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.radio-label {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.radio-desc {
  font-size: 12px;
  color: #8c8c8c;
}

.color-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-option {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #d9d9d9;
  cursor: pointer;
  transition: all 0.2s;
}

.color-option:hover {
  transform: scale(1.1);
  border-color: #40a9ff;
}

.color-option.selected {
  border-color: #262626;
  transform: scale(1.2);
}

.about-info {
  font-size: 14px;
  color: #595959;
}

.tips {
  margin-top: 8px;
  font-size: 12px;
  color: #8c8c8c;
}
</style>

