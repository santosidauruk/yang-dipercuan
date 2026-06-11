'use client'

import { useRef } from 'react'
import { Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CsvActionsProps {
  filename: string
  buildCsv: () => string
  onImport: (text: string) => void
  disabled?: boolean
  importLabel?: string
  exportLabel?: string
  className?: string
}

export function CsvActions({
  filename,
  buildCsv,
  onImport,
  disabled,
  importLabel = 'Import',
  exportLabel = 'Export',
  className
}: CsvActionsProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const csv = buildCsv()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFile = async (file: File) => {
    const text = await file.text()
    onImport(text)
  }

  return (
    <div className={className ?? 'flex items-center gap-2'}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={disabled}
      >
        <Download className="h-4 w-4" />
        {exportLabel}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
        {importLabel}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        data-testid="csv-import-input"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
