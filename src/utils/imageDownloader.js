import { getDisplayColorKey, getColorKeyByHex } from './colorSystemUtils';

// 用于获取对比色的工具函数
function getContrastColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';
  const luma = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luma > 0.5 ? '#000000' : '#FFFFFF';
}

// 辅助函数：将十六进制颜色转换为RGB
function hexToRgb(hex) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const formattedHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(formattedHex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// 用于排序颜色键的函数
function sortColorKeys(a, b) {
  const regex = /^([A-Z]+)(\d+)$/;
  const matchA = a.match(regex);
  const matchB = b.match(regex);

  if (matchA && matchB) {
    const prefixA = matchA[1];
    const numA = parseInt(matchA[2], 10);
    const prefixB = matchB[1];
    const numB = parseInt(matchB[2], 10);

    if (prefixA !== prefixB) {
      return prefixA.localeCompare(prefixB);
    }
    return numA - numB;
  }
  return a.localeCompare(b);
}

// 导出CSV hex数据的函数
export function exportCsvData({ mappedPixelData, gridDimensions, selectedColorSystem }) {
  if (!mappedPixelData || !gridDimensions) {
    console.error("导出失败: 映射数据或尺寸无效。");
    alert("无法导出CSV，数据未生成或无效。");
    return;
  }

  const { N, M } = gridDimensions;
  const csvLines = [];
  
  for (let row = 0; row < M; row++) {
    const rowData = [];
    for (let col = 0; col < N; col++) {
      const cellData = mappedPixelData[row][col];
      if (cellData && !cellData.isExternal) {
        rowData.push(cellData.color);
      } else {
        rowData.push('TRANSPARENT');
      }
    }
    csvLines.push(rowData.join(','));
  }

  const csvContent = csvLines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `bead-pattern-${N}x${M}-${selectedColorSystem}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
  console.log("CSV数据导出完成");
}

// 导入CSV hex数据的函数
export function importCsvData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (!text) {
          reject(new Error('无法读取文件内容'));
          return;
        }
        
        const lines = text.trim().split('\n');
        const M = lines.length;
        
        if (M === 0) {
          reject(new Error('CSV文件为空'));
          return;
        }
        
        const firstRowData = lines[0].split(',');
        const N = firstRowData.length;
        
        if (N === 0) {
          reject(new Error('CSV文件格式无效'));
          return;
        }
        
        const mappedPixelData = [];
        
        for (let row = 0; row < M; row++) {
          const rowData = lines[row].split(',');
          const mappedRow = [];
          
          if (rowData.length !== N) {
            reject(new Error(`第${row + 1}行的列数不匹配，期望${N}列，实际${rowData.length}列`));
            return;
          }
          
          for (let col = 0; col < N; col++) {
            const cellValue = rowData[col].trim();
            
            if (cellValue === 'TRANSPARENT' || cellValue === '') {
              mappedRow.push({
                key: 'TRANSPARENT',
                color: '#FFFFFF',
                isExternal: true
              });
            } else {
              const hexPattern = /^#[0-9A-Fa-f]{6}$/;
              if (!hexPattern.test(cellValue)) {
                reject(new Error(`第${row + 1}行第${col + 1}列的颜色值无效：${cellValue}`));
                return;
              }
              
              mappedRow.push({
                key: cellValue.toUpperCase(),
                color: cellValue.toUpperCase(),
                isExternal: false
              });
            }
          }
          
          mappedPixelData.push(mappedRow);
        }
        
        resolve({
          mappedPixelData,
          gridDimensions: { N, M }
        });
        
      } catch (error) {
        reject(new Error(`解析CSV文件失败：${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('读取文件失败'));
    };
    
    reader.readAsText(file, 'utf-8');
  });
}

// 下载图片的主函数
export async function downloadImage({
  mappedPixelData,
  gridDimensions,
  colorCounts,
  totalBeadCount,
  options,
  activeBeadPalette,
  selectedColorSystem
}) {
  if (!mappedPixelData || !gridDimensions || gridDimensions.N === 0 || gridDimensions.M === 0) {
    console.error("下载失败: 映射数据或尺寸无效。");
    alert("无法下载图纸，数据未生成或无效。");
    return;
  }
  
  if (!activeBeadPalette || !Array.isArray(activeBeadPalette) || activeBeadPalette.length === 0) {
    console.error("下载失败: 色板数据无效。");
    alert("无法下载图纸，色板数据无效。");
    return;
  }
  if (!colorCounts) {
    console.error("下载失败: 色号统计数据无效。");
    alert("无法下载图纸，色号统计数据未生成或无效。");
    return;
  }
  
  // 加载大锤图标
  const logoImage = new Image();
  logoImage.src = '/logo.png'; // 请将大锤图标放在 public/logo.png
  
  const processDownload = () => {
    const { N, M } = gridDimensions;
    const downloadCellSize = 30;
    const { showGrid, gridInterval, showCoordinates, gridLineColor, includeStats } = options;
    const axisLabelSize = showCoordinates ? Math.max(30, Math.floor(downloadCellSize)) : 0;
    const statsPadding = 20;
    let statsHeight = 0;
    const preCalcWidth = N * downloadCellSize + axisLabelSize;
    const preCalcAvailableWidth = preCalcWidth - (statsPadding * 2);
    const baseStatsFontSize = 13;
    const widthFactor = Math.max(0, preCalcAvailableWidth - 350) / 600;
    const statsFontSize = Math.floor(baseStatsFontSize + (widthFactor * 10));
    const extraLeftMargin = showCoordinates ? Math.max(20, statsFontSize * 2) : 0;
    const extraRightMargin = showCoordinates ? Math.max(20, statsFontSize * 2) : 0;
    const extraTopMargin = showCoordinates ? Math.max(15, statsFontSize) : 0;
    const extraBottomMargin = showCoordinates ? Math.max(15, statsFontSize) : 0;
    const gridWidth = N * downloadCellSize;
    const gridHeight = M * downloadCellSize;
    const xiaohongshuAreaHeight = 35;
    const baseTitleBarHeight = 80;
    const initialWidth = gridWidth + axisLabelSize + extraLeftMargin;
    const titleBarScale = Math.max(1.0, Math.min(2.0, initialWidth / 1000));
    const titleBarHeight = Math.floor(baseTitleBarHeight * titleBarScale);
    const titleFontSize = Math.max(28, Math.floor(28 * titleBarScale));
    
    if (includeStats && colorCounts) {
      const colorKeys = Object.keys(colorCounts);
      const statsTopMargin = 24;
      // 使用卡片式布局计算高度
      const cardW = 60;
      const cardH = 80;
      const gap = 12;
      const availableStatsWidth = preCalcAvailableWidth;
      const cols = Math.floor(availableStatsWidth / (cardW + gap));
      const rows = Math.ceil(colorKeys.length / cols);
      const titleHeight = 30;
      const footerHeight = 30;
      statsHeight = titleHeight + 30 + (rows * (cardH + gap)) + footerHeight + (statsPadding * 2) + statsTopMargin;
    }
  
    const downloadWidth = gridWidth + (axisLabelSize * 2) + extraLeftMargin + extraRightMargin;
    let downloadHeight = titleBarHeight + gridHeight + (axisLabelSize * 2) + statsHeight + extraTopMargin + extraBottomMargin + xiaohongshuAreaHeight;
  
    let downloadCanvas = document.createElement('canvas');
    downloadCanvas.width = downloadWidth;
    downloadCanvas.height = downloadHeight;
    const context = downloadCanvas.getContext('2d');
    if (!context) {
      console.error("下载失败: 无法创建临时 Canvas Context。");
      alert("无法下载图纸。");
      return;
    }
    
    let ctx = context;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, downloadWidth, downloadHeight);
    ctx.fillStyle = '#4096FF';
    ctx.fillRect(0, 0, downloadWidth, titleBarHeight);
    
    // 绘制大锤图标（无背景，直接显示）
    const logoSize = titleBarHeight * 0.7;
    const logoPadding = titleBarHeight * 0.15;
    const brandBlockWidth = logoSize + logoPadding * 2;
    
    if (logoImage.complete && logoImage.naturalWidth !== 0) {
      ctx.save();
      ctx.drawImage(logoImage, logoPadding, logoPadding, logoSize, logoSize);
      ctx.restore();
    } else {
      // 如果图片未加载，使用占位符
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.floor(logoSize * 0.3)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LOGO', logoPadding + logoSize / 2, titleBarHeight / 2);
    }
    
    // 生成日期
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}/${month}/${day}`;
    
    // 生成规格和总数信息
    const specStr = `规格: ${N}x${M}`;
    const totalStr = `共 ${totalBeadCount || 0} 颗`;
    const subTitleText = `${dateStr} | ${specStr} | ${totalStr}`;
    
    const mainTitleFontSize = Math.max(20, Math.floor(titleFontSize * 0.8));
    const subTitleFontSize = Math.max(12, Math.floor(titleFontSize * 0.45));
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `600 ${mainTitleFontSize}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const titleStartX = brandBlockWidth + titleBarHeight * 0.3;
    const mainTitleY = titleBarHeight * 0.4;
    ctx.fillText('拼豆图纸@拼豆吧 dc', titleStartX, mainTitleY);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = `400 ${subTitleFontSize}px system-ui, -apple-system, sans-serif`;
    const subTitleY = titleBarHeight * 0.65;
    ctx.fillText(subTitleText, titleStartX, subTitleY);
    
    const separatorY = titleBarHeight - 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, separatorY);
    ctx.lineTo(downloadWidth, separatorY);
    ctx.stroke();
    
    // 移除右侧二维码显示
  
    console.log(`Generating download grid image: ${downloadWidth}x${downloadHeight}`);
    const fontSize = Math.max(8, Math.floor(downloadCellSize * 0.4));
    
    if (showCoordinates) {
      ctx.fillStyle = '#F5F5F5';
      ctx.fillRect(extraLeftMargin + axisLabelSize, titleBarHeight + extraTopMargin, gridWidth, axisLabelSize);
      ctx.fillRect(extraLeftMargin + axisLabelSize, titleBarHeight + extraTopMargin + axisLabelSize + gridHeight, gridWidth, axisLabelSize);
      ctx.fillRect(extraLeftMargin, titleBarHeight + extraTopMargin + axisLabelSize, axisLabelSize, gridHeight);
      ctx.fillRect(extraLeftMargin + axisLabelSize + gridWidth, titleBarHeight + extraTopMargin + axisLabelSize, axisLabelSize, gridHeight);
      
      ctx.fillStyle = '#333333';
      const axisFontSize = 14;
      ctx.font = `${axisFontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      for (let i = 0; i < N; i++) {
        if ((i + 1) % gridInterval === 0 || i === 0 || i === N - 1) {
          const numX = extraLeftMargin + axisLabelSize + (i * downloadCellSize) + (downloadCellSize / 2);
          const numY = titleBarHeight + extraTopMargin + (axisLabelSize / 2);
          ctx.fillText((i + 1).toString(), numX, numY);
        }
      }
      
      for (let i = 0; i < N; i++) {
        if ((i + 1) % gridInterval === 0 || i === 0 || i === N - 1) {
          const numX = extraLeftMargin + axisLabelSize + (i * downloadCellSize) + (downloadCellSize / 2);
          const numY = titleBarHeight + extraTopMargin + axisLabelSize + gridHeight + (axisLabelSize / 2);
          ctx.fillText((i + 1).toString(), numX, numY);
        }
      }
      
      for (let j = 0; j < M; j++) {
        if ((j + 1) % gridInterval === 0 || j === 0 || j === M - 1) {
          const numX = extraLeftMargin + (axisLabelSize / 2);
          const numY = titleBarHeight + extraTopMargin + axisLabelSize + (j * downloadCellSize) + (downloadCellSize / 2);
          ctx.fillText((j + 1).toString(), numX, numY);
        }
      }
      
      for (let j = 0; j < M; j++) {
        if ((j + 1) % gridInterval === 0 || j === 0 || j === M - 1) {
          const numX = extraLeftMargin + axisLabelSize + gridWidth + (axisLabelSize / 2);
          const numY = titleBarHeight + extraTopMargin + axisLabelSize + (j * downloadCellSize) + (downloadCellSize / 2);
          ctx.fillText((j + 1).toString(), numX, numY);
        }
      }
      
      ctx.strokeStyle = '#AAAAAA';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(extraLeftMargin + axisLabelSize, titleBarHeight + extraTopMargin + axisLabelSize);
      ctx.lineTo(extraLeftMargin + axisLabelSize + gridWidth, titleBarHeight + extraTopMargin + axisLabelSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(extraLeftMargin + axisLabelSize, titleBarHeight + extraTopMargin + axisLabelSize + gridHeight);
      ctx.lineTo(extraLeftMargin + axisLabelSize + gridWidth, titleBarHeight + extraTopMargin + axisLabelSize + gridHeight);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(extraLeftMargin + axisLabelSize, titleBarHeight + extraTopMargin + axisLabelSize);
      ctx.lineTo(extraLeftMargin + axisLabelSize, titleBarHeight + extraTopMargin + axisLabelSize + gridHeight);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(extraLeftMargin + axisLabelSize + gridWidth, titleBarHeight + extraTopMargin + axisLabelSize);
      ctx.lineTo(extraLeftMargin + axisLabelSize + gridWidth, titleBarHeight + extraTopMargin + axisLabelSize + gridHeight);
      ctx.stroke();
    }
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let j = 0; j < M; j++) {
      for (let i = 0; i < N; i++) {
        const cellData = mappedPixelData[j][i];
        const drawX = extraLeftMargin + i * downloadCellSize + axisLabelSize;
        const drawY = titleBarHeight + extraTopMargin + j * downloadCellSize + axisLabelSize;

        if (cellData && !cellData.isExternal) {
          const cellColor = cellData.color || '#FFFFFF';
          const cellKey = getDisplayColorKey(cellData.color || '#FFFFFF', selectedColorSystem);
          ctx.fillStyle = cellColor;
          ctx.fillRect(drawX, drawY, downloadCellSize, downloadCellSize);
          ctx.fillStyle = getContrastColor(cellColor);
          ctx.fillText(cellKey, drawX + downloadCellSize / 2, drawY + downloadCellSize / 2);
        } else {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(drawX, drawY, downloadCellSize, downloadCellSize);
        }

        ctx.strokeStyle = '#DDDDDD';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(drawX + 0.5, drawY + 0.5, downloadCellSize, downloadCellSize);
      }
    }

    if (showGrid) {
      ctx.strokeStyle = gridLineColor;
      ctx.lineWidth = 1.5;
      
      for (let i = gridInterval; i < N; i += gridInterval) {
        const lineX = extraLeftMargin + i * downloadCellSize + axisLabelSize;
        ctx.beginPath();
        ctx.moveTo(lineX, titleBarHeight + extraTopMargin + axisLabelSize);
        ctx.lineTo(lineX, titleBarHeight + extraTopMargin + axisLabelSize + M * downloadCellSize);
        ctx.stroke();
      }
      
      for (let j = gridInterval; j < M; j += gridInterval) {
        const lineY = titleBarHeight + extraTopMargin + j * downloadCellSize + axisLabelSize;
        ctx.beginPath();
        ctx.moveTo(extraLeftMargin + axisLabelSize, lineY);
        ctx.lineTo(extraLeftMargin + axisLabelSize + N * downloadCellSize, lineY);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(
      extraLeftMargin + axisLabelSize + 0.5, 
      titleBarHeight + extraTopMargin + axisLabelSize + 0.5, 
      N * downloadCellSize, 
      M * downloadCellSize
    );

    const secondaryWatermarkFontSize = Math.max(10, Math.floor(downloadCellSize * 0.5));
    const secondaryText = '@七卡瓦';
    ctx.font = `500 ${secondaryWatermarkFontSize}px system-ui, -apple-system, sans-serif`;
    const secondaryMetrics = ctx.measureText(secondaryText);
    const secondaryWidth = secondaryMetrics.width;
    const secondaryHeight = secondaryWatermarkFontSize;
    const secondaryWatermarkX = extraLeftMargin + axisLabelSize + 15;
    const secondaryWatermarkY = titleBarHeight + extraTopMargin + axisLabelSize + secondaryHeight + 15;
    const secondaryBgPadding = 4;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(
        secondaryWatermarkX - secondaryBgPadding,
        secondaryWatermarkY - secondaryHeight - secondaryBgPadding,
        secondaryWidth + secondaryBgPadding * 2,
        secondaryHeight + secondaryBgPadding * 2,
        3
      );
    } else {
      ctx.rect(
        secondaryWatermarkX - secondaryBgPadding,
        secondaryWatermarkY - secondaryHeight - secondaryBgPadding,
        secondaryWidth + secondaryBgPadding * 2,
        secondaryHeight + secondaryBgPadding * 2
      );
    }
    ctx.fill();
    ctx.fillStyle = '#6B7280';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(secondaryText, secondaryWatermarkX, secondaryWatermarkY);

    if (includeStats && colorCounts) {
      const colorKeys = Object.keys(colorCounts).sort(sortColorKeys);
      const statsTopMargin = 24;
      const statsY = titleBarHeight + extraTopMargin + M * downloadCellSize + (axisLabelSize * 2) + statsPadding + statsTopMargin;
      const availableStatsWidth = downloadWidth - (statsPadding * 2);
      
      // 使用卡片式布局，参考 App.vue 的样式
      const cardW = 60;
      const cardH = 80;
      const gap = 12;
      const cols = Math.floor((availableStatsWidth) / (cardW + gap));
      const rows = Math.ceil(colorKeys.length / cols);
      
      // 绘制标题和总计
      const titleHeight = 30;
      ctx.fillStyle = '#333333';
      ctx.font = `bold ${Math.max(20, statsFontSize + 4)}px Arial`;
      ctx.textAlign = 'left';
      const titleText = "色号详情   ";
      ctx.fillText(titleText, statsPadding, statsY + titleHeight);
      
      // 在标题右侧显示总计
      const titleMetrics = ctx.measureText(titleText);
      const totalText = `总计: ${totalBeadCount} 颗`;
      ctx.font = `bold ${statsFontSize}px Arial`;
      ctx.textAlign = 'left';
      ctx.fillText(totalText, statsPadding + titleMetrics.width + 20, statsY + titleHeight);
      
      // 绘制卡片
      const legendStartY = statsY + titleHeight + 30;
      colorKeys.forEach((key, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = statsPadding + col * (cardW + gap);
        const y = legendStartY + row * (cardH + gap);
        const cellData = colorCounts[key];
        const r = 10; // 圆角半径
        
        // 绘制圆角卡片路径
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + cardW - r, y);
        ctx.quadraticCurveTo(x + cardW, y, x + cardW, y + r);
        ctx.lineTo(x + cardW, y + cardH - r);
        ctx.quadraticCurveTo(x + cardW, y + cardH, x + cardW - r, y + cardH);
        ctx.lineTo(x + r, y + cardH);
        ctx.quadraticCurveTo(x, y + cardH, x, y + cardH - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        
        // 使用 clip 来限制绘制区域
        ctx.save();
        ctx.clip();
        
        // 绘制颜色预览区域（占卡片高度的 65%）
        ctx.fillStyle = cellData.color;
        ctx.fillRect(x, y, cardW, cardH * 0.65);
        
        // 绘制信息区域（占卡片高度的 35%）
        ctx.fillStyle = '#f9f9f9';
        ctx.fillRect(x, y + cardH * 0.65, cardW, cardH * 0.35);
        
        // 绘制色号代码（在颜色区域中心）
        // 使用 cellData.color (hex值) 而不是 key，因为 key 可能是色号代码
        const colorCode = getColorKeyByHex(cellData.color || key, selectedColorSystem);
        ctx.fillStyle = getContrastColor(cellData.color);
        ctx.font = `bold ${Math.floor(cardW * 0.27)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(colorCode, x + cardW / 2, y + cardH * 0.32);
        
        // 绘制数量（在信息区域中心）
        ctx.fillStyle = '#333333';
        ctx.font = `bold ${Math.floor(cardW * 0.23)}px Arial`;
        ctx.fillText(cellData.count, x + cardW / 2, y + cardH * 0.82);
        
        ctx.restore();
        
        // 绘制卡片边框
        ctx.strokeStyle = '#e5e5e5';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
      
      // 移除总计和图纸来源的底部显示
      // statsHeight 已在上面使用卡片布局计算完成，无需重新计算
    }

    if (includeStats && colorCounts) {
      const newDownloadHeight = titleBarHeight + extraTopMargin + M * downloadCellSize + (axisLabelSize * 2) + statsHeight + extraBottomMargin + xiaohongshuAreaHeight;
      
      if (downloadHeight !== newDownloadHeight) {
        const newCanvas = document.createElement('canvas');
        newCanvas.width = downloadWidth;
        newCanvas.height = newDownloadHeight;
        const newContext = newCanvas.getContext('2d');
        
        if (newContext) {
          newContext.drawImage(downloadCanvas, 0, 0);
          downloadCanvas = newCanvas;
          ctx = newContext;
          ctx.imageSmoothingEnabled = false;
          downloadHeight = newDownloadHeight;
        }
      }
    }

    try {
      const dataURL = downloadCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `bead-grid-${N}x${M}-keys-palette_${selectedColorSystem}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log("Grid image download initiated.");
      
      if (options.exportCsv) {
        exportCsvData({
          mappedPixelData,
          gridDimensions,
          selectedColorSystem
        });
      }
    } catch (e) {
      console.error("下载图纸失败:", e);
      alert("无法生成图纸下载链接。");
    }
  };
  
  if (logoImage.complete) {
    processDownload();
  } else {
    logoImage.onload = processDownload;
    logoImage.onerror = () => {
      console.warn("Logo图片加载失败，将使用占位符");
      processDownload();
    };
  }
}

