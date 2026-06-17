import { useState, useEffect, useRef } from 'react'

export default function WelcomeScreen({ onEnter }) {
  const [phase, setPhase] = useState('idle')
  const [doorsOpen, setDoorsOpen] = useState(false)
  const [isSwaying, setIsSwaying] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [boardCollapsing, setBoardCollapsing] = useState(false)

  const canvasRef = useRef(null)
  const requestRef = useRef(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleStartTransition = () => {
    if (phase !== 'idle') return
    setPhase('transitioning')
    setBoardCollapsing(true)
    setIsSwaying(true)
    setTimeout(() => setIsSwaying(false), 1500)
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

    let robot = {
      x: width / 2,
      y: -200,
      vy: 0,
      gravity: 0.65,
      bounce: -0.38,
      floorY: height * 0.67,
      scale: 1.65,
      squish: 1.0,
      state: 'falling',
      eyeOffsetX: 0,
      time: 0,
      showBubble: false,
      runSpeed: 0,
      stateTime: 0
    }

    let transitionStartedTime = null
    let globalFogDensity = 0
    let hasRevealedProfile = false

    // ─── Metallic gradient helper ─────────────────────────────────────
    const metallicGrad = (hx, hy, hr, tx, ty, tr) => {
      const g = ctx.createRadialGradient(hx, hy, hr, tx, ty, tr)
      g.addColorStop(0,   '#ffffff')
      g.addColorStop(0.12,'#fafcff')
      g.addColorStop(0.55,'#e0ecfa')
      g.addColorStop(0.82,'#baced8')
      g.addColorStop(1,   '#82a0b8')
      return g
    }

    // ─── Rim light helper ──────────────────────────────────────────────
    const rimLight = (x, y, rx, ry, color = 'rgba(0,240,255,0.2)') => {
      const stroke = ctx.createLinearGradient(x - rx, y, x + rx, y)
      stroke.addColorStop(0, color)
      stroke.addColorStop(0.5, 'rgba(255,255,255,0)')
      stroke.addColorStop(1, color)
      ctx.strokeStyle = stroke
      ctx.lineWidth = 1.8
      ctx.beginPath()
      ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
      ctx.stroke()
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      robot.time++

      // ─── Physics / State Machine ────────────────────────────────────
      if (phase === 'transitioning') {
        if (!transitionStartedTime) transitionStartedTime = Date.now()

        if (robot.state === 'falling') {
          robot.vy += robot.gravity
          robot.y += robot.vy
          if (robot.y >= robot.floorY) {
            robot.y = robot.floorY
            robot.vy = robot.vy * robot.bounce
            robot.squish = 0.58
            if (Math.abs(robot.vy) < 1.8) {
              robot.vy = 0
              robot.state = 'standing'
              robot.stateTime = 0
            }
          }
        } else if (robot.state === 'standing') {
          robot.squish += (1.0 - robot.squish) * 0.22
          if (Math.abs(robot.squish - 1.0) < 0.02) {
            robot.squish = 1.0
            robot.state = 'confused'
            robot.stateTime = 0
          }
        } else if (robot.state === 'confused') {
          robot.stateTime++
          robot.eyeOffsetX = Math.sin(robot.time * 0.28) * 9
          if (robot.stateTime > 28) {
            robot.state = 'hi'
            robot.stateTime = 0
            robot.eyeOffsetX = 0
            robot.showBubble = true
          }
        } else if (robot.state === 'hi') {
          robot.stateTime++
          if (robot.stateTime > 48) {
            robot.state = 'running'
            robot.stateTime = 0
            robot.showBubble = false
          }
        } else if (robot.state === 'running') {
          robot.runSpeed = Math.min(robot.runSpeed + 1.4, 22)
          robot.x += robot.runSpeed
          if (robot.x > width + 200 && !hasRevealedProfile) {
            hasRevealedProfile = true
            setDoorsOpen(true)
            onEnter()
            document.body.style.overflow = ''
            setTimeout(() => {
              setPhase('complete')
              setTimeout(() => setIsVisible(false), 1000)
            }, 50)
          }
        }

        if (hasRevealedProfile) {
          globalFogDensity = Math.min(globalFogDensity + 0.025, 1.0)
        }
      }

      // ─── Drawing ────────────────────────────────────────────────────
      if (phase === 'transitioning') {
        const { x, y, scale: S, squish, state, eyeOffsetX, time } = robot

        // ── Speech Bubble ────────────────────────────────────────────
        if (robot.showBubble) {
          ctx.save()
          ctx.translate(x + 20 * S, y - 118 * S)

          // Bubble shadow
          ctx.fillStyle = 'rgba(0,0,0,0.25)'
          ctx.beginPath()
          roundedRect(ctx, -44 * S + 3, -24 * S + 3, 92 * S, 44 * S, 9 * S)
          ctx.fill()

          // Bubble body gradient
          const bgG = ctx.createLinearGradient(-44 * S, -24 * S, 44 * S, 20 * S)
          bgG.addColorStop(0, '#ff0080')
          bgG.addColorStop(1, '#cc005f')
          ctx.fillStyle = bgG
          ctx.strokeStyle = 'rgba(255,255,255,0.7)'
          ctx.lineWidth = 1.8
          ctx.beginPath()
          roundedRect(ctx, -44 * S, -24 * S, 92 * S, 44 * S, 9 * S)
          ctx.fill(); ctx.stroke()

          // Bubble highlight
          ctx.fillStyle = 'rgba(255,255,255,0.2)'
          ctx.beginPath()
          roundedRect(ctx, -38 * S, -22 * S, 76 * S, 14 * S, 7 * S)
          ctx.fill()

          // Arrow pointer
          ctx.fillStyle = '#cc005f'
          ctx.beginPath()
          ctx.moveTo(-10 * S, 20 * S)
          ctx.lineTo(0, 30 * S)
          ctx.lineTo(10 * S, 20 * S)
          ctx.fill()

          // Text
          ctx.fillStyle = '#ffffff'
          ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(255,150,200,0.5)'
          ctx.font = `bold ${15 * S}px 'JetBrains Mono', monospace`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('hii! 👋', 0, -2 * S)
          ctx.shadowBlur = 0
          ctx.restore()
        }

        // ── Ground Shadow ────────────────────────────────────────────
        const distToFloor = Math.max(0, robot.floorY - y)
        const sSc = Math.max(0.1, Math.min(1, 1 - distToFloor / 480))
        const sG = ctx.createRadialGradient(x, robot.floorY + 22 * S, 1, x, robot.floorY + 22 * S, 40 * S * sSc)
        sG.addColorStop(0, `rgba(0,5,20,${0.45 * sSc})`)
        sG.addColorStop(1, 'rgba(0,5,20,0)')
        ctx.fillStyle = sG
        ctx.beginPath()
        ctx.ellipse(x, robot.floorY + 22 * S, 40 * S * sSc, 10 * S * sSc, 0, 0, Math.PI * 2)
        ctx.fill()

        // ── Thruster Flame ───────────────────────────────────────────
        if (state === 'falling' || state === 'standing') {
          ctx.save()
          ctx.translate(x, y + 44 * S * squish)
          const flameH = (22 + Math.random() * 10) * S
          const fg1 = ctx.createLinearGradient(0, 0, 0, flameH)
          fg1.addColorStop(0, 'rgba(0,240,255,0.9)')
          fg1.addColorStop(0.3, 'rgba(60,0,255,0.6)')
          fg1.addColorStop(0.7, 'rgba(255,0,127,0.4)')
          fg1.addColorStop(1, 'rgba(255,0,127,0)')
          ctx.fillStyle = fg1
          ctx.shadowBlur = 20; ctx.shadowColor = '#00f0ff'
          ctx.beginPath()
          ctx.moveTo(-9 * S, 0)
          ctx.quadraticCurveTo(0, flameH * 1.8, 9 * S, 0)
          ctx.fill()
          ctx.shadowBlur = 0
          ctx.restore()
        }

        // ── Arms ─────────────────────────────────────────────────────
        const drawArm = (side, angle, tx, ty) => {
          ctx.save()
          ctx.translate(tx, ty)
          ctx.rotate(angle)
          ctx.fillStyle = metallicGrad(
            side < 0 ? tx + 8 * S : tx - 8 * S, ty - 15 * S, 3 * S,
            tx, ty, 28 * S
          )
          ctx.beginPath()
          ctx.ellipse(0, 0, 9 * S, 27 * S, 0, 0, Math.PI * 2)
          ctx.fill()
          rimLight(0, 0, 9 * S, 27 * S)

          // arm specular
          const aSpec = ctx.createRadialGradient(
            side < 0 ? 3 * S : -3 * S, -12 * S, 0,
            0, -6 * S, 12 * S
          )
          aSpec.addColorStop(0, 'rgba(255,255,255,0.55)')
          aSpec.addColorStop(1, 'rgba(255,255,255,0)')
          ctx.fillStyle = aSpec
          ctx.beginPath()
          ctx.ellipse(side < 0 ? 2 * S : -2 * S, -8 * S, 4.5 * S, 11 * S, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }

        // Left arm
        if (state === 'hi') {
          drawArm(-1, Math.sin(time * 0.14) * 0.55 - 1.0, x - 50 * S, y + 8 * S)
        } else if (state === 'running') {
          drawArm(-1, 0.4 + Math.sin(time * 0.28) * 0.7, x - 50 * S, y + 8 * S)
        } else {
          drawArm(-1, 0.12, x - 50 * S, y + 8 * S)
        }

        // Right arm
        if (state === 'running') {
          drawArm(1, -0.4 - Math.sin(time * 0.28) * 0.7, x + 50 * S, y + 8 * S)
        } else {
          drawArm(1, -0.12, x + 50 * S, y + 8 * S)
        }

        // ── Body ──────────────────────────────────────────────────────
        ctx.save()
        ctx.translate(x, y)
        ctx.scale(1, squish)

        ctx.fillStyle = metallicGrad(-8 * S, -14 * S, 3 * S, 0, 12 * S, 48 * S)
        ctx.beginPath()
        ctx.ellipse(0, 12 * S, 38 * S, 44 * S, 0, 0, Math.PI * 2)
        ctx.fill()
        rimLight(0, 12 * S, 38 * S, 44 * S)

        // Body top specular
        const bSpec = ctx.createRadialGradient(-10 * S, -6 * S, 0, -5 * S, 4 * S, 28 * S)
        bSpec.addColorStop(0, 'rgba(255,255,255,0.52)')
        bSpec.addColorStop(0.5, 'rgba(255,255,255,0.15)')
        bSpec.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = bSpec
        ctx.beginPath()
        ctx.ellipse(-4 * S, 2 * S, 24 * S, 18 * S, -0.1, 0, Math.PI * 2)
        ctx.fill()

        // Chest screen
        ctx.fillStyle = 'rgba(3,12,30,0.94)'
        ctx.beginPath()
        roundedRect(ctx, -22 * S, -5 * S, 44 * S, 28 * S, 6 * S)
        ctx.fill()
        ctx.strokeStyle = 'rgba(0,240,255,0.35)'
        ctx.lineWidth = 1.0
        ctx.beginPath()
        roundedRect(ctx, -22 * S, -5 * S, 44 * S, 28 * S, 6 * S)
        ctx.stroke()

        // ECG line
        const pulse = (Math.sin(time * 0.04) + 1) / 2
        ctx.strokeStyle = `rgba(0,240,255,${0.65 + pulse * 0.35})`
        ctx.shadowBlur = 8; ctx.shadowColor = '#00f0ff'
        ctx.lineWidth = 2.0
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(-16 * S, 10 * S)
        ctx.lineTo(-8 * S, 10 * S)
        ctx.lineTo(-4 * S, 1 * S)
        ctx.lineTo(0, 18 * S)
        ctx.lineTo(5 * S, 10 * S)
        ctx.lineTo(16 * S, 10 * S)
        ctx.stroke()
        ctx.shadowBlur = 0
        ctx.restore()

        // ── Head ──────────────────────────────────────────────────────
        ctx.save()
        ctx.translate(x, y - 72 * S * squish)
        ctx.scale(1, squish)

        // Neck joint
        const nkG = ctx.createLinearGradient(-7 * S, -7 * S, 7 * S, 5 * S)
        nkG.addColorStop(0, '#c5d8ea')
        nkG.addColorStop(1, '#8fa8c8')
        ctx.fillStyle = nkG
        ctx.beginPath()
        ctx.ellipse(0, 0, 11 * S, 7 * S, 0, 0, Math.PI * 2)
        ctx.fill()

        // Head egg
        ctx.translate(0, -8 * S)
        ctx.fillStyle = metallicGrad(-14 * S, -18 * S, 5 * S, 0, 0, 52 * S)
        ctx.beginPath()
        ctx.ellipse(0, 0, 48 * S, 36 * S, 0, 0, Math.PI * 2)
        ctx.fill()
        rimLight(0, 0, 48 * S, 36 * S)

        // Head top gloss
        const hSpec = ctx.createRadialGradient(-16 * S, -20 * S, 0, -10 * S, -14 * S, 30 * S)
        hSpec.addColorStop(0, 'rgba(255,255,255,0.65)')
        hSpec.addColorStop(0.4, 'rgba(255,255,255,0.2)')
        hSpec.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = hSpec
        ctx.beginPath()
        ctx.ellipse(-8 * S, -14 * S, 28 * S, 14 * S, -0.15, 0, Math.PI * 2)
        ctx.fill()

        // Antenna
        ctx.save()
        ctx.translate(18 * S, -32 * S)
        ctx.strokeStyle = '#b8cfe8'; ctx.lineWidth = 2.5 * S
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -14 * S); ctx.stroke()
        const abG = ctx.createRadialGradient(-2 * S, -16 * S, 0, 0, -14 * S, 5.5 * S)
        abG.addColorStop(0, '#ffffff')
        abG.addColorStop(0.45, '#00f0ff')
        abG.addColorStop(1, '#0060cc')
        ctx.fillStyle = abG
        ctx.shadowBlur = 10; ctx.shadowColor = '#00f0ff'
        ctx.beginPath(); ctx.arc(0, -14 * S, 5 * S, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0
        ctx.restore()

        // Visor
        const vG = ctx.createLinearGradient(0, -20 * S, 0, 20 * S)
        vG.addColorStop(0, '#010c1f')
        vG.addColorStop(0.5, '#0d2040')
        vG.addColorStop(1, '#142a50')
        ctx.fillStyle = vG
        ctx.beginPath()
        ctx.ellipse(0, 0, 37 * S, 20 * S, 0, 0, Math.PI * 2)
        ctx.fill()

        // Visor glow border
        ctx.shadowBlur = 12; ctx.shadowColor = 'rgba(0,240,255,0.4)'
        ctx.strokeStyle = 'rgba(0,240,255,0.3)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.ellipse(0, 0, 37 * S, 20 * S, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.shadowBlur = 0

        // Visor sheen
        const vsG = ctx.createLinearGradient(-26 * S, -17 * S, 16 * S, -6 * S)
        vsG.addColorStop(0, 'rgba(255,255,255,0.2)')
        vsG.addColorStop(0.35, 'rgba(255,255,255,0.07)')
        vsG.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = vsG
        ctx.beginPath()
        ctx.ellipse(-6 * S, -6 * S, 28 * S, 11 * S, -0.15, 0, Math.PI * 2)
        ctx.fill()

        // Eyes
        const isBlink = robot.time % 190 < 8

        if (isBlink) {
          ctx.fillStyle = '#00f0ff'
          ctx.fillRect(-20 * S + eyeOffsetX, -1.2 * S, 10 * S, 2.4 * S)
          ctx.fillRect(10 * S + eyeOffsetX, -1.2 * S, 10 * S, 2.4 * S)
        } else if (state === 'confused') {
          ctx.fillStyle = '#00f0ff'
          ctx.shadowBlur = 12; ctx.shadowColor = '#00f0ff'
          ctx.beginPath()
          ctx.ellipse(-14 * S + eyeOffsetX, -1 * S, 7.5 * S, 4 * S, 0.1, 0, Math.PI * 2)
          ctx.ellipse(14 * S + eyeOffsetX, 1 * S, 7.5 * S, 4 * S, -0.1, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
        } else if (state === 'hi') {
          ctx.strokeStyle = '#00f0ff'
          ctx.shadowBlur = 14; ctx.shadowColor = '#00f0ff'
          ctx.lineWidth = 3.5 * S; ctx.lineCap = 'round'
          ctx.beginPath(); ctx.arc(-14 * S, -1 * S, 6.5 * S, Math.PI, 0); ctx.stroke()
          ctx.beginPath(); ctx.arc(14 * S, 0, 6.5 * S, Math.PI, 0); ctx.stroke()
          ctx.shadowBlur = 0
        } else {
          // Standard glowing capsule eyes with reflections
          const drawEye = (ex, ey) => {
            const eg = ctx.createRadialGradient(ex - 2 * S, ey - 2 * S, 0, ex, ey, 8 * S)
            eg.addColorStop(0, '#8fffff')
            eg.addColorStop(0.45, '#00f0ff')
            eg.addColorStop(1, '#0090cc')
            ctx.fillStyle = eg
            ctx.shadowBlur = 14; ctx.shadowColor = '#00f0ff'
            ctx.beginPath()
            ctx.ellipse(ex + eyeOffsetX, ey, 7.5 * S, 4.5 * S, 0, 0, Math.PI * 2)
            ctx.fill()
            ctx.shadowBlur = 0
            // Pupil reflection
            ctx.fillStyle = 'rgba(255,255,255,0.55)'
            ctx.beginPath()
            ctx.ellipse(ex + eyeOffsetX - 2.5 * S, ey - 1.5 * S, 2.8 * S, 1.6 * S, -0.3, 0, Math.PI * 2)
            ctx.fill()
          }
          drawEye(-14 * S, 0)
          drawEye(14 * S, 0)
        }

        ctx.restore()
      }

      // ── Blackout overlay ─────────────────────────────────────────────
      if (globalFogDensity > 0) {
        ctx.fillStyle = `rgba(8, 4, 18, ${globalFogDensity})`
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
      <canvas ref={canvasRef} className="welcome-canvas" />

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
