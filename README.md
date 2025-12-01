# 拼豆底稿生成器 - Vue 版本

这是从 Next.js + React + TypeScript 项目转换而来的 Vue 3 + Vite + JavaScript + Ant Design Vue 版本。

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **Vite** - 下一代前端构建工具
- **Vue Router 4** - 官方路由管理器
- **Ant Design Vue 4** - 企业级 UI 组件库
- **JavaScript** - 使用原生 JS（无 TypeScript）

## 项目结构

```
vue-pro/
├── src/
│   ├── components/          # Vue 组件（待转换）
│   ├── views/              # 页面视图
│   │   ├── Home.vue        # 主页面
│   │   └── Focus.vue       # 专心拼豆模式页面
│   ├── router/             # 路由配置
│   ├── utils/              # 工具函数（已转换）
│   │   ├── pixelation.js   # 像素化核心算法
│   │   ├── colorSystemUtils.js  # 颜色系统工具
│   │   ├── floodFillUtils.js    # 洪水填充算法
│   │   └── localStorageUtils.js # 本地存储工具
│   ├── data/               # 数据文件
│   │   └── colorSystemMapping.json  # 颜色映射数据
│   ├── App.vue             # 根组件
│   └── main.js             # 应用入口
├── index.html              # HTML 模板
├── vite.config.js          # Vite 配置
└── package.json            # 项目配置
```

## 已完成的转换

✅ 项目基础结构（Vite + Vue 3）
✅ 路由配置（Vue Router）
✅ Ant Design Vue 集成
✅ 核心工具函数转换（JavaScript 版本）：
  - `pixelation.js` - 像素化算法
  - `colorSystemUtils.js` - 颜色系统工具
  - `floodFillUtils.js` - 洪水填充算法
  - `localStorageUtils.js` - 本地存储工具
✅ 颜色映射数据文件
✅ 基础页面框架（Home.vue, Focus.vue）

## 待完成的工作

### 1. 工具函数（部分）
- [ ] `canvasUtils.js` - 画布工具函数
- [ ] `pixelEditingUtils.js` - 像素编辑工具
- [ ] `imageDownloader.js` - 图片下载功能

### 2. Vue 组件转换
需要将 React 组件转换为 Vue 组件：

- [ ] `PixelatedPreviewCanvas.vue` - 像素化预览画布
- [ ] `FocusCanvas.vue` - 专心模式画布
- [ ] `ColorPalette.vue` - 色板组件
- [ ] `FloatingToolbar.vue` - 浮动工具栏
- [ ] `FloatingColorPalette.vue` - 浮动色板
- [ ] `CustomPaletteEditor.vue` - 自定义色板编辑器
- [ ] `DownloadSettingsModal.vue` - 下载设置弹窗
- [ ] `GridTooltip.vue` - 网格提示
- [ ] `MagnifierTool.vue` - 放大镜工具
- [ ] 其他辅助组件...

### 3. 主页面功能完善
- [ ] 图片上传和处理
- [ ] 像素化参数调整
- [ ] 颜色映射和编辑
- [ ] 下载功能

### 4. 专心拼豆模式
- [ ] 画布渲染
- [ ] 进度跟踪
- [ ] 区域推荐
- [ ] 完成标记

## 安装和运行

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 核心算法说明

项目保留了原有的图片处理核心算法：

1. **像素化算法**：支持主导色（Dominant）和平均色（Average）两种模式
2. **颜色映射**：使用欧氏距离将像素颜色映射到拼豆色板
3. **区域合并**：BFS 算法合并相似颜色区域
4. **背景移除**：洪水填充识别外部背景

## 注意事项

- 所有工具函数已从 TypeScript 转换为 JavaScript
- 保留了原有的算法逻辑和数据结构
- 使用 Vue 3 Composition API 进行状态管理
- 使用 Ant Design Vue 替代原有的 Tailwind CSS 样式

## 开发建议

1. 先完成核心工具函数的转换
2. 逐步转换组件，从简单到复杂
3. 保持与原项目功能的一致性
4. 充分利用 Vue 3 的 Composition API 和响应式系统

