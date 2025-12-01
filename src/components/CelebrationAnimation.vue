<template>
  <div v-if="isVisible" class="celebration-container">
    <div
      v-for="particle in particles"
      :key="particle.id"
      class="particle emoji"
      :style="{
        left: `${particle.x}px`,
        top: `${particle.y}px`,
        transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
        opacity: particle.opacity
      }"
    >
      {{ particle.emoji }}
    </div>

    <div
      v-for="particle in confetti"
      :key="particle.id"
      class="particle confetti"
      :style="{
        left: `${particle.x}px`,
        top: `${particle.y}px`,
        transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
        opacity: particle.opacity,
        backgroundColor: particle.color
      }"
    />

    <div class="celebration-text">
      <div class="main-text">🎉完成🎉</div>
      <div class="sub-text">这个颜色拼完了！</div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onUnmounted } from 'vue'

export default {
  name: 'CelebrationAnimation',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['complete'],
  setup(props, { emit }) {
    const particles = ref([])
    const confetti = ref([])
    let animationId = null
    let timer = null

    const celebrationEmojis = ['🎉', '🎊', '✨', '🌟', '💫', '🎈', '🎁', '🏆']
    const confettiColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff']

    const createParticles = () => {
      const newParticles = []
      for (let i = 0; i < 20; i++) {
        const isFromLeft = Math.random() < 0.5
        newParticles.push({
          id: Date.now() + i,
          emoji: celebrationEmojis[Math.floor(Math.random() * celebrationEmojis.length)],
          x: isFromLeft ? -50 : window.innerWidth + 50,
          y: Math.random() * window.innerHeight * 0.6 + window.innerHeight * 0.2,
          vx: (isFromLeft ? 1 : -1) * (Math.random() * 3 + 2),
          vy: (Math.random() - 0.5) * 4,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          scale: Math.random() * 0.5 + 0.8,
          opacity: 1
        })
      }
      return newParticles
    }

    const createConfetti = () => {
      const newConfetti = []
      for (let i = 0; i < 40; i++) {
        const isFromLeft = Math.random() < 0.5
        newConfetti.push({
          id: Date.now() + i + 1000,
          emoji: '',
          x: isFromLeft ? -20 : window.innerWidth + 20,
          y: Math.random() * window.innerHeight * 0.4 + window.innerHeight * 0.1,
          vx: (isFromLeft ? 1 : -1) * (Math.random() * 4 + 3),
          vy: Math.random() * 2 - 1,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 15,
          scale: Math.random() * 0.3 + 0.2,
          opacity: 1,
          color: confettiColors[Math.floor(Math.random() * confettiColors.length)]
        })
      }
      return newConfetti
    }

    const animate = () => {
      particles.value = particles.value.map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        rotation: particle.rotation + particle.rotationSpeed,
        opacity: Math.max(0, particle.opacity - 0.02),
        vy: particle.vy + 0.1
      })).filter(particle => 
        particle.x > -100 && 
        particle.x < window.innerWidth + 100 && 
        particle.y < window.innerHeight + 100 &&
        particle.opacity > 0
      )

      confetti.value = confetti.value.map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        rotation: particle.rotation + particle.rotationSpeed,
        opacity: Math.max(0, particle.opacity - 0.015),
        vy: particle.vy + 0.08
      })).filter(particle => 
        particle.x > -50 && 
        particle.x < window.innerWidth + 50 && 
        particle.y < window.innerHeight + 50 &&
        particle.opacity > 0
      )

      animationId = requestAnimationFrame(animate)
    }

    watch(() => props.isVisible, (newVal) => {
      if (newVal) {
        particles.value = createParticles()
        confetti.value = createConfetti()
        animate()

        timer = setTimeout(() => {
          particles.value = []
          confetti.value = []
          if (animationId) {
            cancelAnimationFrame(animationId)
          }
          emit('complete')
        }, 1500)
      } else {
        particles.value = []
        confetti.value = []
        if (animationId) {
          cancelAnimationFrame(animationId)
        }
        if (timer) {
          clearTimeout(timer)
        }
      }
    })

    onUnmounted(() => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      if (timer) {
        clearTimeout(timer)
      }
    })

    return {
      particles,
      confetti
    }
  }
}
</script>

<style scoped>
.celebration-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 50;
}

.particle {
  position: absolute;
  user-select: none;
}

.particle.emoji {
  font-size: 24px;
}

.particle.confetti {
  width: 6px;
  height: 12px;
  border-radius: 1px;
}

.celebration-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  animation: bounce 0.6s ease-out;
}

.main-text {
  font-size: 36px;
  font-weight: bold;
  color: #fadb14;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  animation: pulse 1s ease-in-out infinite;
}

.sub-text {
  font-size: 18px;
  color: white;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
  margin-top: 8px;
}

@keyframes bounce {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
</style>

