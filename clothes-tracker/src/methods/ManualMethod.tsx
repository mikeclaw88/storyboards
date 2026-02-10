import { useState, useEffect } from 'react'
import { Container, Sprite } from '@pixi/react'

interface ManualMethodProps {
  currentTime: number
  isPlaying: boolean
}

interface Keyframe {
  time: number
  x: number
  y: number
}

export const ManualMethod = ({ currentTime, isPlaying: _isPlaying }: ManualMethodProps) => {
  const [keyframes, _setKeyframes] = useState<Keyframe[]>([
    { time: 0, x: 50, y: 150 },
    { time: 10, x: 50, y: 150 }, // Initial frame
    // Add more frames via UI
  ])
  
  const [currentPos, setCurrentPos] = useState({ x: 50, y: 150 })

  // Linear interpolation
  useEffect(() => {
    if (keyframes.length < 2) return
    
    // Sort frames
    const sorted = [...keyframes].sort((a, b) => a.time - b.time)
    
    // Find surrounding frames
    const nextIdx = sorted.findIndex(k => k.time >= currentTime)
    if (nextIdx === -1) {
      // Past last frame
      const last = sorted[sorted.length - 1]
      setCurrentPos({ x: last.x, y: last.y })
      return
    }
    
    if (nextIdx === 0) {
      // Before first frame
      const first = sorted[0]
      setCurrentPos({ x: first.x, y: first.y })
      return
    }
    
    const prev = sorted[nextIdx - 1]
    const next = sorted[nextIdx]
    
    const progress = (currentTime - prev.time) / (next.time - prev.time)
    
    setCurrentPos({
      x: prev.x + (next.x - prev.x) * progress,
      y: prev.y + (next.y - prev.y) * progress
    })
    
  }, [currentTime, keyframes])

  // Drag logic needs interactivity overlay (handled in parent or separately)
  
  return (
    <Container>
      <Sprite
        image="/assets/clothes/linen_summer_dress_front.png"
        x={currentPos.x}
        y={currentPos.y}
        anchor={0.5}
        scale={0.5}
        eventMode="dynamic"
        pointerdown={(e) => {
           // Allow dragging to set keyframe
           // This logic is complex inside React Pixi component without imperative handle
           console.log("Drag start", e)
        }}
      />
    </Container>
  )
}
