import { useEffect, useRef, useState } from 'react'
import type React from 'react'
import { Container, Sprite } from '@pixi/react'
import { Pose } from '@mediapipe/pose'

interface PoseMethodProps {
  videoRef: React.RefObject<HTMLVideoElement | null>
}

export const PoseMethod = ({ videoRef }: PoseMethodProps) => {
  const [landmarks, setLandmarks] = useState<any[] | null>(null)
  const poseRef = useRef<Pose | null>(null)
  
  useEffect(() => {
    const initializePose = async () => {
      const pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });
      
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
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
    
    // Start tracking loop
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
  
  if (!landmarks) return null
  
  // Map landmarks to sprites
  // 11 = left shoulder, 12 = right shoulder -> Use avg for chest center
  // 23 = left hip, 24 = right hip -> Use avg for hip center
  // 0 = nose (head)
  
  const width = videoRef.current?.videoWidth || 1
  const height = videoRef.current?.videoHeight || 1
  
  const shoulderX = ((landmarks[11].x + landmarks[12].x) / 2) * width
  const shoulderY = ((landmarks[11].y + landmarks[12].y) / 2) * height
  
  // Removed head calculation to suppress warning if unused
  
  const hipX = ((landmarks[23].x + landmarks[24].x) / 2) * width
  const hipY = ((landmarks[23].y + landmarks[24].y) / 2) * height

  return (
    <Container>
      {/* Jacket on Shoulders */}
      <Sprite
        image="/assets/clothes/black_leather_jacket_front.png"
        x={shoulderX}
        y={shoulderY}
        anchor={0.5}
        scale={0.5} // Adjust scale dynamically based on distance?
      />
      
      {/* Jeans on Hips */}
      <Sprite
        image="/assets/clothes/high_waist_denim_jeans_front.png"
        x={hipX}
        y={hipY}
        anchor={0.5}
        scale={0.5}
      />
    </Container>
  )
}
