<template>
  <div class="danmaku-container">
    <div
      v-for="danmaku in activeDanmakus"
      :key="danmaku.id"
      class="danmaku-item"
      :class="`danmaku-${danmaku.direction}`"
      :style="danmaku.style"
    >
      {{ danmaku.text }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'DanmakuEffect',
  data() {
    return {
      activeDanmakus: [],
      danmakuId: 0,
      intervalId: null,
      // 弹幕内容库
      danmakuTexts: [
        // 基础旺柴词汇
        '旺柴', 'WANGCHAI', 'BONK', 'WOOF', 
        '旺旺旺', '柴犬', '🐕', '🚀', '王柴',
        '旺', '柴', 'WANG', 'CHAI', 'WangChai',
        '旺旺', '柴柴', '旺财', '柴宝', '旺宝',
        '小旺', '小柴', '大旺', '旺哥', '柴哥',
        '旺妹', '柴妹', '旺仔', '柴仔', '旺总',
        
        // 表情和符号
        '😄', '💰', '🌙', '⭐', '🔥', '💎', '🎉', '✨',
        '🎊', '💫', '🌟', '⚡', '🎯', '🎭', '🎪', '🎨',
        '😍', '🤑', '🥳', '🎪', '🎨', '🎯', '💯', '🔮',
        
        // 趣味文案
        '柴犬冲冲冲', 'To the Moon', 'Diamond Hands', 
        'HODL', 'Ape Strong', '买买买', '冲冲冲',
        'Let\'s Go', 'Pump it', '旺柴军团', '柴犬联盟',
        '发财了', '赚大了', '冲啊', '起飞', '暴富',
        '梭哈', '全仓', '上车', '拉盘', '月球见',
        
        // 中英混合
        'WangChai Forever', '旺柴 No.1', 'Bonk Army',
        '旺柴到月球', 'Doge Power', '柴犬王国',
        'WOOF WOOF', '旺旺军团', 'Shiba Strong',
        'Meme King', '柴犬至尊', 'BONK Nation',
        'WangChai Legend', '旺柴传说', 'Doge Empire',
        'WANGCHAI POWER', '旺柴力量', 'WANG CHAI COIN',
        'WangChai King', '旺柴之王', 'CHAI EMPIRE',
        'WANG DYNASTY', '旺柴王朝', 'CHAI LEGEND',
        'WangChai God', '旺柴大神', 'SUPER WANGCHAI',
        'MEGA WANGCHAI', '超级旺柴', 'ULTRA CHAI',
        'WANGCHAI MASTER', '旺柴大师', 'CHAI BOSS',
        'WANGCHAI HERO', '旺柴英雄', 'LEGENDARY CHAI',
        
        // 网络流行语
        '666', '牛逼', 'Amazing', 'Awesome', 'Epic',
        '太强了', '无敌', '绝了', '顶', '赞',
        '卧槽', '牛批', '厉害', '6得飞起', '秀',
        
        // 加密货币术语
        'PUMP IT', 'DUMP IT', 'MOON MISSION', 'LAMBO',
        'WHALE', 'PAPER HANDS', 'DIAMOND HANDS',
        'FOMO', 'FUD', 'HODL GANG', 'DEFI',
        
        // 旺柴专属
        '旺财', '柴犬帝国', '旺星人', '柴犬星球',
        '旺柴宇宙', '柴犬银河', '旺旺宇宙', '柴犬联盟',
        '旺柴教', '柴犬神教', '旺财发财', '柴犬富豪',
        '旺柴王国', '柴犬部落', '旺旺部落', '柴柴家族',
        '旺柴一族', '柴犬军团', '旺旺军团', '柴柴军团',
        '旺柴天下', '柴犬世界', '旺旺世界', '柴柴世界',
        '旺柴无敌', '柴犬无敌', '旺旺无敌', '柴柴无敌',
        '旺柴霸主', '柴犬霸主', '旺旺霸主', '柴柴霸主',
        '旺柴传奇', '柴犬传奇', '旺旺传奇', '柴柴传奇',
        '旺柴神话', '柴犬神话', '旺旺神话', '柴柴神话',
        
        // 更多表情组合
        '🐕💰', '🚀🌙', '💎👐', '🔥🔥', '⭐✨',
        '🎉🎊', '💫🌟', '⚡🎯', '😄💰', '🐕🚀',
        '🎪🎭', '🎨🎯', '💯💎', '🔮⚡', '🥳🤑',
        '🐕‍🦺🌙', '💰🚀', '⭐🔥', '✨💫', '🎉💎',
        
        // 庆祝词汇
        'EPIC WIN', 'LEGENDARY', 'ULTIMATE', 'SUPREME',
        'GODLIKE', 'UNSTOPPABLE', 'INFINITE', 'ETERNAL',
        
        // 中文网络用语
        '芜湖', '起飞', '奥利给', '冲鸭', '嗷呜',
        '呜呜呜', '哇塞', '绝绝子', '爱了爱了', '慕了',
        '太可了', '好耶', '冲冲冲', '嘿嘿嘿', '哈哈哈',
        
        // 数字和符号组合
        '999', '888', '777', '555', '233',
        '∞', '★', '☆', '◆', '◇', '♦', '♠', '♥', '♣',
        
        // 更多柴犬相关
        'SHIBA INU', 'DOGE COIN', 'DOGGY', 'PUPPY',
        'WOOF WOOF WOOF', 'BARK BARK', 'GOOD BOY',
        'SUCH WOW', 'VERY COIN', 'MUCH MONEY',
        
        // 旺柴口号和slogan
        '旺柴冲冲冲', '旺柴起飞了', '旺柴暴富',
        '旺柴发大财', '旺柴到月球', '旺柴无敌',
        '旺柴666', '旺柴牛逼', '旺柴最强',
        '旺柴万岁', '旺柴永远', '旺柴第一',
        'WANGCHAI 2024', 'WANGCHAI MOON', 'WANGCHAI WIN',
        'WANGCHAI RICH', 'WANGCHAI BEST', 'WANGCHAI TOP',
        'GO WANGCHAI', 'BUY WANGCHAI', 'HOLD WANGCHAI',
        
        // 旺柴变体写法
        'Wang Chai', 'wang chai', 'WANG CHAI',
        'WangChai币', 'WANGCHAI币', '旺柴币',
        'WC', 'wc', 'W.C', '旺🐕', '🐕柴',
        '旺🚀', '🚀柴', '💰旺', '💰柴'
      ],
      
      // 运动方向类型
      directions: [
        'leftToRight',    // 左到右 (主要)
        'rightToLeft',    // 右到左
        'topToBottom',    // 上到下
        'bottomToTop'     // 下到上
      ]
    }
  },
  
  mounted() {
    console.log('DanmakuEffect mounted')
    this.startDanmaku()
  },
  
  beforeUnmount() {
    this.stopDanmaku()
  },
  
  methods: {
    startDanmaku() {
      console.log('Starting danmaku system')
             // 每0.8-1.5秒生成弹幕
       this.intervalId = setInterval(() => {
         // 30%概率同时生成2个弹幕，20%概率生成3个弹幕
         const randomNum = Math.random()
         if (randomNum < 0.2) {
           // 20%概率生成3个弹幕
           this.createDanmaku()
           setTimeout(() => this.createDanmaku(), 100)
           setTimeout(() => this.createDanmaku(), 200)
         } else if (randomNum < 0.5) {
           // 30%概率生成2个弹幕
           this.createDanmaku()
           setTimeout(() => this.createDanmaku(), 150)
         } else {
           // 50%概率生成1个弹幕
           this.createDanmaku()
         }
       }, this.randomBetween(800, 1500))
      
      // 立即创建第一个弹幕用于测试
      setTimeout(() => {
        this.createDanmaku()
      }, 1000)
    },
    
    stopDanmaku() {
      if (this.intervalId) {
        clearInterval(this.intervalId)
      }
    },
    
    createDanmaku() {
      const direction = this.directions[Math.floor(Math.random() * this.directions.length)]
      const text = this.getRandomText()
      const positions = this.getStartPosition(direction)
      
      const danmaku = {
        id: this.danmakuId++,
        text: text,
        direction: direction,
        style: {
          position: 'fixed',
          left: positions.x,
          top: positions.y,
                     fontSize: `${this.randomBetween(20, 32)}px`,
          fontWeight: 'bold',
                     color: this.getRandomColor(),
           textShadow: '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.6)',
          zIndex: 999,
          pointerEvents: 'none',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          transform: `rotate(${this.randomBetween(-10, 10)}deg) scale(${this.randomBetween(0.9, 1.1)})`,
          animationDuration: `${this.randomBetween(6, 10)}s`,
          animationTimingFunction: 'linear',
          animationFillMode: 'forwards'
        }
      }
      
      console.log('Creating danmaku:', danmaku.text, danmaku.direction)
      this.activeDanmakus.push(danmaku)
      
             // 8秒后移除弹幕（加快清理速度）
       setTimeout(() => {
         this.removeDanmaku(danmaku.id)
       }, 8000)
       
       // 如果弹幕数量过多，限制最大数量
       if (this.activeDanmakus.length > 15) {
         // 移除最早的弹幕
         const oldestDanmaku = this.activeDanmakus.shift()
         console.log('移除过多弹幕:', oldestDanmaku?.text)
       }
    },
    
    removeDanmaku(id) {
      const index = this.activeDanmakus.findIndex(d => d.id === id)
      if (index > -1) {
        this.activeDanmakus.splice(index, 1)
      }
    },
    
    getRandomText() {
      return this.danmakuTexts[Math.floor(Math.random() * this.danmakuTexts.length)]
    },
    
    getStartPosition(direction) {
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight
      
      switch (direction) {
        case 'leftToRight':
          return {
            x: '-200px',
            y: `${this.randomBetween(100, windowHeight - 100)}px`
          }
        case 'rightToLeft':
          return {
            x: `${windowWidth + 200}px`,
            y: `${this.randomBetween(100, windowHeight - 100)}px`
          }
        case 'topToBottom':
          return {
            x: `${this.randomBetween(100, windowWidth - 200)}px`,
            y: '-50px'
          }
        case 'bottomToTop':
          return {
            x: `${this.randomBetween(100, windowWidth - 200)}px`,
            y: `${windowHeight + 50}px`
          }
        default:
          return { x: '-200px', y: '50%' }
      }
    },
    
    getRandomColor() {
      const colors = [
        '#FFD700', // 金色
        '#FF4500', // 橙红色 (更深)
        '#DC143C', // 深红色
        '#00CED1', // 深青绿色
        '#1E90FF', // 蓝色
        '#32CD32', // 绿色
        '#FFA500', // 橙色
        '#9370DB', // 紫色
        '#00FA9A', // 中春绿色
        '#FFFF00', // 纯黄色
        '#8A2BE2', // 蓝紫色
        '#00BFFF', // 深天蓝色
        '#FF1493', // 深粉红
        '#7FFF00', // 查特酒绿
        '#FF6347', // 番茄色
        '#40E0D0'  // 绿松石色
      ]
      return colors[Math.floor(Math.random() * colors.length)]
    },
    
    randomBetween(min, max) {
      return Math.random() * (max - min) + min
    }
  }
}
</script>

<style scoped>
.danmaku-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 999;
  overflow: hidden;
}

.danmaku-item {
  font-family: 'Arial', '微软雅黑', sans-serif;
  -webkit-text-stroke: 1px rgba(0,0,0,0.8);
  text-stroke: 1px rgba(0,0,0,0.8);
  text-shadow: 2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.7);
}

/* 左到右移动 */
.danmaku-leftToRight {
  animation-name: moveLeftToRight, danmakuFadeInOut;
}

@keyframes moveLeftToRight {
  from {
    left: -200px;
  }
  to {
    left: calc(100vw + 200px);
  }
}

/* 右到左移动 */
.danmaku-rightToLeft {
  animation-name: moveRightToLeft, danmakuFadeInOut;
}

@keyframes moveRightToLeft {
  from {
    left: calc(100vw + 200px);
  }
  to {
    left: -200px;
  }
}

/* 上到下移动 */
.danmaku-topToBottom {
  animation-name: moveTopToBottom, danmakuFadeInOut;
}

@keyframes moveTopToBottom {
  from {
    top: -50px;
  }
  to {
    top: calc(100vh + 50px);
  }
}

/* 下到上移动 */
.danmaku-bottomToTop {
  animation-name: moveBottomToTop, danmakuFadeInOut;
}

@keyframes moveBottomToTop {
  from {
    top: calc(100vh + 50px);
  }
  to {
    top: -50px;
  }
}

/* 淡入淡出效果 */
@keyframes danmakuFadeInOut {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  10% {
    opacity: 1;
    transform: scale(1);
  }
  90% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.5);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .danmaku-item {
    font-size: 18px !important;
  }
}

@media (max-width: 480px) {
  .danmaku-item {
    font-size: 16px !important;
  }
}
</style> 