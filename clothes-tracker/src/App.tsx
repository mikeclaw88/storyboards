import { useState, useRef, useEffect } from 'react'
import { Stage } from '@pixi/react'
import { Play, Pause, Layers, Bone, Scan, Edit3, Settings, Camera, Target } from 'lucide-react'
import { BoneMethod, PixelMethod, PoseMethod, ManualMethod, IKMethod, OpticalFlowMethod } from './methods'
import { RiggingPanel, type ClothingAttachment } from './components/RiggingPanel'
import './index.css'

// Placeholder for methods
const METHODS = [
  { id: 'bone', name: 'Bone Based (Spine)', icon: Bone },
  { id: 'pixel', name: 'Pixel Based (Color)', icon: Scan },
  { id: 'pose', name: 'Pose Estimation (MediaPipe)', icon: Layers },
  { id: 'manual', name: 'Manual Keyframing', icon: Edit3 },
  { id: 'ik', name: 'IK / Hybrid (Pose → Spine)', icon: Target },
  { id: 'optical', name: 'Optical Flow', icon: Camera },
]

const AVAILABLE_BONES = [
  'root', 
  'hip_center', 
  'shoulder_center', 
  'head', 
  'shoulder_left', 
  'shoulder_right', 
  'elbow_left', 
  'elbow_right', 
  'wrist_left', 
  'wrist_right',
  'knee_left',
  'knee_right'
]

const AVAILABLE_CLOTHES = [
  '/assets/clothes/black_leather_jacket_front.png',
  '/assets/clothes/hair_bobcut_red_front.png',
  '/assets/clothes/high_waist_denim_jeans_front.png',
  '/assets/clothes/linen_summer_dress_front.png',
  '/assets/clothes/sport_bra_lime_front.png'
]

function App() {
  const [activeMethod, setActiveMethod] = useState('bone')
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  
  // Rigging State
  const [attachments, setAttachments] = useState<ClothingAttachment[]>([
    // Default example
    {
      id: 'default-1',
      bone: 'head',
      image: '/assets/clothes/hair_bobcut_red_front.png',
      offsetX: 0,
      offsetY: 0,
      scale: 0.5,
      rotation: 0
    }
  ])

  // Video path - relative to public (need to copy or symlink)
  const videoSrc = '/assets/modelnoclothes.mp4' 
  
  // Dimensions
  const [dimensions, setDimensions] = useState({ width: 800, height: 450 })

  useEffect(() => {
    let animationFrameId: number
    const updateTime = () => {
      if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime)
        if (videoRef.current.videoWidth > 0 && (dimensions.width !== videoRef.current.videoWidth)) {
             setDimensions({ 
                 width: videoRef.current.videoWidth, 
                 height: videoRef.current.videoHeight 
             })
        }
      }
      animationFrameId = requestAnimationFrame(updateTime)
    }
    updateTime()
    return () => cancelAnimationFrame(animationFrameId)
  }, [dimensions.width])

  return (
    <div className="flex h-screen w-full bg-slate-900 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 p-4 border-r border-slate-700 flex flex-col gap-4 z-20 relative">
        <h1 className="text-xl font-bold mb-4">Clothes Tracker</h1>
        
        <div className="space-y-2">
          <p className="text-sm text-slate-400 font-medium">Tracking Method</p>
          {METHODS.map((method) => (
            <button
              key={method.id}
              onClick={() => setActiveMethod(method.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeMethod === method.id 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'hover:bg-slate-700 text-slate-300'
              }`}
            >
              <method.icon size={18} />
              <span className="text-sm font-medium">{method.name}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t border-slate-700">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Settings size={14} />
            <span>Settings</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Rigging Panel Overlay */}
        <RiggingPanel 
          attachments={attachments}
          setAttachments={setAttachments}
          availableBones={AVAILABLE_BONES}
          availableClothes={AVAILABLE_CLOTHES}
        />

        {/* Toolbar */}
        <div className="h-14 bg-slate-800 border-b border-slate-700 flex items-center px-4 justify-between z-10 relative">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm bg-slate-900 px-2 py-1 rounded">
              {activeMethod.toUpperCase()} MODE
            </span>
          </div>
          <div className="flex items-center gap-2">
             {/* Add layer controls here */}
          </div>
        </div>

        {/* Viewport */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
          <div className="relative w-full h-full max-w-4xl max-h-[80vh] aspect-video bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-2xl">
            {/* Video Layer */}
            <video 
              ref={videoRef}
              src={videoSrc}
              className="absolute inset-0 w-full h-full object-contain z-0"
              loop
              muted
              playsInline
            />
            
            {/* Overlay Layer (Canvas/Pixi) */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              <Stage 
                width={dimensions.width} 
                height={dimensions.height} 
                options={{ backgroundAlpha: 0 }}
                className="w-full h-full"
              >
                {activeMethod === 'bone' && <BoneMethod videoRef={videoRef} currentTime={currentTime} isPlaying={isPlaying} attachments={attachments} />}
                {activeMethod === 'pixel' && <PixelMethod videoRef={videoRef} targetColor={{r: 255, g: 0, b: 0}} />}
                {activeMethod === 'pose' && <PoseMethod videoRef={videoRef} />}
                {activeMethod === 'manual' && <ManualMethod currentTime={currentTime} isPlaying={isPlaying} />}
                {activeMethod === 'ik' && <IKMethod videoRef={videoRef} attachments={attachments} />}
                {activeMethod === 'optical' && <OpticalFlowMethod videoRef={videoRef} />}
              </Stage>
            </div>

            {/* UI Overlay for Manual/Interactive modes */}
            {activeMethod === 'manual' && (
              <div className="absolute inset-0 z-20">
                {/* Interactive points */}
              </div>
            )}
          </div>
        </div>

        {/* Timeline / Controls */}
        <div className="h-24 bg-slate-800 border-t border-slate-700 p-4 flex items-center gap-4 z-10 relative">
          <button 
            onClick={() => {
              if (videoRef.current) {
                if (isPlaying) videoRef.current.pause()
                else videoRef.current.play()
                setIsPlaying(!isPlaying)
              }
            }}
            className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-colors shadow-lg"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
          </button>
          
          <div className="flex-1 bg-slate-700 h-2 rounded-full relative group cursor-pointer">
            <div className="absolute top-0 left-0 h-full bg-blue-500 rounded-full w-1/3 group-hover:bg-blue-400 transition-colors"></div>
            {/* Timeline scrubber handle */}
            <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
          
          <div className="text-xs font-mono text-slate-400 w-20 text-right">
            00:00:00
          </div>
        </div>
      </div>
    </div>
  )
}

export default App