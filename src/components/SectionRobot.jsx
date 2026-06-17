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
    const scale = 0.58 // Slightly increased scale for visual pop

    let time = 0
    let steamParticles = []
    let codeParticles = []
    let sparkParticles = []

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
        this.size = Math.random() * 3 + 6
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

    class SparkParticle {
      constructor(x, y) {
        this.x = x
        this.y = y
        this.vx = (Math.random() - 0.5) * 2.0
        this.vy = (Math.random() - 0.5) * 2.0 - 0.8
        this.alpha = 1.0
        this.size = Math.random() * 2 + 1
      }
      update() {
        this.x += this.vx
        this.y += this.vy
        this.alpha -= 0.035
      }
      draw(c) {
        c.fillStyle = `rgba(251, 191, 36, ${this.alpha})` // Amber yellow sparks
        c.beginPath()
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        c.fill()
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height)
      time++

      const cx = width / 2
      const cy = height / 2 + 10

      // Hover / Floating Oscillation
      const hoverOffset = Math.sin(time * 0.05) * 4.5

      // --- 1. DRAW FLOATING SHADOW ---
      const shadowScale = 1 - hoverOffset / 25
      ctx.save()
      ctx.translate(cx, cy + 42 * scale)
      ctx.fillStyle = `rgba(3, 1, 8, ${0.45 * shadowScale})`
      ctx.beginPath()
      ctx.ellipse(0, 0, 20 * scale * shadowScale, 5 * scale * shadowScale, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // --- Helper: Draw 3D Glossy EVE Robot Parts ---
      const drawEVERobot = (customDrawBodyAndArms) => {
        // Base coordinate translations
        ctx.save()
        ctx.translate(cx, cy + hoverOffset)

        // Draw body & arms first (so head sits on top)
        customDrawBodyAndArms()

        // Draw Head (Egg shape)
        ctx.save()
        ctx.translate(0, -42 * scale)
        
        // Shiny 3D head gradient
        const headGrad = ctx.createRadialGradient(-6 * scale, -8 * scale, 2 * scale, 0, 0, 26 * scale)
        headGrad.addColorStop(0, '#ffffff')
        headGrad.addColorStop(0.65, '#f8fafc')
        headGrad.addColorStop(1, '#94a3b8') // Shaded dark metallic boundary
        ctx.fillStyle = headGrad
        ctx.beginPath()
        ctx.ellipse(0, 0, 26 * scale, 20 * scale, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 0.5
        ctx.stroke()

        // Glossy Highlight on Head
        const headHighlight = ctx.createLinearGradient(0, -18 * scale, 0, -4 * scale)
        headHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.45)')
        headHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = headHighlight
        ctx.beginPath()
        ctx.ellipse(0, -7 * scale, 19 * scale, 8 * scale, 0, 0, Math.PI * 2)
        ctx.fill()

        // Visor (Glossy Dark Glass)
        const visorGrad = ctx.createLinearGradient(0, -9 * scale, 0, 9 * scale)
        visorGrad.addColorStop(0, '#020617') // deep black-blue
        visorGrad.addColorStop(1, '#1e293b')
        ctx.fillStyle = visorGrad
        ctx.beginPath()
        ctx.ellipse(0, 0, 20 * scale, 11 * scale, 0, 0, Math.PI * 2)
        ctx.fill()
        
        // Inner screen glow line
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)'
        ctx.lineWidth = 0.8
        ctx.stroke()

        // Glossy reflection stripe on glass visor
        const visorHighlight = ctx.createLinearGradient(-12 * scale, -6 * scale, 12 * scale, 6 * scale)
        visorHighlight.addColorStop(0, 'rgba(255,255,255,0.22)')
        visorHighlight.addColorStop(0.3, 'rgba(255,255,255,0.06)')
        visorHighlight.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = visorHighlight
        ctx.beginPath()
        ctx.ellipse(-2 * scale, -2 * scale, 15 * scale, 7 * scale, -0.1, 0, Math.PI * 2)
        ctx.fill()

        // Glowing blue eyes (LED horizontal segmented arcs)
        ctx.fillStyle = '#00f0ff'
        ctx.shadowBlur = 6 * scale
        ctx.shadowColor = '#00f0ff'

        const scanOffset = (action === 'reading') ? Math.sin(time * 0.08) * 3.5 * scale : 0
        const isBlinking = (time % 160) < 8

        if (isBlinking) {
          // Blink state: Flat thin LED line
          ctx.fillRect(-14 * scale + scanOffset, -0.5 * scale, 7 * scale, 1.2 * scale)
          ctx.fillRect(7 * scale + scanOffset, -0.5 * scale, 7 * scale, 1.2 * scale)
        } else if (action === 'coffee') {
          // Relaxed/Happy curves
          ctx.strokeStyle = '#00f0ff'
          ctx.lineWidth = 2 * scale
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.arc(-10 * scale, -1 * scale, 3.5 * scale, 0, Math.PI)
          ctx.stroke()
          ctx.beginPath()
          ctx.arc(10 * scale, -1 * scale, 3.5 * scale, 0, Math.PI)
          ctx.stroke()
        } else if (action === 'wave') {
          // Left eye winks (arc), Right eye round winking smile
          ctx.strokeStyle = '#00f0ff'
          ctx.lineWidth = 2 * scale
          ctx.lineCap = 'round'
          // wink arc
          ctx.beginPath()
          ctx.arc(-10 * scale, 0, 3.5 * scale, Math.PI, 0)
          ctx.stroke()
          // happy arc
          ctx.beginPath()
          ctx.arc(10 * scale, -1 * scale, 3.5 * scale, 0, Math.PI)
          ctx.stroke()
        } else {
          // Standard focused capsule eyes
          ctx.beginPath()
          ctx.ellipse(-10 * scale + scanOffset, 0, 3.8 * scale, 2.0 * scale, 0, 0, Math.PI * 2)
          ctx.ellipse(10 * scale + scanOffset, 0, 3.8 * scale, 2.0 * scale, 0, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore() // Head restore
        ctx.restore() // Base restore
      }

      // Draw EVE body capsule gradient helper
      const drawEVEBody = (taperScaleX = 1.0) => {
        const bodyGrad = ctx.createRadialGradient(-4 * scale, -6 * scale, 2 * scale, 0, 6 * scale, 25 * scale)
        bodyGrad.addColorStop(0, '#ffffff')
        bodyGrad.addColorStop(0.7, '#f8fafc')
        bodyGrad.addColorStop(1, '#94a3b8')
        ctx.fillStyle = bodyGrad
        ctx.beginPath()
        ctx.ellipse(0, 8 * scale, 22 * scale * taperScaleX, 26 * scale, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 0.5
        ctx.stroke()

        // Highlight layer on body
        const bodyHighlight = ctx.createLinearGradient(0, -10 * scale, 0, 15 * scale)
        bodyHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.4)')
        bodyHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = bodyHighlight
        ctx.beginPath()
        ctx.ellipse(0, 2 * scale, 15 * scale * taperScaleX, 10 * scale, 0, 0, Math.PI * 2)
        ctx.fill()
      }

      // Left Floating Arm helper
      const drawLeftArm = (armAngle, tx = -28 * scale, ty = 6 * scale) => {
        ctx.save()
        ctx.translate(tx, ty)
        ctx.rotate(armAngle)
        const armGrad = ctx.createLinearGradient(-4 * scale, -10 * scale, 4 * scale, 12 * scale)
        armGrad.addColorStop(0, '#ffffff')
        armGrad.addColorStop(1, '#94a3b8')
        ctx.fillStyle = armGrad
        ctx.beginPath()
        ctx.ellipse(0, 0, 5.5 * scale, 15 * scale, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 0.5
        ctx.stroke()
        ctx.restore()
      }

      // Right Floating Arm helper
      const drawRightArm = (armAngle, tx = 28 * scale, ty = 6 * scale) => {
        ctx.save()
        ctx.translate(tx, ty)
        ctx.rotate(armAngle)
        const armGrad = ctx.createLinearGradient(-4 * scale, -10 * scale, 4 * scale, 12 * scale)
        armGrad.addColorStop(0, '#ffffff')
        armGrad.addColorStop(1, '#94a3b8')
        ctx.fillStyle = armGrad
        ctx.beginPath()
        ctx.ellipse(0, 0, 5.5 * scale, 15 * scale, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#cbd5e1'
        ctx.lineWidth = 0.5
        ctx.stroke()
        ctx.restore()
      }

      // Render poses dynamically
      if (action === 'coffee') {
        // --- COFFEE DRINKING POSE ---
        drawEVERobot(() => {
          // Gentle body rotation
          ctx.rotate(0.08)

          // Relaxed left arm
          drawLeftArm(0.2)

          // Body
          drawEVEBody()

          // Right arm holding mug raised/drinking
          const drinkCycle = (time * 0.02) % (Math.PI * 2)
          const isDrinking = drinkCycle > Math.PI
          const armAngle = isDrinking 
            ? -0.95 - Math.sin(drinkCycle) * 0.35 // raise to visor
            : -0.3 // rest on side
          
          drawRightArm(armAngle)

          // Draw neon pink mug attached to right arm tip
          ctx.save()
          ctx.translate(28 * scale, 6 * scale)
          ctx.rotate(armAngle)
          ctx.translate(0, 12 * scale)
          ctx.rotate(-armAngle - 0.08) // Mug stays vertical-ish
          
          ctx.fillStyle = '#ff007f' // Neon Pink
          ctx.beginPath()
          ctx.roundRect(-4 * scale, -6 * scale, 9 * scale, 11 * scale, 1.5 * scale)
          ctx.fill()
          // Handle
          ctx.strokeStyle = '#ff007f'
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.arc(5 * scale, 0, 2.5 * scale, -Math.PI / 2, Math.PI / 2)
          ctx.stroke()

          // Emit steam from top of mug
          const steamWorldX = cx + (28 * scale + Math.cos(armAngle) * 8) * Math.cos(0.08) - (12 * scale + Math.sin(armAngle) * 8) * Math.sin(0.08)
          const steamWorldY = cy + hoverOffset + (28 * scale + Math.cos(armAngle) * 8) * Math.sin(0.08) + (12 * scale + Math.sin(armAngle) * 8) * Math.cos(0.08) - 10
          if (Math.random() < 0.08) {
            steamParticles.push(new SteamParticle(steamWorldX, steamWorldY))
          }
          ctx.restore()
        })

        // Draw steam particles
        steamParticles.forEach((p, idx) => {
          p.update()
          p.draw(ctx)
          if (p.alpha <= 0) steamParticles.splice(idx, 1)
        })

      } else if (action === 'reading') {
        // --- READING SCANNING POSE ---
        drawEVERobot(() => {
          // Floating hologram document below EVE
          ctx.save()
          // Draw hologram box
          const holoGrad = ctx.createLinearGradient(-20 * scale, 24 * scale, 20 * scale, 42 * scale)
          holoGrad.addColorStop(0, 'rgba(0, 240, 255, 0.09)')
          holoGrad.addColorStop(1, 'rgba(0, 240, 255, 0.02)')
          ctx.fillStyle = holoGrad
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)'
          ctx.lineWidth = 1.0
          ctx.beginPath()
          ctx.roundRect(-20 * scale, 22 * scale, 40 * scale, 20 * scale, 2.5 * scale)
          ctx.fill()
          ctx.stroke()

          // Sweeping pink neon laser
          const laserY = 22 * scale + (Math.sin(time * 0.06) * 0.5 + 0.5) * 20 * scale
          ctx.strokeStyle = 'rgba(255, 0, 127, 0.75)'
          ctx.lineWidth = 1.0
          ctx.beginPath()
          ctx.moveTo(-21 * scale, laserY)
          ctx.lineTo(21 * scale, laserY)
          ctx.stroke()

          // Data lines
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)'
          ctx.lineWidth = 0.6
          for (let i = 25 * scale; i < 40 * scale; i += 3.5 * scale) {
            if (Math.abs(i - laserY) > 2) {
              ctx.beginPath()
              ctx.moveTo(-16 * scale, i)
              ctx.lineTo(16 * scale, i)
              ctx.stroke()
            }
          }
          ctx.restore()

          // Arms angled inward holding the hologram
          drawLeftArm(0.35)
          drawRightArm(-0.35)

          // Body
          drawEVEBody()

          // Emit binary/telemetry particles rising up
          if (Math.random() < 0.12) {
            codeParticles.push(new CodeParticle(cx + (Math.random() - 0.5) * 34 * scale, cy + hoverOffset + 18 * scale))
          }
        })

        codeParticles.forEach((p, idx) => {
          p.update()
          p.draw(ctx)
          if (p.alpha <= 0) codeParticles.splice(idx, 1)
        })

      } else if (action === 'working') {
        // --- WORKING / CODING POSE ---
        // Desk screen (left side)
        ctx.fillStyle = 'rgba(0, 240, 255, 0.04)'
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)'
        ctx.lineWidth = 1.0
        ctx.beginPath()
        ctx.roundRect(cx - 42, cy - 8, 20, 26, 2.5)
        ctx.fill()
        ctx.stroke()

        // screen lines
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)'
        ctx.lineWidth = 0.8
        for (let i = cy - 4; i < cy + 15; i += 4) {
          ctx.beginPath()
          ctx.moveTo(cx - 38, i)
          ctx.lineTo(cx - 26, i)
          ctx.stroke()
        }

        if (Math.random() < 0.22) {
          codeParticles.push(new CodeParticle(cx - 30, cy - 8))
        }

        drawEVERobot(() => {
          // Body (leaning forward slightly)
          ctx.translate(10 * scale, 0)
          
          // Fast-typing arms
          const leftArmAngle = Math.sin(time * 0.65) * 0.25 - 0.5
          const rightArmAngle = -Math.sin(time * 0.75) * 0.25 - 0.65
          drawLeftArm(leftArmAngle, -28 * scale, 6 * scale)
          drawRightArm(rightArmAngle, 28 * scale, 6 * scale)

          drawEVEBody()
        })

        codeParticles.forEach((p, idx) => {
          p.update()
          p.draw(ctx)
          if (p.alpha <= 0) codeParticles.splice(idx, 1)
        })

      } else if (action === 'building') {
        // --- BUILDING / WRENCH POSE ---
        drawEVERobot(() => {
          // Rotating holographic gear in front
          ctx.save()
          ctx.translate(-24 * scale, 20 * scale)
          ctx.rotate(time * 0.035)
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)'
          ctx.lineWidth = 1.2
          ctx.beginPath()
          ctx.arc(0, 0, 7.5 * scale, 0, Math.PI * 2)
          ctx.stroke()
          // draw teeth
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            ctx.save()
            ctx.rotate(a)
            ctx.strokeRect(-1.5 * scale, -10 * scale, 3 * scale, 4 * scale)
            ctx.restore()
          }
          ctx.restore()

          // Left Arm holding wrench
          drawLeftArm(0.55 + Math.sin(time * 0.12) * 0.15)
          
          // Draw wrench in left arm
          ctx.save()
          ctx.translate(-28 * scale, 6 * scale)
          ctx.rotate(0.55 + Math.sin(time * 0.12) * 0.15)
          ctx.translate(0, 10 * scale)
          ctx.fillStyle = '#94a3b8'
          ctx.fillRect(-1.5 * scale, 0, 3 * scale, 12 * scale)
          ctx.beginPath()
          ctx.arc(0, 12 * scale, 3.5 * scale, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#0f172a'
          ctx.beginPath()
          ctx.arc(0, 12 * scale, 1.5 * scale, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()

          // Right Arm idle
          drawRightArm(-0.2)

          // Body
          drawEVEBody()

          // Spark particles emitter
          if (Math.random() < 0.20) {
            sparkParticles.push(new SparkParticle(cx - 24 * scale, cy + hoverOffset + 20 * scale))
          }
        })

        sparkParticles.forEach((p, idx) => {
          p.update()
          p.draw(ctx)
          if (p.alpha <= 0) sparkParticles.splice(idx, 1)
        })

      } else if (action === 'leading') {
        // --- LEADING / HARDHAT POSE ---
        drawEVERobot(() => {
          // Arms
          // Left arm holds tablet clipboard
          drawLeftArm(0.2)
          
          // Right arm gesture
          drawRightArm(-0.4 + Math.sin(time * 0.06) * 0.1)

          // Body
          drawEVEBody()

          // Drawing futuristic tablet clipboard in front/left
          ctx.save()
          ctx.translate(-20 * scale, 18 * scale)
          ctx.rotate(-0.1)
          ctx.fillStyle = 'rgba(0, 240, 255, 0.16)'
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)'
          ctx.lineWidth = 1.0
          ctx.beginPath()
          ctx.roundRect(-8 * scale, -11 * scale, 16 * scale, 22 * scale, 2 * scale)
          ctx.fill()
          ctx.stroke()
          // clip detail
          ctx.fillStyle = '#00f0ff'
          ctx.fillRect(-3 * scale, -11 * scale, 6 * scale, 2 * scale)
          // tech screen lines
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.75)'
          ctx.lineWidth = 0.8
          ctx.beginPath()
          ctx.moveTo(-5 * scale, -5 * scale); ctx.lineTo(5 * scale, -5 * scale)
          ctx.moveTo(-5 * scale, -1 * scale); ctx.lineTo(2 * scale, -1 * scale)
          ctx.moveTo(-5 * scale, 3 * scale); ctx.lineTo(5 * scale, 3 * scale)
          ctx.stroke()
          ctx.restore()

          // Overlay small safety hat on the head!
          ctx.save()
          ctx.translate(0, -42 * scale) // Translate to head position
          ctx.fillStyle = '#f59e0b' // Safety Amber Yellow
          // Hat crown
          ctx.beginPath()
          ctx.arc(0, -17 * scale, 12 * scale, Math.PI, 0)
          ctx.fill()
          // Hat brim
          ctx.fillRect(-17 * scale, -17 * scale, 34 * scale, 2 * scale)
          // Ridge stripe on helmet
          ctx.fillStyle = '#d97706'
          ctx.fillRect(-2 * scale, -27 * scale, 4 * scale, 10 * scale)
          ctx.restore()
        })

      } else if (action === 'wave') {
        // --- FRIENDLY WAVING POSE ---
        drawEVERobot(() => {
          // Left arm holding envelope
          drawLeftArm(0.1)

          // Body
          drawEVEBody()

          // Waving right arm
          const waveAngle = -1.3 + Math.sin(time * 0.14) * 0.45
          drawRightArm(waveAngle, 28 * scale, 6 * scale)

          // Envelope in Left Hand
          ctx.save()
          ctx.translate(-28 * scale, 16 * scale)
          ctx.rotate(0.08)
          ctx.fillStyle = 'rgba(255, 0, 127, 0.22)'
          ctx.strokeStyle = 'rgba(255, 0, 127, 0.65)'
          ctx.lineWidth = 1.0
          ctx.beginPath()
          ctx.roundRect(-9 * scale, -6 * scale, 18 * scale, 12 * scale, 1.5 * scale)
          ctx.fill()
          ctx.stroke()
          // Envelope flap lines
          ctx.beginPath()
          ctx.moveTo(-9 * scale, -6 * scale)
          ctx.lineTo(0, 0)
          ctx.lineTo(9 * scale, -6 * scale)
          ctx.stroke()
          ctx.restore()
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
        transform: isVisible 
          ? 'scale(1) translateY(0) rotate(0deg)' 
          : 'scale(0.5) translateY(45px) rotate(-12deg)',
        pointerEvents: isVisible ? 'auto' : 'none',
        width: '150px',
        height: '150px',
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
