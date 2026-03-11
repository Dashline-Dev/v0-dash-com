"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { MapPin, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PlaceResult {
  placeId: string
  name: string
  formattedAddress: string
  lat?: number
  lng?: number
}

interface Suggestion {
  placeId: string
  mainText: string
  secondaryText: string
  description: string
}

interface PlacesAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onPlaceSelect?: (place: PlaceResult) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  types?: string[]
}

export function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Enter an address...",
  disabled = false,
  className,
  id,
  types = ["address"],
}: PlacesAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null)

  // Initialize session token
  useEffect(() => {
    if (typeof google !== "undefined" && google.maps?.places) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken()
    }
  }, [])

  const fetchSuggestions = useCallback(
    async (input: string) => {
      if (!input || input.length < 2) {
        setSuggestions([])
        return
      }

      if (typeof google === "undefined" || !google.maps?.places) {
        return
      }

      setIsLoading(true)
      try {
        // Use the new AutocompleteSuggestion API
        const { suggestions: results } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          sessionToken: sessionTokenRef.current || undefined,
          includedPrimaryTypes: types.includes("establishment") 
            ? ["establishment", "street_address", "premise"] 
            : ["street_address", "premise", "subpremise"],
        })

        const formatted: Suggestion[] = results
          .filter((s): s is google.maps.places.PlacePrediction & { placePrediction: NonNullable<google.maps.places.PlacePrediction["placePrediction"]> } => 
            s.placePrediction != null
          )
          .map((s) => ({
            placeId: s.placePrediction.placeId || "",
            mainText: s.placePrediction.mainText?.text || "",
            secondaryText: s.placePrediction.secondaryText?.text || "",
            description: s.placePrediction.text?.text || "",
          }))

        setSuggestions(formatted)
        setIsOpen(formatted.length > 0)
        setIsLoading(false)
      } catch (error) {
        console.error("Places autocomplete error:", error)
        setIsLoading(false)
        setSuggestions([])
      }
    },
    [types]
  )

  // Debounced fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(value)
    }, 300)
    return () => clearTimeout(timer)
  }, [value, fetchSuggestions])

  const selectPlace = useCallback(
    async (suggestion: Suggestion) => {
      onChange(suggestion.description)
      setSuggestions([])
      setIsOpen(false)
      setActiveIndex(-1)

      if (!onPlaceSelect || !suggestion.placeId) return

      try {
        // Use the new Place class to fetch details
        const { Place } = google.maps.places
        const place = new Place({ id: suggestion.placeId })
        
        await place.fetchFields({
          fields: ["displayName", "formattedAddress", "location"],
        })

        // Reset session token after place selection
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken()

        onPlaceSelect({
          placeId: suggestion.placeId,
          name: place.displayName || suggestion.mainText,
          formattedAddress: place.formattedAddress || suggestion.description,
          lat: place.location?.lat(),
          lng: place.location?.lng(),
        })
      } catch (error) {
        console.error("Place details error:", error)
        // Still call onPlaceSelect with available data
        onPlaceSelect({
          placeId: suggestion.placeId,
          name: suggestion.mainText,
          formattedAddress: suggestion.description,
        })
      }
    },
    [onChange, onPlaceSelect]
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
        break
      case "ArrowUp":
        e.preventDefault()
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1))
        break
      case "Enter":
        e.preventDefault()
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          selectPlace(suggestions[activeIndex])
        }
        break
      case "Escape":
        setIsOpen(false)
        setActiveIndex(-1)
        break
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeItem = listRef.current.children[activeIndex] as HTMLElement
      activeItem?.scrollIntoView({ block: "nearest" })
    }
  }, [activeIndex])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        listRef.current &&
        !listRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const isGoogleLoaded = typeof google !== "undefined" && google.maps?.places

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn("pl-9 pr-8", className)}
          autoComplete="off"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        )}
      </div>

      {isOpen && suggestions.length > 0 && isGoogleLoaded && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.placeId}
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                "px-3 py-2 cursor-pointer text-sm",
                index === activeIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted"
              )}
              onClick={() => selectPlace(suggestion)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium truncate">
                    {suggestion.mainText}
                  </div>
                  {suggestion.secondaryText && (
                    <div className="text-xs text-muted-foreground truncate">
                      {suggestion.secondaryText}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
          <li className="px-3 py-1.5 text-[10px] text-muted-foreground border-t bg-muted/50 flex items-center gap-1">
            <svg className="w-12 h-3" viewBox="0 0 116 15" fill="currentColor">
              <path d="M5.4 11.64c-2.88 0-5.22-2.34-5.22-5.34s2.34-5.34 5.22-5.34c1.56 0 2.7.6 3.54 1.38l-1.02 1.02c-.6-.54-1.38-.96-2.52-.96-2.04 0-3.66 1.68-3.66 3.9s1.62 3.9 3.66 3.9c1.32 0 2.1-.54 2.58-1.02.42-.42.66-1.02.78-1.86H5.4V5.34h4.86c.06.24.06.54.06.84 0 1.02-.3 2.28-1.14 3.18-.84.96-1.92 1.44-3.78 1.44v.84zm11.04-1.2c-2.16 0-3.96-1.62-3.96-3.96s1.8-3.96 3.96-3.96 3.96 1.62 3.96 3.96-1.8 3.96-3.96 3.96zm0-1.38c1.2 0 2.28-1.02 2.28-2.58S17.64 3.9 16.44 3.9s-2.28 1.02-2.28 2.58 1.08 2.58 2.28 2.58zm11.04 1.38c-2.16 0-3.96-1.62-3.96-3.96s1.8-3.96 3.96-3.96 3.96 1.62 3.96 3.96-1.8 3.96-3.96 3.96zm0-1.38c1.2 0 2.28-1.02 2.28-2.58s-1.08-2.58-2.28-2.58-2.28 1.02-2.28 2.58 1.08 2.58 2.28 2.58zm11.16 1.38c-2.16 0-3.96-1.62-3.96-3.96s1.8-3.96 3.96-3.96c1.26 0 2.22.48 2.88 1.26l-1.14.84c-.42-.48-.96-.72-1.74-.72-1.2 0-2.28 1.02-2.28 2.58s1.08 2.58 2.28 2.58c.78 0 1.32-.3 1.74-.78l1.14.84c-.66.78-1.62 1.32-2.88 1.32zm7.86 0c-2.04 0-3.66-1.56-3.66-3.96 0-2.34 1.56-3.96 3.48-3.96 1.98 0 3.12 1.56 3.12 3.84 0 .18 0 .42-.06.6h-4.92c.12 1.26 1.02 2.1 2.1 2.1.9 0 1.44-.36 1.86-1.02l1.32.66c-.6 1.02-1.62 1.74-3.24 1.74zm-2.04-4.56h3.36c-.06-1.02-.66-1.74-1.62-1.74-.9 0-1.56.72-1.74 1.74z"/>
            </svg>
          </li>
        </ul>
      )}
    </div>
  )
}
