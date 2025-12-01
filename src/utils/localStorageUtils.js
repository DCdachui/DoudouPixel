const STORAGE_KEY = 'customPerlerPaletteSelections';

// 保存自定义色板选择状态到localStorage
export function savePaletteSelections(selections) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selections));
  } catch (error) {
    console.error("无法保存色板选择到本地存储:", error);
  }
}

// 从localStorage加载自定义色板选择状态
export function loadPaletteSelections() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("无法从本地存储加载色板选择:", error);
    localStorage.removeItem(STORAGE_KEY);
  }
  return null;
}

// 将预设色板转换为选择状态对象
export function presetToSelections(allHexValues, presetHexValues) {
  const presetSet = new Set(presetHexValues.map(hex => hex.toUpperCase()));
  const selections = {};
  
  allHexValues.forEach(hex => {
    const normalizedHex = hex.toUpperCase();
    selections[normalizedHex] = presetSet.has(normalizedHex);
  });
  
  return selections;
}

// 根据MARD色号预设生成基于hex值的选择状态
export function presetKeysToHexSelections(allBeadPalette, presetKeys) {
  const presetKeySet = new Set(presetKeys);
  const selections = {};
  const processedHexValues = new Set();
  
  allBeadPalette.forEach(color => {
    const normalizedHex = color.hex.toUpperCase();
    
    if (processedHexValues.has(normalizedHex)) {
      return;
    }
    
    processedHexValues.add(normalizedHex);
    selections[normalizedHex] = presetKeySet.has(color.key);
  });
  
  return selections;
}

