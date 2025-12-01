<template>
  <a-config-provider :theme="{
    token: {
      colorPrimary: currentThemeColor,
      colorBgContainer: '#ffffff',
      colorText: currentTextColor,
      borderRadius: 16,
      fontFamily: 'PingFang SC, sans-serif'
    }
  }">
    <!-- 1. 登录层 -->
    <LoginView v-if="!isAuthenticated" @login-success="onLoginSuccess" />

    <!-- 2. 主应用层 -->
    <div v-else :class="currentTheme" class="main-app-container">
      <!-- Header -->
      <header class="app-header">
        <div class="header-left">
          <div class="header-icon">
            <AppstoreFilled />
          </div>
          <span class="app-title">
            拼豆吧 dc
            <span class="pro-tag" :class="{ 'pro-tag-hidden': !isLargeScreen }">PRO</span>
          </span>
        </div>
        
        <a-tooltip :title="themeLabels[currentTheme]">
          <button 
            @click="cycleTheme"
            class="theme-button"
          >
            <SkinOutlined v-if="currentTheme === 'theme-default'" class="theme-icon" />
            <HeartFilled v-else-if="currentTheme === 'theme-pink'" class="theme-icon" />
            <CoffeeOutlined v-else class="theme-icon" />
            <span class="theme-label" :class="{ 'theme-label-hidden': !isLargeScreen }">{{ themeLabels[currentTheme] }}</span>
          </button>
        </a-tooltip>
      </header>

      <!-- Main Layout -->
      <main class="main-content" :class="{ 'main-content-mobile': !isLargeScreen }">
        <!-- 左侧控制面板 -->
        <aside 
          class="control-panel"
          :class="{ 'control-panel-mobile': !isLargeScreen }"
        >
          <div class="panel-tabs">
            <button 
              v-for="tab in tabItems"
              :key="tab.key"
              class="tab-button"
              :class="{ 'tab-button-active': activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              <component :is="tab.icon" v-if="tab.icon" />
              <span>{{ tab.label }}</span>
            </button>
          </div>
          
          <div class="panel-content">
            <!-- Tab 1: 设置 -->
            <div v-show="activeTab === 'settings'" class="settings-content">
              
              <!-- 上传 -->
              <div class="upload-section">
                <a-upload-dragger 
                  :showUploadList="false" 
                  :customRequest="handleCustomUpload"
                  accept="image/*"
                  class="upload-dragger"
                >
                  <div v-if="!previewUrl" class="upload-placeholder">
                    <div class="upload-icon">
                      <InboxOutlined />
                    </div>
                    <p class="upload-text">点击添加图片</p>
                  </div>
                  <div v-else class="preview-container">
                    <img :src="previewUrl" class="preview-image" />
                    <div class="preview-overlay">
                      <CloudUploadOutlined /> 更换图片
                    </div>
                  </div>
                </a-upload-dragger>
              </div>

              <!-- 风格处理 -->
              <div class="option-card">
                <div class="option-card-content">
                  <div class="option-item">
                    <span class="option-label">
                      <span class="option-icon">
                        <FileImageOutlined />
                      </span>
                      黑白线稿
                    </span>
                    <a-switch v-model:checked="config.grayscale" />
                  </div>
                  <div class="option-item">
                    <span class="option-label">
                      <span class="option-icon">
                        <ScissorOutlined />
                      </span>
                      线条增强
                    </span>
                    <a-switch v-model:checked="config.enhanceEdges" />
                  </div>
                </div>
              </div>

              <!-- 魔法算法 -->
              <div class="option-card">
                <label class="option-card-label">魔法优化</label>
                <div class="option-card-content">
                  <div class="option-item">
                    <span>真实化</span>
                    <a-switch v-model:checked="config.useRealistic" />
                  </div>
                  <div class="option-item">
                    <span>卡通化 (去噪点)</span>
                    <a-switch v-model:checked="config.optCartoon" />
                  </div>
                  <div class="option-item">
                    <span>净化背景</span>
                    <a-switch v-model:checked="config.optCleanBg" />
                  </div>
                  <div class="option-item">
                    <span>细节增强</span>
                    <a-switch v-model:checked="config.optDetail" />
                  </div>
                </div>
              </div>

              <!-- 核心参数 -->
              <div class="core-params-section">
                <!-- 网格尺寸 -->
                <div class="grid-size-section">
                  <div class="param-header">
                    <span class="param-label">网格尺寸</span>
                    <a-tooltip :title="config.lockRatio ? '点击解锁比例 (允许拉伸)' : '点击锁定比例 (自动计算)'">
                      <button 
                        @click="toggleLock"
                        class="lock-button"
                        :class="{ 'lock-button-active': config.lockRatio }"
                      >
                        <LinkOutlined v-if="config.lockRatio" />
                        <DisconnectOutlined v-else />
                        {{ config.lockRatio ? '比例锁定' : '自由比例' }}
                      </button>
                    </a-tooltip>
                  </div>
                  
                  <div class="grid-inputs">
                    <a-input-number 
                      v-model:value="config.width" 
                      :min="10" 
                      :max="500" 
                      class="grid-input"
                      @change="onWidthChange"
                    />
                    <span class="grid-separator">×</span>
                    <a-input-number 
                      v-model:value="config.height" 
                      :min="10" 
                      :max="500" 
                      class="grid-input"
                      @change="onHeightChange"
                    />
                  </div>

                  <!-- 预设按钮 -->
                  <div class="preset-buttons">
                    <button 
                      v-for="size in [32, 52, 60, 104]" 
                      :key="size" 
                      @click="applyPreset(size)"
                      class="preset-button"
                    >
                      {{ size }}
                    </button>
                  </div>
                </div>

                <!-- 聚类 -->
                <div class="clustering-card">
                  <div class="clustering-control">
                    <div>
                      <div class="clustering-title">色彩聚类</div>
                      <div class="clustering-desc">仅保留 {{ config.maxColors }} 种核心色</div>
                    </div>
                    <div class="clustering-controls">
                      <a-slider 
                        v-model:value="config.maxColors" 
                        :min="4" 
                        :max="124" 
                        :disabled="!config.useClustering" 
                        class="clustering-slider"
                      />
                      <a-switch v-model:checked="config.useClustering" />
                    </div>
                  </div>
                </div>

                <!-- 颜色合并阈值 -->
                <div class="clustering-card">
                  <div class="clustering-control">
                    <div>
                      <div class="clustering-title">颜色合并阈值</div>
                      <div class="clustering-desc">相似度 {{ config.colorThreshold }} (越小越严格)</div>
                    </div>
                    <div class="clustering-controls">
                      <a-slider 
                        v-model:value="config.colorThreshold" 
                        :min="5" 
                        :max="80" 
                        class="clustering-slider"
                      />
                    </div>
                  </div>
                </div>

                <!-- 抖动 -->
                <div class="option-item">
                  <span>色彩抖动 (Dithering)</span>
                  <a-switch v-model:checked="config.dither" size="small" />
                </div>

                <!-- 色号 -->
                <div class="palette-select-section">
                  <label class="palette-label">色号品牌</label>
                  <a-select 
                    v-model:value="config.selectedPalette" 
                    :options="paletteOptions"
                    size="large"
                    class="palette-select"
                  />
                </div>
              </div>
            </div>

            <!-- Tab 2: 统计清单 -->
            <div v-show="activeTab === 'stats'" class="stats-content">
              <div v-if="!generated" class="stats-empty">
                <div class="stats-empty-icon">🎨</div>
                <p class="stats-empty-text">生成后查看清单</p>
              </div>
              <div v-else class="stats-data">
                <div class="stats-summary-card">
                  <div class="stats-summary-content">
                    <div class="stats-summary-left">
                      <div class="stats-summary-label">Total Beads</div>
                      <div class="stats-summary-value">{{ totalPixels }} <span class="stats-summary-unit">颗</span></div>
                    </div>
                    <div class="stats-summary-badge">
                      {{ statsData.length }} 色
                    </div>
                  </div>
                </div>
                
                <!-- 色块信息网格 -->
                <div class="color-grid">
                  <div 
                    v-for="item in statsData" 
                    :key="item.code"
                    class="color-stat-card"
                    @click="handleHighlightColor(item.hex)"
                  >
                    <div class="color-swatch" :style="{ backgroundColor: item.hex }"></div>
                    <div class="color-info">
                      <div class="color-code">{{ item.code }}</div>
                      <div class="color-count">{{ item.count }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部主按钮 -->
          <div class="panel-footer">
            <a-button 
              type="primary" 
              block 
              size="large" 
              :loading="loading" 
              @click="generate"
              class="generate-button"
            >
              <template #icon><ThunderboltOutlined /></template>
              {{ generated ? '重新生成' : '开始制作' }}
            </a-button>
            
            <div v-if="generated" class="action-buttons">
              <a-button 
                block 
                size="large"
                @click="handleOpenDownloadModal"
                class="action-button"
              >
                <template #icon><DownloadOutlined /></template>
                导出施工图
              </a-button>
              
              <!-- 手动编辑功能暂时隐藏 -->
              <!-- <a-button 
                block 
                size="large"
                @click="handleEnterManualMode"
                class="action-button"
              >
                <template #icon><EditOutlined /></template>
                手动编辑
              </a-button> -->
            </div>
          </div>
        </aside>

        <!-- 画布区域 -->
        <section class="canvas-area" :class="{ 'canvas-area-mobile': !isLargeScreen }">
          <!-- 自定义消息提示 - 画布顶部正中间 -->
          <!-- 手动编辑功能暂时隐藏 -->
          <!-- <div v-if="manualEditMessage" class="canvas-message">
            {{ manualEditMessage }}
          </div> -->
          
          <div class="canvas-controls">
            <div class="controls-inner">
              <button class="control-btn" @click="fitView" title="适应画布">
                <ExpandOutlined />
              </button>
              <div class="control-divider"></div>
              <button class="control-btn" @click="zoomOut" title="缩小">
                <MinusOutlined />
              </button>
              <span class="zoom-text">{{ Math.round(view.scale * 100) }}%</span>
              <button class="control-btn" @click="zoomIn" title="放大">
                <PlusOutlined />
              </button>
            </div>
          </div>

          <div 
            class="canvas-container"
            @wheel="onWheel" 
            @mousedown.left="startDrag" 
            @mousemove="onDrag" 
            @mouseup="stopDrag" 
            @mouseleave="stopDrag"
            @touchstart="startTouch" 
            @touchmove="onTouch" 
            @touchend="stopTouch"
          >
            <div class="checkerboard-bg"></div>
            
            <div 
              class="canvas-wrapper"
              :style="{ 
                transform: `translate(calc(-50% + ${view.x}px), calc(-50% + ${view.y}px)) scale(${view.scale})`
              }"
            >
              <!-- 使用PixelatedPreviewCanvas组件 -->
              <PixelatedPreviewCanvas
                v-if="generated && mappedPixelData && gridDimensions"
                ref="canvasRefForMagnifier"
                :key="`canvas-${generated}-${mappedPixelData?.length}-${gridDimensions?.N}-${gridDimensions?.M}`"
                :mappedPixelData="mappedPixelData"
                :gridDimensions="gridDimensions"
                :isManualColoringMode="isManualColoringMode"
                :highlightColorKey="highlightColorKey"
                @interaction="handleCanvasInteraction"
                @highlight-complete="handleHighlightComplete"
              />
              
              <a-empty 
                v-if="!generated" 
                class="empty-state"
              >
                <template #image>
                  <span></span>
                </template>
                <template #description>
                  <div class="empty-description">
                    <div class="empty-text">工作台就绪，请上传图片</div>
                  </div>
                </template>
              </a-empty>
            </div>
            
            <!-- GridTooltip -->
            <GridTooltip
              v-if="tooltipData"
              :tooltipData="tooltipData"
              :selectedColorSystem="selectedColorSystem.value"
            />
            
          <!-- 手动编辑功能暂时隐藏 -->
          <!-- FloatingToolbar (手动编辑模式) - 放在画布容器内右侧 -->
          <!-- <FloatingToolbar
            v-if="isManualColoringMode"
            :isManualColoringMode="isManualColoringMode"
            :isPaletteOpen="isPaletteOpen"
            :isMagnifierActive="isMagnifierActive"
            @toggle-palette="handleTogglePalette"
            @toggle-magnifier="handleToggleMagnifier"
            @exit-manual-mode="handleExitManualMode"
          >
            <template #palette>
              <FloatingColorPalette
                :colors="availableColors"
                :selectedColor="selectedColor"
                :transparentKey="TRANSPARENT_KEY"
                :selectedColorSystem="selectedColorSystem.value"
                :isEraseMode="isEraseMode"
                :fullPaletteColors="fullPaletteColors"
                :showFullPalette="showFullPalette"
                :colorReplaceState="colorReplaceState"
                @color-select="handleColorSelect"
                @erase-toggle="handleEraseToggle"
                @highlight-color="handleHighlightColor"
                @toggle-full-palette="handleToggleFullPalette"
                @color-replace-toggle="handleColorReplaceToggle"
                @color-replace="handleColorReplace"
              />
            </template>
          </FloatingToolbar>
          
          <MagnifierSelectionOverlay
            v-if="isManualColoringMode && isMagnifierActive && !magnifierSelectionArea && generated"
            :isActive="isMagnifierActive && !magnifierSelectionArea"
            :canvasRef="canvasRefForMagnifier"
            :gridDimensions="gridDimensions"
            @selection-complete="handleMagnifierSelectionComplete"
          />
          
          <MagnifierTool
            v-if="isManualColoringMode && isMagnifierActive && magnifierSelectionArea"
            :isActive="isMagnifierActive && !!magnifierSelectionArea"
            :mappedPixelData="mappedPixelData"
            :gridDimensions="gridDimensions"
            :selectedColor="selectedColor"
            :selectedColorSystem="selectedColorSystem.value"
            :selectionArea="magnifierSelectionArea"
            :isFloatingActive="isMagnifierFloatingActive"
            :highlightColorKey="highlightColorKey"
            @toggle="handleToggleMagnifier"
            @pixel-edit="handleMagnifierPixelEdit"
            @clear-selection="handleClearMagnifierSelection"
            @activate-floating="handleActivateMagnifierFloating"
          /> -->
          </div>
          
          <div class="canvas-footer">
            <span>{{ generated ? `Canvas: ${config.width}x${config.height}` : '告知：上传图片比例 请保持  1:1  建议上传 边缘清晰、简单、背景干净的 Q 版卡通图' }}</span>
            <span v-if="generated && statsData.length > 0">Palette: {{ statsData.length }} Colors</span>
          </div>
        </section>
      </main>
    </div>
    
    <!-- 下载设置模态框 -->
    <DownloadSettingsModal
      v-model:open="downloadModalOpen"
      :options="downloadOptions"
      @options-change="(opts) => Object.assign(downloadOptions, opts)"
      @download="handleDownload"
    />
    
    
  </a-config-provider>
</template>

<script setup>
import { ref, reactive, computed, onUnmounted, nextTick, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import LoginView from '../components/LoginView.vue';
import PixelatedPreviewCanvas from '../components/PixelatedPreviewCanvas.vue';
import FloatingToolbar from '../components/FloatingToolbar.vue';
import FloatingColorPalette from '../components/FloatingColorPalette.vue';
import GridTooltip from '../components/GridTooltip.vue';
import DownloadSettingsModal from '../components/DownloadSettingsModal.vue';
import MagnifierTool from '../components/MagnifierTool.vue';
import MagnifierSelectionOverlay from '../components/MagnifierSelectionOverlay.vue';
import { 
  AppstoreFilled, SkinOutlined, InboxOutlined, ThunderboltOutlined, 
  DownloadOutlined, ExpandOutlined, PlusOutlined, MinusOutlined, 
  FileImageOutlined, HeartFilled, CoffeeOutlined, SettingOutlined, BarChartOutlined,
  ScissorOutlined, CloudUploadOutlined, LinkOutlined, DisconnectOutlined, EditOutlined
} from '@ant-design/icons-vue';

import PixelWorker from '../workers/pixelationWorker.js?worker';
import { getContrastColor } from '../utils/colorLogic';
import { usePixelEditor } from '../utils/editorLogic';
import { clientToGridCoords } from '../utils/canvasUtils';
import { floodFillErase, replaceColor, TRANSPARENT_KEY, transparentColorData } from '../utils/pixelEditingUtils';
import { downloadImage, exportCsvData } from '../utils/imageDownloader';
import { getDisplayColorKey, getColorKeyByHex, convertColorKeyToHex, getMardToHexMapping, convertPaletteToColorSystem, hexToRgb } from '../utils/colorSystemUtils';

const isAuthenticated = ref(false);
onMounted(() => { 
  const token = localStorage.getItem('pixel_craft_token'); 
  if (token) isAuthenticated.value = true; 
});
const onLoginSuccess = () => isAuthenticated.value = true;

const currentTheme = ref('theme-default');
const activeTab = ref('settings');
const loading = ref(false);
const generated = ref(false);
const previewUrl = ref('');
const canvasRef = ref(null);
const view = reactive({ x: 0, y: 0, scale: 0.8, isDragging: false, startX: 0, startY: 0 });

// 响应式检测
const isLargeScreen = ref(window.innerWidth >= 1024);
window.addEventListener('resize', () => {
  isLargeScreen.value = window.innerWidth >= 1024;
});

let gridData = null;
let statsData = ref([]);
let totalPixels = 0;
let imageRatio = 1;

// 画布数据（用于PixelatedPreviewCanvas）
const mappedPixelData = ref(null);
const gridDimensions = ref(null);

// 手动编辑模式相关
const isManualColoringMode = ref(false);
const isPaletteOpen = ref(false);
const isMagnifierActive = ref(false);
const magnifierSelectionArea = ref(null);
const isMagnifierFloatingActive = ref(false);
const selectedColor = ref(null);
const availableColors = ref([]);
const fullPaletteColors = ref([]);
const manualEditMessage = ref('');
const showFullPalette = ref(false);
const isEraseMode = ref(false);
const colorReplaceState = ref(null);
const canvasRefForMagnifier = ref(null);

// Tooltip
const tooltipData = ref(null);

// 下载设置
const downloadModalOpen = ref(false);
const downloadOptions = reactive({
  showGrid: true,
  gridInterval: 10,
  gridLineColor: '#555555',
  showCoordinates: true,
  includeStats: true,
  exportCsv: false
});

// 初始化完整色板
onMounted(() => {
  initFullPaletteColors(); // 初始化完整色板
});

// 编辑器逻辑
const { editorState, initHistory, saveSnapshot, undo, redo, applyTool } = usePixelEditor();

// Config (双输入)
const config = reactive({
  width: 50, 
  height: 50,
  lockRatio: true, // 默认锁定
  maxColors: 24,
  useClustering: false, 
  colorThreshold: 20, // 颜色合并阈值，默认20
  useRealistic: true, // 真实化开关：false=卡通(主色), true=真实(平均)，默认开启
  selectedPalette: 'mard_full',
  dither: false,
  grayscale: false,
  enhanceEdges: false, // 线条增强，默认关闭
  optCartoon: false, 
  optCleanBg: false,
  optDetail: false, // 细节增强，默认关闭
  beadSize: 2.6
});


// Tab 配置
const tabItems = [
  {
    key: 'settings',
    label: '参数设置',
    icon: SettingOutlined
  },
  {
    key: 'stats',
    label: '用量清单',
    icon: BarChartOutlined
  }
];

// 比例联动逻辑
const onWidthChange = (val) => {
  if (config.lockRatio && imageRatio) {
    config.height = Math.max(1, Math.round(val / imageRatio));
  }
};
const onHeightChange = (val) => {
  if (config.lockRatio && imageRatio) {
    config.width = Math.max(1, Math.round(val * imageRatio));
  }
};
const toggleLock = () => {
  config.lockRatio = !config.lockRatio;
  if (config.lockRatio) onWidthChange(config.width); // 重新计算匹配
};
// 预设按钮点击
const applyPreset = (size) => {
  if (!imageRatio) { config.width = size; config.height = size; return; }
  if (imageRatio >= 1) { // 宽图
    config.width = size;
    onWidthChange(size);
  } else { // 竖图
    config.height = size;
    onHeightChange(size);
  }
};

// Theme Logic
const themeLabels = { 'theme-default': '清爽蓝', 'theme-pink': '小红书', 'theme-cream': '奶油拿铁' };
const cycleTheme = () => {
  if (currentTheme.value === 'theme-default') currentTheme.value = 'theme-pink';
  else if (currentTheme.value === 'theme-pink') currentTheme.value = 'theme-cream';
  else currentTheme.value = 'theme-default';
};
const currentThemeColor = computed(() => {
  if (currentTheme.value === 'theme-pink') return '#ff2442'; 
  if (currentTheme.value === 'theme-cream') return '#ffb74d';
  return '#1677ff';
});
const currentTextColor = computed(() => {
  if (currentTheme.value === 'theme-cream') return '#5d4037';
  if (currentTheme.value === 'theme-pink') return '#333333';
  return '#1f1f1f';
});
// 使用next.js版本的色号库处理逻辑
const mardToHexMapping = getMardToHexMapping();
const fullBeadPalette = Object.entries(mardToHexMapping)
  .map(([mardKey, hex]) => {
    const rgb = hexToRgb(hex);
    if (!rgb) {
      console.warn(`Invalid hex code "${hex}" for MARD key "${mardKey}". Skipping.`);
      return null;
    }
    return { key: hex, hex, rgb };
  })
  .filter(color => color !== null);

// 默认使用全部颜色
const activeBeadPalette = ref(fullBeadPalette);

// 色号系统选择（从config中获取，默认为MARD）
const selectedColorSystem = computed(() => {
  return 'MARD';
});

// 转换后的调色板（根据选择的色号系统）
const currentPaletteColors = computed(() => {
  const converted = convertPaletteToColorSystem(activeBeadPalette.value, selectedColorSystem.value);
  return converted;
});

// 色板选项（用于下拉选择，使用colorSystemMapping.json中定义的色号系统）
const paletteOptions = computed(() => [
  { label: 'MARD 全套', value: 'mard_full' }
]);

let sourceImageObject = null;
let workerInstance = null;

const handleCustomUpload = ({ file, onSuccess }) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (e) => {
    previewUrl.value = e.target.result;
    const img = new Image();
    img.src = e.target.result;
    img.onload = () => {
      sourceImageObject = img;
      imageRatio = img.width / img.height;
      
      // 自动计算网格尺寸（仿照next.js版本）
      // 根据图片大小自动计算合适的网格尺寸
      const maxDimension = Math.max(img.width, img.height);
      let suggestedSize = 50; // 默认值
      
      // 根据图片大小智能计算网格尺寸
      if (maxDimension <= 200) {
        suggestedSize = Math.max(20, Math.min(50, Math.floor(maxDimension / 4)));
      } else if (maxDimension <= 500) {
        suggestedSize = Math.max(30, Math.min(75, Math.floor(maxDimension / 6)));
      } else if (maxDimension <= 1000) {
        suggestedSize = Math.max(40, Math.min(100, Math.floor(maxDimension / 8)));
      } else {
        suggestedSize = Math.max(50, Math.min(150, Math.floor(maxDimension / 10)));
      }
      
      // 如果比例锁定，按长边设置
      if (config.lockRatio) {
        if (imageRatio >= 1) {
          // 宽图：以宽度为准
          config.width = suggestedSize;
          config.height = Math.max(1, Math.round(suggestedSize / imageRatio));
        } else {
          // 竖图：以高度为准
          config.height = suggestedSize;
          config.width = Math.max(1, Math.round(suggestedSize * imageRatio));
        }
      } else {
        // 自由比例：分别计算
        config.width = suggestedSize;
        config.height = Math.max(1, Math.round(suggestedSize / imageRatio));
      }
      
      generated.value = false;
      message.success('图片已加载，网格尺寸已自动计算');
      onSuccess(null);
    };
  };
};

const generate = () => {
  if (!sourceImageObject) return message.warning('请先上传图片');
  loading.value = true;

  // 重新应用比例锁，确保尺寸正确
  if (config.lockRatio) onWidthChange(config.width);
  const w = config.width;
  const h = config.height;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = w; tempCanvas.height = h;
  const tCtx = tempCanvas.getContext('2d');
  tCtx.drawImage(sourceImageObject, 0, 0, w, h);
  const imgData = tCtx.getImageData(0, 0, w, h);

  if (!workerInstance) {
    try {
      workerInstance = new PixelWorker();
    } catch (error) {
      console.error('无法创建 Worker:', error);
      message.error('Worker 初始化失败，请刷新页面重试');
      loading.value = false;
      return;
    }
  }

  // 准备调色板数据
  const palette = currentPaletteColors.value.map(c => ({
    code: c.key || c.code, // 使用key作为code（hex值）
    hex: c.hex,
    name: c.name || c.code || c.key,
    rgb: c.rgb // 确保包含rgb信息
  }));
  
  console.log('Prepared palette for worker:', { paletteCount: palette.length, sample: palette[0] });
  console.log('Image dimensions:', { w, h, imgDataWidth: imgData.width, imgDataHeight: imgData.height });

  // 转换 ImageData 为可传输的格式
  const pixels = Array.from(imgData.data);
  console.log('Pixels converted to array:', { length: pixels.length });

  workerInstance.postMessage({
    pixels: pixels,
    width: w,
    height: h,
    palette: JSON.parse(JSON.stringify(palette)),
    maxColors: config.maxColors,
    useClustering: config.useClustering,
    colorThreshold: config.colorThreshold,
    processingMode: config.useRealistic ? 'average' : 'dominant', // 真实化开启=平均模式，关闭=主色模式
    dither: config.dither,
    grayscale: config.grayscale,
    enhanceEdges: config.enhanceEdges,
    optCartoon: config.optCartoon,
    optCleanBg: config.optCleanBg,
    optDetail: config.optDetail
  });

  workerInstance.onmessage = (e) => {
    const { type, success, grid, stats, mappedPixelData: workerMappedPixelData, gridDimensions: workerGridDimensions, colorCounts, totalBeadCount, error } = e.data;
    
    // 处理进度更新
    if (type === 'progress') {
      return;
    }
    
    // 处理结果
    if (type === 'result' || type === undefined) {
      if (success) {
        // 兼容两种返回格式
        if (grid && stats) {
          // 参考代码格式
          console.log('Worker returned grid:', { gridRows: grid.length, gridCols: grid[0]?.length, statsCount: stats.length });
          gridData = grid;
          statsData.value = stats;
          totalPixels = stats.reduce((acc, cur) => acc + cur.count, 0);
          
          // 转换为mappedPixelData格式
          const mapped = grid.map(row => 
            row.map(cell => {
              if (!cell) {
                // 处理null或undefined的cell（透明像素）
                return { key: 'TRANSPARENT', color: '#FFFFFF', isExternal: true };
              }
              return {
                key: cell.code || cell.key || '?',
                color: cell.hex || cell.color || '#FFFFFF',
                isExternal: false
              };
            })
          );
          console.log('Converted mappedPixelData:', { rows: mapped.length, cols: mapped[0]?.length, sample: mapped[0]?.[0] });
          
          // 先设置数据
          mappedPixelData.value = mapped;
          gridDimensions.value = { N: w, M: h };
          
          console.log('Set gridDimensions:', gridDimensions.value);
          console.log('mappedPixelData.value after setting:', { 
            hasData: !!mappedPixelData.value, 
            rows: mappedPixelData.value?.length, 
            cols: mappedPixelData.value?.[0]?.length,
            firstCell: mappedPixelData.value?.[0]?.[0]
          });
          
          // 先设置 generated，让组件可以渲染
          generated.value = true;
          
          // 等待响应式更新完成后再调用其他函数
          nextTick(() => {
            console.log('After nextTick - mappedPixelData:', { 
              hasData: !!mappedPixelData.value, 
              rows: mappedPixelData.value?.length,
              gridDimensions: gridDimensions.value,
              generated: generated.value
            });
            
            // 再次检查数据是否存在
            if (!mappedPixelData.value || !gridDimensions.value) {
              console.error('Data still missing after nextTick:', {
                hasMappedPixelData: !!mappedPixelData.value,
                hasGridDimensions: !!gridDimensions.value
              });
              return;
            }
            
            // 在 nextTick 中调用这些函数，确保数据已经更新
            updateAvailableColors();
            initFullPaletteColors();
            
            // 初始化编辑器历史
            if (mappedPixelData.value) {
              initHistory(mappedPixelData.value);
            }
            
            console.log('Generation complete - Final state:', {
              generated: generated.value,
              hasMappedPixelData: !!mappedPixelData.value,
              mappedPixelDataRows: mappedPixelData.value?.length,
              hasGridDimensions: !!gridDimensions.value,
              gridDimensions: gridDimensions.value,
              availableColorsCount: availableColors.value.length,
              fullPaletteColorsCount: fullPaletteColors.value.length
            });
            
            message.success(`生成成功`);
            
            // 再次等待 DOM 更新后调整视图
            nextTick(() => {
              fitView();
              console.log('View fitted');
            });
          });
        } else if (workerMappedPixelData && workerGridDimensions) {
          // 旧格式
          gridData = workerMappedPixelData;
          mappedPixelData.value = workerMappedPixelData;
          gridDimensions.value = workerGridDimensions;
          statsData.value = Object.values(colorCounts || {}).map(item => ({
            code: item.code,
            hex: item.color,
            count: item.count
          }));
          totalPixels = totalBeadCount || 0;
          
          // 等待响应式更新
          nextTick(() => {
            updateAvailableColors();
            initFullPaletteColors();
            if (mappedPixelData.value) {
              initHistory(mappedPixelData.value);
            }
            generated.value = true;
            message.success(`生成成功`);
            nextTick(() => fitView());
          });
        }
      } else {
        message.error(error || '处理失败');
      }
      loading.value = false;
    }
  };

  workerInstance.onerror = (errorEvent) => {
    console.error('Worker 错误事件:', errorEvent);
    
    // Worker 错误事件可能不包含详细信息，尝试从 error 属性获取
    const errorMessage = errorEvent.message || errorEvent.error?.message || 'Worker 执行出错';
    const errorFilename = errorEvent.filename || 'pixelationWorker.js';
    const errorLineno = errorEvent.lineno || errorEvent.error?.lineno || '未知';
    
    console.error('错误详情:', {
      message: errorMessage,
      filename: errorFilename,
      lineno: errorLineno,
      colno: errorEvent.colno,
      error: errorEvent.error
    });
    
    message.error(`图片处理出错: ${errorMessage} (${errorFilename}:${errorLineno})`);
    loading.value = false;
  };
};

// 更新可用颜色列表
const updateAvailableColors = () => {
  console.log('updateAvailableColors called:', {
    hasMappedPixelData: !!mappedPixelData.value,
    mappedPixelDataValue: mappedPixelData.value,
    hasGridDimensions: !!gridDimensions.value,
    gridDimensionsValue: gridDimensions.value
  });
  
  if (!mappedPixelData.value || !gridDimensions.value) {
    console.warn('updateAvailableColors: Missing mappedPixelData or gridDimensions', {
      mappedPixelData: mappedPixelData.value,
      gridDimensions: gridDimensions.value
    });
    return;
  }
  
  console.log('updateAvailableColors: Starting', {
    mappedPixelDataRows: mappedPixelData.value.length,
    gridDimensions: gridDimensions.value
  });
  
  const colorMap = new Map();
  const { N, M } = gridDimensions.value;
  let processedCells = 0;
  let skippedCells = 0;
  
  for (let j = 0; j < M; j++) {
    for (let i = 0; i < N; i++) {
      const cell = mappedPixelData.value[j]?.[i];
      if (!cell) {
        skippedCells++;
        continue;
      }
      
      // 只处理非外部单元格
      if (!cell.isExternal) {
        const key = cell.color.toUpperCase();
        if (!colorMap.has(key)) {
          const colorKey = cell.key || getColorKeyByHex(cell.color, selectedColorSystem.value) || key;
          colorMap.set(key, {
            key: colorKey,
            color: cell.color,
            count: 0
          });
        }
        colorMap.get(key).count++;
        processedCells++;
      } else {
        skippedCells++;
      }
    }
  }
  
  console.log('updateAvailableColors: Processed', {
    processedCells,
    skippedCells,
    uniqueColors: colorMap.size,
    colorMapEntries: Array.from(colorMap.entries()).slice(0, 5)
  });
  
  availableColors.value = Array.from(colorMap.values()).sort((a, b) => b.count - a.count);
  
  // 添加透明色选项
  availableColors.value.unshift({
    key: TRANSPARENT_KEY,
    color: '#FFFFFF',
    isExternal: true
  });
  
  console.log('updateAvailableColors: Final availableColors', {
    count: availableColors.value.length,
    sample: availableColors.value.slice(0, 5)
  });
  
  // 更新完整色板
  fullPaletteColors.value = currentPaletteColors.value.map(c => ({
    key: c.key || c.code,
    color: c.hex,
    name: c.name || c.code || c.key
  }));
};

// 初始化完整色板（在组件挂载时）
const initFullPaletteColors = () => {
  // 确保 currentPaletteColors 已经准备好
  if (currentPaletteColors.value && currentPaletteColors.value.length > 0) {
    fullPaletteColors.value = currentPaletteColors.value.map(c => ({
      key: c.key || c.code,
      color: c.hex,
      name: c.name || c.code || c.key
    }));
    console.log('Initialized fullPaletteColors:', { count: fullPaletteColors.value.length, sample: fullPaletteColors.value[0] });
  } else {
    // 如果 currentPaletteColors 还没准备好，使用 fullBeadPalette
    fullPaletteColors.value = fullBeadPalette.map(c => ({
      key: c.key || c.hex,
      color: c.hex,
      name: c.key || c.hex
    }));
    console.log('Initialized fullPaletteColors from fullBeadPalette:', { count: fullPaletteColors.value.length });
  }
};

const startDrag = (e) => { 
  view.isDragging = true; 
  view.startX = e.clientX - view.x; 
  view.startY = e.clientY - view.y; 
};
const onDrag = (e) => { 
  if(view.isDragging) { 
    e.preventDefault(); 
    view.x = e.clientX - view.startX; 
    view.y = e.clientY - view.startY; 
  }
};
const stopDrag = () => { view.isDragging = false; };
const onWheel = (e) => { 
  e.preventDefault(); 
  const newScale = view.scale - e.deltaY * 0.001; 
  view.scale = Math.min(Math.max(0.1, newScale), 10); 
};
const startTouch = (e) => { 
  if(e.touches.length===1) { 
    view.isDragging=true; 
    view.startX=e.touches[0].clientX-view.x; 
    view.startY=e.touches[0].clientY-view.y; 
  }
};
const onTouch = (e) => { 
  if(view.isDragging && e.touches.length===1) { 
    e.preventDefault(); 
    view.x=e.touches[0].clientX-view.startX; 
    view.y=e.touches[0].clientY-view.startY; 
  }
};
const stopTouch = () => { view.isDragging = false; };
const fitView = () => {
  if (!generated.value || !gridDimensions.value) {
    view.scale = 1;
    view.x = 0;
    view.y = 0;
    return;
  }
  
  // 获取画布容器的实际尺寸
  const container = document.querySelector('.canvas-container');
  if (!container) {
    view.scale = 1;
    view.x = 0;
    view.y = 0;
    return;
  }
  
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;
  
  // 获取画布的实际尺寸（从PixelatedPreviewCanvas组件计算）
  const isMobile = window.innerWidth < 1024;
  const { N, M } = gridDimensions.value;
  const aspectRatio = N / M;
  
  let canvasWidth, canvasHeight;
  if (isMobile) {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const padding = 40;
    const headerHeight = 48;
    const footerHeight = 32;
    const controlPanelHeight = screenHeight * 0.55;
    const availableHeight = screenHeight - headerHeight - controlPanelHeight - footerHeight - 20;
    const availableWidth = screenWidth - padding;
    
    if (aspectRatio > 1) {
      canvasWidth = Math.min(availableWidth, availableHeight * aspectRatio);
      canvasHeight = canvasWidth / aspectRatio;
    } else {
      canvasHeight = Math.min(availableWidth / aspectRatio, availableHeight);
      canvasWidth = canvasHeight * aspectRatio;
    }
    canvasWidth = Math.max(Math.min(canvasWidth, availableWidth), 200);
  } else {
    const maxSize = Math.max(window.innerWidth - 100, 600);
    if (aspectRatio > 1) {
      canvasWidth = maxSize;
      canvasHeight = maxSize / aspectRatio;
    } else {
      canvasHeight = maxSize;
      canvasWidth = maxSize * aspectRatio;
    }
  }
  
  // 计算合适的缩放比例，确保画布完整显示在容器内
  const scaleX = containerWidth / canvasWidth;
  const scaleY = containerHeight / canvasHeight;
  const scale = Math.min(scaleX, scaleY, 1) * 0.95; // 留出一些边距
  
  view.scale = Math.max(0.1, Math.min(scale, 2)); // 限制缩放范围
  view.x = 0;
  view.y = 0;
};
const zoomIn = () => view.scale = Math.min(view.scale + 0.1, 5);
const zoomOut = () => view.scale = Math.max(view.scale - 0.1, 0.1);

// 画布交互处理
const handleCanvasInteraction = (clientX, clientY, pageX, pageY, isManualMode, isClick = false) => {
  if (!mappedPixelData.value || !gridDimensions.value) return;
  
  // 获取PixelatedPreviewCanvas的canvas元素
  const canvas = document.querySelector('.pixelated-canvas');
  if (!canvas) return;
  
  const coords = clientToGridCoords(clientX, clientY, canvas, gridDimensions.value);
  if (!coords) {
    tooltipData.value = null;
    return;
  }
  
  const { i, j } = coords;
  const cell = mappedPixelData.value[j]?.[i];
  
  if (!cell) {
    tooltipData.value = null;
    return;
  }
  
  // 更新tooltip（仅在非点击或非手动模式时）
  if (!isClick || !isManualMode) {
    tooltipData.value = {
      x: pageX,
      y: pageY,
      color: cell.color,
      key: cell.key
    };
  }
  
  // 颜色替换模式处理
  if (colorReplaceState.value?.isActive && isClick) {
    if (colorReplaceState.value.step === 'select-source' && cell && !cell.isExternal) {
      colorReplaceState.value = {
        isActive: true,
        step: 'select-target',
        sourceColor: {
          key: cell.key,
          color: cell.color
        }
      };
      message.info('请选择要替换成的颜色');
      return;
    }
  }
  
  // 一键擦除模式
  if (isEraseMode.value && isClick && cell && !cell.isExternal) {
    const newData = floodFillErase(mappedPixelData.value, gridDimensions.value, j, i, cell.key);
    mappedPixelData.value = newData;
    saveSnapshot(newData);
    updateAvailableColors();
    message.success('颜色已清除');
    return;
  }
  
  // 手动编辑模式下的点击处理
  if (isManualMode && isClick) {
    handleManualEdit(i, j);
  }
};

const handleHighlightComplete = () => {
  // 高亮完成后的处理
};

// 手动编辑处理
const handleManualEdit = (x, y) => {
  if (!mappedPixelData.value || !gridDimensions.value) return;
  
  const { M, N } = gridDimensions.value;
  if (x < 0 || x >= N || y < 0 || y >= M) return;
  
  const cell = mappedPixelData.value[y]?.[x];
  if (!cell) return;
  
  // 颜色替换模式 - 第一步：选择源颜色
  if (colorReplaceState.value?.isActive && colorReplaceState.value.step === 'select-source') {
    if (cell && !cell.isExternal) {
      colorReplaceState.value = {
        isActive: true,
        step: 'select-target',
        sourceColor: {
          key: cell.key,
          color: cell.color
        }
      };
      message.info('请选择要替换成的颜色');
    }
    return;
  }
  
  // 取色器模式
  if (editorState.currentTool === 'picker') {
    selectedColor.value = {
      key: cell.key,
      color: cell.color
    };
    editorState.currentTool = 'brush';
    const displayKey = getDisplayColorKey(cell.color, selectedColorSystem.value);
    message.success(`已选择颜色: ${displayKey}`);
    return;
  }
  
  // 橡皮擦模式
  if (editorState.currentTool === 'eraser' || (selectedColor.value && selectedColor.value.key === TRANSPARENT_KEY)) {
    const oldData = JSON.parse(JSON.stringify(mappedPixelData.value));
    mappedPixelData.value[y][x] = { ...transparentColorData };
    saveSnapshot(mappedPixelData.value);
    updateAvailableColors();
    return;
  }
  
  // 画笔模式
  if (selectedColor.value && editorState.currentTool === 'brush') {
    const newCell = {
      key: selectedColor.value.key,
      color: selectedColor.value.color,
      isExternal: false
    };
    if (cell.key !== newCell.key || cell.color !== newCell.color) {
      const oldData = JSON.parse(JSON.stringify(mappedPixelData.value));
      mappedPixelData.value[y][x] = newCell;
      saveSnapshot(mappedPixelData.value);
      updateAvailableColors();
    }
  }
};

// 颜色选择
const handleColorSelect = (colorData) => {
  selectedColor.value = colorData;
  editorState.currentTool = colorData.key === TRANSPARENT_KEY ? 'eraser' : 'brush';
};

// 高亮颜色
const highlightColorKey = ref(null);
const handleHighlightColor = (color) => {
  highlightColorKey.value = color;
  setTimeout(() => {
    highlightColorKey.value = null;
  }, 300);
};

// 键盘快捷键处理
let keydownHandler = null;

const handleKeyDown = (e) => {
  if (!isManualColoringMode.value) return;
  // Ctrl+Z 或 Cmd+Z 撤销
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault();
    const restored = undo();
    if (restored) {
      mappedPixelData.value = restored;
      updateAvailableColors();
      message.success('已撤销');
    } else {
      message.info('没有可撤销的操作');
    }
  }
  // Ctrl+Shift+Z 或 Cmd+Shift+Z 重做
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
    e.preventDefault();
    const restored = redo();
    if (restored) {
      mappedPixelData.value = restored;
      updateAvailableColors();
      message.success('已重做');
    } else {
      message.info('没有可重做的操作');
    }
  }
};

// 手动编辑模式切换
const handleEnterManualMode = () => {
  if (!generated.value || !mappedPixelData.value) {
    message.warning('请先生成像素画');
    return;
  }
  isManualColoringMode.value = true;
  isPaletteOpen.value = true;
  // 初始化编辑器状态
  if (mappedPixelData.value && gridDimensions.value) {
    initHistory(mappedPixelData.value);
  }
  // 确保有可用颜色
  if (availableColors.value.length === 0) {
    updateAvailableColors();
  }
  // 初始化默认工具
  editorState.currentTool = 'brush';
  if (!selectedColor.value && availableColors.value.length > 0) {
    // 默认选择第一个非透明颜色
    const firstColor = availableColors.value.find(c => c.key !== TRANSPARENT_KEY);
    if (firstColor) {
      selectedColor.value = firstColor;
    }
  }
  // 显示自定义消息提示
  manualEditMessage.value = '已进入手动编辑模式';
  setTimeout(() => {
    manualEditMessage.value = '';
  }, 3000);
  
  // 添加键盘快捷键监听
  if (!keydownHandler) {
    keydownHandler = handleKeyDown;
    window.addEventListener('keydown', keydownHandler);
  }
};

const handleTogglePalette = () => {
  isPaletteOpen.value = !isPaletteOpen.value;
};

const handleExitManualMode = () => {
  isManualColoringMode.value = false;
  isPaletteOpen.value = false;
  isMagnifierActive.value = false;
  magnifierSelectionArea.value = null;
  isMagnifierFloatingActive.value = false;
  // 移除键盘快捷键监听
  if (keydownHandler) {
    window.removeEventListener('keydown', keydownHandler);
    keydownHandler = null;
  }
  // 显示自定义消息提示
  manualEditMessage.value = '已退出手动编辑模式';
  setTimeout(() => {
    manualEditMessage.value = '';
  }, 3000);
};



const handleToggleMagnifier = () => {
  isMagnifierActive.value = !isMagnifierActive.value;
  if (!isMagnifierActive.value) {
    magnifierSelectionArea.value = null;
    isMagnifierFloatingActive.value = false;
  }
};

const handleMagnifierSelectionComplete = (area) => {
  magnifierSelectionArea.value = area;
  isMagnifierFloatingActive.value = true;
};

const handleClearMagnifierSelection = () => {
  magnifierSelectionArea.value = null;
};

const handleMagnifierPixelEdit = (row, col, color) => {
  if (!mappedPixelData.value || !gridDimensions.value) return;
  const { M, N } = gridDimensions.value;
  if (col < 0 || col >= N || row < 0 || row >= M) return;
  
  const newCell = {
    key: color.key,
    color: color.color,
    isExternal: false
  };
  mappedPixelData.value[row][col] = newCell;
  saveSnapshot(mappedPixelData.value);
  updateAvailableColors();
};

const handleActivateMagnifierFloating = () => {
  isMagnifierFloatingActive.value = true;
};

// 擦除模式
const handleEraseToggle = () => {
  isEraseMode.value = !isEraseMode.value;
  if (isEraseMode.value) {
    message.info('一键擦除模式：点击颜色块可清除整个颜色区域');
  }
};

// 颜色替换
const handleColorReplaceToggle = () => {
  if (!colorReplaceState.value || !colorReplaceState.value.isActive) {
    colorReplaceState.value = {
      isActive: true,
      step: 'select-source',
      sourceColor: null
    };
  } else {
    colorReplaceState.value = null;
  }
};

const handleColorReplace = (sourceColor, targetColor) => {
  if (!mappedPixelData.value || !gridDimensions.value) return;
  
  const newData = replaceColor(
    mappedPixelData.value,
    gridDimensions.value,
    sourceColor.color,
    targetColor.color,
    targetColor.key
  );
  
  mappedPixelData.value = newData;
  saveSnapshot(newData);
  updateAvailableColors();
  colorReplaceState.value = null;
  message.success('颜色替换完成');
};

const handleToggleFullPalette = () => {
  showFullPalette.value = !showFullPalette.value;
};

// 下载相关
const handleOpenDownloadModal = () => {
  downloadModalOpen.value = true;
};

const handleDownload = () => {
  if (!mappedPixelData.value || !gridDimensions.value) return;
  
  // 将 statsData 转换为 colorCounts 格式
  const colorCounts = {};
  if (statsData.value && Array.isArray(statsData.value)) {
    statsData.value.forEach(item => {
      colorCounts[item.code || item.key] = {
        count: item.count,
        color: item.hex || item.color,
        code: item.code || item.key
      };
    });
  }
  
  // 计算总像素数
  const totalBeadCount = statsData.value?.reduce((acc, cur) => acc + (cur.count || 0), 0) || 0;
  
  downloadImage({
    mappedPixelData: mappedPixelData.value,
    gridDimensions: gridDimensions.value,
    colorCounts: colorCounts,
    totalBeadCount: totalBeadCount,
    options: downloadOptions,
    activeBeadPalette: activeBeadPalette.value,
    selectedColorSystem: selectedColorSystem.value
  });
  
  if (downloadOptions.exportCsv) {
    exportCsvData({
      mappedPixelData: mappedPixelData.value,
      gridDimensions: gridDimensions.value,
      selectedColorSystem: selectedColorSystem.value
    });
  }
  
  downloadModalOpen.value = false;
  message.success('下载完成');
};


const download = () => {
  handleOpenDownloadModal();
};

// 监听mappedPixelData变化，更新gridData
watch(mappedPixelData, (newData) => {
  if (newData && gridDimensions.value) {
    gridData = newData.map(row => 
      row.map(cell => ({
        code: cell.key,
        hex: cell.color,
        name: cell.key
      }))
    );
  }
}, { deep: true });

onUnmounted(() => {
  workerInstance?.terminate();
  if (keydownHandler) {
    window.removeEventListener('keydown', keydownHandler);
  }
});
</script>

<style scoped>
/* 主应用容器 */
.main-app-container {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--c-bg, #f0f5ff);
  color: var(--c-text-main, #2c3e50);
  transition: background-color 0.5s ease, color 0.5s ease;
  user-select: none;
  font-family: 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* Header */
.app-header {
  height: 56px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--c-surface, #ffffff);
  background: color-mix(in srgb, var(--c-surface, #ffffff) 80%, transparent);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--c-border, #eef2f6);
  z-index: 50;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--c-primary, #4096ff);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.header-icon:hover {
  transform: scale(1.1);
}

.header-icon :deep(svg) {
  font-size: 20px;
}

.app-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--c-text-main, #2c3e50);
  letter-spacing: -0.5px;
}

.pro-tag {
  display: inline-block;
  margin-left: 8px;
  font-size: 10px;
  padding: 2px 8px;
  background: var(--c-primary-bg, #e6f7ff);
  color: var(--c-primary, #4096ff);
  border-radius: 12px;
  font-weight: 600;
  border: 1px solid color-mix(in srgb, var(--c-primary, #4096ff) 20%, transparent);
  vertical-align: top;
}

.pro-tag-hidden {
  display: none;
}

@media (min-width: 1024px) {
  .pro-tag-hidden {
    display: inline-block;
  }
}

.theme-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid var(--c-border, #eef2f6);
  background: var(--c-bg, #f0f5ff);
  color: var(--c-text-main, #2c3e50);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 12px;
}

.theme-button:hover {
  background: var(--c-primary-bg, #e6f7ff);
  color: var(--c-primary, #4096ff);
  border-color: var(--c-primary, #4096ff);
}

.theme-icon {
  font-size: 18px;
  color: var(--c-primary, #4096ff);
}

.theme-label {
  font-weight: 600;
}

.theme-label-hidden {
  display: none;
}

@media (min-width: 640px) {
  .theme-label-hidden {
    display: inline;
  }
}

/* Main Content */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  position: relative;
}

.main-content-mobile {
  flex-direction: column;
}

/* 控制面板 */
.control-panel {
  width: 320px;
  height: 100%;
  background: var(--c-surface, #ffffff);
  border-right: 1px solid var(--c-border, #eef2f6);
  display: flex;
  flex-direction: column;
  z-index: 20;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.control-panel-mobile {
  order: 2;
  width: 100%;
  height: auto;
  max-height: none;
  position: static;
  border-right: none;
  border-top: 1px solid var(--c-border, #eef2f6);
  border-radius: 24px 24px 0 0;
  box-shadow: 0 -6px 16px rgba(0, 0, 0, 0.08);
  padding-bottom: calc(env(safe-area-inset-bottom, 16px) + 12px);
}

.control-panel-mobile .panel-content {
  max-height: none;
  padding-bottom: 80px;
}

.control-panel-mobile .panel-footer {
  position: sticky;
  bottom: 0;
  background: var(--c-surface, #ffffff);
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);
  border-top: 1px solid var(--c-border, #eef2f6);
}

@media (min-width: 1024px) {
  .control-panel-mobile {
    order: 1;
    position: relative;
    width: 320px;
    height: 100%;
    border-top: none;
    border-right: 1px solid var(--c-border, #eef2f6);
    border-radius: 0;
  }
}

.panel-tabs {
  flex-shrink: 0;
  display: flex;
  gap: 8px;
  padding: 8px;
  background: var(--c-surface, #ffffff);
  border-bottom: 1px solid var(--c-border, #eef2f6);
  border-radius: 30px 30px 0 0;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

@media (min-width: 1024px) {
  .panel-tabs {
    border-radius: 0;
  }
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 20px;
  border: none;
  background: var(--c-bg, #f0f5ff);
  color: var(--c-text-sub, #8c9fa8);
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-button:hover {
  background: var(--c-primary-bg, #e6f7ff);
  color: var(--c-primary, #4096ff);
}

.tab-button-active {
  background: var(--c-primary, #4096ff);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.tab-button-active:hover {
  background: var(--c-primary, #4096ff);
  color: #ffffff;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px;
  background: var(--c-surface, #ffffff);
  transition: background-color 0.3s ease;
  scroll-behavior: smooth;
  /* Firefox 滚动条样式 - 使用主题色 */
  scrollbar-width: thin;
  scrollbar-color: var(--c-primary, #4096ff) rgba(0, 0, 0, 0.05);
  /* 优化滚动性能 */
  -webkit-overflow-scrolling: touch;
  will-change: scroll-position;
  position: relative;
}

/* Webkit 滚动条样式 - 精美设计 */
.panel-content::-webkit-scrollbar {
  width: 8px;
  opacity: 0;
  transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-content:hover::-webkit-scrollbar,
.panel-content:focus-within::-webkit-scrollbar {
  opacity: 1;
}

.panel-content::-webkit-scrollbar-track {
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.02) 0%,
    rgba(0, 0, 0, 0.04) 50%,
    rgba(0, 0, 0, 0.02) 100%
  );
  border-radius: 12px;
  margin: 12px 4px;
  border: 1px solid rgba(0, 0, 0, 0.03);
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.02);
}

.panel-content::-webkit-scrollbar-thumb {
  background: linear-gradient(
    180deg,
    var(--c-primary, #4096ff) 0%,
    color-mix(in srgb, var(--c-primary, #4096ff) 90%, transparent) 50%,
    var(--c-primary, #4096ff) 100%
  );
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid var(--c-surface, #ffffff);
  box-shadow: 
    0 2px 8px rgba(64, 150, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  min-height: 40px;
  position: relative;
}

.panel-content::-webkit-scrollbar-thumb::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 60%;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 2px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--c-primary, #4096ff) 100%, white 10%) 0%,
    var(--c-primary, #4096ff) 50%,
    color-mix(in srgb, var(--c-primary, #4096ff) 100%, white 10%) 100%
  );
  box-shadow: 
    0 4px 12px rgba(64, 150, 255, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  transform: scaleX(1.1);
  border-color: rgba(255, 255, 255, 0.5);
}

.panel-content::-webkit-scrollbar-thumb:hover::before {
  opacity: 1;
}

.panel-content::-webkit-scrollbar-thumb:active {
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--c-primary, #4096ff) 100%, black 5%) 0%,
    color-mix(in srgb, var(--c-primary, #4096ff) 100%, black 10%) 50%,
    color-mix(in srgb, var(--c-primary, #4096ff) 100%, black 5%) 100%
  );
  box-shadow: 
    0 2px 6px rgba(64, 150, 255, 0.4),
    inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 添加顶部和底部渐变遮罩 */
.panel-content::before,
.panel-content::after {
  content: '';
  position: sticky;
  left: 0;
  right: 0;
  height: 20px;
  pointer-events: none;
  z-index: 1;
  flex-shrink: 0;
}

.panel-content::before {
  top: 0;
  background: linear-gradient(180deg, 
    rgba(255, 255, 255, 0.98) 0%, 
    rgba(255, 255, 255, 0.6) 40%, 
    rgba(255, 255, 255, 0.2) 70%, 
    transparent 100%);
  margin-bottom: -20px;
  border-radius: 0 0 12px 12px;
}

.panel-content::after {
  bottom: 0;
  background: linear-gradient(0deg, 
    rgba(255, 255, 255, 0.98) 0%, 
    rgba(255, 255, 255, 0.6) 40%, 
    rgba(255, 255, 255, 0.2) 70%, 
    transparent 100%);
  margin-top: -20px;
  border-radius: 12px 12px 0 0;
}

.settings-content,
.stats-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 0;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stats-content {
  overflow-y: auto;
  padding-right: 4px;
}

/* 上传区域 */
.upload-section {
  margin-bottom: 24px;
}

.upload-dragger {
  background: var(--c-bg, #f0f5ff) !important;
  border: 0px dashed var(--c-border, #eef2f6) !important;
  border-radius: 24px !important;
  padding: 0 !important;
  overflow: hidden !important;
  transition: all 0.3s ease !important;
}

.upload-dragger:hover {
  border-color: var(--c-primary, #4096ff) !important;
}

.upload-placeholder {
  padding: 32px 0;
  text-align: center;
  transition: transform 0.3s ease;
}

.upload-dragger:hover .upload-placeholder {
  transform: scale(1.05);
}

.upload-icon {
  margin-bottom: 8px;
  color: var(--c-primary, #4096ff);
  opacity: 0.8;
}

.upload-icon :deep(svg) {
  font-size: 48px;
}

.upload-text {
  font-size: 12px;
  color: var(--c-text-sub, #8c9fa8);
  font-weight: 600;
}

.preview-container {
  position: relative;
  height: 144px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--c-bg, #f0f5ff);
}

.preview-image {
  height: 100%;
  width: 100%;
  object-fit: contain;
  padding: 8px;
}

.preview-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, white 80%, transparent);
  opacity: 0;
  transition: opacity 0.3s;
  cursor: pointer;
  backdrop-filter: blur(4px);
  font-weight: 600;
  font-size: 14px;
  color: var(--c-primary, #4096ff);
}

.upload-dragger:hover .preview-overlay {
  opacity: 1;
}

/* 选项卡片 */
.option-card {
  background: var(--c-bg, #f0f5ff);
  padding: 16px;
  border-radius: 24px;
  border: 1px solid var(--c-border, #eef2f6);
  transition: all 0.3s ease;
}

.option-card:hover {
  border-color: var(--c-primary, #4096ff);
}

.option-card-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--c-text-sub, #8c9fa8);
  margin-bottom: 16px;
  margin-left: 4px;
}

.option-card-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-container:hover .preview-overlay {
  opacity: 1;
}

.option-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--c-text-main, #2c3e50);
}

.option-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  color: #999;
}

.option-icon :deep(svg) {
  font-size: 16px;
}

/* 核心参数区域 */
.core-params-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.space-y-6 > * + * {
  margin-top: 24px;
}

/* 网格尺寸区域 */
.grid-size-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.param-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  padding: 0 4px;
}

.param-label {
  font-weight: 600;
  color: var(--c-text-sub, #8c9fa8);
}

.lock-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--c-primary-bg, #e6f7ff);
  color: var(--c-primary, #4096ff);
}

.lock-button-active {
  background: var(--c-primary-bg, #e6f7ff);
  color: var(--c-primary, #4096ff);
}

.lock-button:not(.lock-button-active) {
  background: #fff5e6;
  color: #ff9800;
}

.grid-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
}

.grid-input {
  flex: 1;
  text-align: center;
  border-radius: 12px;
  border-color: var(--c-border, #eef2f6);
}

.grid-separator {
  color: var(--c-text-sub, #8c9fa8);
  padding-top: 4px;
}

.preset-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-top: 4px;
}

.preset-button {
  padding: 6px 0;
  font-size: 10px;
  border-radius: 12px;
  border: 1px solid var(--c-border, #eef2f6);
  background: var(--c-bg, #f0f5ff);
  color: var(--c-text-sub, #8c9fa8);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
}

.preset-button:hover {
  border-color: var(--c-primary, #4096ff);
  color: var(--c-primary, #4096ff);
}

/* 聚类卡片 */
.clustering-card {
  background: var(--c-bg, #f0f5ff);
  padding: 12px;
  border-radius: 16px;
  border: 1px solid var(--c-border, #eef2f6);
  transition: all 0.3s ease;
}

.clustering-control {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.clustering-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--c-text-main, #2c3e50);
}

.clustering-desc {
  font-size: 10px;
  color: var(--c-text-sub, #8c9fa8);
  margin-top: 4px;
}

.clustering-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.clustering-slider {
  width: 96px;
}

/* 色号选择 */
.palette-select-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.palette-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--c-text-sub, #8c9fa8);
  margin-left: 4px;
}

.palette-select {
  width: 100%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.panel-footer {
  padding: 16px;
  border-top: 1px solid var(--c-border, #eef2f6);
  flex-shrink: 0;
  background: var(--c-surface, #ffffff);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  width: 100%;
}

.generate-button {
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 24px;
  transition: all 0.3s ease;
}

.generate-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
}

.action-button {
  height: 44px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 22px;
  transition: all 0.3s ease;
  border: 1px solid #d9d9d9;
  background: #ffffff;
  color: #262626;
}

.action-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-color: #40a9ff;
  color: #1890ff;
}

.action-button:active {
  transform: translateY(0);
}

.action-button :deep(.anticon) {
  margin-right: 6px;
}

/* 画布区域 */
.canvas-area {
  order: 1;
  flex: 1;
  width: 100%;
  height: 100%;
  background: var(--c-bg, #f0f5ff);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.canvas-area-mobile {
  order: 1;
  height: auto;
  min-height: 320px;
  padding-bottom: 16px;
}

@media (min-width: 1024px) {
  .canvas-area-mobile {
    order: 2;
    height: 100%;
  }
}

.canvas-controls {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 30;
}

.controls-inner {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.95);
  padding: 4px 6px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.control-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: #595959;
  font-size: 12px;
  transition: all 0.2s ease;
  padding: 0;
}

.control-btn:hover {
  background: rgba(24, 144, 255, 0.1);
  color: #1890ff;
}

.control-btn:active {
  background: rgba(24, 144, 255, 0.2);
  transform: scale(0.95);
}

.control-divider {
  width: 1px;
  height: 16px;
  background: rgba(0, 0, 0, 0.1);
  margin: 0 2px;
}

/* 移动端响应式样式 */
@media (max-width: 1023px) {
  .canvas-message {
    top: 8px;
    padding: 6px 16px;
    font-size: 12px;
  }
  
  .canvas-controls {
    top: 8px;
    left: 8px;
  }
  
  .controls-inner {
    padding: 3px 5px;
    gap: 3px;
  }
  
  .control-btn {
    width: 22px;
    height: 22px;
    font-size: 11px;
  }
  
  .control-divider {
    height: 14px;
    margin: 0 1px;
  }
  
  .zoom-text {
    font-size: 10px;
    width: 32px;
    line-height: 22px;
  }
  
  .canvas-footer {
    padding: 0 12px;
    font-size: 9px;
    height: 28px;
  }
  
  .app-header {
    padding: 0 16px;
    height: 48px;
  }
  
  .app-title {
    font-size: 16px;
  }
  
  .panel-content {
    padding: 12px;
  }
  
  /* 移动端滚动条优化 */
  .panel-content::-webkit-scrollbar {
    width: 6px;
  }
  
  .panel-content::-webkit-scrollbar-track {
    margin: 8px 2px;
  }
  
  .panel-content::-webkit-scrollbar-thumb {
    border-width: 1.5px;
    min-height: 30px;
  }
  
  .generate-button {
    height: 44px;
    font-size: 15px;
  }
  
  .action-button {
    height: 40px;
    font-size: 14px;
  }
}

.zoom-text {
  display: inline-block;
  width: 36px;
  text-align: center;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 11px;
  font-weight: 600;
  color: #262626;
  line-height: 24px;
  user-select: none;
}

.canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
  cursor: move;
  touch-action: none;
  overflow: hidden;
}

/* 手机端画布容器优化 */
@media (max-width: 1023px) {
  .canvas-container {
    overflow: hidden;
  }
}

.checkerboard-bg {
  position: absolute;
  inset: 0;
  background-color: #f5f5f5;
  background-image: 
    linear-gradient(45deg, #e6e6e6 25%, transparent 25%), 
    linear-gradient(-45deg, #e6e6e6 25%, transparent 25%), 
    linear-gradient(45deg, transparent 75%, #e6e6e6 75%), 
    linear-gradient(-45deg, transparent 75%, #e6e6e6 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  opacity: 0.4;
  pointer-events: none;
}

.canvas-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transform-origin: center;
  will-change: transform;
  overflow: visible;
}

/* 手机端画布包装器优化 */
@media (max-width: 1023px) {
  .canvas-wrapper {
    max-width: calc(100vw - 40px);
    max-height: calc(100vh - 48px - 55vh - 32px - 40px);
  }
  
  .canvas-wrapper :deep(.pixelated-canvas) {
    max-width: 100%;
    max-height: 100%;
    width: auto !important;
    height: auto !important;
    object-fit: contain;
  }
}

.canvas-wrapper :deep(.pixelated-canvas) {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  position: relative;
  z-index: 1;
}

.pixel-canvas {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  background: white;
  border-radius: 4px;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

.empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  writing-mode: horizontal-tb !important;
  text-orientation: mixed !important;
  direction: ltr !important;
}

.empty-state :deep(.ant-empty) {
  writing-mode: horizontal-tb !important;
  text-orientation: mixed !important;
  direction: ltr !important;
}

.empty-description {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  writing-mode: horizontal-tb !important;
  text-orientation: mixed !important;
  direction: ltr !important;
  width: auto !important;
  max-width: none !important;
}

.empty-icon-wrapper {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--c-bg, #f0f5ff);
  border-radius: 50%;
  margin-bottom: 8px;
}

.empty-icon {
  font-size: 48px;
  color: var(--c-primary, #4096ff);
  opacity: 0.6;
}

.empty-text {
  font-size: 14px;
  color: var(--c-text-sub, #8c9fa8);
  font-weight: 500;
  text-align: center;
  white-space: nowrap !important;
  word-break: keep-all !important;
  line-height: 1.5 !important;
  letter-spacing: normal !important;
  writing-mode: horizontal-tb !important;
  text-orientation: mixed !important;
  direction: ltr !important;
  display: inline-block !important;
  width: auto !important;
  max-width: none !important;
}

.empty-state :deep(.ant-empty-description) {
  writing-mode: horizontal-tb !important;
  text-orientation: mixed !important;
  direction: ltr !important;
  white-space: nowrap !important;
  word-break: keep-all !important;
  text-align: center !important;
  line-height: 1.5 !important;
  letter-spacing: normal !important;
  width: auto !important;
  max-width: none !important;
}

.empty-state :deep(.ant-empty-description) * {
  writing-mode: horizontal-tb !important;
  text-orientation: mixed !important;
  direction: ltr !important;
}

.canvas-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 32px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
   background: color-mix(in srgb, var(--c-surface, #ffffff) 80%, transparent);
  border-top: 1px solid var(--c-border, #eef2f6);
  backdrop-filter: blur(8px);
  font-size: 10px;
  color: var(--c-text-sub, #8c9fa8);
  z-index: 20;
  font-weight: 500;
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
}

/* 统计清单 */
.stats-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--c-text-sub, #8c9fa8);
  gap: 16px;
  padding: 40px 20px;
  opacity: 0.5;
}

.stats-empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--c-bg, #f0f5ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
}

.stats-empty-text {
  font-size: 12px;
  font-weight: 600;
}

.stats-data {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
}

.stats-summary-card {
  background: var(--c-primary, #4096ff);
  border-radius: 16px;
  color: white;
  box-shadow: 0 4px 16px rgba(64, 150, 255, 0.3);
  padding: 16px;
}

.stats-summary-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-summary-left {
  display: flex;
  flex-direction: column;
}

.stats-summary-label {
  font-size: 10px;
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.stats-summary-value {
  font-size: 24px;
  font-weight: 600;
}

.stats-summary-unit {
  font-size: 14px;
  font-weight: normal;
}

.stats-summary-badge {
  background: color-mix(in srgb, white 20%, transparent);
  padding: 6px 12px;
  border-radius: 8px;
  backdrop-filter: blur(4px);
  font-size: 12px;
  font-weight: 600;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.color-stat-card {
  display: flex;
  flex-direction: column;
  background: var(--c-bg, #f0f5ff);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--c-border, #eef2f6);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}

.color-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.color-swatch {
  width: 100%;
  height: 32px;
}

.color-info {
  padding: 8px;
  text-align: center;
}

.color-code {
  font-size: 10px;
  font-weight: 600;
  color: var(--c-text-main, #2c3e50);
}

.color-count {
  font-size: 9px;
  color: var(--c-text-sub, #8c9fa8);
  font-weight: 600;
  margin-top: 4px;
}


/* 主题样式 */
.theme-default {
  --c-bg: #f0f5ff;
  --c-surface: #ffffff;
  --c-text-main: #2c3e50;
  --c-text-sub: #8c9fa8;
  --c-border: #eef2f6;
  --c-primary: #4096ff;
  --c-primary-bg: #e6f7ff;
}

.theme-pink {
  --c-bg: #fefcfc;
  --c-surface: #ffffff;
  --c-text-main: #333333;
  --c-text-sub: #999999;
  --c-border: #f5f5f5;
  --c-primary: #ff2442;
  --c-primary-bg: #fff0f2;
}

.theme-cream {
  --c-bg: #fffbf2;
  --c-surface: #ffffff;
  --c-text-main: #5d4037;
  --c-text-sub: #a1887f;
  --c-border: #f3e5f5;
  --c-primary: #ffb74d;
  --c-primary-bg: #fff3e0;
}
</style>
