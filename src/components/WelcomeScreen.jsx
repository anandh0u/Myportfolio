import { useState, useEffect, useRef } from 'react'

export default function WelcomeScreen({ onEnter }) {
  const [phase, setPhase] = useState('idle') // idle, transitioning, complete
  const [doorsOpen, setDoorsOpen] = useState(false)
  const [isSwaying, setIsSwaying] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [boardCollapsing, setBoardCollapsing] = useState(false)
  
  const canvasRef = useRef(null)
  const requestRef = useRef(null)
  
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])
  
  const handleStartTransition = () => {
    if (phase !== 'idle') return
    setPhase('transitioning')
    setBoardCollapsing(true)
    setIsSwaying(true)

    // Stop swaying after some time
    setTimeout(() => {
      setIsSwaying(false)
    }, 1500)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const roundedRect = (c, x, y, w, h, r) => {
      const radius = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2))
      c.moveTo(x + radius, y)
      c.lineTo(x + w - radius, y)
      c.quadraticCurveTo(x + w, y, x + w, y + radius)
      c.lineTo(x + w, y + h - radius)
      c.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
      c.lineTo(x + radius, y + h)
      c.quadraticCurveTo(x, y + h, x, y + h - radius)
      c.lineTo(x, y + radius)
      c.quadraticCurveTo(x, y, x + radius, y)
    }
    
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)
    
    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)
    
    // Robot Animation State Variables
    let robot = {
      x: width / 2,
      y: -150,
      vy: 0,
      gravity: 0.7,
      bounce: -0.4,
      floorY: height * 0.68,
      scale: 1.6, // Big robot in welcome screen
      squish: 1.0,
      state: 'falling', // falling, landing, standing, confused, hi, running
      eyeOffsetX: 0,
      time: 0,
      showBubble: false,
      runSpeed: 0,
      stateTime: 0 // Local timer/frame counter for state robustness
    }
    
    let transitionStartedTime = null
    let globalFogDensity = 0
    let hasRevealedProfile = false
    
    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      robot.time++
      
      // Update Robot State and Physics
      if (phase === 'transitioning') {
        if (!transitionStartedTime) {
          transitionStartedTime = Date.now()
        }
        
        if (robot.state === 'falling') {
          // Physics fall
          robot.vy += robot.gravity
          robot.y += robot.vy
          
          if (robot.y >= robot.floorY) {
            robot.y = robot.floorY
            robot.vy = robot.vy * robot.bounce
            robot.squish = 0.6 // landing impact squish
            
            if (Math.abs(robot.vy) < 1.5) {
              robot.vy = 0
              robot.state = 'standing'
              robot.stateTime = 0
            }
          }
        } else if (robot.state === 'standing') {
          // Recover from squish slowly
          robot.squish += (1.0 - robot.squish) * 0.25
          if (Math.abs(robot.squish - 1.0) < 0.02) {
            robot.squish = 1.0
            robot.state = 'confused'
            robot.stateTime = 0
          }
        } else if (robot.state === 'confused') {
          robot.stateTime++
          // Head shake and eye look around (25 frames ~0.4s)
          robot.eyeOffsetX = Math.sin(robot.time * 0.25) * 8
          if (robot.stateTime > 25) {
            robot.state = 'hi'
            robot.stateTime = 0
            robot.eyeOffsetX = 0
            robot.showBubble = true
          }
        } else if (robot.state === 'hi') {
          robot.stateTime++
          // Wave and say hi (40 frames ~0.6s)
          if (robot.stateTime > 40) {
            robot.state = 'running'
            robot.stateTime = 0
            robot.showBubble = false
          }
        } else if (robot.state === 'running') {
          // Run/Float off screen quickly
          robot.runSpeed = Math.min(robot.runSpeed + 1.2, 20)
          robot.x += robot.runSpeed
          
          // Trigger door open & profile popup when robot leaves screen
          if (robot.x > width + 150 && !hasRevealedProfile) {
            hasRevealedProfile = true
            setDoorsOpen(true)
            onEnter()
            document.body.style.overflow = ''
            
            // Fade welcome screen out
            setTimeout(() => {
              setPhase('complete')
              setTimeout(() => {
                setIsVisible(false)
              }, 1000)
            }, 50)
          }
        }
        
        // Solid transition overlay fade
        if (hasRevealedProfile) {
          globalFogDensity = Math.min(globalFogDensity + 0.03, 1.0)
        }
      }
      
      // Draw Vector Robot
      if (phase === 'transitioning') {
        const { x, y, scale, squish, state, eyeOffsetX, time } = robot
        
        // --- DRAW SPEECH BUBBLE ---
        if (robot.showBubble) {
          ctx.save()
          ctx.translate(x, y - 110 * scale)
          ctx.fillStyle = '#ff007f'
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          roundedRect(ctx, -45 * scale, -22 * scale, 90 * scale, 38 * scale, 8 * scale)
          ctx.fill()
          ctx.stroke()
          
          // bubble arrow pointer
          ctx.fillStyle = '#ff007f'
          ctx.beginPath()
          ctx.moveTo(-8 * scale, 16 * scale)
          ctx.lineTo(0, 24 * scale)
          ctx.lineTo(8 * scale, 16 * scale)
          ctx.fill()
          ctx.stroke()
          
          // text
          ctx.fillStyle = '#ffffff'
          ctx.font = `bold ${13 * scale}px 'JetBrains Mono', monospace`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('hii!', 0, -2 * scale)
          ctx.restore()
        }
        
        // --- 1. DRAW FLOATING SHADOW ---
        ctx.save()
        const distanceToFloor = Math.max(0, robot.floorY - y)
        const shadowScale = Math.max(0.12, Math.min(1, 1 - distanceToFloor / 500))
        const shadowOpacity = Math.max(0.08, 0.45 * shadowScale)
        const shadowW = Math.max(12, 38 * scale * shadowScale)
        const shadowH = Math.max(1, 5.5 * scale * shadowScale)
        ctx.translate(x, robot.floorY + 28 * scale)
        ctx.fillStyle = `rgba(3, 1, 8, ${shadowOpacity})`
        ctx.beginPath()
        ctx.ellipse(0, 0, shadowW, shadowH, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // --- 2. DRAW THRUSTER FIRE (if falling/decelerating) ---
        if (state === 'falling' || state === 'standing') {
          ctx.save()
          ctx.translate(x, y + 42 * scale * squish)
          const thrusterGrad = ctx.createLinearGradient(0, 0, 0, 22 * scale)
          thrusterGrad.addColorStop(0, '#00f0ff')
          thrusterGrad.addColorStop(0.4, 'rgba(255, 0, 127, 0.75)')
          thrusterGrad.addColorStop(1, 'rgba(255, 0, 127, 0)')
          ctx.fillStyle = thrusterGrad
          ctx.beginPath()
          ctx.moveTo(-7 * scale, 0)
          ctx.quadraticCurveTo(0, (20 + Math.random() * 8) * scale, 7 * scale, 0)
          ctx.fill()
          ctx.restore()
        }

        // --- 3. DRAW ARMS ---
        // Left Arm
        ctx.save()
        ctx.translate(x - 45 * scale, y + 6 * scale)
        if (state === 'hi') {
          // Wave arm up and down
          const waveAngle = Math.sin(time * 0.15) * 0.6 - 0.95
          ctx.rotate(waveAngle)
        } else if (state === 'running') {
          ctx.rotate(0.35 + Math.sin(time * 0.25) * 0.65)
        } else {
          ctx.rotate(0.1)
        }
        const armGradLeft = ctx.createLinearGradient(-8 * scale, -16 * scale, 8 * scale, 20 * scale)
        armGradLeft.addColorStop(0, '#ffffff')
        armGradLeft.addColorStop(1, '#94a3b8')
        ctx.fillStyle = armGradLeft
        ctx.beginPath()
        ctx.ellipse(0, 0, 8 * scale, 24 * scale, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 0.8
        ctx.stroke()
        ctx.restore()

        // Right Arm
        ctx.save()
        ctx.translate(x + 45 * scale, y + 6 * scale)
        if (state === 'running') {
          ctx.rotate(-0.35 - Math.sin(time * 0.25) * 0.65)
        } else {
          ctx.rotate(-0.1)
        }
        const armGradRight = ctx.createLinearGradient(-8 * scale, -16 * scale, 8 * scale, 20 * scale)
        armGradRight.addColorStop(0, '#ffffff')
        armGradRight.addColorStop(1, '#94a3b8')
        ctx.fillStyle = armGradRight
        ctx.beginPath()
        ctx.ellipse(0, 0, 8 * scale, 24 * scale, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 0.8
        ctx.stroke()
        ctx.restore()

        // --- 4. DRAW BODY ---
        ctx.save()
        ctx.translate(x, y)
        ctx.scale(1, squish)
        const bodyGrad = ctx.createRadialGradient(-6 * scale, -10 * scale, 3 * scale, 0, 10 * scale, 40 * scale)
        bodyGrad.addColorStop(0, '#ffffff')
        bodyGrad.addColorStop(0.7, '#f8fafc')
        bodyGrad.addColorStop(1, '#94a3b8')
        ctx.fillStyle = bodyGrad
        ctx.beginPath()
        ctx.ellipse(0, 10 * scale, 34 * scale, 38 * scale, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 0.8
        ctx.stroke()

        // Highlight layer on body
        const bodyHighlight = ctx.createLinearGradient(0, -10 * scale, 0, 20 * scale)
        bodyHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.4)')
        bodyHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = bodyHighlight
        ctx.beginPath()
        ctx.ellipse(0, 0 * scale, 24 * scale, 18 * scale, 0, 0, Math.PI * 2)
        ctx.fill()

        // Chest Screen (Indicator)
        ctx.fillStyle = '#1e1b4b'
        ctx.beginPath()
        roundedRect(ctx, -18 * scale, -4 * scale, 36 * scale, 22 * scale, 5 * scale)
        ctx.fill()
        
        // Heartbeat wave pulse
        ctx.strokeStyle = '#ff007f'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(-13 * scale, 7 * scale)
        ctx.lineTo(-5 * scale, 7 * scale)
        ctx.lineTo(-2 * scale, 0 * scale)
        ctx.lineTo(2 * scale, 13 * scale)
        ctx.lineTo(5 * scale, 7 * scale)
        ctx.lineTo(13 * scale, 7 * scale)
        ctx.stroke()
        ctx.restore()

        // --- 5. DRAW HEAD ---
        ctx.save()
        ctx.translate(x, y - 62 * scale * squish)
        ctx.scale(1, squish)
        
        // Head gradient
        const headGrad = ctx.createRadialGradient(-8 * scale, -12 * scale, 3 * scale, 0, 0, 42 * scale)
        headGrad.addColorStop(0, '#ffffff')
        headGrad.addColorStop(0.65, '#f8fafc')
        headGrad.addColorStop(1, '#94a3b8')
        ctx.fillStyle = headGrad
        ctx.beginPath()
        ctx.ellipse(0, 0, 42 * scale, 32 * scale, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 0.8
        ctx.stroke()

        // Head Glossy Highlight
        const headHighlight = ctx.createLinearGradient(0, -28 * scale, 0, -6 * scale)
        headHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.45)')
        headHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = headHighlight
        ctx.beginPath()
        ctx.ellipse(0, -11 * scale, 32 * scale, 13 * scale, 0, 0, Math.PI * 2)
        ctx.fill()

        // Visor
        const visorGrad = ctx.createLinearGradient(0, -16 * scale, 0, 16 * scale)
        visorGrad.addColorStop(0, '#020617')
        visorGrad.addColorStop(1, '#1e293b')
        ctx.fillStyle = visorGrad
        ctx.beginPath()
        ctx.ellipse(0, 0, 32 * scale, 18 * scale, 0, 0, Math.PI * 2)
        ctx.fill()

        // Visor Glossy Highlight
        const visorHighlight = ctx.createLinearGradient(-20 * scale, -10 * scale, 20 * scale, 10 * scale)
        visorHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.22)')
        visorHighlight.addColorStop(0.3, 'rgba(255, 255, 255, 0.06)')
        visorHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = visorHighlight
        ctx.beginPath()
        ctx.ellipse(-3 * scale, -3 * scale, 24 * scale, 11 * scale, -0.1, 0, Math.PI * 2)
        ctx.fill()

        // Glowing blue wavelike LED eyes
        ctx.fillStyle = '#00f0ff'
        ctx.shadowBlur = 8 * scale
        ctx.shadowColor = '#00f0ff'

        if (state === 'confused') {
          // Slanted, confused winking LED lines
          ctx.beginPath()
          ctx.ellipse(-14 * scale + eyeOffsetX, 0, 6 * scale, 3.2 * scale, 0.05, 0, Math.PI * 2)
          ctx.ellipse(14 * scale + eyeOffsetX, -2 * scale, 6 * scale, 3.2 * scale, -0.15, 0, Math.PI * 2)
          ctx.fill()
        } else if (state === 'hi') {
          // Happy winking smile eyes
          ctx.strokeStyle = '#00f0ff'
          ctx.lineWidth = 3 * scale
          ctx.lineCap = 'round'
          // Left eye normal happy arc
          ctx.beginPath()
          ctx.arc(-14 * scale, -1 * scale, 5.5 * scale, 0, Math.PI)
          ctx.stroke()
          // Right eye wink arc
          ctx.beginPath()
          ctx.arc(14 * scale, 0, 5.5 * scale, Math.PI, 0)
          ctx.stroke()
        } else {
          // Normal round LED ovals
          ctx.beginPath()
          ctx.ellipse(-14 * scale + eyeOffsetX, 0, 6.2 * scale, 3.5 * scale, 0, 0, Math.PI * 2)
          ctx.ellipse(14 * scale + eyeOffsetX, 0, 6.2 * scale, 3.5 * scale, 0, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }
      
      // Blackout fade-to-color overlay when doors open
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
      {/* Background canvas for vector robot and portal transitions */}
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
      
      {/* Modern Welcome Board Overlay */}
      <div className={`welcome-board-wrapper ${boardCollapsing ? 'collapsing' : ''}`}>
        <div className="welcome-board-card">
          <div className="board-decor-dots">
            <span className="dot-red"></span>
            <span className="dot-yellow"></span>
            <span className="dot-green"></span>
          </div>
          <p className="board-meta">[ query_greeting // handshake ]</p>
          <h2 className="board-text">hey... wanna explore about me?</h2>
          <button id="welcome-start-btn" className="board-start-btn" onClick={handleStartTransition}>
            start
          </button>
        </div>
      </div>
    </div>
  )
}
