import { useEffect, useRef, useState } from 'react'
import type React from 'react'
import { Container, Sprite, useApp } from '@pixi/react'
import * as PIXI from 'pixi.js'
import { Spine } from 'pixi-spine'
import 'pixi-spine' // Register loader
import type { ClothingAttachment } from '../components/RiggingPanel'

interface BoneMethodProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  currentTime: number
  isPlaying: boolean
  attachments: ClothingAttachment[]
}

export const BoneMethod = ({ videoRef: _videoRef, currentTime, isPlaying: _isPlaying, attachments }: BoneMethodProps) => {
  const app = useApp()
  const spineRef = useRef<Spine | null>(null)
  const [loaded, setLoaded] = useState(false)
  
  // Track bone positions for overlay
  const [bonePositions, setBonePositions] = useState<Record<string, {x: number, y: number, rotation: number}>>({})

  useEffect(() => {
    const loadSpine = async () => {
      try {
        const spineData = await PIXI.Assets.load('/assets/model/modelnoclothes.json')
        
        if (spineData) {
          const spine = new Spine(spineData.spineData)
          spine.state.setAnimation(0, 'animation', true) 
          
          spineRef.current = spine
          app.stage.addChild(spine)
          
          spine.alpha = 0.5 
          
          setLoaded(true)
        }
      } catch (e) {
        console.error("Failed to load Spine data:", e)
      }
    }
    loadSpine()
    
    return () => {
      if (spineRef.current) {
        app.stage.removeChild(spineRef.current)
        spineRef.current.destroy()
      }
    }
  }, [app])

  useEffect(() => {
    if (spineRef.current && loaded) {
      const entry = spineRef.current.state.tracks[0]
      if (entry) {
        entry.trackTime = currentTime
        spineRef.current.update(0)
        
        const newPositions: Record<string, {x: number, y: number, rotation: number}> = {}
        // Track only needed bones
        const bonesToTrack = Array.from(new Set(attachments.map(a => a.bone)))
        if (bonesToTrack.length === 0) {
           // Default track something so we don't break if empty
           bonesToTrack.push('head')
        }

        bonesToTrack.forEach(boneName => {
          const bone = spineRef.current!.skeleton.findBone(boneName)
          if (bone) {
             const b = bone as any
             newPositions[boneName] = {
               x: b.worldX + spineRef.current!.x,
               y: b.worldY + spineRef.current!.y,
               rotation: b.rotation 
             }
          }
        })
        setBonePositions(newPositions)
      }
    }
  }, [currentTime, loaded, attachments])

  if (!loaded) return null

  return (
    <Container>
      {attachments.map(att => {
        const pos = bonePositions[att.bone]
        if (!pos) return null
        
        // Calculate final position with offset rotated by bone rotation
        // Simple 2D rotation for offset
        const rad = pos.rotation * (Math.PI / 180)
        const finalX = pos.x + (att.offsetX * Math.cos(rad) - att.offsetY * Math.sin(rad))
        const finalY = pos.y + (att.offsetX * Math.sin(rad) + att.offsetY * Math.cos(rad))
        
        return (
          <Sprite
            key={att.id}
            image={att.image}
            x={finalX}
            y={finalY}
            anchor={0.5}
            rotation={(pos.rotation + att.rotation) * (Math.PI / 180)}
            scale={att.scale}
          />
        )
      })}
    </Container>
  )
}
