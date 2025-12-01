// src/pixel.worker.js

self.onmessage = (e) => {
  const { 
    pixels, width, height, palette, 
    dither, useClustering, maxColors,
    grayscale, enhanceEdges,
    optCartoon, optCleanBg, optDetail,
    optOutline
  } = e.data;
  
  try {
    const { grid, stats } = processImage(
      pixels, width, height, palette, 
      dither, useClustering, maxColors,
      grayscale, enhanceEdges,
      optCartoon, optCleanBg, optDetail,
      optOutline
    );
    
    self.postMessage({ success: true, grid, stats });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};

/**
 * 图像处理主函数 (流水线)
 */
function processImage(pixels, w, h, paletteColors, enableDither, useClustering, maxColors, isGrayscale, isEnhanced, optCartoon, optCleanBg, optDetail, optOutline) {
  // 1. 复制像素数据，避免修改原引用
  let img = new Uint8ClampedArray(pixels);

  // ============================================================
  // A. 预处理阶段 (顺序很重要：先去噪 -> 再增强 -> 再描边)
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

  // 5. 黑色描边 (在锐化之后进行)
  if (optOutline) {
    img = applyBlackOutline(img, w, h);
  }

  // 6. 黑白化处理
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
        
        // 保护：如果是描边产生的纯黑(18,18,18)，不要参与聚类，否则可能变成深灰
        if (optOutline && img[i] < 25 && img[i+1] < 25 && img[i+2] < 25) continue;

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
  // C. 颜色映射 (Mapping)
  // ============================================================
  const outputGrid = new Array(h).fill(0).map(() => new Array(w));
  const colorCounts = {}; 

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

      const bestColor = findClosestColor(oldR, oldG, oldB, targetPalette);
      outputGrid[y][x] = bestColor;
      
      if (!colorCounts[bestColor.code]) {
        colorCounts[bestColor.code] = { ...bestColor, count: 0 };
      }
      colorCounts[bestColor.code].count++;

      // 抖动处理 (开启描边或卡通化时不建议抖动)
      if (enableDither && !optCartoon && !optOutline) {
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

  const statsArray = Object.values(colorCounts).sort((a, b) => b.count - a.count);
  return { grid: outputGrid, stats: statsArray };
}

// ---------------------------------------------------------
// 🧠 算法函数库
// ---------------------------------------------------------

// 智能描边 (阈值检测)
function applyBlackOutline(data, w, h) {
  const src = new Uint8ClampedArray(data);
  const threshold = 40;
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      if (src[i+3] < 128) continue;
      
      const r = src[i], g = src[i+1], b = src[i+2];
      const ir = (y * w + (x + 1)) * 4; // 右边
      const id = ((y + 1) * w + x) * 4; // 下边
      
      // 检测右侧边界
      if (src[ir+3] > 128) {
        const diff = Math.abs(r - src[ir]) + Math.abs(g - src[ir+1]) + Math.abs(b - src[ir+2]);
        if (diff > threshold) { data[i]=18; data[i+1]=18; data[i+2]=18; continue; }
      }
      // 检测下方边界
      if (src[id+3] > 128) {
        const diff = Math.abs(r - src[id]) + Math.abs(g - src[id+1]) + Math.abs(b - src[id+2]);
        if (diff > threshold) { data[i]=18; data[i+1]=18; data[i+2]=18; }
      }
    }
  }
  return data;
}

// 中值滤波
function applyMedianFilter(data, w, h) {
  const output = new Uint8ClampedArray(data);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      if (data[i+3] < 128) continue;
      const rA=[], gA=[], bA=[];
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const ni = ((y + ky) * w + (x + kx)) * 4;
          rA.push(data[ni]); gA.push(data[ni+1]); bA.push(data[ni+2]);
        }
      }
      rA.sort((a,b)=>a-b); gA.sort((a,b)=>a-b); bA.sort((a,b)=>a-b);
      output[i] = rA[4]; output[i+1] = gA[4]; output[i+2] = bA[4];
    }
  }
  return output;
}

// 卷积锐化 (避免变量名冲突 w -> weight)
function applySharpen(data, w, h, amount) {
  const output = new Uint8ClampedArray(data);
  const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4;
      if (data[idx+3] < 128) continue;
      let r=0, g=0, b=0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const kidx = ((y + ky) * w + (x + kx)) * 4;
          const weight = kernel[(ky + 1) * 3 + (kx + 1)]; // 修复变量名冲突
          r += data[kidx] * weight;
          g += data[kidx+1] * weight;
          b += data[kidx+2] * weight;
        }
      }
      output[idx] = clamp(data[idx] * (1 - amount) + r * amount);
      output[idx+1] = clamp(data[idx+1] * (1 - amount) + g * amount);
      output[idx+2] = clamp(data[idx+2] * (1 - amount) + b * amount);
    }
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
  let minDistance = Infinity;
  let closest = colors[0];
  const current = { r, g, b };
  for (const color of colors) {
    const target = parseHex(color.hex);
    const dist = getColorDist(current, target);
    if (dist < minDistance) { minDistance = dist; closest = color; }
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
