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

    // Particle Configuration (Subtle dark-tech constellation network)
    const maxParticles = Math.min(80, Math.floor((width * height) / 18000))
    const particles = []
    const connectionDistLimit = 120 // Max distance to draw connecting line
    
    let mouse = { x: undefined, y: undefined, radius: 150 }

    class Particle {
      constructor() {
        this.reset(true)
      }

      reset(initiallyOnScreen = false) {
        this.x = initiallyOnScreen ? Math.random() * width : (Math.random() > 0.5 ? -10 : width + 10)
        this.y = initiallyOnScreen ? Math.random() * height : (Math.random() > 0.5 ? -10 : height + 10)
        
        // Very slow, professional drift velocities
        this.vx = (Math.random() - 0.5) * 0.4
        this.vy = (Math.random() - 0.5) * 0.4
        
        this.size = Math.random() * 2 + 1
        // Subtle glow color
        this.color = Math.random() > 0.4 ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 0, 127, 0.12)'
      }

      update() {
        this.x += this.vx
        this.y += this.vy

        // Repel from mouse cursor
        if (mouse.x !== undefined && mouse.y !== undefined) {
          const dx = this.x - mouse.x
          const dy = this.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius
            const angle = Math.atan2(dy, dx)
            // Push particles away gently
            this.x += Math.cos(angle) * force * 1.5
            this.y += Math.sin(angle) * force * 1.5
          }
        }

        // Reset if drifted too far offscreen
        if (this.x < -40 || this.x > width + 40 || this.y < -40 || this.y > height + 40) {
          this.reset(false)
        }
      }

      draw(c) {
        c.beginPath()
        c.fillStyle = this.color
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        c.fill()
      }
    }

    // Initialize particles
    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle())
    }

    const handleMouseMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }

    const handleMouseLeave = () => {
      mouse.x = undefined
      mouse.y = undefined
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)

    // Animation Loop
    const animate = () => {
      // Clear with very slight fade for trailing glow effect
      ctx.fillStyle = '#05020c'
      ctx.fillRect(0, 0, width, height)

      // Draw dynamic web lines first (connections between close particles)
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i]
        
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < connectionDistLimit) {
            // Fades lines as distance approaches limit
            const alpha = (1 - dist / connectionDistLimit) * 0.05
            ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`
            ctx.lineWidth = 0.8
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }

        // Draw connections to mouse cursor
        if (mouse.x !== undefined && mouse.y !== undefined) {
          const dx = p1.x - mouse.x
          const dy = p1.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < mouse.radius) {
            const alpha = (1 - dist / mouse.radius) * 0.08
            ctx.strokeStyle = `rgba(255, 0, 127, ${alpha})`
            ctx.lineWidth = 0.8
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(mouse.x, mouse.y)
            ctx.stroke()
          }
        }
      }

      // Update and draw particles
      particles.forEach((p) => {
        p.update()
        p.draw(ctx)
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
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
