"use client"

import { useState, useRef } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
  className?: string
}

export function TagInput({
  value,
  onChange,
  placeholder = "Add a tag...",
  maxTags = 10,
  className,
}: TagInputProps) {
  const [input, setInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = (tag: string) => {
    const cleaned = tag.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-")
    if (!cleaned || value.includes(cleaned) || value.length >= maxTags) return
    onChange([...value, cleaned])
    setInput("")
  }

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag(input)
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 p-2 min-h-[42px] rounded-lg border border-input bg-background transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring",
        className
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="gap-1 pr-1 text-xs font-normal"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              removeTag(tag)
            }}
            className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
            aria-label={`Remove ${tag}`}
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      {value.length < maxTags && (
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (input.trim()) addTag(input)
          }}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[80px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      )}
    </div>
  )
}
