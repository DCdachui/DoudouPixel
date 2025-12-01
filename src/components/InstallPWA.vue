<template>
  <a-button
    v-if="supportsPWA && !isInstalled"
    type="primary"
    shape="round"
    class="install-pwa-btn"
    @click="handleInstall"
  >
    <template #icon>
      <DownloadOutlined />
    </template>
    安装应用
  </a-button>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { DownloadOutlined } from '@ant-design/icons-vue'

export default {
  name: 'InstallPWA',
  components: {
    DownloadOutlined
  },
  setup() {
    const supportsPWA = ref(false)
    const promptInstall = ref(null)
    const isInstalled = ref(false)

    const handler = (e) => {
      e.preventDefault()
      console.log('PWA 安装提示已准备')
      supportsPWA.value = true
      promptInstall.value = e
    }

    onMounted(() => {
      window.addEventListener('beforeinstallprompt', handler)

      if (window.matchMedia('(display-mode: standalone)').matches) {
        isInstalled.value = true
      }
    })

    onUnmounted(() => {
      window.removeEventListener('beforeinstallprompt', handler)
    })

    const handleInstall = async () => {
      if (!promptInstall.value) {
        return
      }
      promptInstall.value.prompt()
      const { outcome } = await promptInstall.value.userChoice
      if (outcome === 'accepted') {
        promptInstall.value = null
        supportsPWA.value = false
      }
    }

    return {
      supportsPWA,
      isInstalled,
      handleInstall
    }
  }
}
</script>

<style scoped>
.install-pwa-btn {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 50;
  background: linear-gradient(to right, #722ed1, #1890ff);
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
}

.install-pwa-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}
</style>

