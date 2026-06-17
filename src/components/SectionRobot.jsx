import { useEffect, useRef, useState } from 'react'

export default function SectionRobot({ action = 'coffee' }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const requestRef = useRef(null)
  const [flightPhase, setFlightPhase] = useState('idle')
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true)
        } else {
          setShouldRender(false)
          setFlightPhase('idle')
        }
      },
      { threshold: 0.1 }
    )
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!shouldRender) return

    let activeTimeout, innerTimeout, resetTimeout

    setFlightPhase('entering')

    const triggerNextCycle = () => {
      const nextDelay = 18000 + Math.random() * 12000
      activeTimeout = setTimeout(() => {
        setFlightPhase('entering')
        innerTimeout = setTimeout(() => {
          setFlightPhase('exiting')
          resetTimeout = setTimeout(() => {
            setFlightPhase('idle')
            triggerNextCycle()
          }, 1200)
        }, 8000)
      }, nextDelay)
    }

    activeTimeout = setTimeout(() => {
      setFlightPhase('exiting')
      resetTimeout = setTimeout(() => {
        setFlightPhase('idle')
        triggerNextCycle()
      }, 1200)
    }, 10000)

    return () => {
      clearTimeout(activeTimeout)
      clearTimeout(innerTimeout)
      clearTimeout(resetTimeout)
    }
  }, [shouldRender])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const W = (canvas.width = 200)
    const H = (canvas.height = 200)
    const cx = W / 2
    const cy = H / 2 + 15
    const S = 0.72 // master scale

    let time = 0
    let steamParticles = []
    let codeParticles = []
    let sparkParticles = []
    let glowPulse = 0

    // ─── Particle Classes ───────────────────────────────────────────────
    class SteamParticle {
      constructor(x, y) {
        this.x = x; this.y = y
        this.vx = (Math.random() - 0.5) * 0.4
        this.vy = -Math.random() * 0.9 - 0.5
        this.r = Math.random() * 3 + 1.5
        this.a = 0.55
      }
      update() { this.x += this.vx; this.y += this.vy; this.a -= 0.012; this.r += 0.04 }
      draw(c) {
        const g = c.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r)
        g.addColorStop(0, `rgba(255,220,230,${this.a})`)
        g.addColorStop(1, `rgba(255,200,210,0)`)
        c.fillStyle = g; c.beginPath(); c.arc(this.x, this.y, this.r, 0, Math.PI * 2); c.fill()
      }
    }

    class CodeParticle {
      constructor(x, y) {
        this.x = x; this.y = y
        this.char = ['0','1','{','}','<','>','+',';','/','λ','∑','π'][Math.floor(Math.random() * 12)]
        this.vy = -Math.random() * 1.0 - 0.6
        this.vx = (Math.random() - 0.5) * 0.5
        this.a = 0.9
        this.size = Math.random() * 4 + 7
      }
      update() { this.x += this.vx; this.y += this.vy; this.a -= 0.018 }
      draw(c) {
        c.fillStyle = `rgba(0,240,255,${this.a})`
        c.shadowBlur = 6; c.shadowColor = '#00f0ff'
        c.font = `bold ${this.size}px 'JetBrains Mono', monospace`
        c.fillText(this.char, this.x, this.y)
        c.shadowBlur = 0
      }
    }

    class SparkParticle {
      constructor(x, y) {
        this.x = x; this.y = y
        this.vx = (Math.random() - 0.5) * 3.5
        this.vy = (Math.random() - 0.5) * 3.5 - 1.2
        this.a = 1.0
        this.r = Math.random() * 1.8 + 0.6
        this.color = Math.random() < 0.5 ? '251,191,36' : '255,120,0'
      }
      update() { this.x += this.vx; this.y += this.vy; this.vy += 0.08; this.a -= 0.04 }
      draw(c) {
        c.fillStyle = `rgba(${this.color},${this.a})`
        c.shadowBlur = 4; c.shadowColor = `rgba(${this.color},1)`
        c.beginPath(); c.arc(this.x, this.y, this.r, 0, Math.PI * 2); c.fill()
        c.shadowBlur = 0
      }
    }

    // ─── Core Drawing Helpers ───────────────────────────────────────────
    const roundedRect = (c, x, y, w, h, r) => {
      const rad = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2))
      c.moveTo(x + rad, y)
      c.lineTo(x + w - rad, y)
      c.quadraticCurveTo(x + w, y, x + w, y + rad)
      c.lineTo(x + w, y + h - rad)
      c.quadraticCurveTo(x + w, y + h, x + w - rad, y + h)
      c.lineTo(x + rad, y + h)
      c.quadraticCurveTo(x, y + h, x, y + h - rad)
      c.lineTo(x, y + rad)
      c.quadraticCurveTo(x, y, x + rad, y)
    }

    // ─── Metallic White Surface Gradient ───────────────────────────────
    const metallicGrad = (c, hx, hy, hr, tx, ty, tr) => {
      const g = c.createRadialGradient(hx, hy, hr, tx, ty, tr)
      g.addColorStop(0,   '#ffffff')
      g.addColorStop(0.15,'#f9fbff')
      g.addColorStop(0.55,'#e8f0f8')
      g.addColorStop(0.82,'#c5d4e8')
      g.addColorStop(1,   '#8fa8c8')
      return g
    }

    // ─── Rim Light Effect ───────────────────────────────────────────────
    const rimLight = (c, x, y, rx, ry, color = 'rgba(0,240,255,0.18)') => {
      const stroke = c.createLinearGradient(x - rx, y, x + rx, y)
      stroke.addColorStop(0, color)
      stroke.addColorStop(0.5, 'rgba(255,255,255,0)')
      stroke.addColorStop(1, color)
      c.strokeStyle = stroke
      c.lineWidth = 1.5
      c.beginPath()
      c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
      c.stroke()
    }

    // ─── Draw Head ──────────────────────────────────────────────────────
    const drawHead = (eyeState = 'normal', eyeOffsetX = 0) => {
      const hx = 0, hy = -44 * S

      // Neck joint
      const neckG = ctx.createLinearGradient(-5 * S, -28 * S, 5 * S, -22 * S)
      neckG.addColorStop(0, '#c0d0e0')
      neckG.addColorStop(0.5, '#e8f0f8')
      neckG.addColorStop(1, '#8fa8c8')
      ctx.fillStyle = neckG
      ctx.beginPath()
      ctx.ellipse(0, -30 * S, 9 * S, 6 * S, 0, 0, Math.PI * 2)
      ctx.fill()

      // Head - egg ellipse
      ctx.fillStyle = metallicGrad(ctx, -10 * S, -53 * S, 4 * S, 0, hy, 40 * S)
      ctx.beginPath()
      ctx.ellipse(hx, hy, 36 * S, 27 * S, 0, 0, Math.PI * 2)
      ctx.fill()

      // Rim light on head
      rimLight(ctx, hx, hy, 36 * S, 27 * S, 'rgba(0,240,255,0.15)')

      // Head top specular highlight
      const specG = ctx.createRadialGradient(-12 * S, -56 * S, 0, -8 * S, -52 * S, 20 * S)
      specG.addColorStop(0, 'rgba(255,255,255,0.65)')
      specG.addColorStop(0.4, 'rgba(255,255,255,0.2)')
      specG.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = specG
      ctx.beginPath()
      ctx.ellipse(-7 * S, -50 * S, 20 * S, 11 * S, -0.1, 0, Math.PI * 2)
      ctx.fill()

      // Antenna
      ctx.save()
      ctx.translate(14 * S, -66 * S)
      const antG = ctx.createLinearGradient(-1, -8 * S, 1, 0)
      antG.addColorStop(0, '#b8cfe8')
      antG.addColorStop(1, '#d0e4f8')
      ctx.strokeStyle = antG; ctx.lineWidth = 2 * S
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -10 * S); ctx.stroke()
      // antenna ball
      const abG = ctx.createRadialGradient(-1.5 * S, -13 * S, 0, 0, -10 * S, 4 * S)
      abG.addColorStop(0, '#ffffff')
      abG.addColorStop(0.5, '#00f0ff')
      abG.addColorStop(1, '#0080ff')
      ctx.fillStyle = abG
      ctx.shadowBlur = 6; ctx.shadowColor = '#00f0ff'
      ctx.beginPath(); ctx.arc(0, -10 * S, 3.5 * S, 0, Math.PI * 2); ctx.fill()
      ctx.shadowBlur = 0
      ctx.restore()

      // Visor — glossy dark glass
      const vg = ctx.createLinearGradient(0, -56 * S, 0, -35 * S)
      vg.addColorStop(0, '#010b1a')
      vg.addColorStop(0.5, '#0d1f35')
      vg.addColorStop(1, '#152840')
      ctx.fillStyle = vg
      ctx.beginPath()
      ctx.ellipse(hx, hy, 27 * S, 14 * S, 0, 0, Math.PI * 2)
      ctx.fill()

      // Visor edge glow
      ctx.strokeStyle = 'rgba(0,240,255,0.25)'
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.ellipse(hx, hy, 27 * S, 14 * S, 0, 0, Math.PI * 2)
      ctx.stroke()

      // Visor glass sheen
      const vsG = ctx.createLinearGradient(-18 * S, -55 * S, 12 * S, -42 * S)
      vsG.addColorStop(0, 'rgba(255,255,255,0.18)')
      vsG.addColorStop(0.4, 'rgba(255,255,255,0.06)')
      vsG.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = vsG
      ctx.beginPath()
      ctx.ellipse(-4 * S, hy - 3 * S, 20 * S, 8 * S, -0.15, 0, Math.PI * 2)
      ctx.fill()

      // Eyes
      ctx.save()
      ctx.translate(eyeOffsetX, 0)
      const isBlinking = time % 180 < 7

      if (isBlinking) {
        ctx.fillStyle = '#00f0ff'
        ctx.shadowBlur = 5; ctx.shadowColor = '#00f0ff'
        ctx.fillRect(-19 * S, hy - 0.8 * S, 8 * S, 1.5 * S)
        ctx.fillRect(11 * S, hy - 0.8 * S, 8 * S, 1.5 * S)
      } else if (eyeState === 'happy') {
        ctx.strokeStyle = '#00f0ff'
        ctx.shadowBlur = 8; ctx.shadowColor = '#00f0ff'
        ctx.lineWidth = 2.5 * S; ctx.lineCap = 'round'
        ctx.beginPath(); ctx.arc(-14 * S, hy, 4.5 * S, Math.PI, 0); ctx.stroke()
        ctx.beginPath(); ctx.arc(14 * S, hy, 4.5 * S, Math.PI, 0); ctx.stroke()
      } else if (eyeState === 'wink') {
        ctx.strokeStyle = '#00f0ff'
        ctx.shadowBlur = 8; ctx.shadowColor = '#00f0ff'
        ctx.lineWidth = 2.5 * S; ctx.lineCap = 'round'
        // one closed arc, one open circle
        ctx.beginPath(); ctx.arc(-14 * S, hy - 1 * S, 4.5 * S, Math.PI, 0); ctx.stroke()
        ctx.beginPath()
        ctx.ellipse(14 * S, hy, 5 * S, 3.2 * S, 0, 0, Math.PI * 2)
        ctx.fillStyle = '#00f0ff'; ctx.fill()
      } else if (eyeState === 'scan') {
        // Scanning horizontal bars
        const sc = Math.sin(time * 0.07) * 4 * S
        ctx.fillStyle = '#00f0ff'
        ctx.shadowBlur = 7; ctx.shadowColor = '#00f0ff'
        ctx.beginPath()
        ctx.rect(-19 * S, hy - 4 * S + sc, 8 * S, 3 * S)
        ctx.rect(11 * S, hy - 4 * S + sc, 8 * S, 3 * S)
        ctx.fill()
      } else {
        // Normal glowing capsule eyes
        const eyeG = ctx.createRadialGradient(-14 * S, hy - 1 * S, 0, -14 * S, hy, 6 * S)
        eyeG.addColorStop(0, '#80ffff')
        eyeG.addColorStop(0.5, '#00f0ff')
        eyeG.addColorStop(1, '#00aadd')
        ctx.fillStyle = eyeG
        ctx.shadowBlur = 10; ctx.shadowColor = '#00f0ff'
        ctx.beginPath()
        ctx.ellipse(-14 * S, hy, 5.5 * S, 3.2 * S, 0, 0, Math.PI * 2)
        ctx.fill()
        const eyeG2 = ctx.createRadialGradient(14 * S, hy - 1 * S, 0, 14 * S, hy, 6 * S)
        eyeG2.addColorStop(0, '#80ffff')
        eyeG2.addColorStop(0.5, '#00f0ff')
        eyeG2.addColorStop(1, '#00aadd')
        ctx.fillStyle = eyeG2
        ctx.beginPath()
        ctx.ellipse(14 * S, hy, 5.5 * S, 3.2 * S, 0, 0, Math.PI * 2)
        ctx.fill()

        // Eye pupil reflections
        ctx.shadowBlur = 0
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.beginPath()
        ctx.ellipse(-15.5 * S, hy - 1.2 * S, 2 * S, 1.2 * S, -0.3, 0, Math.PI * 2)
        ctx.ellipse(12.5 * S, hy - 1.2 * S, 2 * S, 1.2 * S, -0.3, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0
      ctx.restore()
    }

    // ─── Draw Body ──────────────────────────────────────────────────────
    const drawBody = (scaleX = 1, scaleY = 1) => {
      ctx.save()
      ctx.scale(scaleX, scaleY)

      // Thruster flame flicker
      const flameH = (6 + Math.sin(time * 0.45) * 2.5 + Math.random() * 1.5) * S
      const fg = ctx.createLinearGradient(0, 26 * S, 0, 26 * S + flameH * 2.5)
      fg.addColorStop(0, 'rgba(0,240,255,0.85)')
      fg.addColorStop(0.35, 'rgba(100,0,255,0.5)')
      fg.addColorStop(0.7, 'rgba(255,0,127,0.35)')
      fg.addColorStop(1, 'rgba(255,0,127,0)')
      ctx.fillStyle = fg
      ctx.beginPath()
      ctx.moveTo(-5 * S, 26 * S)
      ctx.quadraticCurveTo(0, 26 * S + flameH * 2, 5 * S, 26 * S)
      ctx.fill()

      // Secondary small flame
      const fg2 = ctx.createLinearGradient(0, 26 * S, 0, 26 * S + flameH)
      fg2.addColorStop(0, 'rgba(0,240,255,0.6)')
      fg2.addColorStop(1, 'rgba(0,240,255,0)')
      ctx.fillStyle = fg2
      ctx.beginPath()
      ctx.moveTo(-2.5 * S, 26 * S)
      ctx.quadraticCurveTo(0, 26 * S + flameH * 1.4, 2.5 * S, 26 * S)
      ctx.fill()

      // Body capsule — main
      ctx.fillStyle = metallicGrad(ctx, -8 * S, -8 * S, 4 * S, 0, 10 * S, 38 * S)
      ctx.beginPath()
      ctx.ellipse(0, 9 * S, 29 * S, 34 * S, 0, 0, Math.PI * 2)
      ctx.fill()

      // Body rim light
      rimLight(ctx, 0, 9 * S, 29 * S, 34 * S)

      // Body top highlight
      const bH = ctx.createRadialGradient(-8 * S, -4 * S, 0, -4 * S, 2 * S, 22 * S)
      bH.addColorStop(0, 'rgba(255,255,255,0.5)')
      bH.addColorStop(0.5, 'rgba(255,255,255,0.15)')
      bH.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = bH
      ctx.beginPath()
      ctx.ellipse(-4 * S, 0, 18 * S, 14 * S, -0.1, 0, Math.PI * 2)
      ctx.fill()

      // Chest panel inset
      ctx.fillStyle = 'rgba(5,15,35,0.92)'
      ctx.beginPath()
      roundedRect(ctx, -18 * S, -2 * S, 36 * S, 22 * S, 5 * S)
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,240,255,0.3)'
      ctx.lineWidth = 0.8
      ctx.beginPath()
      roundedRect(ctx, -18 * S, -2 * S, 36 * S, 22 * S, 5 * S)
      ctx.stroke()

      // Chest panel glow strip
      glowPulse = (Math.sin(time * 0.04) + 1) / 2
      const cpG = ctx.createLinearGradient(-18 * S, 0, 18 * S, 0)
      cpG.addColorStop(0, `rgba(0,240,255,${0.08 + glowPulse * 0.07})`)
      cpG.addColorStop(0.5, `rgba(0,240,255,${0.18 + glowPulse * 0.12})`)
      cpG.addColorStop(1, `rgba(0,240,255,${0.08 + glowPulse * 0.07})`)
      ctx.fillStyle = cpG
      ctx.beginPath()
      roundedRect(ctx, -18 * S, -2 * S, 36 * S, 22 * S, 5 * S)
      ctx.fill()

      // ECG line on chest
      ctx.strokeStyle = `rgba(0,240,255,${0.6 + glowPulse * 0.35})`
      ctx.shadowBlur = 5; ctx.shadowColor = '#00f0ff'
      ctx.lineWidth = 1.5
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(-14 * S, 9 * S)
      ctx.lineTo(-7 * S, 9 * S)
      ctx.lineTo(-4 * S, 2 * S)
      ctx.lineTo(0, 16 * S)
      ctx.lineTo(4 * S, 9 * S)
      ctx.lineTo(14 * S, 9 * S)
      ctx.stroke()
      ctx.shadowBlur = 0

      // Body bottom reflection
      const botRef = ctx.createLinearGradient(0, 28 * S, 0, 40 * S)
      botRef.addColorStop(0, 'rgba(0,240,255,0.08)')
      botRef.addColorStop(1, 'rgba(0,240,255,0)')
      ctx.fillStyle = botRef
      ctx.beginPath()
      ctx.ellipse(0, 30 * S, 20 * S, 10 * S, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }

    // ─── Draw Arm ───────────────────────────────────────────────────────
    const drawArm = (side, angle, tx, ty) => {
      ctx.save()
      ctx.translate(tx, ty)
      ctx.rotate(angle)
      const ag = ctx.createRadialGradient(side < 0 ? 3 * S : -3 * S, -10 * S, 1 * S, 0, 0, 18 * S)
      ag.addColorStop(0, '#ffffff')
      ag.addColorStop(0.4, '#e8f0f8')
      ag.addColorStop(0.8, '#c5d4e8')
      ag.addColorStop(1, '#8fa8c8')
      ctx.fillStyle = ag
      ctx.beginPath()
      ctx.ellipse(0, 0, 6 * S, 17 * S, 0, 0, Math.PI * 2)
      ctx.fill()
      rimLight(ctx, 0, 0, 6 * S, 17 * S, 'rgba(0,240,255,0.12)')

      // Arm specular
      const aSpec = ctx.createRadialGradient(side < 0 ? 2 * S : -2 * S, -8 * S, 0, 0, -4 * S, 8 * S)
      aSpec.addColorStop(0, 'rgba(255,255,255,0.5)')
      aSpec.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = aSpec
      ctx.beginPath()
      ctx.ellipse(side < 0 ? 1.5 * S : -1.5 * S, -5 * S, 3.5 * S, 8 * S, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    // ─── Draw Ground Shadow ─────────────────────────────────────────────
    const drawShadow = (opacity = 0.3) => {
      const sG = ctx.createRadialGradient(cx, cy + 54 * S, 1, cx, cy + 54 * S, 28 * S)
      sG.addColorStop(0, `rgba(0,5,20,${opacity})`)
      sG.addColorStop(1, 'rgba(0,5,20,0)')
      ctx.fillStyle = sG
      ctx.beginPath()
      ctx.ellipse(cx, cy + 54 * S, 28 * S, 8 * S, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // ─── Main Animate Loop ───────────────────────────────────────────────
    const animate = () => {
      ctx.clearRect(0, 0, W, H)
      time++

      const hover = Math.sin(time * 0.048) * 5.5

      drawShadow(0.25 + Math.sin(time * 0.048) * 0.05)

      ctx.save()
      ctx.translate(cx, cy + hover)

      // ── COFFEE ──────────────────────────────────────────────────────────
      if (action === 'coffee') {
        // Left arm relaxed tilt
        drawArm(-1, 0.18, -30 * S, 6 * S)

        // Right arm drink cycle
        const dc = (time * 0.018) % (Math.PI * 2)
        const drinking = dc > Math.PI
        const rAngle = drinking ? -1.1 - Math.sin(dc) * 0.3 : -0.22
        drawArm(1, rAngle, 30 * S, 6 * S)

        drawBody()

        // Mug at tip of right arm
        ctx.save()
        ctx.translate(30 * S, 6 * S)
        ctx.rotate(rAngle)
        ctx.translate(0, 14 * S)
        ctx.rotate(-rAngle)

        const mugG = ctx.createLinearGradient(-5 * S, -7 * S, 5 * S, 7 * S)
        mugG.addColorStop(0, '#ff1a8c')
        mugG.addColorStop(1, '#cc006f')
        ctx.fillStyle = mugG
        ctx.beginPath()
        roundedRect(ctx, -5 * S, -7 * S, 11 * S, 13 * S, 2 * S)
        ctx.fill()
        // mug shine
        ctx.fillStyle = 'rgba(255,255,255,0.25)'
        ctx.beginPath()
        roundedRect(ctx, -3.5 * S, -5.5 * S, 4 * S, 5 * S, 1.5 * S)
        ctx.fill()
        // handle
        ctx.strokeStyle = '#ff1a8c'; ctx.lineWidth = 2 * S
        ctx.beginPath(); ctx.arc(6 * S, 0, 3.5 * S, -Math.PI / 2, Math.PI / 2); ctx.stroke()
        ctx.restore()

        // Steam
        if (Math.random() < 0.1) steamParticles.push(new SteamParticle(cx + 30 * S + 6, cy + hover + 8))
        steamParticles = steamParticles.filter(p => p.a > 0)
        steamParticles.forEach(p => { p.update(); p.draw(ctx) })

        drawHead('happy')
      }

      // ── READING ─────────────────────────────────────────────────────────
      else if (action === 'reading') {
        drawArm(-1, 0.32, -30 * S, 6 * S)
        drawArm(1, -0.32, 30 * S, 6 * S)
        drawBody()

        // Holographic tablet below
        ctx.save()
        const htOsc = Math.sin(time * 0.035) * 2
        ctx.translate(0, 30 * S + htOsc)
        ctx.fillStyle = 'rgba(0,240,255,0.07)'
        ctx.strokeStyle = 'rgba(0,240,255,0.45)'
        ctx.lineWidth = 1.2
        ctx.beginPath()
        roundedRect(ctx, -22 * S, 0, 44 * S, 24 * S, 3 * S)
        ctx.fill(); ctx.stroke()

        // Laser scan
        const laserY = (Math.sin(time * 0.055) * 0.5 + 0.5) * 22 * S
        const lG = ctx.createLinearGradient(-22 * S, laserY, 22 * S, laserY)
        lG.addColorStop(0, 'rgba(255,0,127,0)')
        lG.addColorStop(0.1, 'rgba(255,0,127,0.85)')
        lG.addColorStop(0.9, 'rgba(255,0,127,0.85)')
        lG.addColorStop(1, 'rgba(255,0,127,0)')
        ctx.fillStyle = lG
        ctx.fillRect(-22 * S, laserY, 44 * S, 1.5)
        ctx.shadowBlur = 6; ctx.shadowColor = '#ff007f'
        ctx.strokeStyle = `rgba(255,0,127,0.5)`; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(-22 * S, laserY); ctx.lineTo(22 * S, laserY); ctx.stroke()
        ctx.shadowBlur = 0

        // Data lines on tablet
        ctx.strokeStyle = 'rgba(0,240,255,0.4)'; ctx.lineWidth = 0.7
        for (let i = 4 * S; i < 22 * S; i += 4 * S) {
          const alpha = Math.abs(i - laserY) < 3 ? 0 : 1
          ctx.globalAlpha = alpha * 0.5
          ctx.beginPath(); ctx.moveTo(-17 * S, i); ctx.lineTo(17 * S, i); ctx.stroke()
        }
        ctx.globalAlpha = 1
        ctx.restore()

        // Binary particles rising
        if (Math.random() < 0.13)
          codeParticles.push(new CodeParticle(cx + (Math.random() - 0.5) * 35 * S, cy + hover + 26 * S))
        codeParticles = codeParticles.filter(p => p.a > 0)
        codeParticles.forEach(p => { p.update(); p.draw(ctx) })

        drawHead('scan')
      }

      // ── WORKING ──────────────────────────────────────────────────────────
      else if (action === 'working') {
        // Floating code screen beside body
        ctx.restore()
        ctx.save()
        ctx.translate(cx - 48, cy + hover)

        const scW = 24, scH = 30
        ctx.fillStyle = 'rgba(0,240,255,0.04)'
        ctx.strokeStyle = 'rgba(0,240,255,0.28)'
        ctx.lineWidth = 1.2
        ctx.beginPath()
        roundedRect(ctx, 0, -scH / 2, scW, scH, 3)
        ctx.fill(); ctx.stroke()

        // Screen code lines
        ctx.strokeStyle = 'rgba(0,240,255,0.5)'; ctx.lineWidth = 0.8
        for (let i = -scH / 2 + 5; i < scH / 2; i += 5) {
          const lw = (8 + Math.random() * 12)
          ctx.beginPath(); ctx.moveTo(3, i); ctx.lineTo(lw, i); ctx.stroke()
        }
        // Cursor blink
        if (time % 40 < 20) {
          ctx.fillStyle = '#00f0ff'
          ctx.fillRect(3, -scH / 2 + 5 + ((time / 5 | 0) % 5) * 5, 1.5, 3.5)
        }
        ctx.restore()

        ctx.save()
        ctx.translate(cx, cy + hover)

        const la = Math.sin(time * 0.62) * 0.3 - 0.55
        const ra = -Math.sin(time * 0.72) * 0.3 - 0.65
        drawArm(-1, la, -30 * S, 6 * S)
        drawArm(1, ra, 30 * S, 6 * S)
        drawBody()

        // Code particles from screen
        if (Math.random() < 0.18)
          codeParticles.push(new CodeParticle(cx - 38, cy + hover - 10))
        codeParticles = codeParticles.filter(p => p.a > 0)
        codeParticles.forEach(p => { p.update(); p.draw(ctx) })

        drawHead('scan', Math.sin(time * 0.02) * 3)
      }

      // ── BUILDING ─────────────────────────────────────────────────────────
      else if (action === 'building') {
        // Spinning gear hologram
        ctx.save()
        ctx.translate(-28 * S, 22 * S)
        ctx.rotate(time * 0.04)
        ctx.strokeStyle = 'rgba(251,191,36,0.6)'
        ctx.shadowBlur = 6; ctx.shadowColor = 'rgba(251,191,36,0.8)'
        ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.arc(0, 0, 9 * S, 0, Math.PI * 2); ctx.stroke()
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
          ctx.save(); ctx.rotate(a)
          ctx.strokeStyle = 'rgba(251,191,36,0.5)'; ctx.lineWidth = 1.2
          ctx.strokeRect(-1.5 * S, -12 * S, 3 * S, 4.5 * S)
          ctx.restore()
        }
        ctx.shadowBlur = 0
        ctx.restore()

        // Left arm + wrench
        const wA = 0.52 + Math.sin(time * 0.11) * 0.15
        drawArm(-1, wA, -30 * S, 6 * S)

        ctx.save()
        ctx.translate(-30 * S, 6 * S)
        ctx.rotate(wA)
        ctx.translate(0, 13 * S)
        ctx.fillStyle = '#94a3b8'
        ctx.fillRect(-2 * S, 0, 4 * S, 14 * S)
        // wrench head
        ctx.strokeStyle = '#c0d0e0'; ctx.lineWidth = 2 * S
        ctx.beginPath(); ctx.arc(0, 14 * S, 4.5 * S, 0, Math.PI * 2); ctx.stroke()
        ctx.fillStyle = '#8fa8c8'; ctx.fill()
        ctx.restore()

        // Right arm idle
        drawArm(1, -0.22, 30 * S, 6 * S)
        drawBody()

        // Sparks from gear
        if (Math.random() < 0.25)
          sparkParticles.push(new SparkParticle(cx - 28 * S, cy + hover + 22 * S))
        sparkParticles = sparkParticles.filter(p => p.a > 0)
        sparkParticles.forEach(p => { p.update(); p.draw(ctx) })

        drawHead('normal')
      }

      // ── LEADING ──────────────────────────────────────────────────────────
      else if (action === 'leading') {
        drawArm(-1, 0.22, -30 * S, 6 * S)
        drawArm(1, -0.42 + Math.sin(time * 0.06) * 0.12, 30 * S, 6 * S)
        drawBody()

        // Hardhat with shine
        ctx.save()
        ctx.translate(0, -66 * S)
        const hatG = ctx.createRadialGradient(-5 * S, -10 * S, 0, 0, -8 * S, 18 * S)
        hatG.addColorStop(0, '#fcd34d')
        hatG.addColorStop(0.6, '#f59e0b')
        hatG.addColorStop(1, '#b45309')
        ctx.fillStyle = hatG
        ctx.beginPath(); ctx.arc(0, -8 * S, 13 * S, Math.PI, 0); ctx.fill()
        ctx.fillRect(-18 * S, -8 * S, 36 * S, 2.5 * S)
        // brim highlight
        ctx.fillStyle = 'rgba(255,255,255,0.25)'
        ctx.beginPath(); ctx.ellipse(-3 * S, -14 * S, 8 * S, 3 * S, -0.15, 0, Math.PI * 2); ctx.fill()
        // Stripe
        ctx.fillStyle = '#d97706'
        ctx.fillRect(-2.5 * S, -19 * S, 5 * S, 11 * S)
        ctx.restore()

        // Clipboard tablet
        ctx.save()
        ctx.translate(-22 * S, 20 * S); ctx.rotate(-0.1)
        ctx.fillStyle = 'rgba(0,240,255,0.14)'
        ctx.strokeStyle = 'rgba(0,240,255,0.6)'
        ctx.lineWidth = 1.2
        ctx.beginPath(); roundedRect(ctx, -9 * S, -13 * S, 18 * S, 25 * S, 2.5 * S); ctx.fill(); ctx.stroke()
        ctx.fillStyle = '#00f0ff'
        ctx.fillRect(-3 * S, -13 * S, 6 * S, 2.5 * S) // clip top
        ctx.strokeStyle = 'rgba(0,240,255,0.7)'; ctx.lineWidth = 0.9
        const clipLines = [-6, -2, 2, 6]
        clipLines.forEach(ly => {
          ctx.beginPath()
          ctx.moveTo(-5.5 * S, ly * S); ctx.lineTo(5.5 * S, ly * S); ctx.stroke()
        })
        ctx.restore()

        drawHead('normal')
      }

      // ── WAVE ─────────────────────────────────────────────────────────────
      else if (action === 'wave') {
        // Left arm + envelope
        drawArm(-1, 0.12, -30 * S, 6 * S)
        const wA = -1.4 + Math.sin(time * 0.14) * 0.55
        drawArm(1, wA, 30 * S, 6 * S)
        drawBody()

        // Envelope in left hand
        ctx.save()
        ctx.translate(-30 * S, 19 * S); ctx.rotate(0.08)
        ctx.fillStyle = 'rgba(255,0,127,0.2)'
        ctx.strokeStyle = 'rgba(255,0,127,0.7)'
        ctx.lineWidth = 1.2
        ctx.beginPath(); roundedRect(ctx, -10 * S, -7 * S, 20 * S, 13 * S, 2 * S); ctx.fill(); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(-10 * S, -7 * S); ctx.lineTo(0, 0); ctx.lineTo(10 * S, -7 * S); ctx.stroke()
        ctx.restore()

        drawHead('wink')
      }

      ctx.restore()

      requestRef.current = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(requestRef.current)
  }, [action])

  // ─── CSS Transform State ───────────────────────────────────────────────
  const getStyle = () => {
    const base = {
      display: 'inline-block',
      verticalAlign: 'middle',
      width: '200px',
      height: '200px',
      pointerEvents: flightPhase === 'entering' ? 'auto' : 'none',
      filter: flightPhase === 'entering' ? 'drop-shadow(0 0 12px rgba(0,240,255,0.35))' : 'none',
    }
    if (flightPhase === 'entering') {
      return {
        ...base,
        opacity: 1,
        transform: 'scale(1) translateY(0) rotate(0deg)',
        transition: 'opacity 0.9s cubic-bezier(0.19,1,0.22,1), transform 0.9s cubic-bezier(0.19,1,0.22,1)',
      }
    } else if (flightPhase === 'exiting') {
      return {
        ...base,
        opacity: 0,
        transform: 'scale(0.3) translateY(-30px) rotate(-20deg)',
        transition: 'opacity 1.1s cubic-bezier(0.4,0,1,1), transform 1.1s cubic-bezier(0.4,0,1,1)',
      }
    } else {
      return {
        ...base,
        opacity: 0,
        transform: 'scale(0.2) translateY(40px) rotate(20deg)',
        transition: 'none',
      }
    }
  }

  return (
    <div ref={containerRef} style={getStyle()}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
