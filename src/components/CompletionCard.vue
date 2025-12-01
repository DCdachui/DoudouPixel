<template>
  <a-modal
    v-model:open="isVisible"
    title="🎉 作品完成 🎉"
    :width="400"
    :footer="null"
    @cancel="handleClose"
  >
    <div class="completion-card">
      <div class="completion-info">
        <p>总用时：{{ formatTime(totalElapsedTime) }}</p>
        <p>共完成：{{ totalBeads }} 颗豆子</p>
      </div>

      <div v-if="!userPhoto" class="photo-section">
        <template v-if="!isCapturing">
          <p class="photo-hint">拍一张照片生成专属打卡图吧！</p>
          <a-alert
            v-if="cameraError"
            type="warning"
            message="无法访问相机"
            description="可能是权限限制或设备不支持。你可以选择使用作品图生成打卡图。"
            style="margin-bottom: 16px"
          />
          <a-space direction="vertical" style="width: 100%">
            <a-button type="primary" block @click="startCamera">
              📸 开启相机拍照
            </a-button>
            <a-button type="default" block @click="skipPhoto">
              🎨 跳过拍照，使用作品图
            </a-button>
          </a-space>
        </template>
        
        <template v-else>
          <video
            ref="videoRef"
            autoplay
            playsinline
            class="video-preview"
          />
          <a-space>
            <a-button type="primary" @click="takePhoto">📸 拍照</a-button>
            <a-button @click="cancelCamera">取消</a-button>
          </a-space>
        </template>
      </div>

      <div v-else class="photo-preview-section">
        <img
          :src="userPhoto"
          alt="用户照片"
          class="photo-preview"
        />
        <a-space direction="vertical" style="width: 100%">
          <a-button type="primary" block @click="downloadCard">
            📥 下载打卡图
          </a-button>
          <a-button block @click="resetPhoto">重新拍照</a-button>
        </a-space>
      </div>

      <div class="card-footer">
        <a-button block @click="handleClose">稍后再说</a-button>
      </div>
    </div>

    <canvas ref="canvasRef" style="display: none" />
    <canvas ref="cardCanvasRef" style="display: none" />
  </a-modal>
</template>

<script>
import { ref, computed, watch } from 'vue'

export default {
  name: 'CompletionCard',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    mappedPixelData: {
      type: Array,
      required: true
    },
    gridDimensions: {
      type: Object,
      required: true
    },
    totalElapsedTime: {
      type: Number,
      default: 0
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const videoRef = ref(null)
    const canvasRef = ref(null)
    const cardCanvasRef = ref(null)
    const userPhoto = ref(null)
    const isCapturing = ref(false)
    const cameraError = ref(false)

    const totalBeads = computed(() => {
      if (!props.mappedPixelData) return 0
      let count = 0
      for (let row = 0; row < props.gridDimensions.M; row++) {
        for (let col = 0; col < props.gridDimensions.N; col++) {
          const pixel = props.mappedPixelData[row][col]
          if (pixel.color && 
              pixel.color !== 'transparent' && 
              pixel.color !== 'rgba(0,0,0,0)' &&
              !pixel.color.includes('rgba(0, 0, 0, 0)')) {
            count++
          }
        }
      }
      return count
    })

    const formatTime = (seconds) => {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      
      if (hours > 0) {
        return `${hours}小时${minutes}分钟`
      } else {
        return `${minutes}分${secs}秒`
      }
    }

    const generateThumbnail = () => {
      if (!props.mappedPixelData) return null

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      const aspectRatio = props.gridDimensions.N / props.gridDimensions.M
      const maxThumbnailSize = 200
      
      let thumbnailWidth, thumbnailHeight
      if (aspectRatio > 1) {
        thumbnailWidth = maxThumbnailSize
        thumbnailHeight = maxThumbnailSize / aspectRatio
      } else {
        thumbnailHeight = maxThumbnailSize
        thumbnailWidth = maxThumbnailSize * aspectRatio
      }

      canvas.width = thumbnailWidth
      canvas.height = thumbnailHeight

      const cellWidth = thumbnailWidth / props.gridDimensions.N
      const cellHeight = thumbnailHeight / props.gridDimensions.M

      for (let row = 0; row < props.gridDimensions.M; row++) {
        for (let col = 0; col < props.gridDimensions.N; col++) {
          const pixel = props.mappedPixelData[row][col]
          ctx.fillStyle = pixel.color
          ctx.fillRect(
            col * cellWidth,
            row * cellHeight,
            cellWidth,
            cellHeight
          )
        }
      }

      return canvas.toDataURL()
    }

    const startCamera = async () => {
      try {
        isCapturing.value = true
        cameraError.value = false
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' }
        })
        if (videoRef.value) {
          videoRef.value.srcObject = stream
        }
      } catch (error) {
        console.error('无法访问相机:', error)
        isCapturing.value = false
        cameraError.value = true
      }
    }

    const takePhoto = () => {
      if (!videoRef.value || !canvasRef.value) return

      const video = videoRef.value
      const canvas = canvasRef.value
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0)

      const photoDataURL = canvas.toDataURL('image/jpeg', 0.8)
      userPhoto.value = photoDataURL

      const stream = video.srcObject
      stream?.getTracks().forEach(track => track.stop())
      isCapturing.value = false
    }

    const cancelCamera = () => {
      const stream = videoRef.value?.srcObject
      stream?.getTracks().forEach(track => track.stop())
      isCapturing.value = false
    }

    const skipPhoto = () => {
      const thumbnailDataURL = generateThumbnail()
      if (thumbnailDataURL) {
        userPhoto.value = thumbnailDataURL
      }
    }

    const generateCompletionCard = () => {
      if (!userPhoto.value || !cardCanvasRef.value) return null

      const canvas = cardCanvasRef.value
      const ctx = canvas.getContext('2d')
      if (!ctx) return null

      const thumbnailDataURL = generateThumbnail()
      const isUsingPixelArt = userPhoto.value === thumbnailDataURL

      const cardWidth = 720
      const cardHeight = 960
      canvas.width = cardWidth
      canvas.height = cardHeight

      return new Promise((resolve) => {
        const userImg = new Image()
        userImg.onload = () => {
          if (isUsingPixelArt) {
            const gradient = ctx.createLinearGradient(0, 0, 0, cardHeight)
            gradient.addColorStop(0, '#1a1a2e')
            gradient.addColorStop(0.3, '#16213e')
            gradient.addColorStop(0.7, '#0f3460')
            gradient.addColorStop(1, '#533483')
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, cardWidth, cardHeight)

            const imgAspectRatio = userImg.naturalWidth / userImg.naturalHeight
            const maxWidth = cardWidth * 0.9
            const maxHeight = cardHeight * 0.6
            
            let imageWidth, imageHeight
            if (maxWidth / maxHeight > imgAspectRatio) {
              imageHeight = maxHeight
              imageWidth = imageHeight * imgAspectRatio
            } else {
              imageWidth = maxWidth
              imageHeight = imageWidth / imgAspectRatio
            }
            
            const imageX = (cardWidth - imageWidth) / 2
            const imageY = (cardHeight - imageHeight) / 2 - 80

            ctx.fillStyle = '#ffffff'
            ctx.shadowColor = 'rgba(0,0,0,0.3)'
            ctx.shadowBlur = 25
            ctx.shadowOffsetY = 15
            const borderWidth = 12
            ctx.fillRect(imageX - borderWidth, imageY - borderWidth, 
                        imageWidth + borderWidth * 2, imageHeight + borderWidth * 2)

            ctx.drawImage(userImg, imageX, imageY, imageWidth, imageHeight)

            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 28px system-ui, sans-serif'
            ctx.textAlign = 'center'
            ctx.shadowColor = 'rgba(0,0,0,0.3)'
            ctx.shadowBlur = 8
            ctx.fillText('🎉 作品完成 🎉', cardWidth / 2, 80)
            ctx.shadowBlur = 0

            const infoY = imageY + imageHeight + 40
            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 22px system-ui, sans-serif'
            ctx.textAlign = 'center'
            ctx.shadowColor = 'rgba(0,0,0,0.5)'
            ctx.shadowBlur = 8
            ctx.fillText(`⏱️ ${formatTime(props.totalElapsedTime)} | 🔗 完成 ${totalBeads.value} 颗豆子`, cardWidth / 2, infoY + 40)

            ctx.font = '14px system-ui, sans-serif'
            ctx.fillStyle = 'rgba(255,255,255,0.7)'
            ctx.fillText('拼豆吧 dc', cardWidth / 2, cardHeight - 50)
            ctx.font = '12px system-ui, sans-serif'
            ctx.fillStyle = 'rgba(255,255,255,0.5)'
            ctx.fillText('perlerbeads.zippland.com', cardWidth / 2, cardHeight - 25)

            resolve(canvas.toDataURL('image/jpeg', 0.95))
          } else {
            const gradient = ctx.createLinearGradient(0, 0, 0, cardHeight)
            gradient.addColorStop(0, '#ff9a9e')
            gradient.addColorStop(0.3, '#fecfef')
            gradient.addColorStop(0.7, '#fecfef')
            gradient.addColorStop(1, '#ff9a9e')
            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, cardWidth, cardHeight)

            const photoAspectRatio = userImg.naturalWidth / userImg.naturalHeight
            const maxPhotoWidth = cardWidth * 0.85
            const maxPhotoHeight = cardHeight * 0.6
            
            let photoWidth, photoHeight
            if (maxPhotoWidth / maxPhotoHeight > photoAspectRatio) {
              photoHeight = maxPhotoHeight
              photoWidth = photoHeight * photoAspectRatio
            } else {
              photoWidth = maxPhotoWidth
              photoHeight = photoWidth / photoAspectRatio
            }
            
            const photoX = (cardWidth - photoWidth) / 2
            const photoY = (cardHeight - photoHeight) / 2 - 80

            ctx.strokeStyle = 'rgba(255,255,255,0.8)'
            ctx.lineWidth = 8
            ctx.strokeRect(photoX - 15, photoY - 15, photoWidth + 30, photoHeight + 30)
            
            ctx.fillStyle = '#ffffff'
            ctx.shadowColor = 'rgba(0,0,0,0.2)'
            ctx.shadowBlur = 20
            ctx.shadowOffsetY = 10
            ctx.fillRect(photoX - 12, photoY - 12, photoWidth + 24, photoHeight + 24)

            ctx.drawImage(userImg, photoX, photoY, photoWidth, photoHeight)

            const infoCardY = photoY + photoHeight + 30
            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 22px system-ui, sans-serif'
            ctx.textAlign = 'center'
            ctx.shadowColor = 'rgba(0,0,0,0.5)'
            ctx.shadowBlur = 8
            ctx.fillText(`⏱️ 总用时 ${formatTime(props.totalElapsedTime)} | 🔗 共完成 ${totalBeads.value} 颗豆子`, cardWidth / 2, infoCardY + 35)

            if (thumbnailDataURL) {
              const thumbnailImg = new Image()
              thumbnailImg.onload = () => {
                const maxThumbSize = 60
                const thumbAspectRatio = thumbnailImg.naturalWidth / thumbnailImg.naturalHeight
                
                let thumbWidth, thumbHeight
                if (thumbAspectRatio > 1) {
                  thumbWidth = maxThumbSize
                  thumbHeight = maxThumbSize / thumbAspectRatio
                } else {
                  thumbHeight = maxThumbSize
                  thumbWidth = maxThumbSize * thumbAspectRatio
                }
                
                const thumbX = cardWidth / 2 - thumbWidth / 2
                const thumbY = infoCardY + 80
                
                ctx.fillStyle = '#ffffff'
                ctx.shadowColor = 'rgba(0,0,0,0.3)'
                ctx.shadowBlur = 8
                ctx.fillRect(thumbX - 3, thumbY - 3, thumbWidth + 6, thumbHeight + 6)
                ctx.shadowBlur = 0
                 
                ctx.drawImage(thumbnailImg, thumbX, thumbY, thumbWidth, thumbHeight)
                 
                ctx.strokeStyle = '#ffffff'
                ctx.lineWidth = 3
                ctx.strokeRect(thumbX - 3, thumbY - 3, thumbWidth + 6, thumbHeight + 6)

                ctx.font = '14px system-ui, sans-serif'
                ctx.fillStyle = 'rgba(255,255,255,0.8)'
                ctx.textAlign = 'center'
                ctx.shadowColor = 'rgba(0,0,0,0.5)'
                ctx.shadowBlur = 4
                ctx.fillText('拼豆吧 dc', cardWidth / 2, cardHeight - 40)
                ctx.font = '12px system-ui, sans-serif'
                ctx.fillStyle = 'rgba(255,255,255,0.6)'
                ctx.fillText('perlerbeads.zippland.com', cardWidth / 2, cardHeight - 20)
                ctx.shadowBlur = 0

                resolve(canvas.toDataURL('image/jpeg', 0.95))
              }
              thumbnailImg.src = thumbnailDataURL
            } else {
              ctx.font = '14px system-ui, sans-serif'
              ctx.fillStyle = 'rgba(255,255,255,0.8)'
              ctx.textAlign = 'center'
              ctx.shadowColor = 'rgba(0,0,0,0.5)'
              ctx.shadowBlur = 4
              ctx.fillText('拼豆吧 dc', cardWidth / 2, cardHeight - 40)
              ctx.font = '12px system-ui, sans-serif'
              ctx.fillStyle = 'rgba(255,255,255,0.6)'
              ctx.fillText('perlerbeads.zippland.com', cardWidth / 2, cardHeight - 20)
              ctx.shadowBlur = 0

              resolve(canvas.toDataURL('image/jpeg', 0.95))
            }
          }
        }
        userImg.src = userPhoto.value
      })
    }

    const downloadCard = async () => {
      const cardDataURL = await generateCompletionCard()
      if (cardDataURL) {
        const link = document.createElement('a')
        link.download = `拼豆完成打卡-${new Date().toLocaleDateString()}.jpg`
        link.href = cardDataURL
        link.click()
      }
    }

    const resetPhoto = () => {
      userPhoto.value = null
    }

    const handleClose = () => {
      emit('close')
    }

    return {
      videoRef,
      canvasRef,
      cardCanvasRef,
      userPhoto,
      isCapturing,
      cameraError,
      totalBeads,
      formatTime,
      startCamera,
      takePhoto,
      cancelCamera,
      skipPhoto,
      downloadCard,
      resetPhoto,
      handleClose
    }
  }
}
</script>

<style scoped>
.completion-card {
  text-align: center;
}

.completion-info {
  margin-bottom: 24px;
  color: #595959;
}

.photo-section {
  margin-bottom: 24px;
}

.photo-hint {
  margin-bottom: 16px;
  color: #595959;
}

.video-preview {
  width: 100%;
  max-width: 300px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.photo-preview-section {
  margin-bottom: 24px;
}

.photo-preview {
  width: 128px;
  height: 128px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto 16px;
  display: block;
}

.card-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #e8e8e8;
}
</style>

