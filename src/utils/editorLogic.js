// src/utils/editorLogic.js
import { reactive } from 'vue'

export function usePixelEditor() {
  const state = reactive({
    isDrawing: false,
    currentTool: 'brush', // brush, eraser, picker
    currentColor: null,   // 当前选中的拼豆颜色对象
    brushSize: 1,
    history: [],
    historyIndex: -1,
    maxHistory: 20
  })

  // 初始化历史记录
  const initHistory = (grid) => {
    state.history = [JSON.parse(JSON.stringify(grid))]
    state.historyIndex = 0
  }

  // 保存快照
  const saveSnapshot = (grid) => {
    // 如果当前处于历史中间，丢弃后面的记录
    if (state.historyIndex < state.history.length - 1) {
      state.history = state.history.slice(0, state.historyIndex + 1)
    }
    state.history.push(JSON.parse(JSON.stringify(grid)))
    if (state.history.length > state.maxHistory) state.history.shift()
    else state.historyIndex++
  }

  const undo = () => {
    if (state.historyIndex > 0) {
      state.historyIndex--
      return JSON.parse(JSON.stringify(state.history[state.historyIndex]))
    }
    return null
  }

  const redo = () => {
    if (state.historyIndex < state.history.length - 1) {
      state.historyIndex++
      return JSON.parse(JSON.stringify(state.history[state.historyIndex]))
    }
    return null
  }

  // 绘制逻辑
  const applyTool = (grid, x, y, tool, color) => {
    if (!grid[y] || !grid[y][x]) return false // 越界

    // 取色器
    if (tool === 'picker') {
      state.currentColor = grid[y][x]
      state.currentTool = 'brush' // 取完自动切回画笔
      return false // 不改变画布
    }

    // 橡皮擦 (涂白)
    if (tool === 'eraser') {
      grid[y][x] = { code: 'H01', hex: '#FFFFFF', name: 'Eraser' } // 假设 H01 是白色
      return true
    }

    // 画笔
    if (tool === 'brush' && color) {
      if (grid[y][x].code !== color.code) {
        grid[y][x] = { ...color }
        return true
      }
    }
    return false
  }

  return {
    editorState: state,
    initHistory,
    saveSnapshot,
    undo,
    redo,
    applyTool
  }
}

