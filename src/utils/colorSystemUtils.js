import colorSystemMapping from '../data/colorSystemMapping.json';

// 色号系统选项
export const colorSystemOptions = [
  { key: 'MARD', name: 'MARD' },
  { key: 'COCO', name: 'COCO' },
  { key: '漫漫', name: '漫漫' },
  { key: '盼盼', name: '盼盼' },
  { key: '咪小窝', name: '咪小窝' },
];

const typedColorSystemMapping = colorSystemMapping;

// 获取所有可用的hex值
export function getAllHexValues() {
  return Object.keys(typedColorSystemMapping);
}

// 获取所有MARD色号到hex值的映射
export function getMardToHexMapping() {
  const mapping = {};
  Object.entries(typedColorSystemMapping).forEach(([hex, colorData]) => {
    const mardKey = colorData.MARD;
    if (mardKey) {
      mapping[mardKey] = hex;
    }
  });
  return mapping;
}

// 从colorSystemMapping.json加载完整的颜色映射数据
export function loadFullColorMapping() {
  const mapping = new Map();
  Object.entries(colorSystemMapping).forEach(([baseKey, colorData]) => {
    mapping.set(baseKey, colorData);
  });
  return mapping;
}

// 将色板转换到指定色号系统
export function convertPaletteToColorSystem(palette, colorSystem) {
  return palette.map(color => {
    const colorMapping = typedColorSystemMapping[color.hex];
    if (colorMapping && colorMapping[colorSystem]) {
      return {
        ...color,
        key: colorMapping[colorSystem]
      };
    }
    return color;
  });
}

// 获取指定色号系统的显示键
export function getDisplayColorKey(hexValue, colorSystem) {
  // 处理 null、undefined 或空值
  if (!hexValue || typeof hexValue !== 'string') {
    return '?';
  }
  
  if (hexValue === 'ERASE' || hexValue.length === 0 || hexValue === '?') {
    return hexValue;
  }
  
  const normalizedHex = hexValue.toUpperCase();
  const colorMapping = typedColorSystemMapping[normalizedHex];
  if (colorMapping && colorMapping[colorSystem]) {
    return colorMapping[colorSystem];
  }
  
  return '?';
}

// 将色号键转换到hex值
export function convertColorKeyToHex(displayKey, colorSystem) {
  if (displayKey.startsWith('#') && displayKey.length === 7) {
    return displayKey.toUpperCase();
  }
  
  for (const [hex, mapping] of Object.entries(typedColorSystemMapping)) {
    if (mapping[colorSystem] === displayKey) {
      return hex;
    }
  }
  
  return displayKey;
}

// 验证颜色在指定系统中是否有效
export function isValidColorInSystem(hexValue, colorSystem) {
  const mapping = typedColorSystemMapping[hexValue];
  return mapping && mapping[colorSystem] !== undefined;
}

// 通过hex值获取指定色号系统的色号
export function getColorKeyByHex(hexValue, colorSystem) {
  const normalizedHex = hexValue.toUpperCase();
  const mapping = typedColorSystemMapping[normalizedHex];
  if (mapping && mapping[colorSystem]) {
    return mapping[colorSystem];
  }
  return '?';
}

// 转换 Hex 到 RGB
export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// 将hex颜色转换为HSL
function hexToHsl(hex) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

// 按色相排序颜色
export function sortColorsByHue(colors) {
  return colors.slice().sort((a, b) => {
    const hslA = hexToHsl(a.color);
    const hslB = hexToHsl(b.color);
    
    if (Math.abs(hslA.h - hslB.h) > 5) {
      return hslA.h - hslB.h;
    }
    
    if (Math.abs(hslA.l - hslB.l) > 3) {
      return hslB.l - hslA.l;
    }
    
    return hslB.s - hslA.s;
  });
}

