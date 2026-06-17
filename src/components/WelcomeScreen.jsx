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
          robot.squish += (1.0 - robot.squish) * 0.15
          if (Math.abs(robot.squish - 1.0) < 0.02) {
            robot.squish = 1.0
            robot.state = 'confused'
            robot.stateTime = 0
          }
        } else if (robot.state === 'confused') {
          robot.stateTime++
          // Head shake and eye look around (60 frames ~1s)
          robot.eyeOffsetX = Math.sin(robot.time * 0.15) * 8
          if (robot.stateTime > 60) {
            robot.state = 'hi'
            robot.stateTime = 0
            robot.eyeOffsetX = 0
            robot.showBubble = true
          }
        } else if (robot.state === 'hi') {
          robot.stateTime++
          // Wave and say hi (80 frames ~1.3s)
          if (robot.stateTime > 80) {
            robot.state = 'running'
            robot.stateTime = 0
            robot.showBubble = false
          }
        } else if (robot.state === 'running') {
          // Run off screen
          robot.runSpeed = Math.min(robot.runSpeed + 0.6, 12)
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
            }, 500)
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
          ctx.roundRect(-45 * scale, -22 * scale, 90 * scale, 38 * scale, 8 * scale)
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
        
        // --- DRAW ROBOT BASE/WHEELS ---
        ctx.save()
        ctx.translate(x, y + 42 * scale)
        ctx.scale(1, squish)
        ctx.fillStyle = '#334155'
        ctx.beginPath()
        ctx.roundRect(-30 * scale, -8 * scale, 60 * scale, 16 * scale, 8 * scale)
        ctx.fill()
        
        // Little wheels rolling if running
        ctx.fillStyle = '#0f172a'
        const wheelRotation = state === 'running' ? (time * 0.3) % (Math.PI * 2) : 0
        for (let i = -18; i <= 18; i += 18) {
          ctx.save()
          ctx.translate(i * scale, 0)
          ctx.rotate(wheelRotation)
          ctx.beginPath()
          ctx.arc(0, 0, 5 * scale, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(-1 * scale, -4 * scale, 2 * scale, 8 * scale)
          ctx.restore()
        }
        ctx.restore()

        // --- DRAW ROBOT ARMS ---
        // Left arm waving or running
        ctx.save()
        ctx.translate(x - 45 * scale, y - 5 * scale)
        if (state === 'hi') {
          // Wave arm up and down
          const waveAngle = Math.sin(time * 0.15) * 0.6 - 0.9
          ctx.rotate(waveAngle)
        } else if (state === 'running') {
          ctx.rotate(Math.sin(time * 0.25) * 0.6)
        }
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.roundRect(-7 * scale, -12 * scale, 14 * scale, 34 * scale, 7 * scale)
        ctx.fill()
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.restore()

        // Right arm
        ctx.save()
        ctx.translate(x + 45 * scale, y - 5 * scale)
        if (state === 'running') {
          ctx.rotate(-Math.sin(time * 0.25) * 0.6)
        }
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.roundRect(-7 * scale, -12 * scale, 14 * scale, 34 * scale, 7 * scale)
        ctx.fill()
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.restore()

        // --- DRAW ROBOT BODY ---
        ctx.save()
        ctx.translate(x, y)
        ctx.scale(1, squish)
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.roundRect(-36 * scale, -22 * scale, 72 * scale, 64 * scale, 22 * scale)
        ctx.fill()
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Chest Screen
        ctx.fillStyle = '#1e1b4b'
        ctx.beginPath()
        ctx.roundRect(-18 * scale, -10 * scale, 36 * scale, 22 * scale, 5 * scale)
        ctx.fill()
        // Chest Heartbeat / Wave
        ctx.strokeStyle = '#ff007f'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(-13 * scale, 1 * scale)
        ctx.lineTo(-5 * scale, 1 * scale)
        ctx.lineTo(-2 * scale, -6 * scale)
        ctx.lineTo(2 * scale, 7 * scale)
        ctx.lineTo(5 * scale, 1 * scale)
        ctx.lineTo(13 * scale, 1 * scale)
        ctx.stroke()
        ctx.restore()

        // --- DRAW ROBOT HEAD ---
        ctx.save()
        ctx.translate(x, y - 62 * scale * squish)
        ctx.scale(1, squish)
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.roundRect(-42 * scale, -28 * scale, 84 * scale, 56 * scale, 28 * scale)
        ctx.fill()
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 1.5
        ctx.stroke()

        // Black Visor
        ctx.fillStyle = '#0f172a'
        ctx.beginPath()
        ctx.roundRect(-34 * scale, -17 * scale, 68 * scale, 34 * scale, 17 * scale)
        ctx.fill()

        // Visor glowing blue eyes
        ctx.fillStyle = '#00f0ff'
        ctx.shadowBlur = 8 * scale
        ctx.shadowColor = '#00f0ff'

        if (state === 'confused') {
          // Draw slanted confused eyes
          ctx.beginPath()
          ctx.arc(-14 * scale + eyeOffsetX, 0, 4.5 * scale, 0, Math.PI * 2)
          ctx.arc(14 * scale + eyeOffsetX, -2 * scale, 4.5 * scale, 0, Math.PI * 2)
          ctx.fill()
        } else if (state === 'hi') {
          // Happy wink eyes
          ctx.beginPath()
          ctx.arc(-14 * scale, 0, 5 * scale, 0, Math.PI * 2)
          ctx.fill()
          // Arc wink eye
          ctx.strokeStyle = '#00f0ff'
          ctx.lineWidth = 3.5
          ctx.beginPath()
          ctx.arc(14 * scale, 0, 6 * scale, Math.PI, 0)
          ctx.stroke()
        } else {
          // Normal round eyes
          ctx.beginPath()
          ctx.arc(-14 * scale + eyeOffsetX, 0, 5 * scale, 0, Math.PI * 2)
          ctx.arc(14 * scale + eyeOffsetX, 0, 5 * scale, 0, Math.PI * 2)
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
