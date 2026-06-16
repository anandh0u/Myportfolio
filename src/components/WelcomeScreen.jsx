import { useState, useEffect, useRef } from 'react'

export default function WelcomeScreen({ onEnter }) {
  const [phase, setPhase] = useState('idle') // idle, transitioning, complete
  const [doorsOpen, setDoorsOpen] = useState(false)
  const [isSwaying, setIsSwaying] = useState(false)
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
    setIsSwaying(true)

    // Stop swaying after some time
    setTimeout(() => {
      setIsSwaying(false);
    }, 1500);

    // Call the parent enter function when the screen is fully covered by petals
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
    
    // Sakura colors (various soft pinks and blushes)
    const COLORS = [
      'rgba(255, 183, 197, 0.58)', // Cherry Pink
      'rgba(255, 166, 201, 0.54)', // Bright Blossom Pink
      'rgba(255, 204, 213, 0.62)', // Soft White-Pink
      'rgba(255, 105, 180, 0.44)', // Hot Pink highlight
      'rgba(244, 154, 193, 0.56)'  // Classic Sakura
    ]
    
    let globalFogDensity = 0 // Blackout overlay density
    let hasTriggeredBlast = false
    
    // Sakura Petal Class
    class SakuraPetal {
      constructor(isNew = false) {
        this.reset(isNew)
      }
      
      reset(isNew = false) {
        this.originalSize = Math.random() * 8 + 6
        this.size = this.originalSize
        
        if (phase === 'transitioning') {
          // Spawn near the center vortex or enter from the side
          if (Math.random() > 0.5) {
            this.x = width / 2 + (Math.random() - 0.5) * 100
            this.y = height / 2 + (Math.random() - 0.5) * 100
            const angle = Math.random() * Math.PI * 2
            const speed = Math.random() * 12 + 6
            this.vx = Math.cos(angle) * speed
            this.vy = Math.sin(angle) * speed
          } else {
            this.x = Math.random() * -100 - 20
            this.y = Math.random() * height
            this.vx = Math.random() * 6 + 4
            this.vy = Math.random() * 4 + 2
          }
        } else {
          // Idle drift
          this.x = isNew ? Math.random() * -100 - 20 : Math.random() * width
          this.y = Math.random() * height
          this.vx = Math.random() * 1.5 + 1.2
          this.vy = Math.random() * 0.8 + 0.4
        }
        
        this.rotation = Math.random() * Math.PI * 2
        this.rotationSpeed = (Math.random() - 0.5) * 0.04
        this.tilt = Math.random()
        this.tiltAngle = Math.random() * Math.PI
        this.tiltSpeed = Math.random() * 0.03 + 0.01
        
        this.oscillationAngle = Math.random() * Math.PI
        this.oscillationSpeed = Math.random() * 0.02 + 0.01
        this.oscillationDistance = Math.random() * 2 + 1
        
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)]
      }
      
      update() {
        if (phase === 'transitioning') {
          // Grow sizes to cover the screen completely
          if (this.size < this.originalSize * 2.8) {
            this.size += 0.06
          }
          
          // Swirl vortex centered around the screen center
          const dx = this.x - width / 2
          const dy = this.y - height / 2
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist > 10) {
            const angle = Math.atan2(dy, dx)
            const swirlForce = 0.22
            const radialForce = 0.08
            
            this.vx += -Math.sin(angle) * swirlForce + Math.cos(angle) * radialForce
            this.vy += Math.cos(angle) * swirlForce + Math.sin(angle) * radialForce
          }
          
          // Speed limit cap
          const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
          if (speed > 16) {
            this.vx = (this.vx / speed) * 16
            this.vy = (this.vy / speed) * 16
          }
        } else {
          // Gentle drift velocities
          this.vx += ( (Math.random() * 1.5 + 1.2) - this.vx ) * 0.05
          this.vy += ( (Math.random() * 0.8 + 0.4) - this.vy ) * 0.05
        }
        
        this.x += this.vx + Math.sin(this.oscillationAngle) * this.oscillationDistance
        this.y += this.vy
        
        this.rotation += this.rotationSpeed
        this.tiltAngle += this.tiltSpeed
        this.tilt = Math.sin(this.tiltAngle) * 0.8
        this.oscillationAngle += this.oscillationSpeed
        
        // Reset if offscreen (wider bounds in transition to keep screen covered)
        const bound = phase === 'transitioning' ? 250 : 40
        if (this.x > width + bound || this.y > height + bound || this.x < -bound || this.y < -bound) {
          this.reset(true)
        }
      }
      
      draw(c) {
        c.save()
        c.translate(this.x, this.y)
        c.rotate(this.rotation)
        c.scale(1, this.tilt)
        
        c.beginPath()
        c.fillStyle = this.color
        c.shadowBlur = 2
        c.shadowColor = 'rgba(255, 183, 197, 0.22)'
        
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
    
    // Sakura petals collection
    let petals = []
    const maxIdlePetals = 32
    const maxTransitionPetals = 260
    
    for (let i = 0; i < maxIdlePetals; i++) {
      petals.push(new SakuraPetal(false))
    }
    
    // Main animation loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      
      // Update and draw transition particles
      if (phase === 'transitioning') {
        // Trigger initial blast once at start of transition
        if (!hasTriggeredBlast) {
          hasTriggeredBlast = true
          // Spawn a softer burst of petals at the center
          for (let i = 0; i < 140; i++) {
            const angle = Math.random() * Math.PI * 2
            const speed = Math.random() * 14 + 6
            const petal = new SakuraPetal(true)
            petal.x = width / 2
            petal.y = height / 2
            petal.vx = Math.cos(angle) * speed
            petal.vy = Math.sin(angle) * speed
            petal.rotationSpeed = (Math.random() - 0.5) * 0.25
            petal.tiltSpeed = Math.random() * 0.09 + 0.05
            petals.push(petal)
          }
        }
        
        // Increase blackout overlay density
        globalFogDensity = Math.min(globalFogDensity + 0.008, 1.0)
        
        // Spawn a lighter follow-up breeze of petals
        if (petals.length < maxTransitionPetals) {
          const spawnCount = Math.min(5, maxTransitionPetals - petals.length)
          for (let i = 0; i < spawnCount; i++) {
            petals.push(new SakuraPetal(true))
          }
        }
      }
      
      // Update and draw sakura petals
      petals.forEach((petal) => {
        petal.update()
        petal.draw(ctx)
      })
      
      // Solid blackout overlay as fog becomes absolute (tinted with deep midnight rose)
      if (globalFogDensity > 0) {
        ctx.fillStyle = `rgba(15, 8, 20, ${globalFogDensity})`
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
    <div className={`welcome-overlay ${phase === 'complete' ? 'fade-out' : ''} ${isSwaying ? 'wind-sway-effect' : ''}`}>
      {/* Background canvas for particles and sakura petals */}
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
