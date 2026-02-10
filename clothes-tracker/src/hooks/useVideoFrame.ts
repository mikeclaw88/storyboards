import { useEffect } from 'react'

export const useVideoFrame = (
  videoRef: React.RefObject<HTMLVideoElement>,
  onFrame: (canvas: HTMLCanvasElement) => void
) => {
  useEffect(() => {
    let animationId: number
    const canvas = document.createElement('canvas')
    
    const loop = () => {
      const video = videoRef.current
      if (video && video.readyState >= 2) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
        }
        
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          onFrame(canvas)
        }
      }
      animationId = requestAnimationFrame(loop)
    }
    
    loop()
    return () => cancelAnimationFrame(animationId)
  }, [videoRef, onFrame])
}