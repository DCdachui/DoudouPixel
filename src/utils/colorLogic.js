/**
 * 获取文字反差色 (黑/白)
 */
export function getContrastColor(hex) {
  const r = parseInt(hex.substr(1, 2), 16)
  const g = parseInt(hex.substr(3, 2), 16)
  const b = parseInt(hex.substr(5, 2), 16)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
  return (yiq >= 128) ? '#000000' : '#FFFFFF'
}

