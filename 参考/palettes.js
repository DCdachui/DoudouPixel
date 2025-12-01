// src/utils/palettes.js

// ==========================================
// 1. MARD 221色 实色系数据定义
// ==========================================
const MARD_221_COLORS = [
  // --- A色系 (黄色/肤色/橙色) ---
  { code: 'A01', hex: '#FFFFE0' }, { code: 'A02', hex: '#FFFACD' }, { code: 'A03', hex: '#FAFAD2' },
  { code: 'A04', hex: '#FFFF00' }, { code: 'A05', hex: '#FFD700' }, { code: 'A06', hex: '#FFA500' },
  { code: 'A07', hex: '#FF8C00' }, { code: 'A08', hex: '#FF7F50' }, { code: 'A09', hex: '#FF6347' },
  { code: 'A10', hex: '#FF4500' }, { code: 'A11', hex: '#F0E68C' }, { code: 'A12', hex: '#BDB76B' },
  { code: 'A13', hex: '#F5DEB3' }, { code: 'A14', hex: '#FFE4B5' }, { code: 'A15', hex: '#FFDEAD' },
  { code: 'A16', hex: '#D2B48C' }, { code: 'A17', hex: '#BC8F8F' }, { code: 'A18', hex: '#F4A460' },
  { code: 'A19', hex: '#DAA520' }, { code: 'A20', hex: '#CD853F' }, { code: 'A21', hex: '#D2691E' },
  { code: 'A22', hex: '#8B4513' }, { code: 'A23', hex: '#A0522D' }, { code: 'A24', hex: '#800000' },
  { code: 'A25', hex: '#FFFFF0' }, { code: 'A26', hex: '#FDF5E6' },

  // --- B色系 (绿色系) ---
  { code: 'B01', hex: '#98FB98' }, { code: 'B02', hex: '#90EE90' }, { code: 'B03', hex: '#32CD32' },
  { code: 'B04', hex: '#00FF00' }, { code: 'B05', hex: '#228B22' }, { code: 'B06', hex: '#008000' },
  { code: 'B07', hex: '#006400' }, { code: 'B08', hex: '#ADFF2F' }, { code: 'B09', hex: '#7FFF00' },
  { code: 'B10', hex: '#7CFC00' }, { code: 'B11', hex: '#6B8E23' }, { code: 'B12', hex: '#556B2F' },
  { code: 'B13', hex: '#66CDAA' }, { code: 'B14', hex: '#8FBC8F' }, { code: 'B15', hex: '#20B2AA' },
  { code: 'B16', hex: '#008B8B' }, { code: 'B17', hex: '#00FFFF' }, { code: 'B18', hex: '#E0FFFF' },
  { code: 'B19', hex: '#AFEEEE' }, { code: 'B20', hex: '#40E0D0' }, { code: 'B21', hex: '#48D1CC' },
  { code: 'B22', hex: '#00CED1' }, { code: 'B23', hex: '#5F9EA0' }, { code: 'B24', hex: '#4682B4' },
  { code: 'B25', hex: '#B0C4DE' }, { code: 'B26', hex: '#ADD8E6' }, { code: 'B27', hex: '#87CEEB' },
  { code: 'B28', hex: '#87CEFA' }, { code: 'B29', hex: '#00BFFF' }, { code: 'B30', hex: '#1E90FF' },
  { code: 'B31', hex: '#6495ED' }, { code: 'B32', hex: '#7B68EE' },

  // --- C色系 (蓝色系) ---
  { code: 'C01', hex: '#E6E6FA' }, { code: 'C02', hex: '#D8BFD8' }, { code: 'C03', hex: '#DDA0DD' },
  { code: 'C04', hex: '#EE82EE' }, { code: 'C05', hex: '#DA70D6' }, { code: 'C06', hex: '#FF00FF' },
  { code: 'C07', hex: '#BA55D3' }, { code: 'C08', hex: '#9370DB' }, { code: 'C09', hex: '#8A2BE2' },
  { code: 'C10', hex: '#9400D3' }, { code: 'C11', hex: '#9932CC' }, { code: 'C12', hex: '#8B008B' },
  { code: 'C13', hex: '#800080' }, { code: 'C14', hex: '#4B0082' }, { code: 'C15', hex: '#6A5ACD' },
  { code: 'C16', hex: '#483D8B' }, { code: 'C17', hex: '#191970' }, { code: 'C18', hex: '#000080' },
  { code: 'C19', hex: '#00008B' }, { code: 'C20', hex: '#0000CD' }, { code: 'C21', hex: '#0000FF' },
  { code: 'C22', hex: '#4169E1' }, { code: 'C23', hex: '#2F4F4F' }, { code: 'C24', hex: '#708090' },
  { code: 'C25', hex: '#778899' }, { code: 'C26', hex: '#DCDCDC' }, { code: 'C27', hex: '#D3D3D3' },
  { code: 'C28', hex: '#C0C0C0' },

  // --- D色系 (紫色/深色系) ---
  { code: 'D01', hex: '#A9A9A9' }, { code: 'D02', hex: '#808080' }, { code: 'D03', hex: '#696969' },
  { code: 'D04', hex: '#1C1C1C' }, { code: 'D05', hex: '#363636' }, { code: 'D06', hex: '#4F4F4F' },
  { code: 'D07', hex: '#607D8B' }, { code: 'D08', hex: '#546E7A' }, { code: 'D09', hex: '#455A64' },
  { code: 'D10', hex: '#37474F' }, { code: 'D11', hex: '#263238' }, { code: 'D12', hex: '#90A4AE' },
  { code: 'D13', hex: '#78909C' }, { code: 'D14', hex: '#ECEFF1' }, { code: 'D15', hex: '#CFD8DC' },
  { code: 'D16', hex: '#B0BEC5' }, { code: 'D17', hex: '#212121' }, { code: 'D18', hex: '#424242' },
  { code: 'D19', hex: '#616161' }, { code: 'D20', hex: '#757575' }, { code: 'D21', hex: '#9E9E9E' },
  { code: 'D22', hex: '#BDBDBD' }, { code: 'D23', hex: '#E0E0E0' }, { code: 'D24', hex: '#F5F5F5' },
  { code: 'D25', hex: '#FAFAFA' },

  // --- E色系 (粉色系) ---
  { code: 'E01', hex: '#FFC0CB' }, { code: 'E02', hex: '#FFB6C1' }, { code: 'E03', hex: '#FF69B4' },
  { code: 'E04', hex: '#FF1493' }, { code: 'E05', hex: '#DB7093' }, { code: 'E06', hex: '#C71585' },
  { code: 'E07', hex: '#D8BFD8' }, { code: 'E08', hex: '#DDA0DD' }, { code: 'E09', hex: '#EE82EE' },
  { code: 'E10', hex: '#DA70D6' }, { code: 'E11', hex: '#FF00FF' }, { code: 'E12', hex: '#BA55D3' },
  { code: 'E13', hex: '#9370DB' }, { code: 'E14', hex: '#8A2BE2' }, { code: 'E15', hex: '#9400D3' },
  { code: 'E16', hex: '#9932CC' }, { code: 'E17', hex: '#8B008B' }, { code: 'E18', hex: '#800080' },
  { code: 'E19', hex: '#4B0082' }, { code: 'E20', hex: '#6A5ACD' }, { code: 'E21', hex: '#483D8B' },
  { code: 'E22', hex: '#7B68EE' }, { code: 'E23', hex: '#8470FF' }, { code: 'E24', hex: '#0000FF' },

  // --- F色系 (红色系) ---
  { code: 'F01', hex: '#F08080' }, { code: 'F02', hex: '#FA8072' }, { code: 'F03', hex: '#E9967A' },
  { code: 'F04', hex: '#FFA07A' }, { code: 'F05', hex: '#DC143C' }, { code: 'F06', hex: '#FF0000' },
  { code: 'F07', hex: '#B22222' }, { code: 'F08', hex: '#8B0000' }, { code: 'F09', hex: '#FF7F50' },
  { code: 'F10', hex: '#FF6347' }, { code: 'F11', hex: '#FF4500' }, { code: 'F12', hex: '#FF8C00' },
  { code: 'F13', hex: '#FFA500' }, { code: 'F14', hex: '#FFD700' }, { code: 'F15', hex: '#FFFF00' },
  { code: 'F16', hex: '#808000' }, { code: 'F17', hex: '#556B2F' }, { code: 'F18', hex: '#6B8E23' },
  { code: 'F19', hex: '#7CFC00' }, { code: 'F20', hex: '#7FFF00' }, { code: 'F21', hex: '#32CD32' },
  { code: 'F22', hex: '#00FF00' }, { code: 'F23', hex: '#228B22' }, { code: 'F24', hex: '#006400' },
  { code: 'F25', hex: '#008000' },

  // --- G色系 (大地色/棕色) ---
  { code: 'G01', hex: '#F5F5DC' }, { code: 'G02', hex: '#F5DEB3' }, { code: 'G03', hex: '#DEB887' },
  { code: 'G04', hex: '#D2B48C' }, { code: 'G05', hex: '#BC8F8F' }, { code: 'G06', hex: '#F4A460' },
  { code: 'G07', hex: '#DAA520' }, { code: 'G08', hex: '#CD853F' }, { code: 'G09', hex: '#D2691E' },
  { code: 'G10', hex: '#8B4513' }, { code: 'G11', hex: '#A0522D' }, { code: 'G12', hex: '#A52A2A' },
  { code: 'G13', hex: '#800000' }, { code: 'G14', hex: '#5D4037' }, { code: 'G15', hex: '#4E342E' },
  { code: 'G16', hex: '#3E2723' }, { code: 'G17', hex: '#795548' }, { code: 'G18', hex: '#8D6E63' },
  { code: 'G19', hex: '#A1887F' }, { code: 'G20', hex: '#BCAAA4' }, { code: 'G21', hex: '#D7CCC8' },

  // --- H色系 (黑白灰) ---
  { code: 'H01', hex: '#FFFFFF' }, // 纯白
  { code: 'H02', hex: '#F8F8FF' }, 
  { code: 'H03', hex: '#F0F8FF' },
  { code: 'H04', hex: '#E6E6FA' },
  { code: 'H05', hex: '#D3D3D3' },
  { code: 'H06', hex: '#A9A9A9' },
  { code: 'H07', hex: '#121212' }, // 纯黑
  { code: 'H08', hex: '#2F4F4F' },
  { code: 'H09', hex: '#708090' },
  { code: 'H10', hex: '#778899' },
  { code: 'H11', hex: '#B0C4DE' },
  { code: 'H12', hex: '#E6E6FA' },
  { code: 'H13', hex: '#FFFAF0' },
  { code: 'H14', hex: '#FDF5E6' },
  { code: 'H15', hex: '#FAF0E6' },
  { code: 'H18', hex: '#696969' },
  { code: 'H19', hex: '#808080' },
  { code: 'H20', hex: '#A9A9A9' },
  { code: 'H21', hex: '#C0C0C0' },

  // --- M色系 (补充) ---
  { code: 'M01', hex: '#DCDCDC' }, { code: 'M02', hex: '#D3D3D3' }, { code: 'M03', hex: '#C0C0C0' },
  { code: 'M04', hex: '#A9A9A9' }, { code: 'M05', hex: '#808080' }, { code: 'M06', hex: '#696969' },
  { code: 'M07', hex: '#778899' }, { code: 'M08', hex: '#708090' }, { code: 'M09', hex: '#2F4F4F' },
  { code: 'M10', hex: '#000000' }
];

// ==========================================
// 2. MARD 74色 特殊色系数据定义
// ==========================================
const MARD_74_SPECIAL = [
  // --- R系列: 透明色 (Translucent) ---
  // 透明色在生成图纸时，我们用半透明或浅色替代，以便区分
  { code: 'R01', hex: '#FF000088', name: '透红' }, { code: 'R02', hex: '#FFA50088', name: '透橙' },
  { code: 'R03', hex: '#FFFF0088', name: '透黄' }, { code: 'R04', hex: '#00800088', name: '透绿' },
  { code: 'R05', hex: '#0000FF88', name: '透蓝' }, { code: 'R06', hex: '#80008088', name: '透紫' },
  { code: 'R07', hex: '#FFC0CB88', name: '透粉' }, { code: 'R08', hex: '#FFFFFF88', name: '透明' },
  { code: 'R09', hex: '#A52A2A88', name: '透棕' }, { code: 'R10', hex: '#80808088', name: '透灰' },
  { code: 'R11', hex: '#00000088', name: '透黑' }, { code: 'R12', hex: '#00FFFF88', name: '透青' },
  { code: 'R13', hex: '#FF00FF88', name: '透玫' }, { code: 'R14', hex: '#40E0D088', name: '透松' },
  { code: 'R15', hex: '#7FFFD488', name: '透碧' },

  // --- P系列: 珠光色 (Pearlescent) ---
  // 珠光色带有金属光泽，这里用稍亮的高饱和色代替
  { code: 'P01', hex: '#F0F8FF' }, { code: 'P02', hex: '#E6E6FA' }, { code: 'P03', hex: '#FFF0F5' },
  { code: 'P04', hex: '#F0FFF0' }, { code: 'P05', hex: '#F5F5DC' }, { code: 'P06', hex: '#FAEBD7' },
  { code: 'P07', hex: '#FFE4C4' }, { code: 'P08', hex: '#FFDAB9' }, { code: 'P09', hex: '#E0FFFF' },
  { code: 'P10', hex: '#FAFAD2' }, { code: 'P11', hex: '#D3D3D3' }, { code: 'P12', hex: '#C0C0C0' },
  { code: 'P13', hex: '#A9A9A9' }, { code: 'P14', hex: '#808080' },

  // --- Y系列: 夜光色 (Glow) ---
  { code: 'Y01', hex: '#CCFF00', name: '夜光绿' }, { code: 'Y02', hex: '#00FFCC', name: '夜光蓝' },
  { code: 'Y03', hex: '#FF99CC', name: '夜光粉' }, { code: 'Y04', hex: '#FFFF99', name: '夜光黄' },
  { code: 'Y05', hex: '#FFCC99', name: '夜光橙' }, { code: 'Y07', hex: '#E0E0E0', name: '夜光白' },
  { code: 'Y08', hex: '#CC99FF', name: '夜光紫' }, { code: 'Y09', hex: '#99CCFF', name: '夜光青' },

  // --- Z系列: 光变色 (UV Change) ---
  { code: 'Z1', hex: '#E6E6FA', name: '光变紫' }, { code: 'Z2', hex: '#FFC0CB', name: '光变粉' },
  { code: 'Z3', hex: '#ADD8E6', name: '光变蓝' }, { code: 'Z4', hex: '#FFFFE0', name: '光变黄' },
  { code: 'Z5', hex: '#98FB98', name: '光变绿' }, { code: 'Z6', hex: '#FFDAB9', name: '光变橙' },
  { code: 'Z7', hex: '#D3D3D3', name: '光变灰' }, { code: 'Z8', hex: '#F08080', name: '光变红' },

  // --- Q系列: 温变色 (Temp Change) ---
  { code: 'Q1', hex: '#9370DB' }, { code: 'Q2', hex: '#3CB371' }, { code: 'Q3', hex: '#DC143C' },
  { code: 'Q4', hex: '#4169E1' }, { code: 'Q5', hex: '#FF8C00' },

  // --- T系列: 透明加亮片 ---
  { code: 'T01', hex: '#F0F8FF', name: '透亮片' }
];


// ==========================================
// 3. 导出给 App 使用的色号库列表
// ==========================================
export const PALETTE_LIST = [
  {
    key: 'mard_221',
    name: '🔴 MARD 实色 (221色)',
    // 自动补充默认名称，防止 undefined
    colors: MARD_221_COLORS.map(c => ({ name: '实色', ...c }))
  },
  {
    key: 'mard_74',
    name: '✨ MARD 特殊色 (74色)',
    colors: MARD_74_SPECIAL.map(c => ({ name: c.name || '特殊', ...c }))
  },
  {
    key: 'mard_295',
    name: '🔥 MARD 全套 (295色)',
    // 合并两个数组
    colors: [
      ...MARD_221_COLORS.map(c => ({ name: '实色', ...c })),
      ...MARD_74_SPECIAL.map(c => ({ name: c.name || '特殊', ...c }))
    ]
  },
  // 保留之前的 Artkal S 以备不时之需
  {
    key: 'artkal_s',
    name: '🎨 Artkal S (常用20色)',
    colors: [
      { code: 'S01', name: '纯白', hex: '#FFFFFF' },
      { code: 'S02', name: '纯黑', hex: '#121212' },
      { code: 'S03', name: '大红', hex: '#D61C23' },
      { code: 'S04', name: '橙色', hex: '#FF7F00' },
      { code: 'S05', name: '明黄', hex: '#FFEB3B' },
      { code: 'S06', name: '草绿', hex: '#4CAF50' },
      { code: 'S07', name: '天蓝', hex: '#2196F3' },
      { code: 'S08', name: '深蓝', hex: '#0D47A1' },
      { code: 'S09', name: '紫色', hex: '#9C27B0' },
      { code: 'S10', name: '浅粉', hex: '#F8BBD0' },
      { code: 'S11', name: '肉色', hex: '#FFCCBC' },
      { code: 'S12', name: '浅灰', hex: '#9E9E9E' },
      { code: 'S13', name: '深灰', hex: '#616161' },
      { code: 'S14', name: '咖啡', hex: '#795548' },
      { code: 'S15', name: '焦糖', hex: '#D7CCC8' },
      { code: 'S16', name: '荧光绿', hex: '#CCFF90' },
      { code: 'S17', name: '湖蓝', hex: '#00BCD4' },
      { code: 'S18', name: '桃红', hex: '#E91E63' },
      { code: 'S19', name: '奶油', hex: '#FFF9C4' },
      { code: 'S20', name: '薰衣草', hex: '#E1BEE7' }
    ]
  }
];