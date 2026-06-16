import React, { useRef } from 'react'
import { Camera, User } from 'lucide-react'
import { resolveAssetUrl } from '../../utils/apiBase'

interface AvatarUploadProps {
  avatar?: string | null
  nome?: string
  onUpload: (file: File) => void
  loading?: boolean
}

export function AvatarUpload({ avatar, nome, onUpload, loading }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const src = resolveAssetUrl(avatar)

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="w-24 h-24 rounded-2xl bg-forest-100 flex items-center justify-center overflow-hidden">
          {src ? (
            <img src={src} alt={nome} className="w-full h-full object-cover" />
          ) : (
            <User size={40} className="text-forest-600" />
          )}
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
          className="absolute -bottom-1 -right-1 w-8 h-8 bg-forest-700 text-white rounded-full flex items-center justify-center shadow-md hover:bg-forest-800 disabled:opacity-50"
        >
          <Camera size={14} />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) onUpload(file)
          }}
        />
      </div>
      {nome && <p className="font-semibold text-gray-900">{nome}</p>}
    </div>
  )
}
