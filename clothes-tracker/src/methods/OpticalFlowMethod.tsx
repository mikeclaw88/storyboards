import { useEffect, useRef, useState } from 'react'
import type React from 'react' // Import type
import { Container, Sprite } from '@pixi/react'
import * as PIXI from 'pixi.js'

interface OpticalFlowMethodProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
}

export const OpticalFlowMethod = ({ videoRef }: OpticalFlowMethodProps) => {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'))
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null)
  const trackPointRef = useRef<{x: number, y: number} | null>(null)
  
  // Initialize tracking point at center if not set
  useEffect(() => {
    if (!trackPointRef.current && videoRef.current) {
        trackPointRef.current = { 
            x: videoRef.current.videoWidth / 2, 
            y: videoRef.current.videoHeight / 2 
        }
    }
  }, [videoRef])

  useEffect(() => {
    let animationId: number
    const track = () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState < 2) {
        animationId = requestAnimationFrame(track)
        return
      }

      // 1. Setup Canvas
      const width = video.videoWidth / 4 // Downscale for speed
      const height = video.videoHeight / 4
      if (canvas.width !== width) {
          canvas.width = width
          canvas.height = height
      }
      
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return

      ctx.drawImage(video, 0, 0, width, height)
      const frame = ctx.getImageData(0, 0, width, height)
      const currentData = frame.data
      
      // 2. Optical Flow (Block Matching)
      if (prevFrameRef.current && trackPointRef.current) {
          const prev = prevFrameRef.current
          const cur = currentData
          
          const px = Math.floor(trackPointRef.current.x / 4)
          const py = Math.floor(trackPointRef.current.y / 4)
          
          const windowSize = 10
          const searchSize = 10
          
          let minDiff = Infinity
          let bestDx = 0
          let bestDy = 0
          
          // Search around previous point
          for (let dy = -searchSize; dy <= searchSize; dy += 2) {
              for (let dx = -searchSize; dx <= searchSize; dx += 2) {
                  let diff = 0
                  // Compare block
                  for (let wy = -windowSize; wy <= windowSize; wy+=2) {
                      for (let wx = -windowSize; wx <= windowSize; wx+=2) {
                          const idx1 = ((py + wy) * width + (px + wx)) * 4
                          const idx2 = ((py + wy + dy) * width + (px + wx + dx)) * 4
                          
                          if (idx1 >= 0 && idx1 < prev.length && idx2 >= 0 && idx2 < cur.length) {
                              diff += Math.abs(prev[idx1] - cur[idx2]) // Grayscale approx (R channel)
                          }
                      }
                  }
                  
                  if (diff < minDiff) {
                      minDiff = diff
                      bestDx = dx
                      bestDy = dy
                  }
              }
          }
          
          // Update point
          trackPointRef.current.x += bestDx * 4
          trackPointRef.current.y += bestDy * 4
          
          // Keep in bounds
          trackPointRef.current.x = Math.max(0, Math.min(video.videoWidth, trackPointRef.current.x))
          trackPointRef.current.y = Math.max(0, Math.min(video.videoHeight, trackPointRef.current.y))
          
          setPosition({ ...trackPointRef.current })
      } else {
         // Initialize
         trackPointRef.current = { x: width * 2, y: height * 2 }
      }
      
      // Store current frame
      prevFrameRef.current = new Uint8ClampedArray(currentData)
      
      animationId = requestAnimationFrame(track)
    }
    
    track()
    return () => cancelAnimationFrame(animationId)
  }, [videoRef])

  return (
    <Container>
      <Sprite
        image="/assets/clothes/sport_bra_lime_front.png"
        x={position.x}
        y={position.y}
        anchor={0.5}
        scale={0.5}
      />
      {/* Debug dot */}
      <Sprite
        texture={PIXI.Texture.WHITE}
        tint={0xff0000}
        width={10}
        height={10}
        x={position.x}
        y={position.y}
        anchor={0.5}
      />
    </Container>
  )
}
