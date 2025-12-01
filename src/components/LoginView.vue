<template>
  <div class="login-wrapper">
    <!-- 背景层 -->
    <div class="login-background"></div>
    
    <!-- 主卡片 -->
    <a-card class="login-card">
      <!-- Logo 区域 -->
      <div class="logo-container">
        <div class="logo-icon">
          <span>🔐</span>
        </div>
      </div>

      <!-- 标题区域 -->
      <div class="title-container">
        <h1 class="title">访问验证</h1>
        <p class="subtitle">大锤拼豆版</p>
      </div>

      <!-- 输入区域 -->
      <div class="input-container">
        <div class="input-wrapper">
          <a-input-password 
            v-model:value="inputCode" 
            placeholder="请输入卡密" 
            size="large" 
            class="custom-input"
            @pressEnter="handleVerify"
          />
        </div>
        
        <a-button 
          type="primary" 
          block 
          size="large" 
          :loading="loading" 
          class="submit-btn"
          @click="handleVerify"
        >
          <span v-if="!loading">解锁进入</span>
          <span v-else>验证中...</span>
        </a-button>
      </div>

      <!-- 页脚 -->
      <div class="footer-container">
        <p class="footer-text">
          大锤(拼豆版)提供 &copy; 2025
        </p>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { message } from 'ant-design-vue';

const emit = defineEmits(['login-success']);
const inputCode = ref('');
const loading = ref(false);

const isDev = import.meta.env.DEV;

// 确保提示框层级足够高
message.config({
  top: '50px',
  duration: 3,
  maxCount: 3,
});

const handleVerify = async () => {
  if (!inputCode.value) {
    message.warning('请先输入卡密');
    return;
  }
  
  loading.value = true;

  // ============================================================
  // 1. 本地开发环境模拟 (保留逻辑以便你在本地调试，但界面不显示)
  // ============================================================
  if (isDev) {
    // 模拟网络延迟
    setTimeout(() => {
      if (inputCode.value === 'xiedachui666') {
        localStorage.setItem('pixel_craft_token', 'dev-token-123');
        message.success('验证成功 ');
        emit('login-success');
      } else {
        message.error('卡密无效');
      }
      loading.value = false;
    }, 800);
    
    return;
  }

  // ============================================================
  // 2. 线上真实环境
  // ============================================================
  try {
    const res = await fetch('/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: inputCode.value.trim() })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      message.success('验证成功，欢迎回来！');
      localStorage.setItem('pixel_craft_token', inputCode.value);
      emit('login-success');
    } else {
      message.error('卡密错误或已失效');
    }
  } catch (error) {
    console.error(error);
    message.error('连接服务器失败，请检查网络');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  overflow: hidden;
}

.login-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom right, #f8fafc, rgba(239, 246, 255, 0.3), #f1f5f9);
}

.login-card {
  position: relative;
  width: 100%;
  max-width: 448px;
  margin: 0 16px;
  padding: 48px 40px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(226, 232, 240, 0.8);
  text-align: center;
  transform: translateY(0);
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease-out;
}

.login-card:hover {
  box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.3);
  transform: scale(1.01);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-container {
  margin-bottom: 32px;
}

.logo-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 24px;
  background: linear-gradient(to bottom right, #3b82f6, #2563eb);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
  animation: bounce 3s ease-in-out infinite;
}

.logo-icon span {
  font-size: 40px;
  line-height: 1;
}

@keyframes bounce {
  0%, 100% { 
    transform: translateY(-8px); 
  }
  50% { 
    transform: translateY(0); 
  }
}

.title-container {
  margin-bottom: 40px;
}

.title {
  font-size: 30px;
  font-weight: bold;
  color: #1e293b;
  margin-bottom: 12px;
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.input-container {
  margin-bottom: 32px;
}

.input-wrapper {
  margin-bottom: 20px;
}

.custom-input {
  height: 56px;
  border-radius: 28px;
  text-align: center;
  font-size: 16px;
  font-weight: 500;
  background-color: #f8fafc;
  border: 2px solid #e2e8f0;
  transition: all 0.2s ease;
}

.custom-input:hover {
  border-color: #60a5fa;
}

.custom-input :deep(.ant-input) {
  font-weight: 500;
  letter-spacing: 0.5px;
  text-align: center;
  color: #1e293b;
}

.custom-input :deep(.ant-input):focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
}

.custom-input :deep(.anticon) {
  color: #94a3b8;
  transition: color 0.2s;
}

.custom-input:hover :deep(.anticon) {
  color: #3b82f6;
}

.submit-btn {
  height: 56px;
  border-radius: 28px;
  font-weight: bold;
  font-size: 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border: none;
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);
  transition: all 0.2s ease;
}

.submit-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 15px 30px rgba(59, 130, 246, 0.5);
  transform: scale(1.02);
}

.submit-btn:active {
  transform: scale(0.98);
}

.footer-container {
  padding-top: 24px;
  border-top: 1px solid rgba(226, 232, 240, 0.6);
}

.footer-text {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
  margin: 0;
}

/* 响应式优化 */
@media (max-width: 640px) {
  .login-card {
    padding: 32px 24px;
    margin: 16px;
  }
  
  .title {
    font-size: 28px;
  }
}
</style>
