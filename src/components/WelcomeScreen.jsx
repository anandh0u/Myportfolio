import { useState, useEffect, useRef } from 'react'

export default function WelcomeScreen({ onEnter }) {
  const [phase, setPhase] = useState('idle') // idle, transitioning, complete
  const [doorsOpen, setDoorsOpen] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  
  const canvasRef = useRef(null)
  const requestRef = useRef(null)
  
  useEffect(() => {
    // Disable scroll on body while the welcome screen is active
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])
  
  const handleStartTransition = () => {
    if (phase !== 'idle') return
    setPhase('transitioning')
    setDoorsOpen(true)
    setIsShaking(true)

    // Stop shaking after some time
    setTimeout(() => {
      setIsShaking(false);
    }, 1200);

    // Call the parent enter function when the screen is fully blacked out by fog
    setTimeout(() => {
      onEnter()
      document.body.style.overflow = ''
    }, 1800)

    // Complete the transition and fade out the entire welcome screen
    setTimeout(() => {
      setPhase('complete')
      // Let it fade out, then completely remove it from layout
      setTimeout(() => {
        setIsVisible(false)
      }, 1000)
    }, 2200)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)
    
    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)
    
    // Lightning state
    let lightningStrikes = []
    let flashOpacity = 0
    let strikeTimer = 0
    
    // Smoke / Fog particles state
    let particles = []
    const particleEmitterX = width / 2
    const particleEmitterY = height / 2
    let emissionRate = 0 // Will increase when doors start opening
    let globalFogDensity = 0 // Blackout overlay density
    
    class SmokeParticle {
      constructor(x, y) {
        this.x = x
        this.y = y
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 5 + 3
        this.vx = Math.cos(angle) * speed
        this.vy = Math.sin(angle) * speed
        this.radius = Math.random() * 40 + 20
        this.maxRadius = Math.random() * 250 + 150
        this.alpha = 0.1
        this.growth = Math.random() * 3 + 4
        // Dark, blackish/deep purple fog color
        const shade = Math.floor(Math.random() * 10) + 5 // very dark
        const purp = Math.floor(Math.random() * 12) + 5
        this.color = `rgba(${shade}, ${purp}, ${shade + 10}`
      }
      
      update() {
        this.x += this.vx
        this.y += this.vy
        // Friction / slowdown
        this.vx *= 0.98
        this.vy *= 0.98
        
        if (this.radius < this.maxRadius) {
          this.radius += this.growth
        }
        
        if (phase === 'transitioning') {
          // Increase alpha to make it thick
          if (this.alpha < 0.95) {
            this.alpha += 0.02
          }
        }
      }
      
      draw(c) {
        c.save()
        c.beginPath()
        const grad = c.createRadialGradient(
          this.x, this.y, this.radius * 0.1,
          this.x, this.y, this.radius
        )
        grad.addColorStop(0, `${this.color}, ${this.alpha})`)
        grad.addColorStop(0.5, `${this.color}, ${this.alpha * 0.6})`)
        grad.addColorStop(1, `${this.color}, 0)`)
        
        c.fillStyle = grad
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        c.fill()
        c.restore()
      }
    }
    
    // Helper to generate a single lightning path
    const createLightningPath = (sx, sy, tx, ty, displace) => {
      const path = []
      path.push({ x: sx, y: sy })
      
      const midX = (sx + tx) / 2
      const midY = (sy + ty) / 2
      
      const divide = (x1, y1, x2, y2, disp) => {
        if (disp < 4) {
          path.push({ x: x2, y: y2 })
        } else {
          const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * disp
          const my = (y1 + y2) / 2 + (Math.random() - 0.5) * disp
          divide(x1, y1, mx, my, disp / 2)
          divide(mx, my, x2, y2, disp / 2)
        }
      }
      
      divide(sx, sy, tx, ty, displace)
      return path
    }
    
    // Main animation loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      
      // Update and draw smoke/fog particles
      if (phase === 'transitioning') {
        emissionRate = Math.min(emissionRate + 0.8, 15) // Accelerate smoke emission
        globalFogDensity = Math.min(globalFogDensity + 0.009, 1.0) // Transition to total blackout
      }
      
      // Emit new particles from center
      for (let i = 0; i < Math.floor(emissionRate); i++) {
        // Emit in a slightly randomized circle around center
        const offsetAngle = Math.random() * Math.PI * 2
        const offsetDist = Math.random() * 30
        const px = particleEmitterX + Math.cos(offsetAngle) * offsetDist
        const py = particleEmitterY + Math.sin(offsetAngle) * offsetDist
        particles.push(new SmokeParticle(px, py))
      }
      
      particles.forEach((p) => {
        p.update()
        p.draw(ctx)
      })
      
      // Filter out particles that are off screen or fully decayed (though we keep them alive in blackout phase)
      if (particles.length > 200) {
        particles.shift()
      }
      
      // Lightning logic during transitioning phase
      if (phase === 'transitioning') {
        strikeTimer++
        
        // Spawn lightning strikes at specific intervals
        if (strikeTimer === 5 || strikeTimer === 12 || strikeTimer === 28 || strikeTimer === 42 || strikeTimer === 60) {
          flashOpacity = Math.random() * 0.7 + 0.3
          
          // Generate a main bolt from sky to center
          const targetX = width / 2 + (Math.random() - 0.5) * 100
          const targetY = height / 2 + (Math.random() - 0.5) * 50
          const startX = width * Math.random()
          const startY = 0
          
          const path = createLightningPath(startX, startY, targetX, targetY, width / 4)
          lightningStrikes.push({
            path,
            width: Math.random() * 4 + 2,
            opacity: 1.0,
            color: '#00f0ff', // Cyan lightning
          })
          
          // Add a second branching strike
          if (Math.random() > 0.4) {
            const sideStartX = startX + (Math.random() - 0.5) * 200
            const sidePath = createLightningPath(sideStartX, 0, targetX + (Math.random() - 0.5) * 150, targetY, width / 5)
            lightningStrikes.push({
              path: sidePath,
              width: Math.random() * 2 + 1,
              opacity: 0.8,
              color: '#ff007f', // Pink secondary branching
            })
          }
        }
      }
      
      // Render lightning strikes
      lightningStrikes.forEach((strike, idx) => {
        if (strike.path.length < 2) return
        
        ctx.save()
        // Draw outer glow
        ctx.shadowBlur = 25
        ctx.shadowColor = strike.color
        ctx.strokeStyle = strike.color
        ctx.lineWidth = strike.width * 2
        ctx.globalAlpha = strike.opacity
        
        ctx.beginPath()
        ctx.moveTo(strike.path[0].x, strike.path[0].y)
        for (let i = 1; i < strike.path.length; i++) {
          ctx.lineTo(strike.path[i].x, strike.path[i].y)
        }
        ctx.stroke()
        
        // Draw bright inner core
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = strike.width * 0.5
        ctx.shadowBlur = 5
        ctx.stroke()
        
        ctx.restore()
        
        // Fade out strike
        strike.opacity -= 0.08
      })
      
      // Clean finished strikes
      lightningStrikes = lightningStrikes.filter(s => s.opacity > 0)
      
      // Draw screen-wide flash overlays for lightning impact
      if (flashOpacity > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`
        ctx.fillRect(0, 0, width, height)
        flashOpacity -= 0.06 // Fade screen flash
      }
      
      // Solid blackout overlay as fog becomes absolute
      if (globalFogDensity > 0) {
        ctx.fillStyle = `rgba(5, 2, 12, ${globalFogDensity})`
        ctx.fillRect(0, 0, width, height)
      }
      
      requestRef.current = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(requestRef.current)
    }
  }, [phase])
  
  if (!isVisible) return null
  
  return (
    <div className={`welcome-overlay ${phase === 'complete' ? 'fade-out' : ''} ${isShaking ? 'shake-effect' : ''}`}>
      {/* Background canvas for particles and lightning strikes */}
      <canvas ref={canvasRef} className="welcome-canvas" />
      
      {/* Doors Section */}
      <div className={`door-container ${doorsOpen ? 'doors-open' : ''}`}>
        <div className="door door-left">
          <div className="door-panel-texture"></div>
          <div className="door-edge-light"></div>
        </div>
        <div className="door door-right">
          <div className="door-panel-texture"></div>
          <div className="door-edge-light"></div>
        </div>
      </div>
      
      {/* Center lock and welcome text */}
      <div className={`portal-trigger-wrapper ${doorsOpen ? 'portal-disappear' : ''}`}>
        <button className="portal-gate-btn" onClick={handleStartTransition}>
          <div className="portal-ring ring-outer"></div>
          <div className="portal-ring ring-mid"></div>
          <div className="portal-ring ring-inner"></div>
          
          <div className="portal-content">
            <span className="portal-label">initiate_session</span>
            <h1 className="portal-title">welcome to my portfolio</h1>
            <div className="portal-glow-line"></div>
          </div>
        </button>
        <p className="portal-hint">click to unlock system gateway</p>
      </div>
    </div>
  )
}
