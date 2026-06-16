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

    // Wave parameters
    const waves = [
      {
        y: 0.5,
        length: 0.0012,
        amplitude: 130,
        speed: 0.006,
        color: 'rgba(0, 240, 255, 0.11)', // Neon Cyan
        lineWidth: 1.5,
        phase: 0,
      },
      {
        y: 0.55,
        length: 0.0008,
        amplitude: 180,
        speed: 0.004,
        color: 'rgba(255, 0, 127, 0.09)', // Neon Pink
        lineWidth: 1.2,
        phase: Math.PI / 4,
      },
      {
        y: 0.45,
        length: 0.0018,
        amplitude: 90,
        speed: 0.009,
        color: 'rgba(0, 240, 255, 0.05)', // Neon Cyan subtle
        lineWidth: 2.0,
        phase: Math.PI / 2,
      },
      {
        y: 0.52,
        length: 0.0006,
        amplitude: 220,
        speed: 0.003,
        color: 'rgba(255, 0, 127, 0.07)', // Neon Pink subtle
        lineWidth: 1.0,
        phase: Math.PI * 1.2,
      },
    ]

    // Track mouse position for subtle interactive influence
    let mouse = { x: undefined, y: undefined }
    const handleMouseMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    window.addEventListener('mousemove', handleMouseMove)

    // Animation loop
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height)

      // Draw waves
      waves.forEach((wave) => {
        ctx.beginPath()
        ctx.strokeStyle = wave.color
        ctx.lineWidth = wave.lineWidth

        const baseHeight = height * wave.y

        for (let x = 0; x < width; x += 2) {
          // Normal sinusoidal wave calculation
          let yOffset = Math.sin(x * wave.length + wave.phase) * wave.amplitude
          // Add a second harmonic to make it look organic
          yOffset += Math.cos(x * wave.length * 0.5 - wave.phase * 0.7) * (wave.amplitude * 0.4)

          // Subtly attract waves towards mouse position
          if (mouse.x !== undefined && mouse.y !== undefined) {
            const dx = x - mouse.x
            const dy = (baseHeight + yOffset) - mouse.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < 300) {
              const force = (300 - dist) / 300
              yOffset += (mouse.y - (baseHeight + yOffset)) * force * 0.12
            }
          }

          if (x === 0) {
            ctx.moveTo(x, baseHeight + yOffset)
          } else {
            ctx.lineTo(x, baseHeight + yOffset)
          }
        }

        ctx.stroke()
        wave.phase += wave.speed
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
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
