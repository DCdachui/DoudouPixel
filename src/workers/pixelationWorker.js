// Web Worker 用于处理图片像素化（参考代码优化版）

self.onmessage = (e) => {
  const { 
    pixels, width, height, palette, 
    dither, useClustering, maxColors, colorThreshold, processingMode,
    grayscale, enhanceEdges,
    optCartoon, optCleanBg, optDetail,
    // 兼容旧参数
    imgWidth, imgHeight, N, M, mode, threshold, t1FallbackColor
  } = e.data;
  
  try {
    // 发送进度更新
    self.postMessage({ type: 'progress', message: '正在处理图片数据...' });

    // 如果使用新的参考代码格式（直接处理像素数组）
    if (pixels && width && height && palette) {
      const { grid, stats } = processImage(
        pixels, width, height, palette, 
        dither, useClustering, maxColors, colorThreshold || 20,
        processingMode || 'average',
        grayscale, enhanceEdges,
        optCartoon, optCleanBg, optDetail
      );
      
      // 同时返回参考代码格式和旧格式，确保兼容性
      self.postMessage({ 
        type: 'result',
        success: true,
        // 参考代码格式
        grid: grid,
        stats: stats,
        // 旧格式（兼容）
        mappedPixelData: grid, 
        gridDimensions: { N: width, M: height },
        colorCounts: convertStatsToColorCounts(stats),
        totalBeadCount: stats.reduce((acc, cur) => acc + cur.count, 0)
      });
    } 
    // 兼容旧的参数格式
    else if (imgWidth && imgHeight && N && M) {
      const result = processImageLegacy(
        pixels,
        width,
        height,
        imgWidth,
        imgHeight,
        N,
        M,
        palette,
        mode,
        threshold,
        t1FallbackColor
      );
      
      self.postMessage({
        type: 'result',
        success: true,
        mappedPixelData: result.mappedPixelData,
        gridDimensions: { N, M },
        colorCounts: result.colorCounts,
        totalBeadCount: result.totalBeadCount
      });
    } else {
      throw new Error('缺少必要的参数');
    }
  } catch (error) {
    console.error('Worker 处理错误:', error);
    self.postMessage({
      type: 'result',
      success: false,
      error: error.message || String(error)
    });
  }
};

/**
 * 图像处理主函数 (流水线) - 参考代码版本
 */
function processImage(pixels, w, h, paletteColors, enableDither, useClustering, maxColors, colorThreshold, processingMode, isGrayscale, isEnhanced, optCartoon, optCleanBg, optDetail) {
  // 1. 复制像素数据，避免修改原引用
  let img = new Uint8ClampedArray(pixels);

  // ============================================================
  // A. 预处理阶段 (顺序很重要：先去噪 -> 再增强)
  // ============================================================

  // 1. 卡通化 (中值滤波 - 去除椒盐噪点，让色块变平滑)
  if (optCartoon) {
    img = applyMedianFilter(img, w, h);
  }

  // 2. 净化背景 (邻域投票 - 去除孤立杂色)
  if (optCleanBg) {
    img = applyMajorityVote(img, w, h);
  }

  // 3. 细节增强 (S曲线对比度 - 强化眼睛/嘴巴等小点)
  if (optDetail) {
    img = applyDetailEnhance(img, w, h);
  }

  // 4. 边缘锐化 (卷积锐化 - 强化轮廓)
  if (isEnhanced) {
    img = applySharpen(img, w, h, 1.0);
  }

  // 5. 黑白化处理
  let targetPalette = paletteColors;
  if (isGrayscale) {
    for (let i = 0; i < img.length; i += 4) {
      const gray = 0.299 * img[i] + 0.587 * img[i+1] + 0.114 * img[i+2];
      // 稍微增加对比度
      const finalGray = gray > 128 ? Math.min(255, gray * 1.1) : Math.max(0, gray * 0.9);
      img[i] = img[i+1] = img[i+2] = finalGray;
    }
    // 过滤色板，只保留黑白灰
    targetPalette = paletteColors.filter(c => {
      const rgb = parseHex(c.hex);
      const delta = Math.max(rgb.r, rgb.g, rgb.b) - Math.min(rgb.r, rgb.g, rgb.b);
      // R,G,B 差异小说明是灰色，或者特定的黑白代码
      return delta < 15 || ['H01','H07','S01','S02','S12','S13'].includes(c.code);
    });
    // 兜底：如果过滤完没颜色了，就还是用全部
    if (targetPalette.length === 0) targetPalette = paletteColors;
  }

  // ============================================================
  // B. K-Means 聚类 (降噪与归纳)
  // ============================================================
  if (useClustering && maxColors > 0) {
    const samples = [];
    // 降采样提取样本
    for (let i = 0; i < img.length; i += 32) {
      if (img[i+3] > 128) {
        samples.push({ r: img[i], g: img[i+1], b: img[i+2] });
      }
    }

    if (samples.length > maxColors) {
      const centroids = runKMeans(samples, maxColors);
      
      for (let i = 0; i < img.length; i += 4) {
        if (img[i+3] < 128) continue;

        const oldC = { r: img[i], g: img[i+1], b: img[i+2] };
        let minDist = Infinity;
        let bestC = centroids[0];

        for (let k = 0; k < centroids.length; k++) {
          const dist = getColorDist(oldC, centroids[k]);
          if (dist < minDist) { minDist = dist; bestC = centroids[k]; }
        }
        
        img[i] = bestC.r;
        img[i+1] = bestC.g;
        img[i+2] = bestC.b;
      }
    }
  }

  // ============================================================
  // C. 颜色映射 (Mapping) - 根据处理模式选择平均色或主导色，使用颜色合并阈值优化
  // ============================================================
  const outputGrid = new Array(h).fill(0).map(() => new Array(w));
  const colorCounts = {}; 
  const mergeThreshold = colorThreshold || 20; // 颜色合并阈值，默认20
  const mode = processingMode || 'average'; // 处理模式：'average' 真实(平均) 或 'dominant' 卡通(主色)

  // 如果是主导色模式，先计算每个区域的主导色
  if (mode === 'dominant') {
    // 创建一个临时数组存储主导色
    const dominantColors = new Array(h).fill(0).map(() => new Array(w));
    
    // 计算每个像素周围区域的主导色（3x3窗口）
    const windowSize = 3;
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        
        if (img[i+3] < 128) {
          dominantColors[y][x] = null;
          continue;
        }

        // 统计窗口内的颜色分布
        const colorCountsInWindow = {};
        let maxCount = 0;
        let dominantRgb = { r: img[i], g: img[i+1], b: img[i+2] };

        for (let dy = -halfWindow; dy <= halfWindow; dy++) {
          for (let dx = -halfWindow; dx <= halfWindow; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            
            if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
              const ni = (ny * w + nx) * 4;
              if (img[ni+3] > 128) {
                const colorKey = `${img[ni]},${img[ni+1]},${img[ni+2]}`;
                colorCountsInWindow[colorKey] = (colorCountsInWindow[colorKey] || 0) + 1;
                
                if (colorCountsInWindow[colorKey] > maxCount) {
                  maxCount = colorCountsInWindow[colorKey];
                  const [r, g, b] = colorKey.split(',').map(Number);
                  dominantRgb = { r, g, b };
                }
              }
            }
          }
        }

        dominantColors[y][x] = dominantRgb;
      }
    }

    // 使用主导色进行颜色映射，应用颜色合并阈值
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!dominantColors[y][x]) {
          outputGrid[y][x] = null;
          continue;
        }

        const { r: oldR, g: oldG, b: oldB } = dominantColors[y][x];

        // 使用颜色合并阈值：如果已有相似颜色，直接使用，避免重复计算
        let bestColor = null;
        let minDist = Infinity;
        
        // 先检查已使用的颜色中是否有相似的颜色
        if (Object.keys(colorCounts).length > 0 && mergeThreshold > 0) {
          for (const code in colorCounts) {
            const existingColor = colorCounts[code];
            if (!existingColor || !existingColor.hex) continue;
            
            try {
              const existingRgb = parseHex(existingColor.hex);
              const dist = getColorDist({ r: oldR, g: oldG, b: oldB }, existingRgb);
              
              if (dist < mergeThreshold && dist < minDist) {
                minDist = dist;
                bestColor = existingColor;
              }
            } catch (e) {
              console.warn('Failed to parse hex:', existingColor.hex, e);
              continue;
            }
          }
        }
        
        // 如果没有找到相似颜色，从调色板中找最接近的
        if (!bestColor) {
          bestColor = findClosestColor(oldR, oldG, oldB, targetPalette);
        }
        
        outputGrid[y][x] = bestColor;
        
        if (!colorCounts[bestColor.code]) {
          colorCounts[bestColor.code] = { ...bestColor, count: 0 };
        }
        colorCounts[bestColor.code].count++;
      }
    }
  } else {
    // 平均模式：直接使用像素颜色，应用颜色合并阈值
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        
        if (img[i+3] < 128) {
          outputGrid[y][x] = null;
          continue;
        }

        const oldR = img[i];
        const oldG = img[i + 1];
        const oldB = img[i + 2];

        // 使用颜色合并阈值：如果已有相似颜色，直接使用，避免重复计算
        let bestColor = null;
        let minDist = Infinity;
        
        // 先检查已使用的颜色中是否有相似的颜色
        if (Object.keys(colorCounts).length > 0 && mergeThreshold > 0) {
          for (const code in colorCounts) {
            const existingColor = colorCounts[code];
            if (!existingColor || !existingColor.hex) continue;
            
            try {
              const existingRgb = parseHex(existingColor.hex);
              const dist = getColorDist({ r: oldR, g: oldG, b: oldB }, existingRgb);
              
              if (dist < mergeThreshold && dist < minDist) {
                minDist = dist;
                bestColor = existingColor;
              }
            } catch (e) {
              console.warn('Failed to parse hex:', existingColor.hex, e);
              continue;
            }
          }
        }
        
        // 如果没有找到相似颜色，从调色板中找最接近的
        if (!bestColor) {
          bestColor = findClosestColor(oldR, oldG, oldB, targetPalette);
        }
        
        outputGrid[y][x] = bestColor;
        
        if (!colorCounts[bestColor.code]) {
          colorCounts[bestColor.code] = { ...bestColor, count: 0 };
        }
        colorCounts[bestColor.code].count++;

        // 抖动处理 (开启卡通化时不建议抖动)
        if (enableDither && !optCartoon) {
          const target = parseHex(bestColor.hex);
          const errR = oldR - target.r;
          const errG = oldG - target.g;
          const errB = oldB - target.b;
          distributeError(img, x + 1, y, errR, errG, errB, 7/16, w, h);
          distributeError(img, x - 1, y + 1, errR, errG, errB, 3/16, w, h);
          distributeError(img, x, y + 1, errR, errG, errB, 5/16, w, h);
          distributeError(img, x + 1, y + 1, errR, errG, errB, 1/16, w, h);
        }
      }
    }
  }

  const statsArray = Object.values(colorCounts).sort((a, b) => b.count - a.count);
  return { grid: outputGrid, stats: statsArray };
}

// 兼容旧版本的处理函数
function processImageLegacy(pixels, width, height, imgWidth, imgHeight, N, M, palette, mode, threshold, t1FallbackColor) {
  // 这里保留旧的逻辑，但使用优化后的颜色查找
  const imageData = {
    data: new Uint8ClampedArray(pixels),
    width: width,
    height: height
  }

  // 预解析调色板颜色
  const processedPalette = palette.map(p => {
    if (!p.rgb) {
      p.rgb = parseHex(p.hex)
    }
    return {
      ...p,
      code: p.code || p.key
    }
  })

  const mappedData = Array(M).fill(null).map(() => Array(N).fill(null))
  const cellWidthOriginal = imgWidth / N
  const cellHeightOriginal = imgHeight / M

  for (let j = 0; j < M; j++) {
    for (let i = 0; i < N; i++) {
      const startXOriginal = Math.floor(i * cellWidthOriginal)
      const startYOriginal = Math.floor(j * cellHeightOriginal)
      const endXOriginal = Math.min(imgWidth, Math.ceil((i + 1) * cellWidthOriginal))
      const endYOriginal = Math.min(imgHeight, Math.ceil((j + 1) * cellHeightOriginal))
      const currentCellWidth = Math.max(1, endXOriginal - startXOriginal)
      const currentCellHeight = Math.max(1, endYOriginal - startYOriginal)

      const representativeRgb = calculateCellRepresentativeColor(
        imageData,
        startXOriginal,
        startYOriginal,
        currentCellWidth,
        currentCellHeight,
        mode
      )

      if (representativeRgb) {
        const closestBead = findClosestColor(representativeRgb.r, representativeRgb.g, representativeRgb.b, processedPalette)
        mappedData[j][i] = {
          key: closestBead.key || closestBead.code,
          color: closestBead.hex,
          code: closestBead.code || closestBead.key,
          isExternal: false
        }
      } else {
        mappedData[j][i] = {
          key: t1FallbackColor.key,
          color: t1FallbackColor.hex,
          code: t1FallbackColor.code || t1FallbackColor.key,
          isExternal: false
        }
      }
    }
  }

  // 合并相似颜色
  let finalData = mappedData
  if (threshold > 0) {
    finalData = mergeSimilarColors(mappedData, processedPalette, threshold, N, M)
  }

  // 计算颜色统计
  const counts = {}
  let totalCount = 0
  finalData.flat().forEach(cell => {
    if (cell && cell.key && !cell.isExternal) {
      const hexKey = cell.color
      if (!counts[hexKey]) {
        counts[hexKey] = {
          count: 0,
          color: cell.color,
          code: cell.code || cell.key,
          key: cell.key
        }
      }
      counts[hexKey].count++
      totalCount++
    }
  })

  return {
    mappedPixelData: finalData,
    colorCounts: counts,
    totalBeadCount: totalCount
  }
}

// 计算图像指定区域的代表色
function calculateCellRepresentativeColor(imageData, startX, startY, width, height, mode) {
  const data = imageData.data
  const imgWidth = imageData.width
  let rSum = 0, gSum = 0, bSum = 0
  let pixelCount = 0
  const colorCountsInCell = {}
  let dominantColorRgb = null
  let maxCount = 0

  const endX = startX + width
  const endY = startY + height

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const index = (y * imgWidth + x) * 4
      if (data[index + 3] < 128) continue

      const r = data[index]
      const g = data[index + 1]
      const b = data[index + 2]

      pixelCount++

      if (mode === 'average') {
        rSum += r
        gSum += g
        bSum += b
      } else {
        const colorKey = `${r},${g},${b}`
        colorCountsInCell[colorKey] = (colorCountsInCell[colorKey] || 0) + 1
        if (colorCountsInCell[colorKey] > maxCount) {
          maxCount = colorCountsInCell[colorKey]
          dominantColorRgb = { r, g, b }
        }
      }
    }
  }

  if (pixelCount === 0) {
    return null
  }

  if (mode === 'average') {
    return {
      r: Math.round(rSum / pixelCount),
      g: Math.round(gSum / pixelCount),
      b: Math.round(bSum / pixelCount),
    }
  } else {
    return dominantColorRgb
  }
}

// 颜色合并逻辑
function mergeSimilarColors(initialMappedData, palette, threshold, N, M) {
  const keyToRgbMap = new Map()
  const keyToColorDataMap = new Map()
  
  palette.forEach(p => {
    if (!p.rgb) {
      p.rgb = parseHex(p.hex)
    }
    keyToRgbMap.set(p.key || p.code, p.rgb)
    keyToColorDataMap.set(p.key || p.code, p)
  })

  const initialColorCounts = {}
  initialMappedData.flat().forEach(cell => {
    if (cell && cell.key) {
      initialColorCounts[cell.key] = (initialColorCounts[cell.key] || 0) + 1
    }
  })

  const colorsByFrequency = Object.entries(initialColorCounts)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0])

  const mergedData = initialMappedData.map(row =>
    row.map(cell => ({ ...cell, isExternal: false }))
  )

  const replacedColors = new Set()
  for (let i = 0; i < colorsByFrequency.length; i++) {
    const currentKey = colorsByFrequency[i]
    if (replacedColors.has(currentKey)) continue

    const currentRgb = keyToRgbMap.get(currentKey)
    if (!currentRgb) continue

    for (let j = i + 1; j < colorsByFrequency.length; j++) {
      const lowerFreqKey = colorsByFrequency[j]
      if (replacedColors.has(lowerFreqKey)) continue

      const lowerFreqRgb = keyToRgbMap.get(lowerFreqKey)
      if (!lowerFreqRgb) continue

      const dist = getColorDist(currentRgb, lowerFreqRgb)
      if (dist < threshold) {
        replacedColors.add(lowerFreqKey)
        for (let r = 0; r < M; r++) {
          for (let c = 0; c < N; c++) {
            if (mergedData[r][c].key === lowerFreqKey) {
              const colorData = keyToColorDataMap.get(currentKey)
              if (colorData) {
                mergedData[r][c] = {
                  key: currentKey,
                  color: colorData.hex,
                  code: colorData.code || colorData.key,
                  isExternal: false
                }
              }
            }
          }
        }
      }
    }
  }

  return mergedData
}

// 转换统计格式
function convertStatsToColorCounts(stats) {
  const counts = {}
  stats.forEach(item => {
    counts[item.hex] = {
      count: item.count,
      color: item.hex,
      code: item.code,
      key: item.code
    }
  })
  return counts
}

// ---------------------------------------------------------
// 🧠 算法函数库
// ---------------------------------------------------------


// 中值滤波 (优化版 - 加权中值，保留更多细节)
function applyMedianFilter(data, w, h) {
  const output = new Uint8ClampedArray(data);
  const radius = 1; // 3x3 窗口
  
  for (let y = radius; y < h - radius; y++) {
    for (let x = radius; x < w - radius; x++) {
      const i = (y * w + x) * 4;
      if (data[i+3] < 128) {
        output[i] = data[i];
        output[i+1] = data[i+1];
        output[i+2] = data[i+2];
        output[i+3] = data[i+3];
        continue;
      }
      
      // 使用加权中值，中心像素权重更高
      const rA = [], gA = [], bA = [];
      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const ni = ((y + ky) * w + (x + kx)) * 4;
          const weight = (kx === 0 && ky === 0) ? 3 : 1; // 中心像素权重3倍
          for (let w = 0; w < weight; w++) {
            rA.push(data[ni]);
            gA.push(data[ni+1]);
            bA.push(data[ni+2]);
          }
        }
      }
      
      rA.sort((a,b)=>a-b);
      gA.sort((a,b)=>a-b);
      bA.sort((a,b)=>a-b);
      
      const mid = Math.floor(rA.length / 2);
      output[i] = rA[mid];
      output[i+1] = gA[mid];
      output[i+2] = bA[mid];
      output[i+3] = data[i+3];
    }
  }
  
  // 处理边缘像素（直接复制）
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (y < radius || y >= h - radius || x < radius || x >= w - radius) {
        const i = (y * w + x) * 4;
        output[i] = data[i];
        output[i+1] = data[i+1];
        output[i+2] = data[i+2];
        output[i+3] = data[i+3];
      }
    }
  }
  
  return output;
}

// 卷积锐化 (优化版 - 使用Unsharp Masking算法，更自然)
function applySharpen(data, w, h, amount) {
  const output = new Uint8ClampedArray(data);
  
  // 先进行轻微高斯模糊（用于Unsharp Masking）
  const blurred = new Uint8ClampedArray(data);
  const blurKernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  const blurSum = 16;
  
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      if (data[idx+3] < 128) {
        blurred[idx] = data[idx];
        blurred[idx+1] = data[idx+1];
        blurred[idx+2] = data[idx+2];
        blurred[idx+3] = data[idx+3];
        continue;
      }
      
      let r = 0, g = 0, b = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const kidx = ((y + ky) * w + (x + kx)) * 4;
          const weight = blurKernel[(ky + 1) * 3 + (kx + 1)];
          r += data[kidx] * weight;
          g += data[kidx+1] * weight;
          b += data[kidx+2] * weight;
        }
      }
      blurred[idx] = r / blurSum;
      blurred[idx+1] = g / blurSum;
      blurred[idx+2] = b / blurSum;
      blurred[idx+3] = data[idx+3];
    }
  }
  
  // Unsharp Masking: 原图 - 模糊图 = 细节，然后叠加
  for (let i = 0; i < data.length; i += 4) {
    if (data[i+3] < 128) {
      output[i] = data[i];
      output[i+1] = data[i+1];
      output[i+2] = data[i+2];
      output[i+3] = data[i+3];
      continue;
    }
    
    const detailR = data[i] - blurred[i];
    const detailG = data[i+1] - blurred[i+1];
    const detailB = data[i+2] - blurred[i+2];
    
    output[i] = clamp(data[i] + detailR * amount);
    output[i+1] = clamp(data[i+1] + detailG * amount);
    output[i+2] = clamp(data[i+2] + detailB * amount);
    output[i+3] = data[i+3];
  }
  
  return output;
}

// 细节增强
function applyDetailEnhance(data, w, h) {
  const output = new Uint8ClampedArray(data);
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i+1], b = data[i+2];
    r = 128 + (r - 128) * 1.2;
    g = 128 + (g - 128) * 1.2;
    b = 128 + (b - 128) * 1.2;
    output[i] = clamp(r); output[i+1] = clamp(g); output[i+2] = clamp(b);
  }
  return output;
}

// 邻域投票
function applyMajorityVote(data, w, h) {
  const output = new Uint8ClampedArray(data);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      if (data[i+3] < 128) continue;
      let rSum=0, gSum=0, bSum=0, count=0;
      const curr = {r:data[i], g:data[i+1], b:data[i+2]};
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          if(ky===0 && kx===0) continue;
          const ni = ((y + ky) * w + (x + kx)) * 4;
          if (Math.abs(data[ni]-curr.r)+Math.abs(data[ni+1]-curr.g)+Math.abs(data[ni+2]-curr.b) < 30) {
            rSum += data[ni]; gSum += data[ni+1]; bSum += data[ni+2]; count++;
          }
        }
      }
      if(count > 5) {
        output[i] = rSum/count; output[i+1] = gSum/count; output[i+2] = bSum/count;
      }
    }
  }
  return output;
}

// K-Means
function runKMeans(pixels, k) {
  let centroids = pixels.slice(0, k);
  for (let iter = 0; iter < 5; iter++) {
    const sums = new Array(k).fill(0).map(() => ({ r:0, g:0, b:0, count:0 }));
    for (let p of pixels) {
      let minDist = Infinity, idx = 0;
      for (let i = 0; i < k; i++) {
        const dist = getColorDist(p, centroids[i]);
        if (dist < minDist) { minDist = dist; idx = i; }
      }
      sums[idx].r += p.r; sums[idx].g += p.g; sums[idx].b += p.b; sums[idx].count++;
    }
    for (let i = 0; i < k; i++) {
      if (sums[i].count > 0) {
        centroids[i] = {
          r: sums[i].r / sums[i].count,
          g: sums[i].g / sums[i].count,
          b: sums[i].b / sums[i].count
        };
      }
    }
  }
  return centroids;
}

function findClosestColor(r, g, b, colors) {
  if (!colors || colors.length === 0) {
    throw new Error('Color palette is empty');
  }
  let minDistance = Infinity;
  let closest = colors[0];
  const current = { r, g, b };
  for (const color of colors) {
    if (!color || !color.hex) continue;
    try {
      const target = parseHex(color.hex);
      const dist = getColorDist(current, target);
      if (dist < minDistance) { 
        minDistance = dist; 
        closest = color; 
      }
    } catch (e) {
      console.warn('Failed to parse color hex:', color.hex, e);
      continue;
    }
  }
  return closest;
}

function getColorDist(c1, c2) {
  return Math.sqrt(Math.pow(c1.r-c2.r,2)*0.3 + Math.pow(c1.g-c2.g,2)*0.59 + Math.pow(c1.b-c2.b,2)*0.11);
}

function distributeError(pixels, x, y, er, eg, eb, factor, w, h) {
  if (x < 0 || x >= w || y < 0 || y >= h) return;
  const i = (y * w + x) * 4;
  pixels[i] = clamp(pixels[i] + er * factor);
  pixels[i+1] = clamp(pixels[i+1] + eg * factor);
  pixels[i+2] = clamp(pixels[i+2] + eb * factor);
}

function clamp(v) { return Math.max(0, Math.min(255, v)); }
function parseHex(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

