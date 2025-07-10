<template>
  <div class="click-game">
    <!-- 游戏UI -->
    <div class="game-ui">
      <div class="click-counter">
        <span class="counter-text">连击: {{ clickCount }}</span>
        <div class="achievement" v-if="currentTitle">
          🏆 {{ currentTitle }}
        </div>
      </div>
      
      <!-- 连击状态和下一个彩蛋提示 -->
      <div class="combo-status" v-if="clickCount > 0">
        <div class="combo-text">🔥 连击中！ 🔥</div>
        <div class="combo-countdown">
          <div class="countdown-bar"></div>
        </div>
      </div>
      
      <div class="next-milestone" v-if="nextMilestone">
        距离下一个成就: {{ nextMilestone - clickCount }} 次连击
      </div>
      
      <!-- 成就历史按钮 -->
      <div class="history-button" @click="toggleAchievementHistory">
        <span class="history-icon">🏆</span>
        <span class="history-text">成就殿堂</span>
        <span class="history-count">({{ achievementHistory.length }})</span>
      </div>
    </div>

    <!-- 随机出现的旺柴GIF -->
    <div
      v-for="gif in activeGifs"
      :key="gif.id"
      class="floating-gif"
      :style="gif.style"
    >
      <img :src="gif.src" :alt="gif.alt" @load="onGifLoad" />
    </div>

    <!-- 彩蛋特效 -->
    <div v-if="showEasterEgg" class="easter-egg" :class="easterEggType">
      <div class="easter-egg-content">
        <h2>{{ easterEggTitle }}</h2>
        <p>{{ easterEggMessage }}</p>
        <div class="celebration">🎉🎊✨</div>
      </div>
    </div>

    <!-- 失败成就特效 -->
    <div v-if="showFailureAchievement && failureAchievementData" class="failure-achievement">
      <div class="failure-achievement-content">
        <h2>{{ failureAchievementData.icon }} {{ failureAchievementData.title }} {{ failureAchievementData.icon }}</h2>
        <p>{{ failureAchievementData.message }}</p>
        <div class="failure-celebration">💔😭💔</div>
      </div>
    </div>

    <!-- 旺柴雨特效（50次彩蛋） -->
    <div v-if="showWangChaiRain" class="wangchai-rain">
      <div
        v-for="rain in rainGifs"
        :key="rain.id"
        class="rain-gif"
        :style="rain.style"
      >
        <img :src="rain.src" alt="旺柴雨" />
      </div>
    </div>

    <!-- 名字输入框 -->
    <div v-if="showNameInput" class="name-input-modal">
      <div class="name-input-content">
        <h2>🎮 欢迎来到旺柴星球！</h2>
        <p>请输入你的名字，开始你的连击之旅：</p>
        <input 
          v-model="playerName" 
          @keyup.enter="savePlayerName"
          placeholder="输入你的名字..."
          class="name-input"
          maxlength="10"
        />
        <button @click="savePlayerName" class="save-name-btn">开始游戏</button>
      </div>
    </div>

    <!-- 成就历史面板 -->
    <div v-if="showAchievementHistory" class="achievement-history-modal">
      <div class="achievement-history-content">
        <div class="history-header">
          <h2>🏆 {{ playerName || '匿名旺柴' }} 的成就历史</h2>
          <button @click="toggleAchievementHistory" class="close-btn">✕</button>
        </div>
        
        <div class="history-stats">
          <div class="stat-item">
            <span class="stat-label">总成就:</span>
            <span class="stat-value">{{ achievementHistory.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">最高连击:</span>
            <span class="stat-value">{{ achievementHistory.length > 0 ? Math.max(...achievementHistory.map(a => a.combo)) : 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">成功:</span>
            <span class="stat-value success">{{ achievementHistory.filter(a => a.type === 'success').length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">失败:</span>
            <span class="stat-value failure">{{ achievementHistory.filter(a => a.type === 'failure').length }}</span>
          </div>
        </div>
        
        <div class="history-list">
          <div 
            v-for="(achievement, index) in achievementHistory" 
            :key="index"
            :class="['history-item', achievement.type]"
            @click="generateShareCard(achievement)"
          >
            <div class="achievement-icon">
              {{ achievement.type === 'success' ? '🏆' : '💥' }}
            </div>
            <div class="achievement-info">
              <div class="achievement-title">{{ achievement.title }}</div>
              <div class="achievement-combo">连击 {{ achievement.combo }} 次</div>
              <div class="achievement-date">{{ achievement.date }}</div>
            </div>
            <div class="share-hint">点击分享</div>
          </div>
        </div>
        
        <div class="history-actions">
          <button @click="clearHistory" class="clear-btn">清空历史</button>
        </div>
      </div>
    </div>

    <!-- 分享卡片 -->
    <div v-if="showShareCard && shareCardData" class="share-card-modal">
      <div class="share-card-content">
        <div class="share-card-header">
          <h2>📸 生成分享卡片</h2>
          <button @click="closeShareCard" class="close-btn">✕</button>
        </div>
        
        <div :class="['share-card-preview', shareCardData.type]">
          <div class="card-avatar">
            <img src="/wangchai.png" alt="旺柴头像" class="avatar-img" />
          </div>
          <div class="card-title">旺柴连击成就</div>
          <div class="card-player">{{ shareCardData.playerName }}</div>
          <div class="card-achievement">{{ shareCardData.title }}</div>
          <div class="card-combo">连击 {{ shareCardData.combo }} 次</div>
          <div class="card-stats">
            总成就: {{ shareCardData.totalAchievements }} | 最高连击: {{ shareCardData.maxCombo }}
          </div>
          <div class="card-stats">
            成功: {{ shareCardData.successCount }} | 失败: {{ shareCardData.failureCount }}
          </div>
          <div class="card-date">{{ shareCardData.date }}</div>
          <div class="card-brand" v-if="appConfig.showWebsite">{{ appConfig.website }}</div>
        </div>
        
        <div class="share-actions">
          <button @click="downloadShareCard" class="download-btn">📱 下载图片</button>
        </div>
      </div>
    </div>

    <!-- 清空确认弹窗 -->
    <div v-if="showClearConfirm" class="clear-confirm-modal">
      <div class="clear-confirm-content">
        <div class="confirm-icon">🗑️</div>
        <h2>清空成就历史</h2>
        <p>确定要清空所有成就记录吗？</p>
        <p class="warning-text">⚠️ 此操作不可撤销！</p>
        
        <div class="confirm-actions">
          <button @click="cancelClearHistory" class="cancel-btn">取消</button>
          <button @click="confirmClearHistory" class="confirm-btn">确定清空</button>
        </div>
      </div>
    </div>

    <!-- BONK 旺柴按钮 -->
    <div class="bonk-button-container">
      <button 
        class="bonk-button"
        @click="handlePlanetClick"
        @mousedown="onButtonPress"
        @mouseup="onButtonRelease"
        @mouseleave="onButtonRelease"
      >
        <span class="bonk-text">BONK 旺柴</span>
        <div class="button-glow"></div>
      </button>
    </div>
  </div>
</template>

<script>
import { APP_CONFIG } from '../config.js'

export default {
  name: 'WangChaiClickGame',
  expose: ['handlePlanetClick'],
  emits: ['trigger-planet-bounce'],
  data() {
    return {
      clickCount: 0,
      activeGifs: [],
      gifId: 0,
      
      // 连击系统
      comboResetTimer: null,
      comboResetDelay: 3000, // 3秒不点击就清零
      lastClickTime: 0,
      
      // 挑战难度系统
      challengeMode: true, // 挑战模式开关
      lastChallengeCheck: 0, // 上次检查时间
      challengeCheckInterval: 5, // 每累计多少次连击检查一次
      failMessage: '', // 失败消息
      
      // 失败成就系统
      showFailureAchievement: false,
      failureAchievementData: null,
      isGameFrozen: false, // 游戏冻结状态
      frozenEndTime: 0, // 冻结结束时间
      
      // 成就记录系统
      playerName: '', // 玩家名字
      showNameInput: false, // 显示名字输入框
      showAchievementHistory: false, // 显示成就历史
      achievementHistory: [], // 成就历史记录
      showShareCard: false, // 显示分享卡片
      shareCardData: null, // 分享卡片数据
      showClearConfirm: false, // 显示清空确认弹窗
      
      // 彩蛋系统
      showEasterEgg: false,
      easterEggType: '',
      easterEggTitle: '',
      easterEggMessage: '',
      currentTitle: '',
      
      // 旺柴雨特效
      showWangChaiRain: false,
      rainGifs: [],
      rainId: 0,
      
      // 连击里程碑设置（递增难度）
      milestones: [
        // 入门阶段 - 容易获得
        { count: 3, title: '旺柴萌新', message: '连击3次！初次体验！', type: 'small' },
        { count: 8, title: '旺柴新手', message: '连击8次！有点感觉了！', type: 'small' },
        { count: 15, title: '旺柴粉丝', message: '连击15次！旺柴雨来了！', type: 'medium' },
        
        // 进阶阶段 - 中等难度
        { count: 25, title: '旺柴爱好者', message: '连击25次！越来越顺手！', type: 'medium' },
        { count: 40, title: '旺柴达人', message: '连击40次！手速不错！', type: 'large' },
        { count: 60, title: '旺柴高手', message: '连击60次！已经很厉害了！', type: 'large' },
        
        // 专业阶段 - 较高难度
        { count: 85, title: '旺柴专家', message: '连击85次！专业级水准！', type: 'large' },
        { count: 120, title: '旺柴大师', message: '连击120次！大师级手速！', type: 'epic' },
        { count: 160, title: '旺柴宗师', message: '连击160次！宗师降临！', type: 'epic' },
        
        // 传说阶段 - 极高难度
        { count: 210, title: '旺柴传说', message: '连击210次！传说级连击！', type: 'epic' },
        { count: 270, title: '旺柴神话', message: '连击270次！神话般的手速！', type: 'legendary' },
        { count: 350, title: '旺柴至尊', message: '连击350次！至尊级成就！', type: 'legendary' },
        
        // 终极阶段 - 超高难度
        { count: 450, title: '旺柴帝王', message: '连击450次！帝王级统治力！', type: 'legendary' },
        { count: 580, title: '旺柴神皇', message: '连击580次！神皇降世！', type: 'legendary' },
        { count: 750, title: '旺柴天神', message: '连击750次！天神级实力！', type: 'legendary' },
        
        // 究极挑战 - 几乎不可能
        { count: 1000, title: '旺柴之神', message: '连击1000次！手速之神！', type: 'legendary' },
        { count: 1500, title: '旺柴主宰', message: '连击1500次！主宰级存在！超越极限！⚡', type: 'legendary' },
        
        // 终极神话 - 传说中的存在
        { count: 2000, title: '旺柴创世神', message: '连击2000次！创世神级！宇宙无敌！🌟', type: 'legendary' }
      ],
      
      // 失败成就等级设置
      failureAchievements: [
        { minCombo: 15, maxCombo: 49, title: '旺柴萌新失误', message: '连击${combo}次后失败！不要气馁，继续努力！', icon: '😅' },
        { minCombo: 50, maxCombo: 99, title: '旺柴新手翻车', message: '连击${combo}次后失败！已经很不错了！', icon: '😬' },
        { minCombo: 100, maxCombo: 199, title: '旺柴达人失足', message: '连击${combo}次后失败！实力不容小觑！', icon: '😤' },
        { minCombo: 200, maxCombo: 349, title: '旺柴高手失误', message: '连击${combo}次后失败！高手也有马失前蹄的时候！', icon: '😵' },
        { minCombo: 350, maxCombo: 499, title: '旺柴专家翻车', message: '连击${combo}次后失败！专家级的失败更显珍贵！', icon: '🤯' },
        { minCombo: 500, maxCombo: 749, title: '旺柴大师失足', message: '连击${combo}次后失败！大师之路从不平坦！', icon: '😱' },
        { minCombo: 750, maxCombo: 999, title: '旺柴传说陨落', message: '连击${combo}次后失败！传说的陨落震撼宇宙！', icon: '💀' },
        { minCombo: 1000, maxCombo: 1499, title: '旺柴之神失误', message: '连击${combo}次后失败！连神也有失手的时候！', icon: '👻' },
        { minCombo: 1500, maxCombo: 1999, title: '旺柴主宰翻车', message: '连击${combo}次后失败！主宰级的失败轰动银河系！', icon: '💥' },
        { minCombo: 2000, maxCombo: 9999, title: '旺柴创世神陨落', message: '连击${combo}次后失败！创世神的陨落引发宇宙重启！', icon: '🌟' }
      ],
      
      // 可用的旺柴GIF列表
      wangchaiGifs: [],
      
      // 应用配置
      appConfig: APP_CONFIG
    }
  },
  
  computed: {
    nextMilestone() {
      const nextMil = this.milestones.find(m => m.count > this.clickCount)
      return nextMil ? nextMil.count : null
    }
  },
  
  mounted() {
    // 初始化GIF列表
    this.initializeGifList()
    
    // 延迟显示名字输入框，等待开场动画播放完毕
    setTimeout(() => {
      this.checkAndShowNameInput()
    }, 5500) // 开场动画5秒 + 0.5秒缓冲
    
    // 从localStorage加载成就历史
    this.loadAchievementHistory()
    
    // 开始预加载GIF资源
    this.preloadGifs()
  },
  
  methods: {
    initializeGifList() {
      // 生成GIF文件名列表（基于目录扫描结果）
      const gifNumbers = [
        2, 3, 4, 5, 6, 7, 8, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
        36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53,
        54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71,
        72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89,
        90, 91, 92, 93, 94, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235,
        236, 237, 238, 239, 240, 241, 242, 243, 244, 245, 246
      ]
      
      this.wangchaiGifs = gifNumbers.map(num => 
        `/wang-chai/wangchai_${num.toString().padStart(3, '0')}.gif`
      )
    },
    
    // 预加载GIF资源
    preloadGifs() {
      console.log('🚀 开始预加载GIF资源...')
      
      // 预加载策略：分批加载，避免阻塞
      const preloadBatches = [
        // 第一批：最常用的GIF (前30个)
        this.wangchaiGifs.slice(0, 30),
        // 第二批：中等使用频率 (31-80个)
        this.wangchaiGifs.slice(30, 80),
        // 第三批：其余GIF
        this.wangchaiGifs.slice(80)
      ]
      
      // 分批预加载，每批间隔500ms
      preloadBatches.forEach((batch, index) => {
        setTimeout(() => {
          this.preloadGifBatch(batch, index + 1)
        }, index * 500)
      })
    },
    
    preloadGifBatch(gifUrls, batchNumber) {
      console.log(`📦 预加载第${batchNumber}批GIF: ${gifUrls.length}个`)
      
      let loadedCount = 0
      const totalCount = gifUrls.length
      
      gifUrls.forEach(url => {
        const img = new Image()
        img.onload = () => {
          loadedCount++
          if (loadedCount === totalCount) {
            console.log(`✅ 第${batchNumber}批GIF预加载完成 (${totalCount}个)`)
          }
        }
        img.onerror = () => {
          console.warn(`❌ GIF预加载失败: ${url}`)
          loadedCount++
        }
        img.src = url
      })
    },
    
    handlePlanetClick() {
      // 检查游戏是否被冻结
      if (this.isGameFrozen) {
        console.log('游戏暂时冻结中，请稍后...')
        return
      }
      
      const now = Date.now()
      this.lastClickTime = now
      
      // 清除之前的重置计时器
      if (this.comboResetTimer) {
        clearTimeout(this.comboResetTimer)
      }
      
      // 增加连击计数
      this.clickCount++
      this.createFloatingGif()
      this.checkMilestone()
      
      // 触发星球跳动效果
      this.triggerPlanetBounce()
      
      // 挑战模式：随机清零检查
      if (this.challengeMode && this.clickCount > 10) {
        this.checkRandomFailure()
      }
      
      // 设置新的重置计时器
      this.comboResetTimer = setTimeout(() => {
        this.resetCombo()
      }, this.comboResetDelay)
      
      // 添加点击音效（如果需要的话）
      this.playClickSound()
    },
    
    resetCombo() {
      if (this.clickCount > 0) {
        console.log(`连击结束！最终连击：${this.clickCount}次`)
        this.clickCount = 0
        this.currentTitle = ''
      }
    },
    
    createFloatingGif() {
      const randomGif = this.wangchaiGifs[Math.floor(Math.random() * this.wangchaiGifs.length)]
      
      const gif = {
        id: this.gifId++,
        src: randomGif,
        alt: '旺柴表情',
        style: {
          position: 'fixed',
          left: `${Math.random() * (window.innerWidth - 100)}px`,
          top: `${Math.random() * (window.innerHeight - 100)}px`,
          zIndex: 1001,
          pointerEvents: 'none',
          animation: 'gifFadeInOut 3s ease-in-out forwards'
        }
      }
      
      this.activeGifs.push(gif)
      
      // 3秒后移除GIF
      setTimeout(() => {
        this.removeGif(gif.id)
      }, 3000)
    },
    
    removeGif(id) {
      const index = this.activeGifs.findIndex(gif => gif.id === id)
      if (index > -1) {
        this.activeGifs.splice(index, 1)
      }
    },
    
    checkMilestone() {
      const milestone = this.milestones.find(m => m.count === this.clickCount)
      if (milestone) {
        this.triggerEasterEgg(milestone)
      }
    },
    
    triggerEasterEgg(milestone) {
      this.currentTitle = milestone.title
      this.easterEggTitle = `🎉 ${milestone.title} 🎉`
      this.easterEggMessage = milestone.message
      this.easterEggType = milestone.type
      this.showEasterEgg = true
      
      // 保存成就记录
      this.saveAchievement({
        type: 'success',
        title: milestone.title,
        message: milestone.message,
        combo: milestone.count,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('zh-CN')
      })
      
             // 特殊效果
       if (milestone.count === 15) {
         this.startWangChaiRain()
       }
      
      // 3秒后隐藏彩蛋
      setTimeout(() => {
        this.showEasterEgg = false
      }, 3000)
    },
    
    startWangChaiRain() {
      this.showWangChaiRain = true
      
      // 创建15个雨滴
      for (let i = 0; i < 15; i++) {
        setTimeout(() => {
          this.createRainGif()
        }, i * 200)
      }
      
      // 5秒后结束雨效果
      setTimeout(() => {
        this.showWangChaiRain = false
        this.rainGifs = []
      }, 5000)
    },
    
    createRainGif() {
      const randomGif = this.wangchaiGifs[Math.floor(Math.random() * this.wangchaiGifs.length)]
      
      const rain = {
        id: this.rainId++,
        src: randomGif,
        style: {
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 2}s`,
          animationDuration: `${3 + Math.random() * 2}s`
        }
      }
      
      this.rainGifs.push(rain)
    },
    
    playClickSound() {
      // 简单的音效反馈（可以后续添加真实音频）
      console.log('🎵 汪！')
    },
    
    onGifLoad() {
      // GIF加载完成的回调
    },
    
    onButtonPress() {
      // 按钮按下效果
      const button = document.querySelector('.bonk-button')
      if (button) {
        button.classList.add('pressed')
      }
    },
    
    onButtonRelease() {
      // 按钮释放效果
      const button = document.querySelector('.bonk-button')
      if (button) {
        button.classList.remove('pressed')
      }
    },
    
    triggerPlanetBounce() {
      // 发射事件通知父组件触发星球跳动
      this.$emit('trigger-planet-bounce')
    },
    
    checkRandomFailure() {
      // 只有当连击数是挑战检查间隔的倍数时才检查
      if (this.clickCount % this.challengeCheckInterval !== 0) {
        return
      }
      
      let failureProbability = 0
      
      // 前期（500次之前）：极低失败率，鼓励玩家完成前期成就
      if (this.clickCount < 500) {
        // 前期基础公式: 概率 = (连击数 - 50) / 5000，起点更高，增长极慢
        failureProbability = Math.max(0, (this.clickCount - 50) / 5000)
        
        // 前期特殊节点：轻微增加
        if (this.clickCount >= 100) failureProbability *= 1.1
        if (this.clickCount >= 200) failureProbability *= 1.15
        if (this.clickCount >= 350) failureProbability *= 1.2
        
        // 前期最高不超过3%
        failureProbability = Math.min(0.03, failureProbability)
      } 
      // 中期（500-1000次）：快速增长的挑战期
      else if (this.clickCount < 1000) {
        // 中期基础公式: 从3%快速增长到15%
        const progress = (this.clickCount - 500) / 500 // 0到1的进度
        failureProbability = 0.03 + progress * 0.12 // 从3%增长到15%
      }
      // 后期（1000次以上）：高风险高回报
      else {
        // 后期基础公式: 从15%增长到60%
        const baseProgress = Math.min(1, (this.clickCount - 1000) / 1000) // 0到1的进度
        failureProbability = 0.15 + baseProgress * 0.45 // 从15%增长到60%
        
        // 后期特殊难度节点：大幅增加难度
        if (this.clickCount >= 1200) failureProbability *= 1.3
        if (this.clickCount >= 1500) failureProbability *= 1.4
        if (this.clickCount >= 1800) failureProbability *= 1.5
        
        // 后期最高60%
        failureProbability = Math.min(0.6, failureProbability)
      }
      
      // 生成随机数并检查是否失败
      const random = Math.random()
      console.log(`连击${this.clickCount}次，失败概率: ${(failureProbability * 100).toFixed(2)}%`)
      
      if (random < failureProbability) {
        this.triggerFailure()
      }
    },
    
    triggerFailure() {
      // 记录当前连击数
      const currentCombo = this.clickCount
      
      // 查找对应的失败成就
      const failureAchievement = this.failureAchievements.find(achievement => 
        currentCombo >= achievement.minCombo && currentCombo <= achievement.maxCombo
      )
      
      if (failureAchievement) {
        // 准备失败成就数据
        this.failureAchievementData = {
          title: failureAchievement.title,
          message: failureAchievement.message.replace('${combo}', currentCombo),
          icon: failureAchievement.icon,
          combo: currentCombo
        }
        
        // 保存失败成就记录
        this.saveAchievement({
          type: 'failure',
          title: failureAchievement.title,
          message: failureAchievement.message.replace('${combo}', currentCombo),
          combo: currentCombo,
          timestamp: new Date().toISOString(),
          date: new Date().toLocaleDateString('zh-CN')
        })
        
                 // 显示失败成就
         this.displayFailureAchievement()
      }
      
      // 冻结游戏3秒
      this.freezeGame()
      
      // 重置连击
      this.clickCount = 0
      this.currentTitle = ''
    },
    
    displayFailureAchievement() {
      // 显示失败成就弹窗
      this.showFailureAchievement = true
      
      // 5秒后隐藏失败成就
      setTimeout(() => {
        this.showFailureAchievement = false
        this.failureAchievementData = null
      }, 5000)
    },
    
    freezeGame() {
      // 冻结游戏5秒
      this.isGameFrozen = true
      this.frozenEndTime = Date.now() + 5000
      
      // 5秒后解除冻结
      setTimeout(() => {
        this.isGameFrozen = false
        this.frozenEndTime = 0
      }, 5000)
    },
    
    // 成就记录系统方法
    loadPlayerData() {
      // 从本地存储加载玩家数据
      const savedName = localStorage.getItem('wangchai_player_name')
      const savedHistory = localStorage.getItem('wangchai_achievement_history')
      
      if (savedName) {
        this.playerName = savedName
      } else {
        // 首次进入，等待开局动画结束后显示名字输入框
        setTimeout(() => {
          this.showNameInput = true
        }, 5500) // 开局动画5秒 + 0.5秒缓冲
      }
      
      if (savedHistory) {
        this.achievementHistory = JSON.parse(savedHistory)
      }
    },
    
    savePlayerName() {
      if (this.playerName.trim()) {
        localStorage.setItem('wangchai_player_name', this.playerName.trim())
        this.showNameInput = false
      }
    },
    
    saveAchievement(achievement) {
      // 添加玩家名字
      achievement.playerName = this.playerName || '匿名旺柴'
      
      // 添加到历史记录
      this.achievementHistory.unshift(achievement)
      
      // 保持最多50条记录
      if (this.achievementHistory.length > 50) {
        this.achievementHistory = this.achievementHistory.slice(0, 50)
      }
      
      // 保存到本地存储
      localStorage.setItem('wangchai_achievement_history', JSON.stringify(this.achievementHistory))
    },
    
    toggleAchievementHistory() {
      this.showAchievementHistory = !this.showAchievementHistory
    },
    
    generateShareCard(achievement) {
      // 准备分享卡片数据
      this.shareCardData = {
        ...achievement,
        playerName: this.playerName || '匿名旺柴',
        totalAchievements: this.achievementHistory.length,
        maxCombo: this.achievementHistory.length > 0 ? Math.max(...this.achievementHistory.map(a => a.combo)) : 0,
        successCount: this.achievementHistory.filter(a => a.type === 'success').length,
        failureCount: this.achievementHistory.filter(a => a.type === 'failure').length
      }
      
      this.showShareCard = true
    },
    
    downloadShareCard() {
      // 创建画布来生成分享卡片
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // 设置画布尺寸
      canvas.width = 800
      canvas.height = 600
      
      // 背景
      const gradient = ctx.createLinearGradient(0, 0, 800, 600)
      if (this.shareCardData.type === 'success') {
        gradient.addColorStop(0, '#FFD700')
        gradient.addColorStop(1, '#FF8C00')
      } else {
        gradient.addColorStop(0, '#DC143C')
        gradient.addColorStop(1, '#8B0000')
      }
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 800, 600)
      
      // 加载并绘制旺柴头像
      const avatarImg = new Image()
      avatarImg.onload = () => {
        // 绘制头像背景圆形
        ctx.save()
        ctx.beginPath()
        ctx.arc(400, 130, 40, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
        ctx.fill()
        ctx.clip()
        
        // 绘制头像
        ctx.drawImage(avatarImg, 360, 90, 80, 80)
        ctx.restore()
        
        // 绘制头像边框
        ctx.beginPath()
        ctx.arc(400, 130, 40, 0, Math.PI * 2)
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 3
        ctx.stroke()
        
        // 标题
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 36px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('旺柴连击成就', 400, 200)
        
        // 玩家名字
        ctx.font = 'bold 28px Arial'
        ctx.fillText(this.shareCardData.playerName, 400, 240)
        
        // 成就标题
        ctx.font = 'bold 32px Arial'
        ctx.fillText(this.shareCardData.title, 400, 290)
        
        // 连击数
        ctx.font = 'bold 56px Arial'
        ctx.fillText(`连击 ${this.shareCardData.combo} 次`, 400, 360)
        
        // 统计信息
        ctx.font = '20px Arial'
        ctx.fillText(`总成就: ${this.shareCardData.totalAchievements} | 最高连击: ${this.shareCardData.maxCombo}`, 400, 420)
        ctx.fillText(`成功: ${this.shareCardData.successCount} | 失败: ${this.shareCardData.failureCount}`, 400, 450)
        
        // 日期
        ctx.font = '18px Arial'
        ctx.fillText(this.shareCardData.date, 400, 490)
        
        // 网站标识（使用配置）
        if (this.appConfig.showWebsite) {
          ctx.font = 'bold 24px Arial'
          ctx.fillText(this.appConfig.website, 400, 550)
        }
        
        // 下载图片
        const link = document.createElement('a')
        link.download = `旺柴成就_${this.shareCardData.playerName}_${this.shareCardData.combo}次连击.png`
        link.href = canvas.toDataURL()
        link.click()
      }
      
      // 设置头像图片源
      avatarImg.src = '/wangchai.png'
    },
    
    closeShareCard() {
      this.showShareCard = false
      this.shareCardData = null
    },
    
    clearHistory() {
      this.showClearConfirm = true
    },
    
    confirmClearHistory() {
      this.achievementHistory = []
      localStorage.removeItem('wangchai_achievement_history')
      this.showClearConfirm = false
    },
    
    cancelClearHistory() {
      this.showClearConfirm = false
    },
    
    // 连击模式不需要保存进度
  }
}
</script>

<style scoped>
.click-game {
  position: relative;
  width: 100%;
  height: 100%;
}

/* 游戏UI */
.game-ui {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1002;
  text-align: right;
}

.click-counter {
  background: rgba(0, 0, 0, 0.7);
  padding: 15px 20px;
  border-radius: 10px;
  margin-bottom: 10px;
}

.counter-text {
  color: #FFD700;
  font-size: 28px;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
}

/* 连击状态样式 */
.combo-status {
  background: rgba(255, 69, 0, 0.8);
  padding: 12px 18px;
  border-radius: 8px;
  margin-bottom: 8px;
  border: 2px solid #FF4500;
  box-shadow: 0 0 20px rgba(255, 69, 0, 0.7), inset 0 0 10px rgba(255, 140, 0, 0.3);
  animation: fireGlow 2s ease-in-out infinite alternate;
}

.combo-text {
  color: #fff;
  font-size: 24px;
  font-weight: bold;
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
  animation: comboGlow 1s ease-in-out infinite alternate;
  position: relative;
}

.combo-countdown {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  margin-top: 4px;
  overflow: hidden;
}

.countdown-bar {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #FFD700, #FF4500);
  border-radius: 2px;
  animation: countdownShrink 3s linear infinite;
}

.achievement {
  color: #FF6B6B;
  font-size: 16px;
  font-weight: bold;
  margin-top: 5px;
  animation: glow 2s ease-in-out infinite alternate;
}

.next-milestone {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
}

.history-button {
  background: linear-gradient(45deg, #FFD700, #FF8C00);
  color: #fff;
  padding: 12px 18px;
  border-radius: 15px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid rgba(255, 255, 255, 0.3);
  margin-top: 10px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
  position: relative;
  overflow: hidden;
}

.history-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.history-button:hover::before {
  left: 100%;
}

.history-button:hover {
  background: linear-gradient(45deg, #FFA500, #FF6347);
  transform: scale(1.08);
  box-shadow: 0 6px 25px rgba(255, 215, 0, 0.6);
  border-color: rgba(255, 255, 255, 0.5);
}

.history-icon {
  font-size: 16px;
  margin-right: 6px;
  animation: trophyShine 2s ease-in-out infinite;
}

.history-text {
  font-weight: bold;
  margin-right: 4px;
}

.history-count {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: normal;
}

@keyframes trophyShine {
  0%, 100% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.1);
    filter: brightness(1.3);
  }
}

/* 浮动GIF */
.floating-gif {
  user-select: none;
  pointer-events: none;
}

.floating-gif img {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
}

/* GIF动画 */
@keyframes gifFadeInOut {
  0% {
    opacity: 0;
    transform: scale(0.5) rotate(-10deg);
  }
  20% {
    opacity: 1;
    transform: scale(1.1) rotate(5deg);
  }
  80% {
    opacity: 1;
    transform: scale(1) rotate(-2deg);
  }
  100% {
    opacity: 0;
    transform: scale(0.8) rotate(10deg);
  }
}

/* 彩蛋特效 - 显示在星球上方 */
.easter-egg {
  position: fixed;
  top: 25%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1003;
  text-align: center;
  animation: easterEggAppear 3s ease-in-out;
  pointer-events: none;
}

.easter-egg-content {
  background: linear-gradient(45deg, #FFD700, #FF8C00);
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
  border: 3px solid #fff;
}

.easter-egg h2 {
  color: #fff;
  font-size: 28px;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.easter-egg p {
  color: #fff;
  font-size: 18px;
  margin-bottom: 15px;
}

.celebration {
  font-size: 24px;
  animation: bounce 0.5s ease-in-out infinite alternate;
}

/* 不同级别的彩蛋样式 */
.easter-egg.epic .easter-egg-content {
  background: linear-gradient(45deg, #9c27b0, #673ab7);
  animation: epicGlow 3s ease-in-out;
}

.easter-egg.legendary .easter-egg-content {
  background: linear-gradient(45deg, #ff9800, #e91e63, #9c27b0, #3f51b5);
  background-size: 300% 300%;
  animation: legendaryRainbow 3s ease-in-out;
}

/* 旺柴雨 */
.wangchai-rain {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1001;
  overflow: hidden;
}

.rain-gif {
  position: absolute;
  top: -100px;
  animation: rainFall linear forwards;
}

.rain-gif img {
  width: 55px;
  height: 55px;
  border-radius: 50%;
}

/* 动画效果 */
@keyframes easterEggAppear {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes bounce {
  from { transform: translateY(0px); }
  to { transform: translateY(-10px); }
}

@keyframes glow {
  from { text-shadow: 0 0 10px rgba(255, 107, 107, 0.8); }
  to { text-shadow: 0 0 20px rgba(255, 107, 107, 1); }
}

@keyframes epicGlow {
  0%, 100% { box-shadow: 0 0 30px rgba(156, 39, 176, 0.8); }
  50% { box-shadow: 0 0 50px rgba(156, 39, 176, 1); }
}

@keyframes legendaryRainbow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes rainFall {
  to {
    top: 100vh;
    transform: rotate(360deg);
  }
}

@keyframes comboGlow {
  from { 
    text-shadow: 0 0 8px rgba(255, 255, 255, 0.8), 0 0 15px rgba(255, 69, 0, 0.6);
    transform: scale(1);
  }
  to { 
    text-shadow: 0 0 15px rgba(255, 255, 255, 1), 0 0 25px rgba(255, 69, 0, 1);
    transform: scale(1.05);
  }
}

@keyframes countdownShrink {
  from { 
    width: 100%;
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  to { 
    width: 0%;
    opacity: 0.5;
  }
}

@keyframes fireGlow {
  from { 
    box-shadow: 0 0 20px rgba(255, 69, 0, 0.7), inset 0 0 10px rgba(255, 140, 0, 0.3);
  }
  to { 
    box-shadow: 0 0 30px rgba(255, 69, 0, 1), inset 0 0 15px rgba(255, 140, 0, 0.5);
  }
}

/* 失败成就特效 - 与成功成就相同位置 */
.failure-achievement {
  position: fixed;
  top: 25%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1003;
  text-align: center;
  animation: failureAchievementAppear 5s ease-in-out;
  pointer-events: none;
}

.failure-achievement-content {
  background: linear-gradient(45deg, #DC143C, #8B0000);
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 0 30px rgba(220, 20, 60, 0.8);
  border: 3px solid #FF1744;
  animation: failureGlow 2s ease-in-out infinite alternate;
}

.failure-achievement h2 {
  color: #fff;
  font-size: 28px;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  animation: failureShake 0.5s ease-in-out infinite;
}

.failure-achievement p {
  color: #fff;
  font-size: 18px;
  margin-bottom: 15px;
}

.failure-celebration {
  font-size: 24px;
  animation: failureBounce 0.8s ease-in-out infinite alternate;
}

@keyframes failureAchievementAppear {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.5) rotate(-10deg);
  }
  20% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1) rotate(5deg);
  }
  80% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1) rotate(-2deg);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1) rotate(0deg);
  }
}

@keyframes failureGlow {
  0%, 100% { 
    box-shadow: 0 0 30px rgba(220, 20, 60, 0.8);
  }
  50% { 
    box-shadow: 0 0 50px rgba(220, 20, 60, 1);
  }
}

@keyframes failureShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

@keyframes failureBounce {
  from { 
    transform: translateY(0px) scale(1);
  }
  to { 
    transform: translateY(-8px) scale(1.1);
  }
}

/* BONK 旺柴按钮样式 */
.bonk-button-container {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1002;
}

.bonk-button {
  position: relative;
  background: linear-gradient(45deg, #FF6B35, #F7931E, #FFD23F);
  border: 3px solid #FF4500;
  border-radius: 25px;
  padding: 18px 40px;
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
  box-shadow: 
    0 8px 20px rgba(255, 107, 53, 0.6),
    inset 0 2px 10px rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
  transform: scale(1);
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
  outline: none;
}

.bonk-button:hover {
  transform: scale(1.05);
  box-shadow: 
    0 10px 25px rgba(255, 107, 53, 0.8),
    inset 0 2px 15px rgba(255, 255, 255, 0.4);
  background: linear-gradient(45deg, #FF7F50, #FF8C00, #FFE135);
}

.bonk-button:active,
.bonk-button.pressed {
  transform: scale(0.95);
  box-shadow: 
    0 4px 15px rgba(255, 107, 53, 0.8),
    inset 0 4px 20px rgba(0, 0, 0, 0.3);
  background: linear-gradient(45deg, #FF4500, #E85D00, #F4C430);
}

.bonk-text {
  position: relative;
  z-index: 2;
  animation: textPulse 2s ease-in-out infinite;
}

.button-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  opacity: 0;
  animation: buttonGlow 3s ease-in-out infinite;
  pointer-events: none;
}

@keyframes textPulse {
  0%, 100% { 
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
  }
  50% { 
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7), 0 0 15px rgba(255, 255, 255, 0.8);
  }
}

@keyframes buttonGlow {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

/* 模态框基础样式 */
.name-input-modal,
.achievement-history-modal,
.share-card-modal,
.clear-confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1010;
}

/* 名字输入框 */
.name-input-content {
  background: linear-gradient(45deg, #FF6B35, #F7931E);
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  min-width: 450px;
  max-width: 500px;
  border: 5px solid #FF4500;
  box-shadow: 0 0 50px rgba(255, 107, 53, 0.8), 0 0 20px rgba(255, 107, 53, 0.6) inset;
}

.name-input-content h2 {
  color: #fff;
  margin-bottom: 20px;
  font-size: 28px;
}

.name-input-content p {
  color: #fff;
  margin-bottom: 20px;
  font-size: 16px;
}

.name-input {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  margin-bottom: 20px;
  text-align: center;
}

.save-name-btn {
  background: #fff;
  color: #FF6B35;
  border: none;
  padding: 12px 30px;
  border-radius: 8px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-name-btn:hover {
  background: #f0f0f0;
  transform: scale(1.05);
}

/* 成就历史面板 */
.achievement-history-content {
  background: rgba(0, 0, 0, 0.95);
  border-radius: 20px;
  min-width: 600px;
  max-width: 90%;
  max-height: 80%;
  overflow: hidden;
  border: 5px solid #FFD700;
  box-shadow: 0 0 50px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.6) inset;
}

.history-header {
  background: linear-gradient(45deg, #FFD700, #FF8C00);
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-header h2 {
  color: #fff;
  margin: 0;
  font-size: 24px;
}

.close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.history-stats {
  padding: 25px 30px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  background: rgba(255, 255, 255, 0.05);
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  color: #ccc;
  font-size: 14px;
  margin-bottom: 5px;
}

.stat-value {
  display: block;
  color: #fff;
  font-size: 20px;
  font-weight: bold;
}

.stat-value.success {
  color: #4CAF50;
}

.stat-value.failure {
  color: #F44336;
}

.history-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 0 20px;
}

.history-item {
  display: flex;
  align-items: center;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.history-item.success {
  background: rgba(76, 175, 80, 0.1);
  border: 2px solid rgba(76, 175, 80, 0.5);
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.2);
}

.history-item.failure {
  background: rgba(244, 67, 54, 0.1);
  border: 2px solid rgba(244, 67, 54, 0.5);
  box-shadow: 0 0 10px rgba(244, 67, 54, 0.2);
}

.history-item:hover {
  transform: scale(1.02);
  background: rgba(255, 255, 255, 0.1);
}

.history-item.success:hover {
  border-color: rgba(76, 175, 80, 0.8);
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.4);
}

.history-item.failure:hover {
  border-color: rgba(244, 67, 54, 0.8);
  box-shadow: 0 0 20px rgba(244, 67, 54, 0.4);
}

.achievement-icon {
  font-size: 30px;
  margin-right: 15px;
}

.achievement-info {
  flex: 1;
}

.achievement-title {
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 5px;
}

.achievement-combo {
  color: #FFD700;
  font-size: 14px;
  margin-bottom: 3px;
}

.achievement-date {
  color: #ccc;
  font-size: 12px;
}

.share-hint {
  color: #007bff;
  font-size: 12px;
  opacity: 0.7;
}

.history-actions {
  padding: 20px;
  text-align: center;
}

.clear-btn {
  background: #F44336;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.clear-btn:hover {
  background: #d32f2f;
  transform: scale(1.05);
}

/* 分享卡片 */
.share-card-content {
  background: rgba(0, 0, 0, 0.95);
  border-radius: 20px;
  min-width: 500px;
  max-width: 700px;
  border: 5px solid #FFD700;
  box-shadow: 0 0 50px rgba(255, 215, 0, 0.8), 0 0 20px rgba(255, 215, 0, 0.6) inset;
  overflow: hidden;
}

.share-card-header {
  background: linear-gradient(45deg, #FFD700, #FF8C00);
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.share-card-header h2 {
  color: #fff;
  margin: 0;
  font-size: 24px;
}

.share-card-preview {
  margin: 20px;
  padding: 40px 30px;
  border-radius: 15px;
  text-align: center;
  color: #fff;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.share-card-preview.success {
  background: linear-gradient(45deg, #FFD700, #FF8C00);
}

.share-card-preview.failure {
  background: linear-gradient(45deg, #DC143C, #8B0000);
}

.card-avatar {
  display: flex;
  justify-content: center;
  margin-bottom: 15px;
}

.avatar-img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 3px solid #fff;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px;
}

.card-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
}

.card-player {
  font-size: 20px;
  margin-bottom: 15px;
}

.card-achievement {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 10px;
}

.card-combo {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 15px;
}

.card-stats {
  font-size: 14px;
  margin-bottom: 5px;
}

.card-date {
  font-size: 12px;
  margin-bottom: 15px;
  opacity: 0.8;
}

.card-brand {
  font-size: 16px;
  font-weight: bold;
}

.share-actions {
  padding: 20px;
  text-align: center;
}

.download-btn {
  background: #4CAF50;
  color: #fff;
  border: none;
  padding: 15px 30px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.download-btn:hover {
  background: #45a049;
  transform: scale(1.05);
}

/* 清空确认弹窗 */
.clear-confirm-content {
  background: rgba(0, 0, 0, 0.95);
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  min-width: 450px;
  max-width: 500px;
  border: 5px solid #F44336;
  box-shadow: 0 0 50px rgba(244, 67, 54, 0.8), 0 0 20px rgba(244, 67, 54, 0.6) inset;
}

.confirm-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.clear-confirm-content h2 {
  color: #F44336;
  margin-bottom: 20px;
  font-size: 24px;
}

.clear-confirm-content p {
  color: #fff;
  margin-bottom: 15px;
  font-size: 16px;
}

.warning-text {
  color: #FF6B35 !important;
  font-weight: bold;
  margin-bottom: 30px !important;
}

.confirm-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.cancel-btn {
  background: #6c757d;
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
}

.cancel-btn:hover {
  background: #5a6268;
  transform: scale(1.05);
}

.confirm-btn {
  background: #F44336;
  color: #fff;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
}

.confirm-btn:hover {
  background: #d32f2f;
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(244, 67, 54, 0.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .game-ui {
    top: 10px;
    right: 10px;
  }
  
  .counter-text {
    font-size: 24px;
  }
  
  .combo-text {
    font-size: 20px;
  }
  
  .floating-gif img {
    width: 65px;
    height: 65px;
  }
  
  .easter-egg h2 {
    font-size: 24px;
  }
  
  .easter-egg p {
    font-size: 16px;
  }
  
  .bonk-button-container {
    bottom: 60px;
  }
  
  .bonk-button {
    padding: 15px 30px;
    font-size: 20px;
  }
  
  /* 移动端成就系统样式 */
  .name-input-content {
    margin: 20px;
    padding: 30px 20px;
    min-width: 300px;
    max-width: 95%;
  }
  
  .achievement-history-content {
    min-width: 300px;
    max-width: 95%;
    max-height: 90%;
    margin: 20px;
  }
  
  .history-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .share-card-content {
    min-width: 300px;
    max-width: 95%;
    margin: 20px;
  }
  
  .share-card-preview {
    padding: 30px 20px;
    margin: 10px;
    min-height: 350px;
  }
  
  .card-title {
    font-size: 20px;
  }
  
  .card-combo {
    font-size: 24px;
  }
  
  .clear-confirm-content {
    min-width: 300px;
    max-width: 95%;
    margin: 20px;
    padding: 30px 20px;
  }
  
  /* 移动端清空确认弹窗 */
  .clear-confirm-content {
    margin: 20px;
    padding: 30px 20px;
  }
  
  .confirm-actions {
    flex-direction: column;
    gap: 15px;
  }
  
  .cancel-btn, .confirm-btn {
    width: 100%;
  }
}
</style> 