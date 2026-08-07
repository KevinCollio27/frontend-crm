"use client"

import * as React from "react"
import { MapPinIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { loadPlacesLibrary } from "@/lib/google-maps"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Ingresa una dirección",
  className,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = React.useState<google.maps.places.AutocompleteSuggestion[]>([])
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [dropdownStyle, setDropdownStyle] = React.useState<React.CSSProperties>({})

  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const sessionTokenRef = React.useRef<google.maps.places.AutocompleteSessionToken | null>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function positionDropdown() {
    if (!inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    setDropdownStyle({ top: rect.bottom + 6, left: rect.left, width: rect.width })
  }

  async function fetchSuggestions(query: string) {
    if (query.trim().length < 3) {
      setSuggestions([])
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const places = await loadPlacesLibrary()
      if (!sessionTokenRef.current) {
        sessionTokenRef.current = new places.AutocompleteSessionToken()
      }
      const { suggestions: results } = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: query,
        sessionToken: sessionTokenRef.current,
        language: "es",
        region: "cl",
      })
      setSuggestions(results)
      positionDropdown()
      setOpen(results.length > 0)
    } catch {
      setSuggestions([])
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  function handleFocus() {
    if (suggestions.length === 0) return
    positionDropdown()
    setOpen(true)
  }

  function handleInputChange(next: string) {
    onChange(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(next), 300)
  }

  async function handleSelect(suggestion: google.maps.places.AutocompleteSuggestion) {
    const prediction = suggestion.placePrediction
    if (!prediction) return
    const place = prediction.toPlace()
    try {
      await place.fetchFields({ fields: ["formattedAddress"] })
    } catch {
      // sigue con el texto de la predicción si falla el detalle
    }
    onChange(place.formattedAddress ?? prediction.text.toString())
    setOpen(false)
    setSuggestions([])
    sessionTokenRef.current = null
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <InputGroup>
        <InputGroupAddon>
          <MapPinIcon className="" />
        </InputGroupAddon>
        <InputGroupInput
          ref={inputRef}
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          autoComplete="off"
        />
      </InputGroup>

      {open && (
        <div
          className="fixed z-50 max-h-56 overflow-y-auto rounded-lg border bg-popover text-popover-foreground shadow-md"
          style={dropdownStyle}
        >
          {loading ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">Buscando...</p>
          ) : (
            suggestions.map((s) => (
              <button
                key={s.placePrediction?.placeId ?? s.placePrediction?.text.toString()}
                type="button"
                onClick={() => handleSelect(s)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <MapPinIcon className="size-3.5 shrink-0" />
                <span className="truncate">{s.placePrediction?.text.toString()}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
