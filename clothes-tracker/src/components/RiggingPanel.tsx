import { useState } from 'react'
import { Sliders, Save, Plus, Trash2 } from 'lucide-react'

export interface ClothingAttachment {
  id: string
  bone: string
  image: string
  offsetX: number
  offsetY: number
  scale: number
  rotation: number
}

interface RiggingPanelProps {
  attachments: ClothingAttachment[]
  setAttachments: (attachments: ClothingAttachment[]) => void
  availableBones: string[]
  availableClothes: string[]
}

export const RiggingPanel = ({ attachments, setAttachments, availableBones, availableClothes }: RiggingPanelProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleAdd = () => {
    const newId = Math.random().toString(36).substr(2, 9)
    setAttachments([
      ...attachments,
      {
        id: newId,
        bone: availableBones[0] || 'root',
        image: availableClothes[0] || '',
        offsetX: 0,
        offsetY: 0,
        scale: 0.5,
        rotation: 0
      }
    ])
    setSelectedId(newId)
  }

  const updateSelected = (field: keyof ClothingAttachment, value: any) => {
    if (!selectedId) return
    setAttachments(attachments.map(a => 
      a.id === selectedId ? { ...a, [field]: value } : a
    ))
  }
  
  const selectedAttachment = attachments.find(a => a.id === selectedId)

  return (
    <div className="absolute right-4 top-20 w-80 bg-slate-800/90 backdrop-blur border border-slate-700 rounded-lg p-4 shadow-xl z-50 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-200 flex items-center gap-2">
          <Sliders size={16} /> Rigging Station
        </h3>
        <button 
          onClick={handleAdd}
          className="p-1 bg-blue-600 rounded hover:bg-blue-500 transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="space-y-4">
        {/* List of attachments */}
        <div className="space-y-2 mb-4">
          {attachments.map(att => (
            <div 
              key={att.id}
              onClick={() => setSelectedId(att.id)}
              className={`p-2 rounded cursor-pointer flex justify-between items-center text-xs ${
                selectedId === att.id ? 'bg-blue-900/50 border border-blue-500' : 'bg-slate-700/50 border border-transparent hover:bg-slate-700'
              }`}
            >
              <span className="truncate">{att.image.split('/').pop()} &rarr; {att.bone}</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  setAttachments(attachments.filter(a => a.id !== att.id))
                  if (selectedId === att.id) setSelectedId(null)
                }}
                className="text-slate-400 hover:text-red-400"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Editor for selected */}
        {selectedAttachment && (
          <div className="space-y-3 border-t border-slate-700 pt-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Bone Target</label>
              <select 
                value={selectedAttachment.bone}
                onChange={(e) => updateSelected('bone', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-xs"
              >
                {availableBones.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            
            <div>
              <label className="text-xs text-slate-400 block mb-1">Clothing Asset</label>
              <select 
                value={selectedAttachment.image}
                onChange={(e) => updateSelected('image', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-xs"
              >
                {availableClothes.map(c => <option key={c} value={c}>{c.split('/').pop()}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Offset X</label>
                <input 
                  type="range" min="-200" max="200" 
                  value={selectedAttachment.offsetX}
                  onChange={(e) => updateSelected('offsetX', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Offset Y</label>
                <input 
                  type="range" min="-200" max="200" 
                  value={selectedAttachment.offsetY}
                  onChange={(e) => updateSelected('offsetY', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Scale</label>
                <input 
                  type="range" min="0.1" max="2" step="0.1"
                  value={selectedAttachment.scale}
                  onChange={(e) => updateSelected('scale', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Rotation</label>
                <input 
                  type="range" min="-180" max="180"
                  value={selectedAttachment.rotation}
                  onChange={(e) => updateSelected('rotation', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        <button 
          onClick={() => {
            console.log(JSON.stringify(attachments, null, 2))
            alert("Configuration saved to console!")
          }}
          className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs font-bold flex items-center justify-center gap-2 mt-2"
        >
          <Save size={14} /> Export Config
        </button>
      </div>
    </div>
  )
}
