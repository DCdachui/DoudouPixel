// 定义像素化模式
export const PixelationMode = {
  Dominant: 'dominant', // 卡通模式（主色）
  Average: 'average',   // 真实模式（平均色）
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

// 计算颜色距离
export function colorDistance(rgb1, rgb2) {
  const dr = rgb1.r - rgb2.r;
  const dg = rgb1.g - rgb2.g;
  const db = rgb1.b - rgb2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

// 查找最接近的颜色
export function findClosestPaletteColor(targetRgb, palette) {
  if (!palette || palette.length === 0) {
    console.error("findClosestPaletteColor: Palette is empty or invalid!");
    return { key: 'ERR', hex: '#000000', rgb: { r: 0, g: 0, b: 0 } };
  }

  let minDistance = Infinity;
  let closestColor = palette[0];

  for (const paletteColor of palette) {
    const distance = colorDistance(targetRgb, paletteColor.rgb);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = paletteColor;
    }
    if (distance === 0) break; // 完全匹配，提前退出
  }
  return closestColor;
}

// 计算图像指定区域的代表色（根据所选模式）
function calculateCellRepresentativeColor(imageData, startX, startY, width, height, mode) {
  const data = imageData.data;
  const imgWidth = imageData.width;
  let rSum = 0, gSum = 0, bSum = 0;
  let pixelCount = 0;
  const colorCountsInCell = {};
  let dominantColorRgb = null;
  let maxCount = 0;

  const endX = startX + width;
  const endY = startY + height;

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const index = (y * imgWidth + x) * 4;
      // 检查 alpha 通道，忽略完全透明的像素
      if (data[index + 3] < 128) continue;

      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];

      pixelCount++;

      if (mode === PixelationMode.Average) {
        rSum += r;
        gSum += g;
        bSum += b;
      } else { // Dominant mode
        const colorKey = `${r},${g},${b}`;
        colorCountsInCell[colorKey] = (colorCountsInCell[colorKey] || 0) + 1;
        if (colorCountsInCell[colorKey] > maxCount) {
          maxCount = colorCountsInCell[colorKey];
          dominantColorRgb = { r, g, b };
        }
      }
    }
  }

  if (pixelCount === 0) {
    return null; // 区域内没有不透明像素
  }

  if (mode === PixelationMode.Average) {
    return {
      r: Math.round(rSum / pixelCount),
      g: Math.round(gSum / pixelCount),
      b: Math.round(bSum / pixelCount),
    };
  } else { // Dominant mode
    return dominantColorRgb; // 可能为 null 如果只有一个透明像素
  }
}

// 根据原始图像数据、网格尺寸、调色板和模式计算像素化网格数据
export function calculatePixelGrid(originalCtx, imgWidth, imgHeight, N, M, palette, mode, t1FallbackColor) {
  console.log(`Calculating pixel grid with mode: ${mode}`);
  const mappedData = Array(M).fill(null).map(() => Array(N).fill({ key: t1FallbackColor.key, color: t1FallbackColor.hex }));
  const cellWidthOriginal = imgWidth / N;
  const cellHeightOriginal = imgHeight / M;

  let fullImageData = null;
  try {
    fullImageData = originalCtx.getImageData(0, 0, imgWidth, imgHeight);
  } catch (e) {
    console.error("Failed to get full image data:", e);
    return mappedData;
  }

  for (let j = 0; j < M; j++) {
    for (let i = 0; i < N; i++) {
      const startXOriginal = Math.floor(i * cellWidthOriginal);
      const startYOriginal = Math.floor(j * cellHeightOriginal);
      const endXOriginal = Math.min(imgWidth, Math.ceil((i + 1) * cellWidthOriginal));
      const endYOriginal = Math.min(imgHeight, Math.ceil((j + 1) * cellHeightOriginal));
      const currentCellWidth = Math.max(1, endXOriginal - startXOriginal);
      const currentCellHeight = Math.max(1, endYOriginal - startYOriginal);

      const representativeRgb = calculateCellRepresentativeColor(
        fullImageData,
        startXOriginal,
        startYOriginal,
        currentCellWidth,
        currentCellHeight,
        mode
      );

      let finalCellColorData;
      if (representativeRgb) {
        const closestBead = findClosestPaletteColor(representativeRgb, palette);
        finalCellColorData = { key: closestBead.key, color: closestBead.hex };
      } else {
        finalCellColorData = { key: t1FallbackColor.key, color: t1FallbackColor.hex };
      }
      mappedData[j][i] = finalCellColorData;
    }
  }
  console.log(`Pixel grid calculation complete for mode: ${mode}`);
  return mappedData;
}

