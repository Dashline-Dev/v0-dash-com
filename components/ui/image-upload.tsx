"use client"

import { useCallback, useState, useRef } from "react"
import { Upload, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ImageUploadProps {
  value: string | null
  onChange: (url: string | null) => void
  className?: string
  aspectRatio?: "square" | "wide"
  label?: string
}

export function ImageUpload({
  value,
  onChange,
  className,
  aspectRatio = "wide",
  label = "Upload image",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true)
      setError(null)

      try {
        const formData = new FormData()
        formData.append("file", file)

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || "Upload failed")
        }

        const data = await res.json()
        onChange(data.url)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed")
      } finally {
        setUploading(false)
      }
    },
    [onChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) handleUpload(file)
    },
    [handleUpload]
  )

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-foreground">{label}</p>
      {value ? (
        <div
          className={cn(
            "relative rounded-lg overflow-hidden border border-border",
            aspectRatio === "square" ? "aspect-square max-w-40" : "aspect-video"
          )}
        >
          <img
            src={value}
            alt="Uploaded"
            className="w-full h-full object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7"
            onClick={() => onChange(null)}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          disabled={uploading}
          className={cn(
            "flex flex-col items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed border-border bg-secondary/50 text-muted-foreground cursor-pointer transition-colors hover:border-primary/40 hover:bg-secondary",
            aspectRatio === "square"
              ? "aspect-square max-w-40"
              : "aspect-video",
            uploading && "pointer-events-none opacity-60"
          )}
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <Upload className="w-6 h-6" />
          )}
          <span className="text-xs">
            {uploading ? "Uploading..." : "Click or drag to upload"}
          </span>
        </button>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleUpload(file)
          e.target.value = ""
        }}
      />
    </div>
  )
}
