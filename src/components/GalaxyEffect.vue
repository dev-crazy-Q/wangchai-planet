<template>
  <div class="galaxy-effect-container" @click="handleCanvasClick">
    <canvas ref="canvasRef" id="galaxy-effect-canvas"></canvas>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import {
  AdditiveBlending,
  NormalBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  PerspectiveCamera,
  Points,
  RawShaderMaterial,
  Scene,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
  AnimationMixer,
  Clock,
  PCFSoftShadowMap,
  FrontSide,
  MeshStandardMaterial,
  MeshBasicMaterial,
  TextureLoader
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
export default {
  name: 'GalaxyEffect',
  emits: ['planet-click'],
  setup(props, { emit }) {
    const canvasRef = ref(null)
    
    let scene, camera, renderer, orbit
    let galaxy, universe, galaxyMaterial, universeMaterial
    let planet, planetMixer
    let animationId
    const clock = new Clock()
    
    const count = 128 ** 2
    
    // 固定参数 - 用户确认的设置，颜色适配旺柴星球
    const FIXED_PARAMS = {
      starSize: 1.89,
      branchNum: 3,
      scale: 1.87,
      spin: -5.35,
      scatter: 0.55, // 适中的散射值，配合距离调节
      innColor: new Color("#FFD700"), // 内部：金黄色，匹配旺柴高光
      outColor: new Color("#FF8C00")  // 外部：深橙色，匹配旺柴阴影
    }
    
    // Shader utilities
    const shaderUtils = `
      float random (vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }

      vec3 scatter (vec3 seed) {
        float u = random(seed.xy);
        float v = random(seed.yz);
        float theta = u * 6.28318530718;
        float phi = acos(2.0 * v - 1.0);

        float sinTheta = sin(theta);
        float cosTheta = cos(theta);
        float sinPhi = sin(phi);
        float cosPhi = cos(phi);

        float x = sinPhi * cosTheta;
        float y = sinPhi * sinTheta;
        float z = cosPhi;

        return vec3(x, y, z);
      }
    `
    
    const createStarTexture = () => {
      const ctx = document.createElement("canvas").getContext("2d")
      ctx.canvas.width = ctx.canvas.height = 32

      ctx.fillStyle = "#000"
      ctx.fillRect(0, 0, 32, 32)

      let grd = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
      grd.addColorStop(0.0, "#fff")
      grd.addColorStop(1.0, "#000")
      ctx.fillStyle = grd
      ctx.beginPath()
      ctx.rect(15, 0, 2, 32)
      ctx.fill()
      ctx.beginPath()
      ctx.rect(0, 15, 32, 2)
      ctx.fill()

      grd = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
      grd.addColorStop(0.1, "#ffff")
      grd.addColorStop(0.6, "#0000")
      ctx.fillStyle = grd
      ctx.fillRect(0, 0, 32, 32)

      return new CanvasTexture(ctx.canvas)
    }
    
    const createGalaxy = (alphaMap) => {
      const galaxyGeometry = new BufferGeometry()
      
      const galaxyPosition = new Float32Array(count * 3)
      const galaxySeed = new Float32Array(count * 3)
      const galaxySize = new Float32Array(count)

      for (let i = 0; i < count; i++) {
        galaxyPosition[i * 3] = i / count
        galaxySeed[i * 3 + 0] = Math.random()
        galaxySeed[i * 3 + 1] = Math.random()
        galaxySeed[i * 3 + 2] = Math.random()
        galaxySize[i] = Math.random() * 2 + 0.5
      }

      galaxyGeometry.setAttribute("position", new BufferAttribute(galaxyPosition, 3))
      galaxyGeometry.setAttribute("size", new BufferAttribute(galaxySize, 1))
      galaxyGeometry.setAttribute("seed", new BufferAttribute(galaxySeed, 3))

      galaxyMaterial = new RawShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: renderer.getPixelRatio() * FIXED_PARAMS.starSize },
          uBranches: { value: FIXED_PARAMS.branchNum },
          uRadius: { value: 0 }, // 从0开始，动画中会变化到固定值
          uSpin: { value: Math.PI * 0.25 }, // 从小值开始，动画中会变化到固定值  
          uRandomness: { value: 0 }, // 从0开始，动画中会变化到固定值
          uCenterHoleSize: { value: 0.35 }, // 调整中心空洞，平衡密集度
          uAlphaMap: { value: alphaMap },
          uColorInn: { value: FIXED_PARAMS.innColor },
          uColorOut: { value: FIXED_PARAMS.outColor },
        },
        vertexShader: `
          precision highp float;

          attribute vec3 position;
          attribute float size;
          attribute vec3 seed;
          uniform mat4 projectionMatrix;
          uniform mat4 modelViewMatrix;

          uniform float uTime;
          uniform float uSize;
          uniform float uBranches;
          uniform float uRadius;
          uniform float uSpin;
          uniform float uRandomness;
          uniform float uCenterHoleSize;

          varying float vDistance;
          varying float vDiscard;

          #define PI  3.14159265359
          #define PI2 6.28318530718

          #include <random, scatter>

          void main() {
            vec3 p = position;
            float st = sqrt(p.x);
            float qt = p.x * p.x;
            float mt = mix(st, qt, p.x);

            // 创建中心空洞 - 为星球预留空间
            float minRadius = uCenterHoleSize;
            float adjustedPosition = minRadius + p.x * (1.0 - minRadius);
            
            // 检查是否在中心空洞内，标记需要丢弃的粒子
            vDiscard = 0.0;
            if (adjustedPosition < minRadius * 1.1) {
              vDiscard = 1.0;
            }

            // 轨道逻辑 - 围绕中心旋转
            float angle = adjustedPosition * uSpin * (2.0 - sqrt(1.0 - adjustedPosition));
            float branchOffset = (PI2 / uBranches) * floor(seed.x * uBranches);
            
            // 设置轨道半径，确保星星在轨道上
            float orbitRadius = adjustedPosition * uRadius;
            p.x = orbitRadius * cos(angle + branchOffset);
            p.z = orbitRadius * sin(angle + branchOffset);

            // 根据距离调整散射：中心密集，边缘分散
            float scatterFactor = mt * mt; // 距离越远散射越强
            p += scatter(seed) * random(seed.zx) * uRandomness * scatterFactor * 2.0;
            p.y *= 0.2 + qt * 0.5; // Y轴分布

            // 围绕中心的轨道运动
            vec3 temp = p;
            float orbitSpeed = (2.0 - st) * 0.3; // 内轨道转得更快
            float ac = cos(-uTime * orbitSpeed);
            float as = sin(-uTime * orbitSpeed);
            p.x = temp.x * ac - temp.z * as;
            p.z = temp.x * as + temp.z * ac;

            vDistance = mt;

            vec4 mvp = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mvp;
            gl_PointSize = (10.0 * size * uSize) / -mvp.z;
          }
        `,
        fragmentShader: `
          precision highp float;

          uniform vec3 uColorInn;
          uniform vec3 uColorOut;
          uniform sampler2D uAlphaMap;

          varying float vDistance;
          varying float vDiscard;

          #define PI  3.14159265359

          void main() {
            // 丢弃中心区域的粒子
            if (vDiscard > 0.5) {
              discard;
            }

            vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
            float a = texture2D(uAlphaMap, uv).g;
            if (a < 0.1) discard;

            vec3 color = mix(uColorInn, uColorOut, vDistance);
            float c = step(0.99, (sin(gl_PointCoord.x * PI) + sin(gl_PointCoord.y * PI)) * 0.5);
            color = max(color, vec3(c));

            gl_FragColor = vec4(color, a);
          }
        `,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: AdditiveBlending,
      })

      galaxy = new Points(galaxyGeometry, galaxyMaterial)
      galaxy.material.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader
          .replace("#include <random, scatter>", shaderUtils)
      }
      galaxy.renderOrder = 0 // 银河系在星球之后渲染
      
      return galaxy
    }
    
    const createUniverse = (alphaMap) => {
      const universeGeometry = new BufferGeometry()
      
      const universePosition = new Float32Array(count * 3 / 2)
      const universeSeed = new Float32Array(count * 3 / 2)
      const universeSize = new Float32Array(count / 2)

      for (let i = 0; i < count / 2; i++) {
        universeSeed[i * 3 + 0] = Math.random()
        universeSeed[i * 3 + 1] = Math.random()
        universeSeed[i * 3 + 2] = Math.random()
        universeSize[i] = Math.random() * 2 + 0.5
      }

      universeGeometry.setAttribute("position", new BufferAttribute(universePosition, 3))
      universeGeometry.setAttribute("seed", new BufferAttribute(universeSeed, 3))
      universeGeometry.setAttribute("size", new BufferAttribute(universeSize, 1))

      universeMaterial = new RawShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uSize: galaxyMaterial.uniforms.uSize,
          uRadius: galaxyMaterial.uniforms.uRadius,
          uCenterHoleSize: { value: 0.25 }, // 减小背景星星的中心空洞
          uAlphaMap: galaxyMaterial.uniforms.uAlphaMap,
        },
        vertexShader: `
          precision highp float;

          attribute vec3 seed;
          attribute float size;
          uniform mat4 projectionMatrix;
          uniform mat4 modelViewMatrix;

          uniform float uTime;
          uniform float uSize;
          uniform float uRadius;
          uniform float uCenterHoleSize;

          varying float vDiscard;

          #define PI  3.14159265359
          #define PI2 6.28318530718

          #include <random, scatter>

          const float r = 3.0;
          const vec3 s = vec3(2.1, 1.3, 2.1);

          void main() {
            vec3 p = scatter(seed) * r * s;

            float q = random(seed.zx);
            for (int i = 0; i < 3; i++) q *= q;
            p *= q;

            float l = length(p) / (s.x * r);
            p = l < 0.001 ? (p / l) : p;

            // 为背景星星也创建中心空洞
            vDiscard = 0.0;
            float distFromCenter = length(p.xz) / (r * max(s.x, s.z));
            if (distFromCenter < uCenterHoleSize * 0.4) {
              vDiscard = 1.0;
            }

            vec3 temp = p;
            float ql = 1.0 - l;
            for (int i = 0; i < 3; i++) ql *= ql;
            float ac = cos(-uTime * ql);
            float as = sin(-uTime * ql);
            p.x = temp.x * ac - temp.z * as;
            p.z = temp.x * as + temp.z * ac;

            vec4 mvp = modelViewMatrix * vec4(p * uRadius, 1.0);
            gl_Position = projectionMatrix * mvp;

            l = (2.0 - l) * (2.0 - l);
            gl_PointSize = (r * size * uSize * l) / -mvp.z;
          }
        `,
        fragmentShader: `
          precision highp float;

          uniform sampler2D uAlphaMap;

          varying float vDiscard;

          #define PI 3.14159265359

          void main() {
            // 丢弃中心区域的背景星星
            if (vDiscard > 0.5) {
              discard;
            }

            vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
            float a = texture2D(uAlphaMap, uv).g;
            if (a < 0.1) discard;

            // 背景星星使用白色，增加整体星空感
            gl_FragColor = vec4(vec3(0.8), a * 0.7);
          }
        `,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: AdditiveBlending,
      })

      universe = new Points(universeGeometry, universeMaterial)
      universe.material.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader
          .replace("#include <random, scatter>", shaderUtils)
      }
      universe.renderOrder = 1 // 确保背景星星在最后渲染
      
      return universe
    }
    
    const loadPlanetModel = () => {
      const loader = new GLTFLoader()
      
      return new Promise((resolve) => {
        loader.load('/texture_obj/planet.glb', (gltf) => {
          planet = gltf.scene
          
          // 设置星球初始大小为0，开场动画中会逐渐变大
          planet.scale.set(0, 0, 0)
          planet.position.set(0, 0, 0)
          
          // 彻底解决透明问题：完全替换材质而不是修改
          planet.traverse((child) => {
            if (child.isMesh) {
              // 获取原始材质信息以保留纹理和颜色
              const originalMaterial = child.material
              let newMaterial
              
              if (Array.isArray(originalMaterial)) {
                // 处理多材质数组
                newMaterial = originalMaterial.map(mat => {
                  // 完全创建新的不透明材质 - 使用最基础的材质确保不透明
                  const replacementMaterial = new MeshBasicMaterial({
                    // 保留原始颜色和纹理（BasicMaterial只支持基本属性）
                    color: mat.color || new Color(0xffffff),
                    map: mat.map || null,
                    // 强制不透明设置
                    transparent: false,
                    opacity: 1.0,
                    alphaTest: 0,
                    alphaMap: null,
                    depthWrite: true,
                    depthTest: true,
                    side: FrontSide,
                    blending: NormalBlending,
                    premultipliedAlpha: false,
                    vertexColors: false
                  })
                  return replacementMaterial
                })
              } else if (originalMaterial) {
                // 单一材质 - 完全创建新材质，使用最基础的材质确保不透明
                newMaterial = new MeshBasicMaterial({
                  // 保留原始颜色和纹理（BasicMaterial只支持基本属性）
                  color: originalMaterial.color || new Color(0xffffff),
                  map: originalMaterial.map || null,
                  // 强制不透明设置
                  transparent: false,
                  opacity: 1.0,
                  alphaTest: 0,
                  alphaMap: null,
                  depthWrite: true,
                  depthTest: true,
                  side: FrontSide,
                  blending: NormalBlending,
                  premultipliedAlpha: false,
                  vertexColors: false
                })
              } else {
                // 如果没有材质，创建默认不透明材质
                newMaterial = new MeshBasicMaterial({
                  color: new Color(0xffffff),
                  transparent: false,
                  opacity: 1.0,
                  depthWrite: true,
                  depthTest: true,
                  side: FrontSide,
                  blending: NormalBlending
                })
              }
              
              // 完全替换材质
              console.log('🔧 替换星球材质:', {
                原始材质类型: originalMaterial?.constructor?.name || 'undefined',
                原始透明: originalMaterial?.transparent,
                新材质类型: newMaterial?.constructor?.name,
                新透明: newMaterial?.transparent
              })
              child.material = newMaterial
              
              // 设置mesh属性 - 强化设置确保完全不透明
              child.castShadow = false // 暂时禁用阴影避免透明问题
              child.receiveShadow = false 
              child.frustumCulled = true
              child.matrixAutoUpdate = true
              child.renderOrder = -1 // 负数确保最先渲染
              
              // 强制更新材质
              if (child.material) {
                child.material.needsUpdate = true
              }
            }
          })
          
          // 设置整个星球对象的渲染顺序
          planet.renderOrder = -1
          planet.matrixAutoUpdate = true
          
          // 添加动画支持
          if (gltf.animations && gltf.animations.length > 0) {
            planetMixer = new AnimationMixer(planet)
            gltf.animations.forEach(clip => {
              planetMixer.clipAction(clip).play()
            })
          }
          
          scene.add(planet)
          resolve()
        })
      })
    }
    
    const runOpeningAnimation = () => {
      let start = null
      const duration = 5000
      
      const animate = (timestamp) => {
        if (!start) start = timestamp
        const progress = Math.min((timestamp - start) / duration, 1)
        
        // 缓动函数
        const eased = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2
        
        // 使用固定的最终值进行动画
        const radius = eased * FIXED_PARAMS.scale
        const spin = eased * FIXED_PARAMS.spin
        const randomness = eased * FIXED_PARAMS.scatter
        const rotate = eased * Math.PI * 4
        
        // 直接更新材质uniforms
        galaxyMaterial.uniforms.uRadius.value = radius
        galaxyMaterial.uniforms.uSpin.value = spin
        galaxyMaterial.uniforms.uRandomness.value = randomness
        
        galaxy.rotation.y = rotate
        universe.rotation.y = rotate / 3
        
        // 星球从小到大的动画效果
        if (planet) {
          const planetScale = eased * 0.6 // 最终大小0.6
          planet.scale.set(planetScale, planetScale, planetScale)
        }
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      
      requestAnimationFrame(animate)
    }
    
    const init = async () => {
      // Scene setup
      scene = new Scene()
      
      camera = new PerspectiveCamera(
        60, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        100
      )
      camera.position.set(0, 2, 3)
      
      renderer = new WebGLRenderer({ 
        canvas: canvasRef.value,
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: false
      })
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setClearColor(0x000000, 1)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = PCFSoftShadowMap
      renderer.sortObjects = true
      // 强制启用深度测试和写入
      renderer.autoClear = true
      renderer.autoClearColor = true
      renderer.autoClearDepth = true
      renderer.autoClearStencil = false
      
      orbit = new OrbitControls(camera, canvasRef.value)
      orbit.enableDamping = true
      orbit.dampingFactor = 0.05
      
      // 添加光源以照亮星球
      const ambientLight = new AmbientLight(0xffffff, 0.6)
      scene.add(ambientLight)
      
      const directionalLight = new DirectionalLight(0xffffff, 1.2)
      directionalLight.position.set(5, 5, 5)
      directionalLight.castShadow = true
      scene.add(directionalLight)
      
      // Create star texture
      const alphaMap = createStarTexture()
      
      // Create galaxy and universe
      const galaxyObject = createGalaxy(alphaMap)
      const universeObject = createUniverse(alphaMap)
      
      scene.add(galaxyObject)
      scene.add(universeObject)
      
      // 加载旺柴星球
      loadPlanetModel().then(() => {
        // 启动开场动画
        runOpeningAnimation()
      })
      
      // Animation loop
      const t = 0.001
      const animate = () => {
        const deltaTime = clock.getDelta()
        
        // 更新银河系动画
        galaxyMaterial.uniforms.uTime.value += t / 2
        universeMaterial.uniforms.uTime.value += t / 3
        
        // 更新星球动画
        if (planetMixer) {
          planetMixer.update(deltaTime)
        }
        
        // 缓慢旋转星球
        if (planet) {
          planet.rotation.y += t / 5
        }
        
        orbit.update()
        renderer.render(scene, camera)

        animationId = requestAnimationFrame(animate)
      }
      
      animate()
    }
    
    const handleResize = () => {
      if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }
    }
    
    const handleCanvasClick = (event) => {
      // 检查点击是否在星球区域（中心区域）
      const rect = canvasRef.value.getBoundingClientRect()
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      
      // 检查是否点击在中心星球区域（简单的圆形检测）
      const distance = Math.sqrt(x * x + y * y)
      if (distance < 0.3) { // 调整这个值来改变可点击区域大小
        emit('planet-click', event)
        triggerPlanetBounce()
      }
    }
    
    const triggerPlanetBounce = () => {
      // 星球跳动动画效果
      if (planet) {
        // 快速缩放动画
        const originalScale = planet.scale.x
        planet.scale.set(originalScale * 0.9, originalScale * 0.9, originalScale * 0.9)
        
        setTimeout(() => {
          if (planet) {
            planet.scale.set(originalScale, originalScale, originalScale)
          }
        }, 100)
      }
    }
    
    onMounted(() => {
      init()
      window.addEventListener('resize', handleResize)
    })
    
    onUnmounted(() => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      if (renderer) {
        renderer.dispose()
      }
      window.removeEventListener('resize', handleResize)
    })
    
    return {
      canvasRef,
      handleCanvasClick,
      triggerPlanetBounce
    }
  }
}
</script>

<style scoped>
.galaxy-effect-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: black;
}

#galaxy-effect-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
</style> 