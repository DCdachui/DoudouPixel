<template>
  <a-modal
    v-model:open="isOpen"
    title="Buy Me A Milk Tea"
    :width="400"
    :footer="null"
    @cancel="handleClose"
  >
    <div class="donation-modal">
      <div class="donation-content">
        <p class="donation-text">
          开源项目是把作者和用户紧紧联系在一起的社群，如果您希望这个项目继续发展，可以请作者喝一杯奶茶。
        </p>
        <p class="donation-text">
          您的支持是作者把项目继续下去的动力。
        </p>
        
        <div class="qr-container">
          <img
            src="/donation-qr.jpg"
            alt="赞赏码"
            class="qr-image"
            @error="handleImageError"
          />
        </div>
        
        <p class="donation-hint">
          微信扫描上方赞赏码，请作者喝一杯奶茶。
        </p>
      </div>
    </div>
  </a-modal>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'DonationModal',
  props: {
    open: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:open', 'close'],
  setup(props, { emit }) {
    const isOpen = ref(props.open)

    watch(() => props.open, (newVal) => {
      isOpen.value = newVal
    })

    const handleClose = () => {
      isOpen.value = false
      emit('update:open', false)
      emit('close')
    }

    const handleImageError = (e) => {
      // 如果图片加载失败，隐藏图片或显示占位符
      if (e.target) {
        e.target.style.display = 'none'
      }
    }

    return {
      isOpen,
      handleClose,
      handleImageError
    }
  }
}
</script>

<style scoped>
.donation-modal {
  text-align: center;
}

.donation-content {
  padding: 16px 0;
}

.donation-text {
  margin-bottom: 16px;
  font-size: 14px;
  color: #595959;
  line-height: 1.6;
}

.qr-container {
  display: flex;
  justify-content: center;
  margin: 24px 0;
  padding: 8px;
  background: linear-gradient(to right, #fff0f6, #fff1f0);
  border-radius: 8px;
}

.qr-image {
  width: 200px;
  height: 200px;
  object-fit: contain;
  padding: 8px;
}

.donation-hint {
  font-size: 12px;
  color: #8c8c8c;
  background: #fafafa;
  padding: 8px 16px;
  border-radius: 16px;
  display: inline-block;
}
</style>

