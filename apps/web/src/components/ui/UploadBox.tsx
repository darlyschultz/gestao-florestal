import React, { useRef, useState } from 'react'
import { Upload, FileText, X, CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface UploadBoxProps {
  label?: string
  accept?: string
  onFileSelect?: (file: File) => void
  status?: 'pendente' | 'valido' | 'invalido'
  fileName?: string
  onRemove?: () => void
  helper?: string
}

export function UploadBox({
  label,
  accept = '.pdf,.jpg,.jpeg,.png',
  onFileSelect,
  status,
  fileName,
  onRemove,
  helper,
}: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function handleFile(file: File) {
    onFileSelect?.(file)
  }

  const statusConfig = {
    pendente: { icon: <Clock size={14} />, label: 'Pendente', color: 'text-yellow-600 bg-yellow-50' },
    valido: { icon: <CheckCircle size={14} />, label: 'Válido', color: 'text-green-600 bg-green-50' },
    invalido: { icon: <AlertCircle size={14} />, label: 'Inválido', color: 'text-red-600 bg-red-50' },
  }

  if (fileName) {
    const cfg = status ? statusConfig[status] : null
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
        <div className="p-2 bg-blue-100 rounded-lg">
          <FileText size={18} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{fileName}</p>
          {cfg && (
            <span className={`inline-flex items-center gap-1 text-xs font-medium mt-0.5 px-2 py-0.5 rounded-full ${cfg.color}`}>
              {cfg.icon}{cfg.label}
            </span>
          )}
        </div>
        {onRemove && (
          <button onClick={onRemove} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
            <X size={16} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-forest-500 bg-forest-50'
            : 'border-gray-300 hover:border-forest-400 hover:bg-gray-50'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          const file = e.dataTransfer.files[0]
          if (file) handleFile(file)
        }}
      >
        <Upload size={24} className="mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 font-medium">Clique ou arraste o arquivo</p>
        <p className="text-xs text-gray-400 mt-1">PDF, JPG ou PNG (máx. 10MB)</p>
        {helper && <p className="text-xs text-forest-600 mt-1">{helper}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
    </div>
  )
}
