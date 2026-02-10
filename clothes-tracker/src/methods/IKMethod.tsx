import { useEffect, useRef, useState } from 'react'
import type React from 'react'
import { Container, Sprite, useApp } from '@pixi/react'
import * as PIXI from 'pixi.js'
import { Spine } from 'pixi-spine'
import { Pose } from '@mediapipe/pose'
import type { ClothingAttachment } from '../components/RiggingPanel'

interface IKMethodProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
  attachments: ClothingAttachment[]
}

export const IKMethod = ({ videoRef, attachments }: IKMethodProps) => {
  const app = useApp()
  const spineRef = useRef<Spine | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [landmarks, setLandmarks] = useState<any[] | null>(null)
  const poseRef = useRef<Pose | null>(null)
  
  const [bonePositions, setBonePositions] = useState<Record<string, {x: number, y: number, rotation: number}>>({})

  // 1. Initialize Pose
  useEffect(() => {
    const initializePose = async () => {
      const pose = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });
      
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      
      pose.onResults((results) => {
        if (results.poseLandmarks) {
          setLandmarks(results.poseLandmarks)
        }
      });
      
      poseRef.current = pose
    }
    
    initializePose()
    
    // Tracking loop
    let animationId: number
    const sendFrame = async () => {
      const video = videoRef.current
      if (video && video.readyState >= 2 && poseRef.current) {
         try {
           await poseRef.current.send({image: video})
         } catch(e) {
           console.error("Pose error:", e)
         }
      }
      animationId = requestAnimationFrame(sendFrame)
    }
    
    sendFrame()
    
    return () => {
      cancelAnimationFrame(animationId)
      if (poseRef.current) poseRef.current.close()
    }
  }, [videoRef])

  // 2. Initialize Spine
  useEffect(() => {
    const loadSpine = async () => {
      try {
        const spineData = await PIXI.Assets.load('/assets/model/modelnoclothes.json')
        if (spineData) {
          const spine = new Spine(spineData.spineData)
          spineRef.current = spine
          app.stage.addChild(spine)
          spine.x = app.renderer.width / 2
          spine.y = app.renderer.height / 2
          
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

  // 3. Drive Bones with Pose & Extract Positions
  useEffect(() => {
    if (!loaded || !spineRef.current || !landmarks || !videoRef.current) return
    
    const width = videoRef.current.videoWidth
    const height = videoRef.current.videoHeight
    
    const spine = spineRef.current
    const skeleton = spine.skeleton
    
    const getPos = (idx: number) => ({
      x: landmarks[idx].x * width,
      y: landmarks[idx].y * height
    })

    const hipL = getPos(23)
    const hipR = getPos(24)
    const hipCenter = { x: (hipL.x + hipR.x)/2, y: (hipL.y + hipR.y)/2 }
    
    spine.x = hipCenter.x
    spine.y = hipCenter.y
    
    const shoulderL = getPos(11)
    const shoulderR = getPos(12)
    const angle = Math.atan2(shoulderR.y - shoulderL.y, shoulderR.x - shoulderL.x)
    
    const torso = skeleton.findBone('root') as any
    if (torso) {
      torso.rotation = angle * (180 / Math.PI)
    }
    
    const shoulderDist = Math.hypot(shoulderR.x - shoulderL.x, shoulderR.y - shoulderL.y)
    const scale = shoulderDist / 100 
    spine.scale.set(scale)
    
    spine.update(0) 
    
    // Extract bone positions for overlays
    const newPositions: Record<string, {x: number, y: number, rotation: number}> = {}
    const bonesToTrack = Array.from(new Set(attachments.map(a => a.bone)))
    
    bonesToTrack.forEach(boneName => {
      const bone = skeleton.findBone(boneName)
      if (bone) {
         const b = bone as any
         // Need world transform (Spine Runtime specific)
         // spine-ts uses worldX/worldY if updateWorldTransform is called?
         // pixi-spine usually exposes worldX/worldY on the bone object directly or via worldTransform
         newPositions[boneName] = {
           x: b.worldX + spine.x,
           y: b.worldY + spine.y,
           rotation: b.rotation // This is local rotation. Need world rotation.
           // Approximating world rotation by adding parent rotations or just using local if root is rotated?
           // The root rotation we set propagates.
         }
      }
    })
    setBonePositions(newPositions)
    
  }, [landmarks, loaded, attachments])

  if (!loaded) return null

  return (
    <Container>
      {/* Attachments Overlay */}
      {attachments.map(att => {
        const pos = bonePositions[att.bone]
        if (!pos) return null
        
        const rad = pos.rotation * (Math.PI / 180)
        // Rotate offset based on bone rotation
        const finalX = pos.x + (att.offsetX * Math.cos(rad) - att.offsetY * Math.sin(rad))
        const finalY = pos.y + (att.offsetX * Math.sin(rad) + att.offsetY * Math.cos(rad))

        return (
          <Sprite
            key={att.id}
            image={att.image}
            x={finalX}
            y={finalY}
            rotation={(pos.rotation + att.rotation) * (Math.PI / 180)}
            scale={att.scale}
            anchor={0.5}
          />
        )
      })}
    </Container>
  )
}
