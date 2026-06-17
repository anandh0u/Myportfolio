import { useEffect, useRef, useState } from 'react'

export default function SectionRobot({ action = 'coffee' }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const requestRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          setShouldRender(true)
        } else {
          setIsVisible(false)
          setShouldRender(false)
        }
      },
      { threshold: 0.1 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Timer lifecycle for showing 10s on entry, hiding, then showing randomly
  useEffect(() => {
    if (!shouldRender) return

    let activeTimeout
    let innerTimeout

    // Initial show for 10 seconds
    setIsVisible(true)

    const triggerNextCycle = () => {
      // Wait for a random interval between 20 and 30 seconds
      const nextDelay = 20000 + Math.random() * 10000 // 20s to 30s
      activeTimeout = setTimeout(() => {
        setIsVisible(true)
        innerTimeout = setTimeout(() => {
          setIsVisible(false)
          triggerNextCycle()
        }, 5000) // Stay active for 5 seconds
      }, nextDelay)
    }

    // Hide after 10 seconds initially
    activeTimeout = setTimeout(() => {
      setIsVisible(false)
      triggerNextCycle()
    }, 10000)

    return () => {
      clearTimeout(activeTimeout)
      clearTimeout(innerTimeout)
    }
  }, [shouldRender])

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const width = (canvas.width = 150)
    const height = (canvas.height = 150)
    const scale = 0.55 // Mascot size (small)

    let time = 0
    let steamParticles = []
    let codeParticles = []

    class SteamParticle {
      constructor(x, y) {
        this.x = x
        this.y = y
        this.vx = (Math.random() - 0.5) * 0.3
        this.vy = -Math.random() * 0.6 - 0.4
        this.size = Math.random() * 2 + 1
        this.alpha = 0.6
      }
      update() {
        this.x += this.vx
        this.y += this.vy
        this.alpha -= 0.015
      }
      draw(c) {
        c.beginPath()
        c.fillStyle = `rgba(255, 200, 220, ${this.alpha})`
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        c.fill()
      }
    }

    class CodeParticle {
      constructor(x, y) {
        this.x = x
        this.y = y
        this.char = ['0', '1', '{', '}', '<', '>', '+', ';', '/'][Math.floor(Math.random() * 9)]
        this.vy = -Math.random() * 0.8 - 0.5
        this.vx = (Math.random() - 0.5) * 0.4
        this.alpha = 0.8
        this.size = Math.random() * 4 + 7
      }
      update() {
        this.x += this.vx
        this.y += this.vy
        this.alpha -= 0.02
      }
      draw(c) {
        c.fillStyle = `rgba(0, 240, 255, ${this.alpha})`
        c.font = `${this.size}px 'JetBrains Mono', monospace`
        c.fillText(this.char, this.x, this.y)
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      time++

      const cx = width / 2
      const cy = height / 2 + 15

      // Base robot setup
      let squish = 1.0
      let eyeOffsetX = 0
      let state = 'normal'

      if (action === 'coffee') {
        // Coffee Reclined Pose
        ctx.save()
        // Tilt body slightly
        ctx.translate(cx, cy)
        ctx.rotate(0.12)
        
        // Robot Head
        ctx.save()
        ctx.translate(0, -42 * scale)
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.roundRect(-25 * scale, -18 * scale, 50 * scale, 36 * scale, 18 * scale)
        ctx.fill()
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 1
        ctx.stroke()

        // Visor
        ctx.fillStyle = '#0f172a'
        ctx.beginPath()
        ctx.roundRect(-20 * scale, -11 * scale, 40 * scale, 22 * scale, 11 * scale)
        ctx.fill()

        // Relaxed glowing blue eyes
        ctx.fillStyle = '#00f0ff'
        ctx.shadowBlur = 4
        ctx.shadowColor = '#00f0ff'
        // Relaxed eyes (semicircles or curved lines)
        ctx.strokeStyle = '#00f0ff'
        ctx.lineWidth = 2 * scale
        ctx.beginPath()
        ctx.arc(-9 * scale, -2 * scale, 3 * scale, 0, Math.PI)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(9 * scale, -2 * scale, 3 * scale, 0, Math.PI)
        ctx.stroke()
        ctx.restore()

        // Robot Body
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.roundRect(-22 * scale, -15 * scale, 44 * scale, 42 * scale, 15 * scale)
        ctx.fill()
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 1
        ctx.stroke()

        // Relaxed left arm
        ctx.save()
        ctx.translate(-26 * scale, -2 * scale)
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.roundRect(-5 * scale, -8 * scale, 10 * scale, 25 * scale, 5 * scale)
        ctx.fill()
        ctx.strokeStyle = '#cbd5e1'
        ctx.stroke()
        ctx.restore()

        // Right arm holding coffee cup (raised dynamically)
        ctx.save()
        const drinkCycle = (time * 0.02) % (Math.PI * 2)
        const isDrinking = drinkCycle > Math.PI
        const armAngle = isDrinking 
          ? -0.8 - Math.sin(drinkCycle) * 0.4 // raise to mouth
          : -0.4 // rest on body
        
        ctx.translate(26 * scale, -2 * scale)
        ctx.rotate(armAngle)
        
        // Draw arm segment
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.roundRect(-5 * scale, -8 * scale, 10 * scale, 25 * scale, 5 * scale)
        ctx.fill()
        ctx.strokeStyle = '#cbd5e1'
        ctx.stroke()

        // Coffee Mug (attached to arm tip)
        ctx.translate(0, 18 * scale)
        ctx.rotate(-armAngle - 0.1) // Mug remains upright
        ctx.fillStyle = '#ff007f' // Neon Pink Mug
        ctx.beginPath()
        ctx.roundRect(-4 * scale, -6 * scale, 10 * scale, 12 * scale, 2 * scale)
        ctx.fill()
        // Handle
        ctx.strokeStyle = '#ff007f'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(6 * scale, 0, 3 * scale, -Math.PI / 2, Math.PI / 2)
        ctx.stroke()

        // Steam particle emitter tip
        const steamX = cx + (26 * scale + Math.cos(armAngle) * 10) * Math.cos(0.12) - (18 * scale + Math.sin(armAngle) * 10) * Math.sin(0.12)
        const steamY = cy + (26 * scale + Math.cos(armAngle) * 10) * Math.sin(0.12) + (18 * scale + Math.sin(armAngle) * 10) * Math.cos(0.12) - 15
        
        if (Math.random() < 0.08) {
          steamParticles.push(new SteamParticle(steamX + 5, steamY))
        }
        ctx.restore()

        // Base / Treads (reclined)
        ctx.save()
        ctx.translate(0, 28 * scale)
        ctx.fillStyle = '#334155'
        ctx.beginPath()
        ctx.roundRect(-16 * scale, -4 * scale, 32 * scale, 8 * scale, 4 * scale)
        ctx.fill()
        ctx.restore()

        ctx.restore() // restore main rotation

        // Update & draw steam particles
        steamParticles.forEach((p, idx) => {
          p.update()
          p.draw(ctx)
          if (p.alpha <= 0) steamParticles.splice(idx, 1)
        })

      } else if (action === 'working') {
        // Typing/Coding Pose
        
        // Desk & Screen
        ctx.fillStyle = 'rgba(0, 240, 255, 0.05)'
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.roundRect(cx - 42, cy - 10, 24, 30, 3)
        ctx.fill()
        ctx.stroke()

        // Holographic lines on screen
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)'
        ctx.lineWidth = 1
        for (let i = cy - 6; i < cy + 15; i += 5) {
          ctx.beginPath()
          ctx.moveTo(cx - 38, i)
          ctx.lineTo(cx - 22, i)
          ctx.stroke()
        }

        // Emit code symbols
        if (Math.random() < 0.25) {
          codeParticles.push(new CodeParticle(cx - 30, cy - 12))
        }

        // Robot Head (looking forward-down)
        ctx.save()
        ctx.translate(cx + 15, cy - 42 * scale)
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.roundRect(-25 * scale, -18 * scale, 50 * scale, 36 * scale, 18 * scale)
        ctx.fill()
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 1
        ctx.stroke()

        // Visor
        ctx.fillStyle = '#0f172a'
        ctx.beginPath()
        ctx.roundRect(-20 * scale, -11 * scale, 40 * scale, 22 * scale, 11 * scale)
        ctx.fill()

        // Focus eyes (looking left/screen direction)
        ctx.fillStyle = '#00f0ff'
        ctx.beginPath()
        ctx.arc(-13 * scale, 0, 3 * scale, 0, Math.PI * 2)
        ctx.arc(5 * scale, 0, 3 * scale, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // Robot Body
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.roundRect(cx + 15 - 22 * scale, cy - 15 * scale, 44 * scale, 42 * scale, 15 * scale)
        ctx.fill()
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 1
        ctx.stroke()

        // Left arm typing on desk (moving fast)
        ctx.save()
        ctx.translate(cx + 15 - 26 * scale, cy - 2 * scale)
        const leftArmAngle = Math.sin(time * 0.6) * 0.3 - 0.5
        ctx.rotate(leftArmAngle)
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.roundRect(-5 * scale, -8 * scale, 10 * scale, 25 * scale, 5 * scale)
        ctx.fill()
        ctx.strokeStyle = '#cbd5e1'
        ctx.stroke()
        ctx.restore()

        // Right arm typing (moving fast)
        ctx.save()
        ctx.translate(cx + 15 + 26 * scale, cy - 2 * scale)
        const rightArmAngle = -Math.sin(time * 0.7) * 0.3 - 0.7
        ctx.rotate(rightArmAngle)
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.roundRect(-5 * scale, -8 * scale, 10 * scale, 25 * scale, 5 * scale)
        ctx.fill()
        ctx.strokeStyle = '#cbd5e1'
        ctx.stroke()
        ctx.restore()

        // Base / Treads
        ctx.save()
        ctx.translate(cx + 15, cy + 28 * scale)
        ctx.fillStyle = '#334155'
        ctx.beginPath()
        ctx.roundRect(-16 * scale, -4 * scale, 32 * scale, 8 * scale, 4 * scale)
        ctx.fill()
        ctx.restore()

        // Update and draw code particles
        codeParticles.forEach((p, idx) => {
          p.update()
          p.draw(ctx)
          if (p.alpha <= 0) codeParticles.splice(idx, 1)
        })
      } else if (action === 'reading') {
        // Reading/Scanning holographic document pose
        
        // Robot Head (looking slightly down)
        ctx.save()
        ctx.translate(cx, cy - 42 * scale)
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.roundRect(-25 * scale, -18 * scale, 50 * scale, 36 * scale, 18 * scale)
        ctx.fill()
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 1
        ctx.stroke()

        // Visor
        ctx.fillStyle = '#0f172a'
        ctx.beginPath()
        ctx.roundRect(-20 * scale, -11 * scale, 40 * scale, 22 * scale, 11 * scale)
        ctx.fill()

        // Scanning glowing blue eyes (horizontal tracking)
        const scanOffset = Math.sin(time * 0.08) * 3 * scale
        ctx.fillStyle = '#00f0ff'
        ctx.shadowBlur = 4
        ctx.shadowColor = '#00f0ff'
        ctx.beginPath()
        ctx.arc(-9 * scale + scanOffset, 0, 3 * scale, 0, Math.PI * 2)
        ctx.arc(9 * scale + scanOffset, 0, 3 * scale, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // Robot Body
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.roundRect(cx - 22 * scale, cy - 15 * scale, 44 * scale, 42 * scale, 15 * scale)
        ctx.fill()
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 1
        ctx.stroke()

        // Left arm angled inward supporting the hologram
        ctx.save()
        ctx.translate(cx - 26 * scale, cy - 2 * scale)
        ctx.rotate(0.35)
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.roundRect(-5 * scale, -8 * scale, 10 * scale, 25 * scale, 5 * scale)
        ctx.fill()
        ctx.strokeStyle = '#cbd5e1'
        ctx.stroke()
        ctx.restore()

        // Right arm angled inward supporting the hologram
        ctx.save()
        ctx.translate(cx + 26 * scale, cy - 2 * scale)
        ctx.rotate(-0.35)
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.roundRect(-5 * scale, -8 * scale, 10 * scale, 25 * scale, 5 * scale)
        ctx.fill()
        ctx.strokeStyle = '#cbd5e1'
        ctx.stroke()
        ctx.restore()

        // Base / Treads
        ctx.save()
        ctx.translate(cx, cy + 28 * scale)
        ctx.fillStyle = '#334155'
        ctx.beginPath()
        ctx.roundRect(-16 * scale, -4 * scale, 32 * scale, 8 * scale, 4 * scale)
        ctx.fill()
        ctx.restore()

        // Holographic document
        const holoX = cx - 22 * scale
        const holoY = cy - 2 * scale
        const holoW = 44 * scale
        const holoH = 26 * scale

        // Hologram container gradient glow
        const holoGrad = ctx.createLinearGradient(holoX, holoY, holoX, holoY + holoH)
        holoGrad.addColorStop(0, 'rgba(0, 240, 255, 0.08)')
        holoGrad.addColorStop(1, 'rgba(0, 240, 255, 0.02)')
        ctx.fillStyle = holoGrad
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.roundRect(holoX, holoY, holoW, holoH, 3 * scale)
        ctx.fill()
        ctx.stroke()

        // Scanning laser (pink neon line sweeping up/down)
        const laserY = holoY + (Math.sin(time * 0.05) * 0.5 + 0.5) * holoH
        ctx.strokeStyle = 'rgba(255, 0, 127, 0.7)'
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(holoX - 2 * scale, laserY)
        ctx.lineTo(holoX + holoW + 2 * scale, laserY)
        ctx.stroke()

        // Telemetry text / data lines in hologram
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)'
        ctx.lineWidth = 0.8
        for (let i = holoY + 4 * scale; i < holoY + holoH - 2 * scale; i += 4 * scale) {
          if (Math.abs(i - laserY) > 2) {
            ctx.beginPath()
            ctx.moveTo(holoX + 4 * scale, i)
            ctx.lineTo(holoX + holoW - 4 * scale, i)
            ctx.stroke()
          }
        }

        // Emit code / binary particles floating upward
        if (Math.random() < 0.15) {
          codeParticles.push(new CodeParticle(cx + (Math.random() - 0.5) * 36 * scale, holoY + 2 * scale))
        }

        // Update and draw code particles
        codeParticles.forEach((p, idx) => {
          p.update()
          p.draw(ctx)
          if (p.alpha <= 0) codeParticles.splice(idx, 1)
        })
      }

      requestRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => cancelAnimationFrame(requestRef.current)
  }, [action])

  return (
    <div
      ref={containerRef}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        transition: 'opacity 0.6s var(--transition), transform 0.6s var(--transition)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.8) translateY(20px)',
        pointerEvents: isVisible ? 'auto' : 'none',
        width: '150px',
        height: '150px',
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
