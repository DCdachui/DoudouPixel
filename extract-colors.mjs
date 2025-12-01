// 提取所有色号信息到 JSON 文件
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 读取颜色映射文件
const colorMappingPath = join(__dirname, 'src/data/colorSystemMapping.json')
const colorMapping = JSON.parse(readFileSync(colorMappingPath, 'utf-8'))

// 定义品牌列表
const brands = ['MARD', 'COCO', '漫漫', '盼盼', '咪小窝']

// 为每个品牌创建色号数组
const colorCodesByBrand = {}
brands.forEach(brand => {
  colorCodesByBrand[brand] = []
})

// 遍历所有颜色
Object.entries(colorMapping).forEach(([hex, codes]) => {
  brands.forEach(brand => {
    if (codes[brand]) {
      // 检查是否已存在该色号（避免重复）
      const existing = colorCodesByBrand[brand].find(item => item.code === codes[brand])
      if (!existing) {
        colorCodesByBrand[brand].push({
          code: codes[brand],
          hex: hex
        })
      }
    }
  })
})

// 按色号排序
brands.forEach(brand => {
  colorCodesByBrand[brand].sort((a, b) => {
    // 提取字母和数字部分进行排序
    const aMatch = a.code.match(/^([A-Z]+)(\d+)$/)
    const bMatch = b.code.match(/^([A-Z]+)(\d+)$/)
    
    if (aMatch && bMatch) {
      const aLetter = aMatch[1]
      const bLetter = bMatch[1]
      if (aLetter !== bLetter) {
        return aLetter.localeCompare(bLetter)
      }
      return parseInt(aMatch[2]) - parseInt(bMatch[2])
    }
    return a.code.localeCompare(b.code)
  })
})

// 生成输出 JSON
const output = {
  MARD: colorCodesByBrand.MARD,
  COCO: colorCodesByBrand.COCO,
  漫漫: colorCodesByBrand.漫漫,
  盼盼: colorCodesByBrand.盼盼,
  咪小窝: colorCodesByBrand.咪小窝,
  _stats: {
    MARD: colorCodesByBrand.MARD.length,
    COCO: colorCodesByBrand.COCO.length,
    漫漫: colorCodesByBrand.漫漫.length,
    盼盼: colorCodesByBrand.盼盼.length,
    咪小窝: colorCodesByBrand.咪小窝.length
  }
}

// 写入文件
const outputPath = join(__dirname, 'color-codes.json')
writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8')

console.log('✅ 色号信息已提取到: color-codes.json')
console.log('\n各品牌色号数量:')
brands.forEach(brand => {
  console.log(`  ${brand}: ${colorCodesByBrand[brand].length} 种`)
})

