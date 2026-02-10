import { useEffect, useRef, useState } from 'react'
import { Container, Sprite, useApp } from '@pixi/react'
import * as PIXI from 'pixi.js'
import { Spine } from 'pixi-spine'
import 'pixi-spine' // Register loader

interface BoneMethodProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  currentTime: number
  isPlaying: boolean
}

export const BoneMethod = ({ videoRef: _videoRef, currentTime, isPlaying: _isPlaying }: BoneMethodProps) => {
  const app = useApp()
  const spineRef = useRef<Spine | null>(null)
  const [loaded, setLoaded] = useState(false)
  
  // Track bone positions for overlay
  const [bonePositions, setBonePositions] = useState<Record<string, {x: number, y: number, rotation: number}>>({})

  useEffect(() => {
    const loadSpine = async () => {
      try {
        // Spine data requires loader
        // Note: PIXI v8 might handle loading differently, using Assets
        const spineData = await PIXI.Assets.load('/assets/model/modelnoclothes.json')
        
        if (spineData) {
          const spine = new Spine(spineData.spineData)
          spine.state.setAnimation(0, 'animation', true) // Assuming 'animation' is the name, standard spine export default
          // Or check spine.spineData.animations to find the name
          
          spineRef.current = spine
          app.stage.addChild(spine)
          
          // Hide skeleton if desired, or make it transparent
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
      // Sync animation time with video
      // spine.state.tracks[0].trackTime = currentTime
      // Alternatively, use update(delta) but manual sync is better for seeking
      
      const entry = spineRef.current.state.tracks[0]
      if (entry) {
        entry.trackTime = currentTime
        // Force update to calculate bone world transforms
        spineRef.current.update(0)
        
        // Extract bone positions
        const newPositions: Record<string, {x: number, y: number, rotation: number}> = {}
        const bonesToTrack = ['head', 'shoulder_center', 'hip_center', 'shoulder_left', 'shoulder_right']
        
        bonesToTrack.forEach(boneName => {
          const bone = spineRef.current!.skeleton.findBone(boneName)
          if (bone) {
             const b = bone as any
             // Spine uses local transforms, need world
             // bone.worldX, bone.worldY might be populated after update
             newPositions[boneName] = {
               x: b.worldX + spineRef.current!.x,
               y: b.worldY + spineRef.current!.y,
               rotation: b.rotation // Check if worldRotation or rotation
             }
          }
        })
        setBonePositions(newPositions)
      }
    }
  }, [currentTime, loaded])

  if (!loaded) return null

  // Render clothes at bone positions
  return (
    <Container>
      {/* Example: Hair attached to Head */}
      {bonePositions.head && (
        <Sprite
          image="/assets/clothes/hair_bobcut_red_front.png"
          x={bonePositions.head.x}
          y={bonePositions.head.y}
          anchor={0.5}
          rotation={bonePositions.head.rotation * (Math.PI / 180)} // Convert deg to rad if needed
          scale={0.5} // Adjust scale
        />
      )}
      
      {/* Example: Jacket attached to Shoulder Center */}
      {bonePositions.shoulder_center && (
        <Sprite
          image="/assets/clothes/black_leather_jacket_front.png"
          x={bonePositions.shoulder_center.x}
          y={bonePositions.shoulder_center.y}
          anchor={0.5}
          rotation={bonePositions.shoulder_center.rotation * (Math.PI / 180)}
          scale={0.5}
        />
      )}
    </Container>
  )
}
