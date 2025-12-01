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
    <div v-else :class="currentTheme" class="fixed inset-0 w-full h-full flex flex-col bg-[var(--c-bg)] text-[var(--c-text-main)] transition-colors duration-500 select-none font-sans">
      
      <!-- Header -->
      <header class="h-14 px-6 flex items-center justify-between bg-[var(--c-surface)]/80 backdrop-blur border-b border-[var(--c-border)] z-50 shrink-0 shadow-sm transition-colors duration-300">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-[var(--c-primary)] flex items-center justify-center text-white shadow-md transition-all duration-300 hover:scale-110">
            <AppstoreFilled class="text-xl" />
          </div>
          <span class="text-lg font-bold tracking-tight text-[var(--c-text-main)]">
            拼豆吧 dc
            <span class="hidden lg:inline-block text-[10px] bg-[var(--c-primary-bg)] text-[var(--c-primary)] px-2 py-0.5 rounded-full ml-1 font-bold align-top border border-[var(--c-primary)]/20">PRO</span>
          </span>
        </div>
        
        <div>
          <a-tooltip :title="`${themeLabels[currentTheme]}`">
            <button 
              @click="cycleTheme" 
              class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--c-bg)] hover:bg-[var(--c-primary-bg)] transition-all duration-300 border border-[var(--c-border)]"
            >
              <SkinOutlined v-if="currentTheme === 'theme-default'" class="text-[var(--c-primary)] text-lg" />
              <HeartFilled v-else-if="currentTheme === 'theme-pink'" class="text-[#ff2442] text-lg" />
              <CoffeeOutlined v-else class="text-[#8d6e63] text-lg" />
              <span class="text-xs font-bold text-[var(--c-text-main)] hidden sm:inline">{{ themeLabels[currentTheme] }}</span>
            </button>
          </a-tooltip>
        </div>
      </header>

      <!-- Main Layout -->
      <main class="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        <!-- 左侧控制面板 -->
        <aside class="
          order-2 lg:order-1
          w-full lg:w-80 
          h-[55%] lg:h-full 
          bg-[var(--c-surface)] 
          border-t lg:border-t-0 lg:border-r border-[var(--c-border)] 
          flex flex-col z-20 shadow-xl
          transition-colors duration-300
          rounded-t-[30px] lg:rounded-none
        ">
          
          <div class="flex p-2 gap-2 shrink-0 bg-[var(--c-surface)] rounded-t-[30px] lg:rounded-none transition-colors duration-300">
            <button 
              v-for="tab in ['settings', 'stats']"
              :key="tab"
              class="flex-1 py-2.5 text-xs font-bold rounded-full transition-all duration-300 flex items-center justify-center gap-1"
              :class="activeTab === tab 
                ? 'bg-[var(--c-primary)] text-white shadow-md' 
                : 'bg-[var(--c-bg)] text-[var(--c-text-sub)] hover:bg-[var(--c-primary-bg)] hover:text-[var(--c-primary)]'"
              @click="activeTab = tab"
            >
              <SettingOutlined v-if="tab === 'settings'" />
              <BarChartOutlined v-else />
              {{ tab === 'settings' ? '参数设置' : '用量清单' }}
            </button>
          </div>
          
          <div class="flex-1 overflow-y-auto px-5 pb-5 space-y-6 custom-scroll bg-[var(--c-surface)] transition-colors duration-300">
            
            <!-- Tab 1: 设置 -->
            <div v-show="activeTab === 'settings'" class="space-y-6 animate-fade-in">
              
              <!-- 上传 -->
              <div class="space-y-2 pt-2">
                <a-upload-dragger 
                  :showUploadList="false" 
                  :customRequest="handleCustomUpload" 
                  class="!bg-[var(--c-bg)] !border-2 !border-dashed !border-[var(--c-border)] !rounded-3xl !p-0 !overflow-hidden !box-border group hover:!border-[var(--c-primary)] transition-all"
                >
                   <div v-if="!previewUrl" class="py-8 text-center group-hover:scale-105 transition-transform duration-300">
                     <div class="mb-2 text-[var(--c-primary)] opacity-80"><InboxOutlined class="text-4xl"/></div>
                     <p class="text-xs text-[var(--c-text-sub)] font-bold">点击添加图片</p>
                   </div>
                   <div v-else class="relative h-36 bg-[var(--c-bg)] flex items-center justify-center overflow-hidden">
                     <img :src="previewUrl" class="h-full w-full object-contain p-2" />
                     <div class="absolute inset-0 flex items-center justify-center bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--c-primary)] text-sm font-bold cursor-pointer backdrop-blur-sm">
                       <CloudUploadOutlined class="mr-1"/> 更换图片
                     </div>
                   </div>
                </a-upload-dragger>
              </div>

              <!-- 风格处理 -->
              <div class="bg-[var(--c-bg)] p-4 rounded-3xl border border-[var(--c-border)] space-y-4 transition-colors duration-300">
                 <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-[var(--c-text-main)] flex items-center gap-2">
                      <span class="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-400"><FileImageOutlined/></span> 黑白线稿
                    </span>
                    <a-switch v-model:checked="config.grayscale" />
                 </div>
                 <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-[var(--c-text-main)] flex items-center gap-2">
                      <span class="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-400"><ScissorOutlined/></span> 线条增强
                    </span>
                    <a-switch v-model:checked="config.enhanceEdges" />
                 </div>
              </div>

              <!-- 魔法算法 -->
              <div class="bg-[var(--c-bg)] p-4 rounded-3xl border border-[var(--c-border)] space-y-4 transition-colors duration-300">
                 <label class="text-xs font-bold text-[var(--c-text-sub)] ml-1">魔法优化</label>
                 
                 <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-[var(--c-text-main)]">卡通化 (去噪点)</span>
                    <a-switch v-model:checked="config.optCartoon" />
                 </div>
                 <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-[var(--c-text-main)]">净化背景</span>
                    <a-switch v-model:checked="config.optCleanBg" />
                 </div>
                 <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-[var(--c-text-main)]">细节增强</span>
                    <a-switch v-model:checked="config.optDetail" />
                 </div>
                 <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-[var(--c-text-main)]">黑色描边</span>
                    <a-switch v-model:checked="config.optOutline" />
                 </div>
                 
              </div>

              <!-- 核心参数 (升级版：双输入框 + 比例锁) -->
              <div class="space-y-6">
                <div class="space-y-3">
                  <div class="flex justify-between items-center text-xs mb-1 px-1">
                    <span class="text-[var(--c-text-sub)] font-bold">网格尺寸</span>
                    <!-- 比例锁开关 -->
                    <a-tooltip :title="config.lockRatio ? '点击解锁比例 (允许拉伸)' : '点击锁定比例 (自动计算)'">
                      <button 
                        @click="toggleLock"
                        class="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors"
                        :class="config.lockRatio ? 'bg-[var(--c-primary-bg)] text-[var(--c-primary)]' : 'bg-orange-50 text-orange-500'"
                      >
                        <LinkOutlined v-if="config.lockRatio" />
                        <DisconnectOutlined v-else />
                        {{ config.lockRatio ? '比例锁定' : '自由比例' }}
                      </button>
                    </a-tooltip>
                  </div>
                  

                  <!-- 双输入框 -->
                  <div class="flex items-center gap-2">
                    <div class="flex-1">
                      <a-input-number 
                        v-model:value="config.width" 
                        :min="10" :max="500" 
                        class="w-full text-center !rounded-xl !border-[var(--c-border)] !shadow-none font-bold"
                        @change="onWidthChange"
                      />
                    </div>
                    <span class="text-[var(--c-text-sub)] pt-4">×</span>
                    <div class="flex-1">
                      <a-input-number 
                        v-model:value="config.height" 
                        :min="10" :max="500" 
                        class="w-full text-center !rounded-xl !border-[var(--c-border)] !shadow-none font-bold"
                        @change="onHeightChange"
                      />
                    </div>
                  </div>

                  <!-- 预设按钮 (点击后自动按长边设置) -->
                  <div class="grid grid-cols-4 gap-2 mt-1">
                    <button v-for="size in [32, 52, 60, 104]" :key="size" @click="applyPreset(size)"
                      class="py-1.5 text-[10px] rounded-xl border transition-all duration-300 font-bold bg-[var(--c-bg)] text-[var(--c-text-sub)] border-[var(--c-border)] hover:border-[var(--c-primary)] hover:text-[var(--c-primary)]">
                      {{ size }}
                    </button>
                  </div>
                </div>

                <!-- 聚类 -->
                <div class="bg-[var(--c-bg)] p-3 rounded-2xl border border-[var(--c-border)] flex items-center justify-between transition-colors duration-300">
                    <div class="flex flex-col">
                      <span class="text-xs font-bold text-[var(--c-text-main)]">色彩聚类</span>
                      <span class="text-[10px] text-[var(--c-text-sub)]">仅保留 {{ config.maxColors }} 种核心色</span>
                    </div>
                    <div class="flex items-center gap-3">
                       <a-slider v-model:value="config.maxColors" :min="4" :max="64" :disabled="!config.useClustering" class="w-24" />
                       <a-switch v-model:checked="config.useClustering" />
                    </div>
                </div>

                <!-- 抖动 -->
                <div class="flex items-center justify-between px-2">
                    <span class="text-xs font-bold text-[var(--c-text-sub)]">色彩抖动 (Dithering)</span>
                    <a-switch v-model:checked="config.dither" size="small" />
                </div>

                <!-- 色号 -->
                <div class="space-y-2">
                   <span class="text-xs ml-1 text-[var(--c-text-sub)] font-bold">色号品牌</span>
                   <a-select v-model:value="config.selectedPalette" class="w-full shadow-sm" size="large" :options="paletteOptions" />
                </div>

              </div>
            </div>

            <!-- Tab 2: 统计清单 -->
            <div v-show="activeTab === 'stats'" class="space-y-4 animate-fade-in h-full">
              <div v-if="!generated" class="h-full flex flex-col items-center justify-center text-[var(--c-text-sub)] space-y-4 opacity-50 py-10">
                <div class="w-20 h-20 rounded-full bg-[var(--c-bg)] flex items-center justify-center text-4xl">🎨</div>
                <p class="text-xs font-bold">生成后查看清单</p>
              </div>
              <div v-else class="space-y-4 pt-2">
                <div class="flex justify-between items-center p-4 bg-[var(--c-primary)] rounded-2xl shadow-lg text-white">
                  <div class="flex flex-col">
                    <span class="text-[10px] opacity-80 uppercase tracking-wider">Total Beads</span>
                    <span class="text-2xl font-bold">{{ totalPixels }} <span class="text-sm font-normal">颗</span></span>
                  </div>
                  <div class="text-right bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm">
                    <span class="text-xs font-bold">{{ statsData.length }} 色</span>
                  </div>
                </div>
                
                <div class="grid grid-cols-4 gap-2">
                  <div v-for="item in statsData" :key="item.code" 
                       class="flex flex-col bg-[var(--c-bg)] rounded-xl overflow-hidden border border-[var(--c-border)] shadow-sm hover:shadow-md transition-shadow">
                    <div class="h-8 w-full relative">
                      <div class="absolute inset-0" :style="{ backgroundColor: item.hex }"></div>
                    </div>
                    <div class="py-2 text-center">
                      <div class="text-[10px] font-bold text-[var(--c-text-main)]">{{ item.code }}</div>
                      <div class="text-[9px] text-[var(--c-text-sub)] font-bold mt-0.5">{{ item.count }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- 底部主按钮 -->
          <div class="p-4 bg-[var(--c-surface)] shrink-0 transition-colors duration-300">
             <a-button type="primary" block size="large" :loading="loading" @click="generate" class="font-bold shadow-lg shadow-[var(--c-primary)]/40 h-12 rounded-full text-base hover:scale-[1.02] active:scale-95 transition-transform">
               <template #icon><ThunderboltOutlined /></template>
               {{ generated ? '重新生成' : '开始制作' }}
             </a-button>
             
             <div class="flex gap-2 mt-3" v-if="generated">
               <a-button block class="flex-1 rounded-full border-2 border-[var(--c-border)] text-[var(--c-text-main)] hover:text-[var(--c-primary)] hover:border-[var(--c-primary)] font-bold" @click="download">
                 <template #icon><DownloadOutlined /></template> 导出施工图
               </a-button>
             </div>
          </div>
        </aside>

        <!-- 画布区域 -->
        <section class="order-1 lg:order-2 w-full lg:flex-1 h-[45%] lg:h-full bg-[var(--c-bg)] overflow-hidden flex flex-col items-center justify-center relative z-0 transition-colors duration-300">
          <div class="absolute top-4 right-6 z-30 flex items-center gap-2 bg-[var(--c-surface)]/90 backdrop-blur px-3 py-1.5 rounded-full shadow-xl border border-[var(--c-border)] scale-90 sm:scale-100 text-[var(--c-text-main)] transition-colors duration-300">
            <a-button type="text" shape="circle" size="small" @click="fitView"><ExpandOutlined /></a-button>
            <div class="w-px h-3 bg-[var(--c-border)]"></div>
            <a-button type="text" shape="circle" size="small" @click="zoomOut"><MinusOutlined /></a-button>
            <span class="text-xs font-mono w-10 text-center font-bold">{{ Math.round(view.scale * 100) }}%</span>
            <a-button type="text" shape="circle" size="small" @click="zoomIn"><PlusOutlined /></a-button>
          </div>

          <div 
            class="w-full h-full relative cursor-move touch-none"
            @wheel="onWheel" @mousedown.left="startDrag" @mousemove="onDrag" @mouseup="stopDrag" @mouseleave="stopDrag"
            @touchstart="startTouch" @touchmove="onTouch" @touchend="stopTouch"
          >
            <div class="absolute inset-0 checkerboard-bg pointer-events-none"></div>
            
            <div class="absolute top-0 left-0 origin-center will-change-transform flex items-center justify-center w-full h-full" 
                 :style="{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }">
              <canvas ref="canvasRef" v-show="generated" class="shadow-2xl bg-white image-rendering-pixelated ring-8 ring-white/30 rounded-sm"></canvas>
              
              <div v-if="!generated" class="absolute inset-0 flex flex-col items-center justify-center text-center opacity-40 text-[var(--c-text-sub)] pointer-events-none space-y-4">
                 <div class="w-24 h-24 rounded-3xl bg-[var(--c-primary-bg)] flex items-center justify-center text-[var(--c-primary)] text-5xl shadow-inner border border-[var(--c-primary)]/20">
                   <FileImageOutlined />
                 </div>
                 <div>
                   <p class="text-xl font-bold text-[var(--c-text-main)]">工作台就绪</p>
                   <p class="text-xs mt-1">上传图片即可生成像素画</p>
                 </div>
              </div>
            </div>
          </div>
          
          <div class="absolute bottom-0 w-full h-8 bg-[var(--c-surface)]/80 backdrop-blur border-t border-[var(--c-border)] flex items-center justify-between px-6 text-[10px] text-[var(--c-text-sub)] z-20 font-medium transition-colors duration-300">
             <span>{{ generated ? `Canvas: ${config.width}x${config.height}` : '告知：上传图片比例 请保持  1:1  建议上传 边缘清晰、颜色简单、背景干净的 Q 版卡通图  ' }}</span>
             <span v-if="generated && statsData.length > 0">Palette: {{ statsData.length }} Colors</span>
          </div>
        </section>

      </main>
    </div>
  </a-config-provider>
</template>

<script setup>
import { ref, reactive, computed, onUnmounted, nextTick, onMounted, watch } from 'vue';
import { message } from 'ant-design-vue';
import LoginView from './components/LoginView.vue';
import { 
  AppstoreFilled, SkinOutlined, InboxOutlined, ThunderboltOutlined, 
  DownloadOutlined, ExpandOutlined, PlusOutlined, MinusOutlined, 
  FileImageOutlined, HeartFilled, CoffeeOutlined, SettingOutlined, BarChartOutlined,
  ScissorOutlined, CloudUploadOutlined, LinkOutlined, DisconnectOutlined
} from '@ant-design/icons-vue';

import PixelWorker from './pixel.worker.js?worker';
import { PALETTE_LIST } from './utils/palettes';
import { getContrastColor } from './utils/colorLogic';

const isAuthenticated = ref(false);
onMounted(() => { const token = localStorage.getItem('pixel_craft_token'); if (token) isAuthenticated.value = true; });
const onLoginSuccess = () => isAuthenticated.value = true;

const currentTheme = ref('theme-default');
const activeTab = ref('settings');
const loading = ref(false);
const generated = ref(false);
const previewUrl = ref('');
const canvasRef = ref(null);
const view = reactive({ x: 0, y: 0, scale: 0.8, isDragging: false, startX: 0, startY: 0 });

let gridData = null;
let statsData = ref([]);
let totalPixels = 0;
let imageRatio = 1;

// Config (双输入)
const config = reactive({
  width: 50, 
  height: 50,
  lockRatio: true, // 默认锁定
  maxColors: 24,
  useClustering: false, 
  selectedPalette: 'mard_295',
  dither: false,
  grayscale: false,
  enhanceEdges: true,
  optCartoon: false, 
  optCleanBg: false,
  optDetail: true,
  optOutline: false,
  beadSize: 2.6
});

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
const currentBgContainer = computed(() => '#ffffff');
const currentTextColor = computed(() => {
  if (currentTheme.value === 'theme-cream') return '#5d4037';
  if (currentTheme.value === 'theme-pink') return '#333333';
  return '#1f1f1f';
});
const currentBorderColor = computed(() => '#f0f0f0');
const paletteOptions = computed(() => PALETTE_LIST.map(p => ({ label: p.name, value: p.key })));
const currentPaletteColors = computed(() => PALETTE_LIST.find(p => p.key === config.selectedPalette)?.colors || []);

let sourceImageObject = null;
let workerInstance = null;
const setTheme = (t) => { currentTheme.value = t; };

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
      // 初始化尺寸
      if (config.lockRatio) onWidthChange(config.width);
      
      generated.value = false;
      message.success('图片已加载');
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

  if (!workerInstance) workerInstance = new PixelWorker();

  workerInstance.postMessage({
    pixels: imgData.data,
    width: w,
    height: h,
    palette: JSON.parse(JSON.stringify(currentPaletteColors.value)),
    maxColors: config.maxColors,
    useClustering: config.useClustering,
    dither: config.dither,
    grayscale: config.grayscale,
    enhanceEdges: config.enhanceEdges,
    optCartoon: config.optCartoon,
    optCleanBg: config.optCleanBg,
    optDetail: config.optDetail,
    optOutline: config.optOutline
  });

  workerInstance.onmessage = (e) => {
    const { success, grid, stats, error } = e.data;
    if (success) {
      gridData = grid;
      statsData.value = stats;
      totalPixels = stats.reduce((acc, cur) => acc + cur.count, 0);
      renderCanvas();        
      generated.value = true;
      message.success(`生成成功`);
      nextTick(() => fitView());
    } else {
      message.error(error);
    }
    loading.value = false;
  };
};

const renderCanvas = () => {
  if (!gridData) return;
  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  const w = config.width;
  const h = config.height;
  const maxSide = Math.max(w, h);
  const renderCellSize = Math.max(20, Math.floor(1200 / maxSide)); 
  
  canvas.width = w * renderCellSize;
  canvas.height = h * renderCellSize;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cell = gridData[y][x];
      if (!cell) continue;
      const px = x * renderCellSize; const py = y * renderCellSize;
      ctx.fillStyle = cell.hex; ctx.fillRect(px, py, renderCellSize, renderCellSize);
      ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1; ctx.strokeRect(px, py, renderCellSize, renderCellSize);
      if (renderCellSize >= 14) {
        ctx.fillStyle = getContrastColor(cell.hex);
        ctx.font = `bold ${Math.floor(renderCellSize * 0.35)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(cell.code, px + renderCellSize/2, py + renderCellSize/2);
      }
    }
  }
};

const startDrag = (e) => { view.isDragging = true; view.startX = e.clientX - view.x; view.startY = e.clientY - view.y; };
const onDrag = (e) => { if(view.isDragging) { e.preventDefault(); view.x = e.clientX - view.startX; view.y = e.clientY - view.startY; }};
const stopDrag = () => { view.isDragging = false; };
const onWheel = (e) => { e.preventDefault(); const newScale = view.scale - e.deltaY * 0.001; view.scale = Math.min(Math.max(0.1, newScale), 10); };
const startTouch = (e) => { if(e.touches.length===1) { view.isDragging=true; view.startX=e.touches[0].clientX-view.x; view.startY=e.touches[0].clientY-view.y; }};
const onTouch = (e) => { if(view.isDragging && e.touches.length===1) { e.preventDefault(); view.x=e.touches[0].clientX-view.startX; view.y=e.touches[0].clientY-view.startY; }};
const stopTouch = () => { view.isDragging = false; };
const fitView = () => { view.scale = 0.5; view.x = 0; view.y = 0; };
const zoomIn = () => view.scale = Math.min(view.scale + 0.1, 5);
const zoomOut = () => view.scale = Math.max(view.scale - 0.1, 0.1);

const download = () => {
  if (!gridData) return;
  const messageKey = 'exporting';
  message.loading({ content: '绘制施工图...', key: messageKey });

  setTimeout(() => {
    try {
      const CELL = 40; const RULER = 30; 
      const logicW = config.width;
      const logicH = config.height;
      const mapW = (logicW * CELL) + RULER; const mapH = (logicH * CELL) + RULER;
      
      const cardW = 60; const cardH = 80; const gap = 12; const padding = 40;
      const maxContentW = Math.max(mapW, 800); 
      const cols = Math.floor((maxContentW - padding * 2) / (cardW + gap));
      const rows = Math.ceil(statsData.value.length / cols);
      const legendH = rows * (cardH + gap) + 60;
      const headerHeight = 100;
      const totalW = maxContentW;
      const totalH = headerHeight + mapH + 40 + legendH + 40;

      const canvas = document.createElement('canvas'); canvas.width = totalW; canvas.height = totalH;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, totalW, totalH);
      ctx.fillStyle = '#1f1f1f'; ctx.font = 'bold 32px Arial'; ctx.textAlign = 'left'; ctx.fillText(` 施工单`, padding, 50);
      ctx.font = '16px Arial'; ctx.fillStyle = '#666'; ctx.fillText(`${new Date().toLocaleDateString()} | 规格: ${logicW}x${logicH} | 共 ${totalPixels} 颗`, padding, 80);

      const mapStartX = (totalW - mapW) / 2;
      ctx.save(); ctx.translate(mapStartX, headerHeight);
      
      ctx.fillStyle = '#F8F8F8'; ctx.fillRect(0, 0, mapW, RULER); ctx.fillRect(0, 0, RULER, mapH);
      ctx.fillStyle = '#333'; ctx.textAlign = 'center'; ctx.font = 'bold 10px Arial';
      for (let i = 0; i < logicW; i++) { const num = i + 1; const center = RULER + (i * CELL) + (CELL / 2); if (num === 1 || num % 5 === 0) ctx.fillText(num, center, RULER / 2 + 4); }
      for (let i = 0; i < logicH; i++) { const num = i + 1; const center = RULER + (i * CELL) + (CELL / 2); if (num === 1 || num % 5 === 0) ctx.fillText(num, RULER / 2, center + 4); }
      
      ctx.translate(RULER, RULER);
      for (let y = 0; y < logicH; y++) {
        for (let x = 0; x < logicW; x++) {
          const c = gridData[y][x];
          if (c) {
            const px = x * CELL; const py = y * CELL;
            ctx.fillStyle = c.hex; ctx.fillRect(px, py, CELL, CELL);
            ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1; ctx.strokeRect(px, py, CELL, CELL);
            ctx.fillStyle = getContrastColor(c.hex); ctx.font = `bold ${Math.floor(CELL * 0.35)}px Arial`;
            ctx.fillText(c.code, px + CELL/2, py + CELL/2);
          }
        }
      }
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2; const totalGridW = logicW * CELL; const totalGridH = logicH * CELL;
      ctx.strokeRect(0, 0, totalGridW, totalGridH);
      for (let i = 10; i < logicW; i += 10) { const pos = i * CELL; ctx.beginPath(); ctx.moveTo(pos, 0); ctx.lineTo(pos, totalGridH); ctx.stroke(); }
      for (let i = 10; i < logicH; i += 10) { const pos = i * CELL; ctx.beginPath(); ctx.moveTo(0, pos); ctx.lineTo(totalGridW, pos); ctx.stroke(); }
      ctx.restore();

      const legendStartY = headerHeight + mapH + 40;
      ctx.translate(padding, legendStartY);
      ctx.fillStyle = '#333'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'left'; ctx.fillText("色号清单 (BOM)", 0, 0);
      ctx.translate(0, 30);

      statsData.value.forEach((item, index) => {
        const col = index % cols; const row = Math.floor(index / cols);
        const x = col * (cardW + gap); const y = row * (cardH + gap);
        const r = 10;
        ctx.beginPath(); ctx.moveTo(x+r, y); ctx.lineTo(x+cardW-r, y); ctx.quadraticCurveTo(x+cardW, y, x+cardW, y+r); ctx.lineTo(x+cardW, y+cardH-r); ctx.quadraticCurveTo(x+cardW, y+cardH, x+cardW-r, y+cardH); ctx.lineTo(x+r, y+cardH); ctx.quadraticCurveTo(x, y+cardH, x, y+cardH-r); ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y); ctx.closePath();
        ctx.save(); ctx.clip();
        ctx.fillStyle = item.hex; ctx.fillRect(x, y, cardW, cardH * 0.65);
        ctx.fillStyle = '#f9f9f9'; ctx.fillRect(x, y + cardH * 0.65, cardW, cardH * 0.35);
        ctx.fillStyle = getContrastColor(item.hex); ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(item.code, x + cardW / 2, y + cardH * 0.32);
        ctx.fillStyle = '#333'; ctx.font = 'bold 14px Arial'; ctx.fillText(item.count, x + cardW / 2, y + cardH * 0.82);
        ctx.restore();
        ctx.strokeStyle = '#e5e5e5'; ctx.lineWidth = 1; ctx.stroke();
      });

      const link = document.createElement('a'); link.download = `pixel-blueprint-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0); link.click();
      message.success({ content: '图纸导出成功', key: messageKey });
    } catch (e) { console.error(e); message.error({ content: '导出失败', key: messageKey }); }
  }, 100);
};

onUnmounted(() => workerInstance?.terminate());
</script>