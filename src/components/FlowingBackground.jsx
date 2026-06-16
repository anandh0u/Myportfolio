import { useEffect, useRef } from 'react'

export default function FlowingBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationFrameId
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    // Handle resizing
    const handleResize = () => {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Sakura colors (various soft pinks and blushes)
    const COLORS = [
      'rgba(255, 183, 197, 0.30)', // Cherry Pink
      'rgba(255, 166, 201, 0.28)', // Bright Blossom Pink
      'rgba(255, 204, 213, 0.34)', // Soft White-Pink
      'rgba(255, 105, 180, 0.22)', // Hot Pink highlight
      'rgba(244, 154, 193, 0.30)'  // Classic Sakura
    ]

    // Petal configuration
    const maxPetals = 16
    const petals = []

    class Petal {
      constructor() {
        this.reset(true)
      }

      reset(initiallyOnScreen = false) {
        // Position
        this.x = initiallyOnScreen ? Math.random() * width : -30
        this.y = Math.random() * height
        
        // Size
        this.size = Math.random() * 5 + 4.5
        
        // Velocities
        this.baseVx = Math.random() * 0.9 + 0.65
        this.baseVy = Math.random() * 0.25 + 0.12
        this.vx = this.baseVx
        this.vy = this.baseVy
        
        // 3D Flipped states
        this.rotation = Math.random() * Math.PI * 2
        this.rotationSpeed = (Math.random() - 0.5) * 0.014
        this.tilt = Math.random()
        this.tiltAngle = Math.random() * Math.PI
        this.tiltSpeed = Math.random() * 0.008 + 0.004
        
        // Sine wave swing (oscillation in the wind)
        this.oscillationAngle = Math.random() * Math.PI
        this.oscillationSpeed = Math.random() * 0.006 + 0.003
        this.oscillationDistance = Math.random() * 0.7 + 0.2
        
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)]
      }

      update() {
        // Wind drift calculations
        this.x += this.vx + Math.sin(this.oscillationAngle) * this.oscillationDistance
        this.y += this.vy
        
        // Angles update
        this.rotation += this.rotationSpeed
        this.tiltAngle += this.tiltSpeed
        this.tilt = Math.sin(this.tiltAngle) * 0.8 // Fluctuates between -0.8 and 0.8 (3D flip effect)
        this.oscillationAngle += this.oscillationSpeed

        // Apply gentle drag back to each petal's steady drift.
        this.vx += (this.baseVx - this.vx) * 0.01
        this.vy += (this.baseVy - this.vy) * 0.01

        // Reset if offscreen (left/right bounds or bottom bounds)
        if (this.x > width + 30 || this.y > height + 30) {
          this.reset(false)
        }
      }

      draw(c) {
        c.save()
        c.translate(this.x, this.y)
        c.rotate(this.rotation)
        c.scale(1, this.tilt) // Scale Y dimension dynamically to simulate 3D rotation flip

        c.beginPath()
        c.fillStyle = this.color
        
        // Optional pink shadow blur for premium glowing look
        c.shadowBlur = 1
        c.shadowColor = 'rgba(255, 183, 197, 0.12)'

        // Procedural sakura petal drawing with split/notched tip
        c.moveTo(0, 0)
        c.bezierCurveTo(
          -this.size / 2, -this.size / 2, 
          -this.size / 2, -this.size * 1.2, 
          0, -this.size * 1.5
        )
        c.bezierCurveTo(
          this.size * 0.15, -this.size * 1.4, 
          this.size * 0.35, -this.size * 1.4, 
          this.size * 0.5, -this.size * 1.5
        )
        c.bezierCurveTo(
          this.size / 2, -this.size * 1.2, 
          this.size / 2, -this.size / 2, 
          0, 0
        )

        c.fill()
        c.restore()
      }
    }

    // Initialize petals collection
    for (let i = 0; i < maxPetals; i++) {
      petals.push(new Petal())
    }

    // Animation Loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      // Draw background ambient depth-of-field lights (glowing bokeh circles)
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      petals.forEach((p, idx) => {
        // Draw sparse, faint bokeh lights for depth
        if (idx % 9 === 0) {
          ctx.beginPath()
          const glowGrad = ctx.createRadialGradient(
            p.x, p.y - 200, 0,
            p.x, p.y - 200, p.size * 6
          )
          glowGrad.addColorStop(0, 'rgba(255, 183, 197, 0.012)')
          glowGrad.addColorStop(0.5, 'rgba(255, 166, 201, 0.004)')
          glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
          
          ctx.fillStyle = glowGrad
          ctx.arc(p.x, p.y - 200, p.size * 6, 0, Math.PI * 2)
          ctx.fill()
        }
      })
      ctx.restore()

      // Update and draw petals
      petals.forEach((petal) => {
        petal.update()
        petal.draw(ctx)
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  )
}
