<template>
  <!-- 
    层级 z-[100] 确保位于主界面之上，但低于全局提示 Message (z-1010)
  -->
  <div class="fixed inset-0 flex items-center justify-center bg-[var(--c-bg)]/90 transition-colors duration-500 z-[100] backdrop-blur-md">
    <div class="w-full max-w-md p-8 rounded-3xl bg-[var(--c-surface)] shadow-2xl border border-[var(--c-border)] text-center transform transition-all hover:scale-[1.01]">
      
      <!-- Logo -->
      <div class="w-20 h-20 mx-auto bg-[var(--c-primary)] rounded-full flex items-center justify-center text-white shadow-lg mb-6 animate-bounce-slow">
        <span class="text-4xl">🔐</span>
      </div>

      <h1 class="text-2xl font-bold text-[var(--c-text-main)] mb-2">访问验证</h1>
      <p class="text-sm text-[var(--c-text-sub)] mb-8">拼豆dc</p>

      <!-- 输入框 -->
      <div class="space-y-4">
        <a-input-password 
          v-model:value="inputCode" 
          placeholder="请输入卡密" 
          size="large" 
          class="!rounded-full !h-12 !text-center !bg-[var(--c-bg)] !border-[var(--c-border)] hover:!border-[var(--c-primary)] focus:!border-[var(--c-primary)] !text-[var(--c-text-main)]"
          @pressEnter="handleVerify"
        />
        
        <a-button 
          type="primary" 
          block 
          size="large" 
          :loading="loading" 
          class="!h-12 !rounded-full !font-bold !text-lg !shadow-lg shadow-[var(--c-primary)]/30"
          @click="handleVerify"
        >
          解锁进入
        </a-button>
      </div>

      <!-- 页脚：统一显示版权，不再显示测试提示 -->
      <p class="mt-6 text-xs text-[var(--c-text-sub)] opacity-60">
        大锤(拼豆版)提供 &copy; 2025
      </p>
    </div>
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
.animate-bounce-slow {
  animation: bounce 3s infinite;
}
@keyframes bounce {
  0%, 100% { transform: translateY(-5%); }
  50% { transform: translateY(0); }
}
</style>