<template>
  <div id="app">
    <!-- 3D背景 -->
    <GalaxyEffect ref="galaxyEffect" @planet-click="handlePlanetClick" />
    
    <!-- 弹幕层 -->
    <DanmakuEffect />
    
    <!-- 点击游戏层 -->
    <WangChaiClickGame ref="clickGame" @trigger-planet-bounce="triggerPlanetBounce" />
    
    <!-- 动态标题层 -->
    <div class="title-overlay">
      <div class="main-title">
        <span class="title-char bounce-1">旺</span>
        <img src="/wangchai.png" alt="旺柴" class="title-logo" />
        <span class="title-char bounce-2">柴</span>
      </div>
      <div class="subtitle">WANGCHAI</div>
    </div>
    
    <!-- 社交信息栏 -->
    <div v-if="shouldShowInfoBar" class="social-info-bar">
      <div class="info-container">
        <!-- 社交媒体链接 -->
        <div v-if="appConfig.showSocial && hasSocialLinks" class="social-links">
          <a v-if="appConfig.social.telegram" :href="appConfig.social.telegram" target="_blank" class="social-link telegram">
            <span class="social-icon">📱</span>
            <span class="social-text">Telegram</span>
          </a>
          <a v-if="appConfig.social.twitter" :href="appConfig.social.twitter" target="_blank" class="social-link twitter">
            <span class="social-icon">🐦</span>
            <span class="social-text">Twitter</span>
          </a>
          <a v-if="appConfig.social.website" :href="appConfig.social.website" target="_blank" class="social-link website">
            <span class="social-icon">🌐</span>
            <span class="social-text">Website</span>
          </a>
        </div>
        
        <!-- 合约地址 -->
        <div v-if="appConfig.showContract && appConfig.contractAddress" class="contract-info" @click="copyContract">
          <span class="contract-label">{{ appConfig.contractDisplay.prefix }}</span>
          <span class="contract-address">
            {{ displayContract }}
          </span>
          <span class="copy-hint">📋</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import GalaxyEffect from './components/GalaxyEffect.vue'
import DanmakuEffect from './components/DanmakuEffect.vue'
import WangChaiClickGame from './components/WangChaiClickGame.vue'
import { APP_CONFIG } from './config.js'

export default {
  name: 'App',
  components: {
    GalaxyEffect,
    DanmakuEffect,
    WangChaiClickGame
  },
  data() {
    return {
      appConfig: APP_CONFIG
    }
  },
  computed: {
    displayContract() {
      const addr = this.appConfig.contractAddress
      if (!addr) return ''
      
      if (this.appConfig.contractDisplay.showFull) {
        return addr
      } else {
        // 显示缩短版本：前6位...后4位
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`
      }
    },
    
    hasSocialLinks() {
      // 检查是否有有效的社交链接
      const social = this.appConfig.social
      return social.telegram || social.twitter || social.website || social.discord
    },
    
    shouldShowInfoBar() {
      // 主开关控制：如果showBottomBar为false，直接隐藏整个底部栏
      if (!this.appConfig.showBottomBar) return false
      
      // 只有当有社交链接或合约地址时才显示信息栏
      const hasSocial = this.appConfig.showSocial && this.hasSocialLinks
      const hasContract = this.appConfig.showContract && this.appConfig.contractAddress
      return hasSocial || hasContract
    }
  },
  methods: {
    handlePlanetClick() {
      // 调用点击游戏组件的处理方法
      if (this.$refs.clickGame) {
        this.$refs.clickGame.handlePlanetClick()
      }
    },
    triggerPlanetBounce() {
      // 触发星球跳动效果
      if (this.$refs.galaxyEffect) {
        this.$refs.galaxyEffect.triggerPlanetBounce()
      }
    },
    
    async copyContract() {
      const addr = this.appConfig.contractAddress
      if (!addr) {
        console.log('合约地址为空')
        return
      }
      
      console.log('尝试复制合约地址:', addr)
      
      try {
        await navigator.clipboard.writeText(addr)
        console.log('复制成功 (clipboard API)')
        this.showCopySuccess()
      } catch (err) {
        console.log('Clipboard API 失败，使用兜底方案:', err)
        // 兜底方案
        this.fallbackCopyTextToClipboard(addr)
      }
    },
    
    fallbackCopyTextToClipboard(text) {
      console.log('使用兜底复制方案:', text)
      const textArea = document.createElement("textarea")
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        const successful = document.execCommand('copy')
        if (successful) {
          console.log('兜底复制成功')
          this.showCopySuccess()
        } else {
          console.error('兜底复制失败')
          this.showCopyError()
        }
      } catch (err) {
        console.error('兜底复制异常:', err)
        this.showCopyError()
      }
      document.body.removeChild(textArea)
    },
    
    showCopySuccess() {
      // 临时显示复制成功提示
      const hint = document.querySelector('.copy-hint')
      if (hint) {
        hint.textContent = '✅'
        hint.style.color = '#4CAF50'
        setTimeout(() => {
          hint.textContent = '📋'
          hint.style.color = ''
        }, 2000)
      }
      
      // 显示成功消息
      console.log('合约地址已复制到剪贴板')
    },
    
    showCopyError() {
      // 显示复制失败提示
      const hint = document.querySelector('.copy-hint')
      if (hint) {
        hint.textContent = '❌'
        hint.style.color = '#F44336'
        setTimeout(() => {
          hint.textContent = '📋'
          hint.style.color = ''
        }, 2000)
      }
      
      console.error('复制失败，请手动复制合约地址')
    }
  }
}
</script>

<style>
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  position: relative;
  overflow: hidden;
}

/* 标题覆盖层 */
.title-overlay {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  text-align: center;
  pointer-events: none;
}

/* 主标题容器 */
.main-title {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
  font-family: 'Arial', '微软雅黑', sans-serif;
}

/* 标题文字 */
.title-char {
  font-size: 4.5rem;
  font-weight: bold;
  background: linear-gradient(45deg, #FF0080, #FF8C00, #FFD700, #00FF80, #0080FF, #8000FF);
  background-size: 600% 600%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 30px rgba(255, 255, 255, 0.8);
  margin: 0 10px;
  position: relative;
  display: inline-block;
}

/* 不同的跳动动画 */
.bounce-1 {
  animation: 
    rainbowShift 2s linear infinite,
    bounce1 1.2s ease-in-out infinite,
    glow 3s ease-in-out infinite alternate;
}

.bounce-2 {
  animation: 
    rainbowShift 2s linear infinite 0.5s,
    bounce2 1.2s ease-in-out infinite 0.6s,
    glow 3s ease-in-out infinite alternate 1s;
}

/* 标题中间的旺柴头像 */
.title-logo {
  width: 120px;
  height: 120px;
  animation: logoFloat 3s ease-in-out infinite;
  margin: 0 15px;
}

/* 英文副标题 */
.subtitle {
  font-size: 1.8rem;
  font-weight: 600;
  color: #FFD700;
  text-shadow: 0 0 15px rgba(255, 215, 0, 0.7);
  letter-spacing: 8px;
  margin-bottom: 20px;
  animation: subtitlePulse 4s ease-in-out infinite;
}



/* 动画效果 */
@keyframes rainbowShift {
  0% { background-position: 0% 50%; }
  25% { background-position: 25% 50%; }
  50% { background-position: 50% 50%; }
  75% { background-position: 75% 50%; }
  100% { background-position: 100% 50%; }
}

@keyframes bounce1 {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0) scale(1) rotateZ(0deg);
  }
  10% {
    transform: translateY(-20px) scale(1.1) rotateZ(-5deg);
  }
  40% {
    transform: translateY(-15px) scale(1.05) rotateZ(3deg);
  }
  60% {
    transform: translateY(-10px) scale(1.02) rotateZ(-2deg);
  }
}

@keyframes bounce2 {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0) scale(1) rotateZ(0deg);
  }
  15% {
    transform: translateY(-25px) scale(1.15) rotateZ(8deg);
  }
  35% {
    transform: translateY(-18px) scale(1.08) rotateZ(-4deg);
  }
  65% {
    transform: translateY(-12px) scale(1.03) rotateZ(2deg);
  }
}

@keyframes glow {
  0% { 
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.5),
                 0 0 30px rgba(255, 215, 0, 0.3); 
  }
  100% { 
    text-shadow: 0 0 30px rgba(255, 215, 0, 0.8),
                 0 0 50px rgba(255, 215, 0, 0.5),
                 0 0 70px rgba(255, 215, 0, 0.3); 
  }
}

@keyframes logoFloat {
  0%, 100% { 
    transform: translateY(0px) scale(1);
  }
  50% { 
    transform: translateY(-10px) scale(1.05);
  }
}

/* 社交信息栏 */
.social-info-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.8), rgba(255, 215, 0, 0.1), rgba(0, 0, 0, 0.8));
  backdrop-filter: blur(10px);
  border-top: 2px solid rgba(255, 215, 0, 0.3);
  z-index: 1005;
  padding: 12px 0;
}

.info-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.social-links {
  display: flex;
  gap: 20px;
  align-items: center;
}

.social-link {
  display: flex;
  align-items: center;
  padding: 8px 15px;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 25px;
  color: #FFD700;
  text-decoration: none;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.social-link:hover {
  background: rgba(255, 215, 0, 0.2);
  border-color: rgba(255, 215, 0, 0.6);
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
}

.social-icon {
  margin-right: 6px;
  font-size: 16px;
}

.social-text {
  color: #fff;
}

/* 特定社交平台颜色 */
.social-link.telegram:hover {
  background: rgba(0, 136, 204, 0.2);
  border-color: rgba(0, 136, 204, 0.6);
  box-shadow: 0 4px 15px rgba(0, 136, 204, 0.3);
}

.social-link.twitter:hover {
  background: rgba(29, 161, 242, 0.2);
  border-color: rgba(29, 161, 242, 0.6);
  box-shadow: 0 4px 15px rgba(29, 161, 242, 0.3);
}

.social-link.website:hover {
  background: rgba(46, 125, 50, 0.2);
  border-color: rgba(46, 125, 50, 0.6);
  box-shadow: 0 4px 15px rgba(46, 125, 50, 0.3);
}

/* 合约信息 */
.contract-info {
  display: flex;
  align-items: center;
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 25px;
  padding: 8px 15px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.contract-info:hover {
  background: rgba(255, 215, 0, 0.2);
  border-color: rgba(255, 215, 0, 0.6);
  transform: translateY(-1px);
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
}

.contract-label {
  color: #FFD700;
  font-weight: bold;
  margin-right: 8px;
}

.contract-address {
  color: #fff;
  font-family: 'Courier New', monospace;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 8px;
}

.contract-address:hover {
  color: #FFD700;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.copy-hint {
  font-size: 16px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.copy-hint:hover {
  transform: scale(1.2);
}



@keyframes subtitlePulse {
  0%, 100% { 
    opacity: 0.8;
    transform: scale(1);
  }
  50% { 
    opacity: 1;
    transform: scale(1.02);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .title-overlay {
    top: 40px;
  }
  
  .title-char {
    font-size: 3rem;
    margin: 0 5px;
  }
  
  .title-logo {
    width: 90px;
    height: 90px;
    margin: 0 10px;
  }
  
  .subtitle {
    font-size: 1.4rem;
    letter-spacing: 4px;
  }
  
  /* 移动端社交信息栏 */
  .info-container {
    flex-direction: column;
    gap: 15px;
    padding: 0 15px;
  }
  
  .social-links {
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .social-link {
    padding: 6px 12px;
    font-size: 12px;
  }
  
  .contract-info {
    padding: 6px 12px;
    font-size: 12px;
  }
  
  .contract-address {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .title-overlay {
    top: 30px;
  }
  
  .title-char {
    font-size: 2.5rem;
  }
  
  .title-logo {
    width: 70px;
    height: 70px;
    margin: 0 8px;
  }
  
  .subtitle {
    font-size: 1.2rem;
    letter-spacing: 3px;
  }
}
</style> 