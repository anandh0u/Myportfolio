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
      'rgba(255, 183, 197, 0.85)', // Cherry Pink
      'rgba(255, 166, 201, 0.80)', // Bright Blossom Pink
      'rgba(255, 204, 213, 0.90)', // Soft White-Pink
      'rgba(255, 105, 180, 0.75)', // Hot Pink highlight
      'rgba(244, 154, 193, 0.85)'  // Classic Sakura
    ]

    // Petal configuration
    const maxPetals = 70
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
        this.size = Math.random() * 8 + 6
        
        // Velocities
        this.vx = Math.random() * 2 + 2.5 // Base movement from left to right
        this.vy = Math.random() * 0.8 + 0.4 // Soft downward fall
        
        // 3D Flipped states
        this.rotation = Math.random() * Math.PI * 2
        this.rotationSpeed = (Math.random() - 0.5) * 0.03
        this.tilt = Math.random()
        this.tiltAngle = Math.random() * Math.PI
        this.tiltSpeed = Math.random() * 0.02 + 0.01
        
        // Sine wave swing (oscillation in the wind)
        this.oscillationAngle = Math.random() * Math.PI
        this.oscillationSpeed = Math.random() * 0.015 + 0.005
        this.oscillationDistance = Math.random() * 1.5 + 0.5
        
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)]
      }

      update(mouse, mouseVelocity) {
        // Wind drift calculations
        this.x += this.vx + Math.sin(this.oscillationAngle) * this.oscillationDistance
        this.y += this.vy
        
        // Angles update
        this.rotation += this.rotationSpeed
        this.tiltAngle += this.tiltSpeed
        this.tilt = Math.sin(this.tiltAngle) * 0.8 // Fluctuates between -0.8 and 0.8 (3D flip effect)
        this.oscillationAngle += this.oscillationSpeed

        // Mouse interaction: create a wind swirl if the cursor is close and moving
        if (mouse.x !== undefined && mouse.y !== undefined) {
          const dx = this.x - mouse.x
          const dy = this.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < 180) {
            const force = (180 - dist) / 180
            
            // Push petals in direction of mouse movement velocity
            this.x += mouseVelocity.x * force * 1.2
            this.y += mouseVelocity.y * force * 1.2
            
            // Add extra swirl
            this.vx += (dx / dist) * force * 0.15
            this.vy += (dy / dist) * force * 0.08
          }
        }

        // Apply drag back to terminal speed limits
        this.vx += ( (Math.random() * 2 + 2.5) - this.vx ) * 0.01
        this.vy += ( (Math.random() * 0.8 + 0.4) - this.vy ) * 0.01

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
        c.shadowBlur = 4
        c.shadowColor = 'rgba(255, 183, 197, 0.4)'

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

    // Track mouse coordinates & velocity
    let mouse = { x: undefined, y: undefined }
    let lastMouse = { x: undefined, y: undefined }
    let mouseVelocity = { x: 0, y: 0 }
    let mouseTimer = null

    const handleMouseMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      
      if (lastMouse.x !== undefined && lastMouse.y !== undefined) {
        mouseVelocity.x = mouse.x - lastMouse.x
        mouseVelocity.y = mouse.y - lastMouse.y
      }
      
      lastMouse.x = mouse.x
      lastMouse.y = mouse.y

      // Reset mouse velocity decay timer
      clearTimeout(mouseTimer)
      mouseTimer = setTimeout(() => {
        mouseVelocity.x = 0
        mouseVelocity.y = 0
      }, 100)
    }

    window.addEventListener('mousemove', handleMouseMove)

    // Animation Loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      // Draw background ambient depth-of-field lights (glowing bokeh circles)
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      petals.forEach((p, idx) => {
        // Draw bokeh lights for every 5th petal for depth
        if (idx % 5 === 0) {
          ctx.beginPath()
          const glowGrad = ctx.createRadialGradient(
            p.x, p.y - 200, 0,
            p.x, p.y - 200, p.size * 8
          )
          glowGrad.addColorStop(0, 'rgba(255, 183, 197, 0.05)')
          glowGrad.addColorStop(0.5, 'rgba(255, 166, 201, 0.02)')
          glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
          
          ctx.fillStyle = glowGrad
          ctx.arc(p.x, p.y - 200, p.size * 8, 0, Math.PI * 2)
          ctx.fill()
        }
      })
      ctx.restore()

      // Update and draw petals
      petals.forEach((petal) => {
        petal.update(mouse, mouseVelocity)
        petal.draw(ctx)
      })

      // Decay mouse velocity slowly
      mouseVelocity.x *= 0.95
      mouseVelocity.y *= 0.95

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
      clearTimeout(mouseTimer)
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
