"use client"

import { toHebrewDate } from "@/lib/hebrew-date"
import type { EventTemplate } from "@/lib/event-templates"
import { getTemplateById } from "@/lib/event-templates"
import type { Event } from "@/types/event"
import { formatEventDate, formatEventTime } from "@/types/event"

interface InvitationCardProps {
  event: Partial<Event> & { title: string; start_time: string; end_time: string }
  templateId?: string
  template?: EventTemplate
  className?: string
  scale?: number
}

// Decorative SVG elements
const Decorations = {
  floral: (color: string) => (
    <svg viewBox="0 0 100 20" className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 opacity-60">
      <path
        d="M10,10 Q25,0 40,10 T70,10 T100,10"
        fill="none"
        stroke={color}
        strokeWidth="1"
      />
      <circle cx="25" cy="10" r="3" fill={color} />
      <circle cx="50" cy="10" r="3" fill={color} />
      <circle cx="75" cy="10" r="3" fill={color} />
    </svg>
  ),
  
  musical: (color: string) => (
    <div className="absolute top-6 left-6 opacity-30">
      <svg viewBox="0 0 24 24" width="32" height="32" fill={color}>
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
      </svg>
    </div>
  ),
  
  stars: (color: string) => (
    <>
      <div className="absolute top-4 right-4 opacity-40">
        <svg viewBox="0 0 24 24" width="20" height="20" fill={color}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </div>
      <div className="absolute bottom-8 left-8 opacity-30">
        <svg viewBox="0 0 24 24" width="16" height="16" fill={color}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </div>
    </>
  ),
  
  hearts: (color: string) => (
    <div className="absolute top-6 right-6 opacity-30">
      <svg viewBox="0 0 24 24" width="24" height="24" fill={color}>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    </div>
  ),
  
  dove: (color: string) => (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-40">
      <svg viewBox="0 0 24 24" width="40" height="40" fill={color}>
        <path d="M12.5 2C9.46 2 7 4.46 7 7.5c0 1.33.47 2.55 1.26 3.5H7c-.83 0-1.5.67-1.5 1.5S6.17 14 7 14h4.5c-1.5 1.17-2.5 3-2.5 5h11c0-2-1-3.83-2.5-5H22c.83 0 1.5-.67 1.5-1.5S22.83 11 22 11h-1.26c.79-.95 1.26-2.17 1.26-3.5C22 4.46 19.54 2 16.5 2h-4z" />
      </svg>
    </div>
  ),
  
  torah: (color: string) => (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-30">
      <svg viewBox="0 0 48 24" width="60" height="30" fill={color}>
        <rect x="2" y="2" width="6" height="20" rx="1" />
        <rect x="40" y="2" width="6" height="20" rx="1" />
        <path d="M8 4h32v16H8z" fill="none" stroke={color} strokeWidth="1" />
        <line x1="14" y1="8" x2="34" y2="8" stroke={color} strokeWidth="0.5" />
        <line x1="14" y1="12" x2="34" y2="12" stroke={color} strokeWidth="0.5" />
        <line x1="14" y1="16" x2="34" y2="16" stroke={color} strokeWidth="0.5" />
      </svg>
    </div>
  ),
  
  candles: (color: string) => (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1 opacity-40">
      {[...Array(9)].map((_, i) => (
        <div key={i} className="flex flex-col items-center">
          <div 
            className="w-1 h-2 rounded-full" 
            style={{ background: `linear-gradient(to top, ${color}, #FEF3C7)` }} 
          />
          <div className="w-1.5 h-4" style={{ backgroundColor: color }} />
        </div>
      ))}
    </div>
  ),
  
  confetti: (color: string) => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: i % 3 === 0 ? color : i % 3 === 1 ? '#FCD34D' : '#EC4899',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  ),
  
  rings: (color: string) => (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-40">
      <svg viewBox="0 0 48 24" width="48" height="24">
        <circle cx="16" cy="12" r="8" fill="none" stroke={color} strokeWidth="2" />
        <circle cx="32" cy="12" r="8" fill="none" stroke={color} strokeWidth="2" />
      </svg>
    </div>
  ),
  
  ribbons: (color: string) => (
    <div className="absolute top-0 right-4 opacity-40">
      <svg viewBox="0 0 24 48" width="24" height="48" fill={color}>
        <path d="M12 0v36l-8 12 8-8 8 8-8-12V0z" />
      </svg>
    </div>
  ),
  
  geometric: (color: string) => (
    <div className="absolute top-4 right-4 opacity-20">
      <svg viewBox="0 0 60 60" width="60" height="60">
        <polygon points="30,5 55,55 5,55" fill="none" stroke={color} strokeWidth="1" />
        <polygon points="30,15 45,50 15,50" fill="none" stroke={color} strokeWidth="0.5" />
      </svg>
    </div>
  ),
}

// Frame styles
function getFrameStyle(frameStyle: EventTemplate["style"]["frameStyle"], frameColor: string) {
  switch (frameStyle) {
    case "ornate":
      return {
        border: `3px solid ${frameColor}`,
        boxShadow: `inset 0 0 0 6px transparent, inset 0 0 0 8px ${frameColor}20`,
        borderRadius: "4px",
      }
    case "double":
      return {
        border: `2px solid ${frameColor}`,
        boxShadow: `inset 0 0 0 4px transparent, inset 0 0 0 6px ${frameColor}`,
        borderRadius: "2px",
      }
    case "simple":
      return {
        border: `2px solid ${frameColor}`,
        borderRadius: "4px",
      }
    case "rounded":
      return {
        border: `2px solid ${frameColor}`,
        borderRadius: "16px",
      }
    case "artistic":
      return {
        border: `3px solid ${frameColor}`,
        borderRadius: "8px",
        boxShadow: `4px 4px 0 ${frameColor}40`,
      }
    case "none":
    default:
      return {}
  }
}

// Font family mapping
function getFontFamily(font: EventTemplate["style"]["fontFamily"]) {
  switch (font) {
    case "serif":
      return "Georgia, 'Times New Roman', serif"
    case "script":
      return "'Brush Script MT', cursive, serif"
    case "hebrew":
      return "'David Libre', 'Frank Ruhl Libre', serif"
    case "mixed":
      return "'Frank Ruhl Libre', Georgia, serif"
    case "sans-serif":
    default:
      return "system-ui, -apple-system, sans-serif"
  }
}

export function InvitationCard({
  event,
  templateId,
  template: providedTemplate,
  className = "",
  scale = 1,
}: InvitationCardProps) {
  const template = providedTemplate || (templateId ? getTemplateById(templateId) : undefined)
  
  if (!template) {
    // Default simple card if no template
    return (
      <div className={`bg-white border rounded-lg p-8 text-center ${className}`}>
        <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
        {event.start_time && (
          <p className="text-muted-foreground">{formatEventDate(event.start_time)}</p>
        )}
        {event.location_name && <p className="mt-2">{event.location_name}</p>}
      </div>
    )
  }

  const { style, fields } = template
  const frameStyles = getFrameStyle(style.frameStyle, style.frameColor)
  const fontFamily = getFontFamily(style.fontFamily)
  
  // Format Hebrew date if needed
  const hebrewDate = fields.showHebrewDate && event.start_time 
    ? toHebrewDate(new Date(event.start_time))
    : null

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: style.background,
        ...frameStyles,
        padding: `${24 * scale}px`,
        minHeight: `${400 * scale}px`,
        fontFamily,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      {/* Decorations */}
      {style.decorations?.map((dec) => {
        const DecorationComponent = Decorations[dec]
        return DecorationComponent ? (
          <div key={dec}>{DecorationComponent(style.accentColor)}</div>
        ) : null
      })}
      
      {/* Content */}
      <div 
        className="relative z-10 flex flex-col items-center justify-center h-full text-center gap-3"
        style={{ 
          minHeight: `${350 * scale}px`,
          paddingTop: style.decorations?.includes("candles") || style.decorations?.includes("rings") ? "40px" : "0",
        }}
      >
        {/* Event type label */}
        {fields.eventTypeLabel && (
          <div
            className="text-sm uppercase tracking-[0.3em] font-medium"
            style={{ color: style.secondaryTextColor }}
          >
            {fields.eventTypeLabel}
          </div>
        )}
        
        {/* Main title */}
        <h1
          className="text-3xl md:text-4xl font-bold leading-tight"
          style={{ color: style.textColor }}
        >
          {event.title}
        </h1>
        
        {/* Host line */}
        {fields.showHostLine && fields.hostLineTemplate && (
          <p
            className="text-base mt-2"
            style={{ color: style.secondaryTextColor }}
          >
            {fields.hostLineTemplate}
          </p>
        )}
        
        {/* Divider */}
        <div
          className="w-24 h-px my-3"
          style={{ backgroundColor: style.accentColor }}
        />
        
        {/* Date & Time */}
        {fields.showTime && event.start_time && (
          <div className="space-y-1">
            <p
              className="text-lg font-semibold"
              style={{ color: style.textColor }}
            >
              {formatEventDate(event.start_time)}
            </p>
            {hebrewDate && (
              <p
                className="text-base"
                style={{ color: style.secondaryTextColor, direction: "rtl" }}
              >
                {hebrewDate}
              </p>
            )}
            <p
              className="text-base"
              style={{ color: style.secondaryTextColor }}
            >
              {formatEventTime(event.start_time)} - {formatEventTime(event.end_time)}
            </p>
          </div>
        )}
        
        {/* Location */}
        {fields.showVenue && event.location_name && (
          <div className="mt-2 space-y-0.5">
            <p
              className="text-lg font-medium"
              style={{ color: style.textColor }}
            >
              {event.location_name}
            </p>
            {event.location_address && (
              <p
                className="text-sm"
                style={{ color: style.secondaryTextColor }}
              >
                {event.location_address}
              </p>
            )}
          </div>
        )}
        
        {/* Dress code */}
        {fields.showDressCode && event.dress_code && (
          <p
            className="text-sm mt-3 italic"
            style={{ color: style.secondaryTextColor }}
          >
            {event.dress_code}
          </p>
        )}
        
        {/* Custom invitation message */}
        {event.invitation_message && (
          <p
            className="text-base mt-4 max-w-xs mx-auto italic"
            style={{ color: style.secondaryTextColor }}
          >
            {event.invitation_message}
          </p>
        )}
      </div>
    </div>
  )
}
