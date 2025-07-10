<template>
  <div v-if="isLoading" class="loading-screen">
    <div class="loading-content">
      <img src="/wangchai.png" alt="旺柴" class="loading-logo" />
      <h2 class="loading-title">🚀 旺柴星球加载中...</h2>
      <div class="loading-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${loadingProgress}%` }"></div>
        </div>
        <div class="progress-text">{{ loadingProgress }}%</div>
      </div>
      <div class="loading-status">{{ loadingStatus }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoadingScreen',
  props: {
    isLoading: {
      type: Boolean,
      default: true
    },
    loadingProgress: {
      type: Number,
      default: 0
    },
    loadingStatus: {
      type: String,
      default: '正在初始化...'
    }
  }
}
</script>

<style scoped>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d1b69 50%, #1a1a1a 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  opacity: 1;
  transition: opacity 0.5s ease-out;
}

.loading-content {
  text-align: center;
  color: white;
}

.loading-logo {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  animation: logoSpin 2s ease-in-out infinite;
  margin-bottom: 20px;
}

.loading-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 30px;
  background: linear-gradient(45deg, #FFD700, #FF8C00);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.loading-progress {
  width: 300px;
  margin: 0 auto 20px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FFD700, #FF8C00);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.progress-text {
  font-size: 18px;
  font-weight: bold;
  color: #FFD700;
}

.loading-status {
  font-size: 16px;
  color: #ccc;
  margin-top: 10px;
}

@keyframes logoSpin {
  0%, 100% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.1); }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .loading-title {
    font-size: 24px;
  }
  
  .loading-progress {
    width: 250px;
  }
  
  .loading-logo {
    width: 100px;
    height: 100px;
  }
}
</style> 