// 旺柴项目配置 | WangChai Project Configuration
export const APP_CONFIG = {
  // 基础信息 | Basic Information
  name: '旺柴',
  website: '旺柴连击游戏',
  description: '旺柴连击游戏',
  contractAddress: '测试', // 合约地址，为空则不显示 | Contract address, leave empty to hide
  
  // 社交媒体配置 | Social Media Configuration
  social: {
    telegram: '测试', // 'https://t.me/your_channel'
    twitter: '测试',  // 'https://twitter.com/your_account'
    discord: '测试',  // 'https://discord.gg/your_server'
    website: '测试'   // 'https://your-website.com'
  },
  
  // 显示配置 - 灵活控制各个模块的显示
  showBottomBar: true, // 🎛️ 主开关：设为false可以完全隐藏整个底部社交栏
  showSocial: true,    // 📱 社交媒体：设为false隐藏所有社交链接
  showContract: true,  // 🔗 合约地址：设为false隐藏合约信息
  showWebsite: true,   // 🌐 网站信息：设为false隐藏网站相关信息
  
  /* 
  🎯 使用场景示例：
  
  1. 完全隐藏底部栏（纯净游戏体验）：
     showBottomBar: false
  
  2. 只显示社交媒体（适合社区推广）：
     showBottomBar: true, showSocial: true, showContract: false
  
  3. 只显示合约地址（适合DeFi项目）：
     showBottomBar: true, showSocial: false, showContract: true
  
  4. 全部显示（完整功能）：
     showBottomBar: true, showSocial: true, showContract: true
  */
  
  // 合约信息展示配置
  contractDisplay: {
    showFull: true, // true显示完整地址，false显示缩短版本
    prefix: 'CA: ', // 合约地址前缀
  }
} 