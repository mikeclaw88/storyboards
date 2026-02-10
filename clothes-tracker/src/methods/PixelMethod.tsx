import { useEffect, useRef, useState } from 'react'
import { Container, Sprite } from '@pixi/react'

interface PixelMethodProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  targetColor?: { r: number, g: number, b: number } // e.g. from picker
}

export const PixelMethod = ({ videoRef, targetColor = { r: 255, g: 0, b: 0 } }: PixelMethodProps) => {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'))
  
  // Update every frame
  useEffect(() => {
    let animationFrameId: number
    
    const trackColor = () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) return

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        animationFrameId = requestAnimationFrame(trackColor)
        return
      }
      
      canvas.width = video.videoWidth / 4 // Downsample for performance
      canvas.height = video.videoHeight / 4
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = frame.data
      
      let sumX = 0
      let sumY = 0
      let count = 0
      
      // Target RGB
      const tr = targetColor.r
      const tg = targetColor.g
      const tb = targetColor.b
      const threshold = 40 // Tolerance
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        
        // Simple distance check
        if (Math.abs(r - tr) < threshold && 
            Math.abs(g - tg) < threshold && 
            Math.abs(b - tb) < threshold) {
          const pixelIndex = i / 4
          const x = pixelIndex % canvas.width
          const y = Math.floor(pixelIndex / canvas.width)
          sumX += x
          sumY += y
          count++
        }
      }
      
      if (count > 0) {
        // Upscale back to video dimensions
        setPosition({
          x: (sumX / count) * 4,
          y: (sumY / count) * 4
        })
      }
      
      animationFrameId = requestAnimationFrame(trackColor)
    }
    
    trackColor()
    return () => cancelAnimationFrame(animationFrameId)
  }, [videoRef, targetColor])

  return (
    <Container>
      <Sprite
        image="/assets/clothes/sport_bra_lime_front.png"
        x={position.x}
        y={position.y}
        anchor={0.5}
        scale={0.5}
      />
    </Container>
  )
}
