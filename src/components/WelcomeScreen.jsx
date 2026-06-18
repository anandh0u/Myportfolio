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
      gravity: 0.68,
      bounce: -0.28,
      floorY: height * 0.72,
      scale: 1.65,
      squish: 1.0,
      state: 'falling',
      eyeOffsetX: 0,
      time: 0,
      showBubble: false,
      runSpeed: 0,
      stateTime: 0,
      headRotation: 0,
      swayX: 0
    }

    let board = {
      x: width / 2,
      y: height / 2,
      vy: 0,
      vx: 0,
      angle: 0,
      angularVelocity: 0,
      width: Math.min(width * 0.9, 440),
      height: 180,
      showStartBtn: false,
      state: 'idle',
      stateTime: 0
    }

    let shakeTime = 0
    let shakeIntensity = 0
    let particles = []
    let transitionStartedTime = null
    let globalFogDensity = 0
    let hasRevealedProfile = false

    // ─── Particle Classes ───────────────────────────────────────────────
    class CollisionParticle {
      constructor(x, y) {
        this.x = x
        this.y = y
        this.vx = (Math.random() - 0.5) * 14
        this.vy = -Math.random() * 9 - 3
        this.r = Math.random() * 5 + 2
        this.alpha = 1.0
        this.color = Math.random() < 0.65 ? '#00f0ff' : '#6366f1'
      }
      update() {
        this.x += this.vx
        this.y += this.vy
        this.vy += 0.25 // gravity
        this.vx *= 0.97
        this.alpha -= 0.018
      }
      draw(c) {
        c.fillStyle = this.color
        c.globalAlpha = Math.max(0, this.alpha)
        c.shadowBlur = 8; c.shadowColor = this.color
        c.beginPath()
        c.arc(this.x, this.y, this.r, 0, Math.PI * 2)
        c.fill()
        c.shadowBlur = 0
        c.globalAlpha = 1.0
      }
    }

    // ─── Canvas Greeting Card Helpers ────────────────────────────────────
    const drawSciFiCardPath = (c, dx, dy, w, h, clipSize) => {
      c.beginPath()
      c.moveTo(dx - w/2 + clipSize, dy - h/2)
      c.lineTo(dx + w/2, dy - h/2)
      c.lineTo(dx + w/2, dy + h/2 - clipSize)
      c.lineTo(dx + w/2 - clipSize, dy + h/2)
      c.lineTo(dx - w/2, dy + h/2)
      c.lineTo(dx - w/2, dy - h/2 + clipSize)
      c.closePath()
    }

    const drawBoardOnCanvas = (c, b) => {
      const { x, y, width: w, height: h, angle, showStartBtn } = b
      c.save()
      c.translate(x, y)
      c.rotate(angle)

      // Base shadow
      c.fillStyle = 'rgba(0, 0, 0, 0.45)'
      c.shadowBlur = 25; c.shadowColor = 'rgba(0,0,0,0.6)'
      drawSciFiCardPath(c, 4, 4, w, h, 18)
      c.fill()
      c.shadowBlur = 0

      // Card BG
      const bgGrad = c.createLinearGradient(-w/2, -h/2, w/2, h/2)
      bgGrad.addColorStop(0, 'rgba(15, 10, 32, 0.95)')
      bgGrad.addColorStop(1, 'rgba(7, 4, 18, 0.98)')
      c.fillStyle = bgGrad
      drawSciFiCardPath(c, 0, 0, w, h, 18)
      c.fill()

      // Card Border
      const borderGrad = c.createLinearGradient(-w/2, -h/2, w/2, h/2)
      borderGrad.addColorStop(0, 'rgba(0, 240, 255, 0.35)')
      borderGrad.addColorStop(0.5, 'rgba(99, 102, 241, 0.15)')
      borderGrad.addColorStop(1, 'rgba(0, 240, 255, 0.45)')
      c.strokeStyle = borderGrad
      c.lineWidth = 1.5
      c.beginPath()
      drawSciFiCardPath(c, 0, 0, w, h, 18)
      c.stroke()

      // Decor dots
      const dotX = -w / 2 + 25
      const dotY = -h / 2 + 25
      c.fillStyle = '#ff5f56'; c.beginPath(); c.arc(dotX, dotY, 4, 0, Math.PI * 2); c.fill()
      c.fillStyle = '#ffbd2e'; c.beginPath(); c.arc(dotX + 10, dotY, 4, 0, Math.PI * 2); c.fill()
      c.fillStyle = '#27c93f'; c.beginPath(); c.arc(dotX + 20, dotY, 4, 0, Math.PI * 2); c.fill()

      // Meta text
      c.fillStyle = 'rgba(99, 102, 241, 0.85)'
      c.font = "11px 'JetBrains Mono', monospace"
      c.textAlign = 'left'
      c.textBaseline = 'top'
      c.fillText('[ query_greeting // handshake ]', -w / 2 + 55, -h / 2 + 20)

      // Text
      c.fillStyle = '#ffffff'
      c.font = "bold 20px 'Outfit', sans-serif"
      c.textAlign = 'center'
      c.textBaseline = 'middle'
      c.fillText('hey... wanna explore about me?', 0, -15)

      // Start Button
      if (showStartBtn) {
        c.save()
        c.strokeStyle = 'rgba(0, 240, 255, 0.65)'
        c.fillStyle = 'rgba(0, 240, 255, 0.08)'
        c.lineWidth = 1
        c.beginPath()
        const bw = 120, bh = 36
        const bx = -bw / 2, by = 40
        roundedRect(c, bx, by, bw, bh, 5)
        c.fill()
        c.stroke()

        c.fillStyle = '#00f0ff'
        c.font = "bold 13px 'JetBrains Mono', monospace"
        c.textAlign = 'center'
        c.textBaseline = 'middle'
        c.fillText('start', 0, 40 + bh / 2)
        c.restore()
      }

      c.restore()
    }

    // ─── Dizzy Stars Helper ──────────────────────────────────────────────
    const drawDizzyStars = (c, rx, ry, S) => {
      c.save()
      const numStars = 3
      const orbitRadiusX = 42 * S
      const orbitRadiusY = 10 * S
      c.fillStyle = '#ffbd2e'
      c.shadowBlur = 8; c.shadowColor = '#ffbd2e'
      for (let i = 0; i < numStars; i++) {
        const angle = (robot.time * 0.12) + (i * (Math.PI * 2) / numStars)
        const sx = Math.cos(angle) * orbitRadiusX
        const sy = Math.sin(angle) * orbitRadiusY - 60 * S

        c.beginPath()
        c.moveTo(rx + sx, ry + sy - 5 * S)
        c.lineTo(rx + sx + 1.8 * S, ry + sy - 1.8 * S)
        c.lineTo(rx + sx + 5 * S, ry + sy)
        c.lineTo(rx + sx + 1.8 * S, ry + sy + 1.8 * S)
        c.lineTo(rx + sx, ry + sy + 5 * S)
        c.lineTo(rx + sx - 1.8 * S, ry + sy + 1.8 * S)
        c.lineTo(rx + sx - 5 * S, ry + sy)
        c.lineTo(rx + sx - 1.8 * S, ry + sy - 1.8 * S)
        c.closePath()
        c.fill()
      }
      c.restore()
    }

    // ─── Metallic gradient helper ─────────────────────────────────────
    const metallicGrad = (hx, hy, hr, tx, ty, tr) => {
      const g = ctx.createRadialGradient(hx, hy, hr, tx, ty, tr)
      g.addColorStop(0,   '#ffffff')
      g.addColorStop(0.15, '#fafcff')
      g.addColorStop(0.45, '#dbe5f0')
      g.addColorStop(0.70, '#b0c7db')
      g.addColorStop(0.85, '#8ba3bf')
      g.addColorStop(0.95, '#5c7894')
      g.addColorStop(1,    '#435a70')
      return g
    }

    // ─── Rim light helper ──────────────────────────────────────────────
    const rimLight = (x, y, rx, ry, color = 'rgba(0,240,255,0.22)') => {
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

      // Apply camera shake if active
      ctx.save()
      if (shakeTime > 0) {
        const intensity = (shakeTime / 25) * shakeIntensity
        const dx = (Math.random() - 0.5) * intensity
        const dy = (Math.random() - 0.5) * intensity
        ctx.translate(dx, dy)
        shakeTime--
      }

      // Update and draw collision dust
      particles = particles.filter(p => {
        p.update()
        p.draw(ctx)
        return p.alpha > 0
      })

      // ─── Physics / State Machine ────────────────────────────────────
      if (phase === 'transitioning') {
        if (!transitionStartedTime) transitionStartedTime = Date.now()

        // Robot Physics
        if (robot.state === 'falling') {
          robot.vy += robot.gravity
          robot.y += robot.vy
          if (robot.y >= robot.floorY) {
            robot.y = robot.floorY
            robot.vy = robot.vy * robot.bounce
            robot.squish = 0.55
            if (Math.abs(robot.vy) < 1.8) {
              robot.vy = 0
              robot.state = 'standing'
              robot.stateTime = 0
            }
          }
        } else if (robot.state === 'standing') {
          robot.squish += (1.0 - robot.squish) * 0.18
          if (Math.abs(robot.squish - 1.0) < 0.02) {
            robot.squish = 1.0
            // Trigger board fall after robot stands up
            if (board.state === 'idle') {
              board.state = 'shake'
              board.stateTime = 0
            }
          }
        } else if (robot.state === 'squashed') {
          robot.stateTime++
          robot.squish = 0.22
          if (robot.stateTime > 45) {
            robot.state = 'pushing'
            robot.stateTime = 0
          }
        } else if (robot.state === 'pushing') {
          robot.stateTime++
          // Push card off head
          robot.squish += (0.75 - robot.squish) * 0.12
          board.y = robot.y - 95 * robot.scale * robot.squish - 22
          board.angle += 0.035 // Tilt card off
          if (robot.squish >= 0.7) {
            board.state = 'sliding'
            board.vx = -12
            board.vy = -4
            board.angularVelocity = -0.06
            robot.state = 'confused'
            robot.stateTime = 0
          }
        } else if (robot.state === 'confused') {
          robot.stateTime++
          robot.squish += (1.0 - robot.squish) * 0.15
          robot.eyeOffsetX = Math.sin(robot.time * 0.45) * 8
          robot.headRotation = Math.sin(robot.time * 0.65) * 0.14
          robot.swayX = Math.sin(robot.time * 0.22) * 5
          if (robot.stateTime > 90) {
            robot.state = 'hi'
            robot.stateTime = 0
            robot.eyeOffsetX = 0
            robot.headRotation = 0
            robot.swayX = 0
            robot.showBubble = true
          }
        } else if (robot.state === 'hi') {
          robot.stateTime++
          if (robot.stateTime > 60) {
            robot.state = 'running'
            robot.stateTime = 0
            robot.showBubble = false
          }
        } else if (robot.state === 'running') {
          robot.runSpeed = Math.min(robot.runSpeed + 1.2, 22)
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

        // Board Physics
        if (board.state === 'shake') {
          board.stateTime++
          board.x = width / 2 + (Math.random() - 0.5) * 8
          board.y = height / 2 + (Math.random() - 0.5) * 8
          board.angle = (Math.random() - 0.5) * 0.05
          if (board.stateTime > 12) {
            board.state = 'falling'
            board.x = width / 2
            board.y = height / 2
            board.angle = 0
            board.vy = 1
            board.vx = -1.2 // slightly drift left
            board.angularVelocity = 0.016
          }
        } else if (board.state === 'falling') {
          board.vy += 0.55 // gravity
          board.y += board.vy
          board.x += board.vx
          board.angle += board.angularVelocity

          // Collision Check
          const robotHeadY = robot.y - 95 * robot.scale * robot.squish
          if (board.y + 60 >= robotHeadY) {
            board.state = 'collided'
            board.y = robotHeadY - 30
            board.vy = 0
            board.vx = 0
            board.angularVelocity = 0
            board.angle = 0.06 // rest tilted slightly

            robot.state = 'squashed'
            robot.stateTime = 0
            robot.squish = 0.22

            // Camera shake & dust particles
            shakeTime = 25
            shakeIntensity = 20
            for (let i = 0; i < 30; i++) {
              particles.push(new CollisionParticle(robot.x, robotHeadY + 25))
            }
          }
        } else if (board.state === 'collided') {
          // Resting on robot head
          const robotHeadY = robot.y - 95 * robot.scale * robot.squish
          board.y = robotHeadY - 20
        } else if (board.state === 'sliding') {
          board.vy += 0.5 // gravity
          board.x += board.vx
          board.y += board.vy
          board.angle += board.angularVelocity
          if (board.x < -board.width || board.y > height + board.height) {
            board.state = 'hidden'
          }
        }

        if (hasRevealedProfile) {
          globalFogDensity = Math.min(globalFogDensity + 0.025, 1.0)
        }
      }

      // ─── Drawing ────────────────────────────────────────────────────
      if (phase === 'transitioning') {
        const { x, y, scale: S, squish, state, eyeOffsetX, time } = robot

        // Apply sway/offsets from confusion state
        const rx = x + (robot.swayX || 0)
        const ry = y

        // ── Drawing greeting board on canvas (drawn in background) ───
        if (board.state !== 'hidden') {
          drawBoardOnCanvas(ctx, board)
        }

        // ── Ground Shadow ────────────────────────────────────────────
        const distToFloor = Math.max(0, robot.floorY - ry)
        const sSc = Math.max(0.1, Math.min(1, 1 - distToFloor / 480))
        const sG = ctx.createRadialGradient(rx, robot.floorY + 22 * S, 1, rx, robot.floorY + 22 * S, 40 * S * sSc)
        sG.addColorStop(0, `rgba(0,5,20,${0.45 * sSc})`)
        sG.addColorStop(1, 'rgba(0,5,20,0)')
        ctx.fillStyle = sG
        ctx.beginPath()
        ctx.ellipse(rx, robot.floorY + 22 * S, 40 * S * sSc, 10 * S * sSc, 0, 0, Math.PI * 2)
        ctx.fill()

        // ── Thruster Flame & Nozzle ──────────────────────────────────
        if (state === 'falling' || state === 'standing' || state === 'confused' || state === 'hi' || state === 'running') {
          ctx.save()
          ctx.translate(rx, ry + 40 * S * squish)
          ctx.scale(1, squish)

          // 1. Thruster Nozzle
          const nG = ctx.createLinearGradient(-15 * S, 0, 15 * S, 10 * S)
          nG.addColorStop(0, '#2b3545')
          nG.addColorStop(0.5, '#506075')
          nG.addColorStop(1, '#18202b')
          ctx.fillStyle = nG
          ctx.beginPath()
          ctx.moveTo(-15 * S, 0)
          ctx.lineTo(-10 * S, 11 * S)
          ctx.lineTo(10 * S, 11 * S)
          ctx.lineTo(15 * S, 0)
          ctx.closePath()
          ctx.fill()

          ctx.strokeStyle = 'rgba(0, 240, 255, 0.75)'
          ctx.shadowBlur = 8; ctx.shadowColor = '#00f0ff'
          ctx.lineWidth = 2 * S
          ctx.beginPath()
          ctx.moveTo(-10 * S, 11 * S)
          ctx.lineTo(10 * S, 11 * S)
          ctx.stroke()
          ctx.shadowBlur = 0
          ctx.restore()

          // 2. Thruster Flame
          if (state === 'falling' || state === 'standing' || state === 'running') {
            ctx.save()
            ctx.translate(rx, ry + 50 * S * squish)
            const flameH = (22 + Math.random() * 10) * S
            const fg1 = ctx.createLinearGradient(0, 0, 0, flameH)
            fg1.addColorStop(0, 'rgba(0,240,255,0.95)')
            fg1.addColorStop(0.35, 'rgba(99,102,241,0.7)') // indigo
            fg1.addColorStop(0.75, 'rgba(255,0,127,0.35)')
            fg1.addColorStop(1, 'rgba(255,0,127,0)')
            ctx.fillStyle = fg1
            ctx.shadowBlur = 22; ctx.shadowColor = '#00f0ff'
            ctx.beginPath()
            ctx.moveTo(-8 * S, 0)
            ctx.quadraticCurveTo(0, flameH * 1.8, 8 * S, 0)
            ctx.fill()
            ctx.shadowBlur = 0
            ctx.restore()
          }
        }

        // Helper to draw shoulder sockets
        const drawShoulderSocket = (side, tx, ty) => {
          ctx.save()
          ctx.translate(tx, ty)
          // Recess Shadow
          ctx.fillStyle = 'rgba(8, 12, 20, 0.82)'
          ctx.beginPath()
          ctx.arc(0, 0, 11 * S, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
          ctx.lineWidth = 1 * S
          ctx.stroke()

          // Metallic ball joint
          const ballG = ctx.createRadialGradient(-3 * S * side, -3 * S, 0, 0, 0, 8 * S)
          ballG.addColorStop(0, '#ffffff')
          ballG.addColorStop(0.25, '#c5d8ea')
          ballG.addColorStop(0.75, '#6a82a0')
          ballG.addColorStop(1, '#324254')
          ctx.fillStyle = ballG
          ctx.beginPath()
          ctx.arc(0, 0, 8 * S, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }

        // Helper to draw arms
        const drawArm = (side, angle, tx, ty) => {
          ctx.save()
          ctx.translate(tx, ty)
          ctx.rotate(angle)

          // Drop shadow behind arm
          ctx.fillStyle = 'rgba(5, 8, 15, 0.25)'
          ctx.beginPath()
          ctx.ellipse(2 * side * S, 3 * S, 9 * S, 27 * S, 0, 0, Math.PI * 2)
          ctx.fill()

          ctx.fillStyle = metallicGrad(
            side < 0 ? 3 * S : -3 * S, -12 * S, 3 * S,
            0, 0, 26 * S
          )
          ctx.beginPath()
          ctx.ellipse(0, 0, 9 * S, 27 * S, 0, 0, Math.PI * 2)
          ctx.fill()
          rimLight(0, 0, 9 * S, 27 * S)

          // Arm specular glint
          const aSpec = ctx.createRadialGradient(
            side < 0 ? 3 * S : -3 * S, -12 * S, 0,
            0, -6 * S, 12 * S
          )
          aSpec.addColorStop(0, 'rgba(255,255,255,0.6)')
          aSpec.addColorStop(1, 'rgba(255,255,255,0)')
          ctx.fillStyle = aSpec
          ctx.beginPath()
          ctx.ellipse(side < 0 ? 2.5 * S : -2.5 * S, -8 * S, 4 * S, 12 * S, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }

        // Draw Shoulder Sockets
        drawShoulderSocket(-1, rx - 38 * S, ry + 8 * S * squish)
        drawShoulderSocket(1, rx + 38 * S, ry + 8 * S * squish)

        // Left Arm (waving or running)
        if (state === 'hi') {
          drawArm(-1, Math.sin(time * 0.16) * 0.55 - 1.1, rx - 38 * S, ry + 8 * S * squish)
        } else if (state === 'running') {
          drawArm(-1, 0.45 + Math.sin(time * 0.28) * 0.75, rx - 38 * S, ry + 8 * S * squish)
        } else {
          drawArm(-1, 0.12, rx - 38 * S, ry + 8 * S * squish)
        }

        // Right Arm
        if (state === 'running') {
          drawArm(1, -0.45 - Math.sin(time * 0.28) * 0.75, rx + 38 * S, ry + 8 * S * squish)
        } else {
          drawArm(1, -0.12, rx + 38 * S, ry + 8 * S * squish)
        }

        // ── Torso/Body ────────────────────────────────────────────────
        ctx.save()
        ctx.translate(rx, ry)
        ctx.scale(1, squish)

        // Ambient shadow under head
        ctx.fillStyle = 'rgba(5, 8, 15, 0.35)'
        ctx.beginPath()
        ctx.ellipse(0, -28 * S, 32 * S, 7 * S, 0, 0, Math.PI * 2)
        ctx.fill()

        //Torso body base
        ctx.fillStyle = metallicGrad(-8 * S, -14 * S, 3 * S, 0, 12 * S, 48 * S)
        ctx.beginPath()
        ctx.ellipse(0, 12 * S, 38 * S, 44 * S, 0, 0, Math.PI * 2)
        ctx.fill()
        rimLight(0, 12 * S, 38 * S, 44 * S)

        // Torso panel split lines
        ctx.strokeStyle = 'rgba(8, 15, 28, 0.2)'
        ctx.lineWidth = 1 * S
        ctx.beginPath()
        // vertical center split
        ctx.moveTo(0, -24 * S)
        ctx.lineTo(0, -6 * S)
        ctx.moveTo(0, 24 * S)
        ctx.lineTo(0, 48 * S)
        // horizontal seam split
        ctx.moveTo(-32 * S, 20 * S)
        ctx.quadraticCurveTo(0, 24 * S, 32 * S, 20 * S)
        ctx.stroke()

        // Torso panel split highlights
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
        ctx.beginPath()
        ctx.moveTo(0.8 * S, -24 * S)
        ctx.lineTo(0.8 * S, -6 * S)
        ctx.moveTo(0.8 * S, 24 * S)
        ctx.lineTo(0.8 * S, 48 * S)
        ctx.moveTo(-32 * S, 20.8 * S)
        ctx.quadraticCurveTo(0, 24.8 * S, 32 * S, 20.8 * S)
        ctx.stroke()

        // Body specular reflection
        const bSpec = ctx.createRadialGradient(-10 * S, -6 * S, 0, -5 * S, 4 * S, 28 * S)
        bSpec.addColorStop(0, 'rgba(255,255,255,0.58)')
        bSpec.addColorStop(0.5, 'rgba(255,255,255,0.18)')
        bSpec.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = bSpec
        ctx.beginPath()
        ctx.ellipse(-4 * S, 2 * S, 24 * S, 18 * S, -0.1, 0, Math.PI * 2)
        ctx.fill()

        // Torso Decal (V-01 styling)
        ctx.fillStyle = 'rgba(99, 102, 241, 0.3)'
        ctx.font = `bold ${6 * S}px 'JetBrains Mono', monospace`
        ctx.textAlign = 'right'
        ctx.fillText('V-01', -20 * S, -12 * S)

        // Chest display bezel
        ctx.strokeStyle = 'rgba(100, 130, 160, 0.4)'
        ctx.lineWidth = 1 * S
        ctx.beginPath()
        roundedRect(ctx, -23 * S, -6 * S, 46 * S, 30 * S, 6 * S)
        ctx.stroke()

        // Chest screen dark glass
        ctx.fillStyle = 'rgba(3,10,24,0.95)'
        ctx.beginPath()
        roundedRect(ctx, -22 * S, -5 * S, 44 * S, 28 * S, 5 * S)
        ctx.fill()

        // ECG Heart line
        const pulse = (Math.sin(time * 0.055) + 1) / 2
        ctx.strokeStyle = `rgba(0, 240, 255, ${0.65 + pulse * 0.35})`
        ctx.shadowBlur = 8; ctx.shadowColor = '#00f0ff'
        ctx.lineWidth = 2.0 * S
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
        // Translate to head center including neck flex and sway
        ctx.translate(rx, ry - 70 * S * squish)
        ctx.rotate(robot.headRotation || 0)
        ctx.scale(1, squish)

        // Neck joint
        const nkG = ctx.createLinearGradient(-7 * S, -7 * S, 7 * S, 5 * S)
        nkG.addColorStop(0, '#b8cfe8')
        nkG.addColorStop(0.5, '#e8f0f8')
        nkG.addColorStop(1, '#7a94b4')
        ctx.fillStyle = nkG
        ctx.beginPath()
        ctx.ellipse(0, 0, 12 * S, 7 * S, 0, 0, Math.PI * 2)
        ctx.fill()

        // Head egg body
        ctx.translate(0, -9 * S)
        ctx.fillStyle = metallicGrad(-14 * S, -18 * S, 5 * S, 0, 0, 52 * S)
        ctx.beginPath()
        ctx.ellipse(0, 0, 48 * S, 36 * S, 0, 0, Math.PI * 2)
        ctx.fill()
        rimLight(0, 0, 48 * S, 36 * S)

        // Head Panel Line (Seam)
        ctx.strokeStyle = 'rgba(8, 15, 28, 0.16)'
        ctx.lineWidth = 1 * S
        ctx.beginPath()
        ctx.ellipse(0, 3 * S, 47.5 * S, 35.5 * S, 0, -Math.PI * 0.8, -Math.PI * 0.2)
        ctx.stroke()
        // Highlight directly below panel line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.beginPath()
        ctx.ellipse(0, 4 * S, 47.5 * S, 35.5 * S, 0, -Math.PI * 0.8, -Math.PI * 0.2)
        ctx.stroke()

        // Head top glossy reflection
        const hSpec = ctx.createRadialGradient(-16 * S, -20 * S, 0, -10 * S, -14 * S, 30 * S)
        hSpec.addColorStop(0, 'rgba(255,255,255,0.72)')
        hSpec.addColorStop(0.4, 'rgba(255,255,255,0.22)')
        hSpec.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = hSpec
        ctx.beginPath()
        ctx.ellipse(-8 * S, -14 * S, 28 * S, 14 * S, -0.15, 0, Math.PI * 2)
        ctx.fill()

        // Antenna
        ctx.save()
        ctx.translate(18 * S, -32 * S)
        // Base collar
        ctx.fillStyle = '#6c82a0'
        ctx.beginPath(); ctx.ellipse(0, 0, 3 * S, 1.5 * S, 0, 0, Math.PI * 2); ctx.fill()
        // Antenna rod
        ctx.strokeStyle = '#9bb0c8'; ctx.lineWidth = 2 * S
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -15 * S); ctx.stroke()
        // Glow orb
        const abG = ctx.createRadialGradient(-1.8 * S, -17 * S, 0, 0, -15 * S, 5.5 * S)
        abG.addColorStop(0, '#ffffff')
        abG.addColorStop(0.45, '#00f0ff')
        abG.addColorStop(1, '#0058b8')
        ctx.fillStyle = abG
        ctx.shadowBlur = 10; ctx.shadowColor = '#00f0ff'
        ctx.beginPath(); ctx.arc(0, -15 * S, 4.5 * S, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0
        ctx.restore()

        // Visor Bezel
        ctx.strokeStyle = 'rgba(100, 130, 160, 0.45)'
        ctx.lineWidth = 1.5 * S
        ctx.beginPath()
        ctx.ellipse(0, 0, 38.5 * S, 21.5 * S, 0, 0, Math.PI * 2)
        ctx.stroke()

        // Deep visor inner recess shadow
        ctx.fillStyle = 'rgba(5, 8, 15, 0.45)'
        ctx.beginPath()
        ctx.ellipse(0, 1 * S, 37.5 * S, 20.5 * S, 0, 0, Math.PI * 2)
        ctx.fill()

        // Visor dark faceplate glass
        const vG = ctx.createLinearGradient(0, -20 * S, 0, 20 * S)
        vG.addColorStop(0, '#010c1e')
        vG.addColorStop(0.5, '#0c1e3a')
        vG.addColorStop(1, '#15294e')
        ctx.fillStyle = vG
        ctx.beginPath()
        ctx.ellipse(0, 0, 37 * S, 20 * S, 0, 0, Math.PI * 2)
        ctx.fill()

        // Visor glow border
        ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(0,240,255,0.45)'
        ctx.strokeStyle = 'rgba(0,240,255,0.32)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.ellipse(0, 0, 37 * S, 20 * S, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.shadowBlur = 0

        // Visor reflection sheen
        const vsG = ctx.createLinearGradient(-26 * S, -17 * S, 16 * S, -6 * S)
        vsG.addColorStop(0, 'rgba(255,255,255,0.22)')
        vsG.addColorStop(0.35, 'rgba(255,255,255,0.06)')
        vsG.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = vsG
        ctx.beginPath()
        ctx.ellipse(-6 * S, -6 * S, 28 * S, 11 * S, -0.15, 0, Math.PI * 2)
        ctx.fill()

        // Visor sharp secondary glint
        const vsG2 = ctx.createRadialGradient(-16 * S, -10 * S, 0, -16 * S, -10 * S, 8 * S)
        vsG2.addColorStop(0, 'rgba(255, 255, 255, 0.45)')
        vsG2.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = vsG2
        ctx.beginPath()
        ctx.arc(-16 * S, -9 * S, 6 * S, 0, Math.PI * 2)
        ctx.fill()

        // Eyes rendering helper
        const drawProjectorEye = (ex, ey, offset) => {
          ctx.save()
          ctx.translate(ex, ey)

          // Lens casing border
          ctx.strokeStyle = 'rgba(100, 130, 160, 0.7)'
          ctx.lineWidth = 1 * S
          ctx.beginPath()
          ctx.ellipse(offset, 0, 8.5 * S, 5.5 * S, 0, 0, Math.PI * 2)
          ctx.stroke()

          const isBlink = robot.time % 195 < 8

          if (isBlink) {
            ctx.fillStyle = '#00f0ff'
            ctx.shadowBlur = 10; ctx.shadowColor = '#00f0ff'
            ctx.fillRect(-6 * S + offset, -1.2 * S, 12 * S, 2.4 * S)
            ctx.shadowBlur = 0
          } else if (state === 'confused') {
            // Crossed dizzy eyes
            ctx.strokeStyle = '#00f0ff'
            ctx.lineWidth = 2.5 * S; ctx.lineCap = 'round'
            ctx.shadowBlur = 12; ctx.shadowColor = '#00f0ff'
            ctx.beginPath()
            ctx.moveTo(-4 * S + offset, -3 * S)
            ctx.lineTo(4 * S + offset, 3 * S)
            ctx.moveTo(4 * S + offset, -3 * S)
            ctx.lineTo(-4 * S + offset, 3 * S)
            ctx.stroke()
            ctx.shadowBlur = 0
          } else if (state === 'hi') {
            // Wave arch happy eyes
            ctx.strokeStyle = '#00f0ff'
            ctx.lineWidth = 3 * S; ctx.lineCap = 'round'
            ctx.shadowBlur = 12; ctx.shadowColor = '#00f0ff'
            ctx.beginPath()
            ctx.arc(offset, 1.2 * S, 6 * S, Math.PI, 0)
            ctx.stroke()
            ctx.shadowBlur = 0
          } else {
            // Deep glowing iris
            const eg = ctx.createRadialGradient(offset - 2.2 * S, -1.5 * S, 0, offset, 0, 8 * S)
            eg.addColorStop(0, '#ffffff')
            eg.addColorStop(0.25, '#9bf6ff')
            eg.addColorStop(0.55, '#00dfff')
            eg.addColorStop(0.85, '#007cdb')
            eg.addColorStop(1, '#003a8a')
            ctx.fillStyle = eg
            ctx.shadowBlur = 15; ctx.shadowColor = '#00f0ff'
            ctx.beginPath()
            ctx.ellipse(offset, 0, 7.5 * S, 4.5 * S, 0, 0, Math.PI * 2)
            ctx.fill()
            ctx.shadowBlur = 0

            // Inner sub-aperture ring
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)'
            ctx.lineWidth = 0.8 * S
            ctx.beginPath()
            ctx.ellipse(offset, 0, 5.5 * S, 3 * S, 0, 0, Math.PI * 2)
            ctx.stroke()

            // Pupil reflection glint
            ctx.fillStyle = 'rgba(255, 255, 255, 0.65)'
            ctx.beginPath()
            ctx.ellipse(offset - 2 * S, -1 * S, 2 * S, 1.2 * S, -0.3, 0, Math.PI * 2)
            ctx.fill()
          }
          ctx.restore()
        }

        drawProjectorEye(-14 * S, 0, eyeOffsetX)
        drawProjectorEye(14 * S, 0, eyeOffsetX)

        ctx.restore() // restore from head translate/rotate

        // ── Dizzy Stars (drawn above head, relative to robot) ──────────
        if (state === 'confused') {
          drawDizzyStars(ctx, rx, ry - 70 * S * squish, S)
        }

        ctx.restore() // restore from body translate/scale

        // ── Speech Bubble (drawn on top of everything) ──────────────────
        if (robot.showBubble) {
          ctx.save()
          ctx.translate(rx + 20 * S, ry - 118 * S)

          // Bubble shadow
          ctx.fillStyle = 'rgba(0,0,0,0.25)'
          ctx.beginPath()
          roundedRect(ctx, -44 * S + 3, -24 * S + 3, 92 * S, 44 * S, 9 * S)
          ctx.fill()

          // Bubble body gradient
          const bgG = ctx.createLinearGradient(-44 * S, -24 * S, 44 * S, 20 * S)
          bgG.addColorStop(0, '#6366f1') // Indigo professional
          bgG.addColorStop(1, '#4f46e5')
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
          ctx.fillStyle = '#4f46e5'
          ctx.beginPath()
          ctx.moveTo(-10 * S, 20 * S)
          ctx.lineTo(0, 30 * S)
          ctx.lineTo(10 * S, 20 * S)
          ctx.fill()

          // Text
          ctx.fillStyle = '#ffffff'
          ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(99,102,241,0.5)'
          ctx.font = `bold ${14 * S}px 'JetBrains Mono', monospace`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('hii! 👋', 0, -2 * S)
          ctx.shadowBlur = 0
          ctx.restore()
        }

        ctx.restore() // Restore from camera shake translate
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
