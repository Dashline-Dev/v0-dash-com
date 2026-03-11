"use client"

import { toHebrewDate } from "@/lib/hebrew-date"
import type { EventTemplate } from "@/lib/event-templates"
import { getTemplateById } from "@/lib/event-templates"
import type { Event } from "@/types/event"
import { formatEventDate, formatEventTime } from "@/types/event"

// Card size presets for different platforms
export const CARD_SIZES = {
  whatsapp: { width: 1080, height: 1920, label: "WhatsApp Status", ratio: "9:16" },
  instagram_story: { width: 1080, height: 1920, label: "Instagram Story", ratio: "9:16" },
  instagram_square: { width: 1080, height: 1080, label: "Instagram Square", ratio: "1:1" },
  instagram_portrait: { width: 1080, height: 1350, label: "Instagram Portrait", ratio: "4:5" },
  facebook: { width: 1200, height: 630, label: "Facebook Post", ratio: "1.91:1" },
  twitter: { width: 1200, height: 675, label: "Twitter/X", ratio: "16:9" },
  a4_portrait: { width: 2480, height: 3508, label: "A4 Portrait", ratio: "1:1.41" },
  letter: { width: 2550, height: 3300, label: "Letter Size", ratio: "1:1.29" },
  custom: { width: 800, height: 1000, label: "Custom", ratio: "4:5" },
} as const

export type CardSize = keyof typeof CARD_SIZES

interface InvitationCardProps {
  event: Partial<Event> & { title: string; start_time: string; end_time: string }
  templateId?: string
  template?: EventTemplate
  className?: string
  size?: CardSize
  previewScale?: number // Scale factor for preview display
  communityLogo?: string | null // Community logo URL to display at top
  communityName?: string | null // Community name for header
  showBranding?: boolean // Show "Created by Kesher" footer
}

// Enhanced decorative SVG elements
const Decorations = {
  floral: (color: string) => (
    <svg viewBox="0 0 200 60" className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 opacity-50">
      <defs>
        <linearGradient id="floralGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="50%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {/* Center flower */}
      <circle cx="100" cy="30" r="8" fill={color} opacity="0.7" />
      <circle cx="100" cy="30" r="4" fill="white" opacity="0.5" />
      {/* Leaves and swirls */}
      <path d="M50,30 Q70,10 100,30 Q130,50 150,30" fill="none" stroke="url(#floralGrad)" strokeWidth="2" />
      <path d="M30,35 Q50,20 70,35" fill="none" stroke={color} strokeWidth="1.5" opacity="0.6" />
      <path d="M130,35 Q150,20 170,35" fill="none" stroke={color} strokeWidth="1.5" opacity="0.6" />
      {/* Small flowers */}
      <circle cx="60" cy="32" r="4" fill={color} opacity="0.5" />
      <circle cx="140" cy="32" r="4" fill={color} opacity="0.5" />
    </svg>
  ),
  
  floralCorners: (color: string) => (
    <>
      {/* Top left corner */}
      <svg viewBox="0 0 80 80" className="absolute top-4 left-4 w-16 h-16 opacity-40">
        <path d="M0,40 Q20,0 60,10 Q30,20 20,50 Q10,30 0,40" fill={color} />
        <circle cx="50" cy="15" r="6" fill={color} opacity="0.7" />
        <circle cx="25" cy="40" r="4" fill={color} opacity="0.5" />
      </svg>
      {/* Top right corner */}
      <svg viewBox="0 0 80 80" className="absolute top-4 right-4 w-16 h-16 opacity-40 scale-x-[-1]">
        <path d="M0,40 Q20,0 60,10 Q30,20 20,50 Q10,30 0,40" fill={color} />
        <circle cx="50" cy="15" r="6" fill={color} opacity="0.7" />
        <circle cx="25" cy="40" r="4" fill={color} opacity="0.5" />
      </svg>
      {/* Bottom left */}
      <svg viewBox="0 0 80 80" className="absolute bottom-4 left-4 w-16 h-16 opacity-40 scale-y-[-1]">
        <path d="M0,40 Q20,0 60,10 Q30,20 20,50 Q10,30 0,40" fill={color} />
        <circle cx="50" cy="15" r="6" fill={color} opacity="0.7" />
      </svg>
      {/* Bottom right */}
      <svg viewBox="0 0 80 80" className="absolute bottom-4 right-4 w-16 h-16 opacity-40 scale-[-1]">
        <path d="M0,40 Q20,0 60,10 Q30,20 20,50 Q10,30 0,40" fill={color} />
        <circle cx="50" cy="15" r="6" fill={color} opacity="0.7" />
      </svg>
    </>
  ),
  
  musical: (color: string) => (
    <>
      <div className="absolute top-8 left-8 opacity-25">
        <svg viewBox="0 0 24 24" width="48" height="48" fill={color}>
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </div>
      <div className="absolute top-12 right-12 opacity-20">
        <svg viewBox="0 0 24 24" width="36" height="36" fill={color}>
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </div>
      <div className="absolute bottom-16 left-12 opacity-15">
        <svg viewBox="0 0 24 24" width="32" height="32" fill={color}>
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </div>
    </>
  ),

  violins: (color: string) => (
    <>
      <div className="absolute top-1/4 left-6 opacity-25">
        <svg viewBox="0 0 40 80" width="40" height="80" fill={color}>
          <ellipse cx="20" cy="55" rx="15" ry="20" />
          <ellipse cx="20" cy="55" rx="8" ry="12" fill="white" opacity="0.3" />
          <rect x="18" y="5" width="4" height="40" />
          <circle cx="20" cy="8" r="4" />
          <rect x="10" y="2" width="20" height="3" />
        </svg>
      </div>
      <div className="absolute top-1/4 right-6 opacity-25 scale-x-[-1]">
        <svg viewBox="0 0 40 80" width="40" height="80" fill={color}>
          <ellipse cx="20" cy="55" rx="15" ry="20" />
          <ellipse cx="20" cy="55" rx="8" ry="12" fill="white" opacity="0.3" />
          <rect x="18" y="5" width="4" height="40" />
          <circle cx="20" cy="8" r="4" />
          <rect x="10" y="2" width="20" height="3" />
        </svg>
      </div>
    </>
  ),
  
  stars: (color: string) => (
    <>
      {[...Array(8)].map((_, i) => (
        <div 
          key={i}
          className="absolute opacity-30"
          style={{
            left: `${10 + (i % 4) * 25}%`,
            top: `${i < 4 ? 5 : 85}%`,
          }}
        >
          <svg viewBox="0 0 24 24" width={16 + (i % 3) * 8} height={16 + (i % 3) * 8} fill={color}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      ))}
    </>
  ),

  starOfDavid: (color: string) => (
    <div className="absolute top-8 left-1/2 -translate-x-1/2 opacity-20">
      <svg viewBox="0 0 100 100" width="60" height="60" fill="none" stroke={color} strokeWidth="2">
        <polygon points="50,10 90,75 10,75" />
        <polygon points="50,90 10,25 90,25" />
      </svg>
    </div>
  ),
  
  hearts: (color: string) => (
    <>
      <div className="absolute top-8 right-8 opacity-30">
        <svg viewBox="0 0 24 24" width="32" height="32" fill={color}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>
      <div className="absolute top-12 left-10 opacity-20">
        <svg viewBox="0 0 24 24" width="20" height="20" fill={color}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>
      <div className="absolute bottom-16 left-8 opacity-25">
        <svg viewBox="0 0 24 24" width="24" height="24" fill={color}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>
    </>
  ),
  
  dove: (color: string) => (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 opacity-30">
      <svg viewBox="0 0 60 40" width="60" height="40" fill={color}>
        <path d="M30 5c-8 0-15 5-15 12 0 3 1 6 4 8h-5c-2 0-3 2-3 4s1 4 3 4h15c-4 3-7 8-7 14h22c0-6-3-11-7-14h15c2 0 3-2 3-4s-1-4-3-4h-5c3-2 4-5 4-8 0-7-7-12-15-12h-6z" />
      </svg>
    </div>
  ),
  
  torah: (color: string) => (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-25">
      <svg viewBox="0 0 80 40" width="80" height="40" fill={color}>
        <rect x="5" y="5" width="10" height="30" rx="2" />
        <rect x="65" y="5" width="10" height="30" rx="2" />
        <rect x="15" y="8" width="50" height="24" fill="none" stroke={color} strokeWidth="1.5" />
        <line x1="22" y1="14" x2="58" y2="14" stroke={color} strokeWidth="0.75" />
        <line x1="22" y1="20" x2="58" y2="20" stroke={color} strokeWidth="0.75" />
        <line x1="22" y1="26" x2="58" y2="26" stroke={color} strokeWidth="0.75" />
      </svg>
    </div>
  ),
  
  menorah: (color: string) => (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-25">
      <svg viewBox="0 0 100 60" width="80" height="48" fill={color}>
        {/* Base */}
        <rect x="40" y="50" width="20" height="8" rx="2" />
        <rect x="45" y="35" width="10" height="15" />
        {/* Center branch */}
        <rect x="48" y="10" width="4" height="25" />
        <ellipse cx="50" cy="8" rx="4" ry="5" fill="#FEF3C7" />
        {/* Left branches */}
        {[1, 2, 3, 4].map((i) => (
          <g key={`left-${i}`}>
            <path d={`M${50 - i * 10},${15 + i * 4} Q${50 - i * 5},${30} ${50},35`} fill="none" stroke={color} strokeWidth="3" />
            <ellipse cx={50 - i * 10} cy={13 + i * 4} rx="3" ry="4" fill="#FEF3C7" />
          </g>
        ))}
        {/* Right branches */}
        {[1, 2, 3, 4].map((i) => (
          <g key={`right-${i}`}>
            <path d={`M${50 + i * 10},${15 + i * 4} Q${50 + i * 5},${30} ${50},35`} fill="none" stroke={color} strokeWidth="3" />
            <ellipse cx={50 + i * 10} cy={13 + i * 4} rx="3" ry="4" fill="#FEF3C7" />
          </g>
        ))}
      </svg>
    </div>
  ),
  
  candles: (color: string) => (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2 opacity-40">
      {[...Array(9)].map((_, i) => (
        <div key={i} className="flex flex-col items-center">
          <div 
            className="w-2 h-4 rounded-full" 
            style={{ background: `linear-gradient(to top, ${color}, #FEF3C7)` }} 
          />
          <div 
            className="w-3 h-8 rounded-b" 
            style={{ backgroundColor: i === 4 ? color : `${color}CC` }} 
          />
        </div>
      ))}
    </div>
  ),
  
  confetti: (color: string) => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(30)].map((_, i) => {
        const colors = [color, '#FCD34D', '#EC4899', '#8B5CF6', '#10B981']
        const shapes = ['circle', 'rect', 'triangle']
        const shape = shapes[i % 3]
        return (
          <div
            key={i}
            className="absolute opacity-40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          >
            {shape === 'circle' && (
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[i % colors.length] }}
              />
            )}
            {shape === 'rect' && (
              <div 
                className="w-4 h-2"
                style={{ backgroundColor: colors[i % colors.length] }}
              />
            )}
            {shape === 'triangle' && (
              <svg viewBox="0 0 10 10" width="12" height="12" fill={colors[i % colors.length]}>
                <polygon points="5,0 10,10 0,10" />
              </svg>
            )}
          </div>
        )
      })}
    </div>
  ),
  
  balloons: (color: string) => (
    <>
      {[
        { x: 10, y: 5, size: 40 },
        { x: 85, y: 8, size: 35 },
        { x: 15, y: 15, size: 30 },
        { x: 80, y: 20, size: 32 },
      ].map((balloon, i) => {
        const colors = [color, '#EC4899', '#8B5CF6', '#10B981']
        return (
          <div 
            key={i}
            className="absolute opacity-40"
            style={{ left: `${balloon.x}%`, top: `${balloon.y}%` }}
          >
            <svg viewBox="0 0 30 50" width={balloon.size} height={balloon.size * 1.5} fill={colors[i % colors.length]}>
              <ellipse cx="15" cy="15" rx="12" ry="15" />
              <polygon points="15,30 12,35 18,35" />
              <path d="M15,35 Q13,42 15,50" fill="none" stroke={colors[i % colors.length]} strokeWidth="1" />
            </svg>
          </div>
        )
      })}
    </>
  ),
  
  rings: (color: string) => (
    <div className="absolute top-8 left-1/2 -translate-x-1/2 opacity-40">
      <svg viewBox="0 0 80 40" width="80" height="40">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor="#FCD34D" />
          </linearGradient>
        </defs>
        <circle cx="28" cy="20" r="14" fill="none" stroke="url(#ringGrad)" strokeWidth="4" />
        <circle cx="52" cy="20" r="14" fill="none" stroke="url(#ringGrad)" strokeWidth="4" />
        {/* Diamond on one ring */}
        <polygon points="52,4 55,10 52,8 49,10" fill="#FCD34D" />
      </svg>
    </div>
  ),
  
  ribbons: (color: string) => (
    <>
      <div className="absolute top-0 right-8 opacity-40">
        <svg viewBox="0 0 30 60" width="30" height="60" fill={color}>
          <path d="M15 0v45l-10 15 10-10 10 10-10-15V0z" />
        </svg>
      </div>
      <div className="absolute top-0 left-8 opacity-30 scale-x-[-1]">
        <svg viewBox="0 0 30 60" width="24" height="48" fill={color}>
          <path d="M15 0v45l-10 15 10-10 10 10-10-15V0z" />
        </svg>
      </div>
    </>
  ),
  
  geometric: (color: string) => (
    <>
      <div className="absolute top-6 right-6 opacity-15">
        <svg viewBox="0 0 80 80" width="80" height="80">
          <polygon points="40,5 75,70 5,70" fill="none" stroke={color} strokeWidth="1.5" />
          <polygon points="40,20 60,60 20,60" fill="none" stroke={color} strokeWidth="1" />
        </svg>
      </div>
      <div className="absolute bottom-6 left-6 opacity-15">
        <svg viewBox="0 0 80 80" width="60" height="60">
          <rect x="10" y="10" width="60" height="60" fill="none" stroke={color} strokeWidth="1.5" transform="rotate(45 40 40)" />
        </svg>
      </div>
    </>
  ),

  borderPattern: (color: string) => (
    <div className="absolute inset-4 pointer-events-none">
      <div 
        className="w-full h-full rounded-lg"
        style={{
          border: `3px solid ${color}20`,
          backgroundImage: `
            linear-gradient(45deg, ${color}10 25%, transparent 25%),
            linear-gradient(-45deg, ${color}10 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, ${color}10 75%),
            linear-gradient(-45deg, transparent 75%, ${color}10 75%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
        }}
      />
    </div>
  ),

  grapes: (color: string) => (
    <>
      <div className="absolute bottom-8 left-8 opacity-30">
        <svg viewBox="0 0 40 50" width="40" height="50" fill={color}>
          {/* Grape cluster */}
          <circle cx="20" cy="20" r="5" />
          <circle cx="12" cy="25" r="5" />
          <circle cx="28" cy="25" r="5" />
          <circle cx="16" cy="32" r="5" />
          <circle cx="24" cy="32" r="5" />
          <circle cx="20" cy="39" r="5" />
          {/* Stem */}
          <path d="M20,15 Q25,5 35,8" fill="none" stroke={color} strokeWidth="2" />
          {/* Leaf */}
          <path d="M30,8 Q40,5 38,15 Q35,10 30,8" fill={color} opacity="0.7" />
        </svg>
      </div>
      <div className="absolute bottom-8 right-8 opacity-30 scale-x-[-1]">
        <svg viewBox="0 0 40 50" width="40" height="50" fill={color}>
          <circle cx="20" cy="20" r="5" />
          <circle cx="12" cy="25" r="5" />
          <circle cx="28" cy="25" r="5" />
          <circle cx="16" cy="32" r="5" />
          <circle cx="24" cy="32" r="5" />
          <circle cx="20" cy="39" r="5" />
          <path d="M20,15 Q25,5 35,8" fill="none" stroke={color} strokeWidth="2" />
          <path d="M30,8 Q40,5 38,15 Q35,10 30,8" fill={color} opacity="0.7" />
        </svg>
      </div>
    </>
  ),

  // Baby boy - booties/shoes
  babyBoy: (color: string) => (
    <>
      <div className="absolute top-8 left-1/2 -translate-x-1/2 opacity-40">
        <svg viewBox="0 0 100 50" width="80" height="40" fill={color}>
          {/* Left bootie */}
          <ellipse cx="25" cy="35" rx="18" ry="12" />
          <ellipse cx="20" cy="20" rx="12" ry="18" />
          <circle cx="15" cy="12" r="4" fill="white" opacity="0.3" />
          {/* Right bootie */}
          <ellipse cx="75" cy="35" rx="18" ry="12" />
          <ellipse cx="80" cy="20" rx="12" ry="18" />
          <circle cx="85" cy="12" r="4" fill="white" opacity="0.3" />
          {/* Laces */}
          <path d="M18,28 Q25,25 32,28" fill="none" stroke="white" strokeWidth="1.5" opacity="0.5" />
          <path d="M68,28 Q75,25 82,28" fill="none" stroke="white" strokeWidth="1.5" opacity="0.5" />
        </svg>
      </div>
      {/* Small decorative stars */}
      <div className="absolute top-6 left-10 opacity-25">
        <svg viewBox="0 0 24 24" width="16" height="16" fill={color}>
          <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8z" />
        </svg>
      </div>
      <div className="absolute top-10 right-12 opacity-20">
        <svg viewBox="0 0 24 24" width="12" height="12" fill={color}>
          <path d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8z" />
        </svg>
      </div>
    </>
  ),

  // Baby girl - pacifier
  babyGirl: (color: string) => (
    <>
      <div className="absolute top-8 left-1/2 -translate-x-1/2 opacity-40">
        <svg viewBox="0 0 60 50" width="60" height="50" fill={color}>
          {/* Pacifier ring */}
          <ellipse cx="30" cy="15" rx="18" ry="12" fill="none" stroke={color} strokeWidth="4" />
          {/* Pacifier shield */}
          <ellipse cx="30" cy="32" rx="22" ry="14" />
          {/* Center hole */}
          <ellipse cx="30" cy="32" rx="8" ry="6" fill="white" opacity="0.3" />
          {/* Nipple */}
          <ellipse cx="30" cy="44" rx="8" ry="5" />
          {/* Decorative bow */}
          <path d="M12,32 Q5,25 12,20 Q18,25 12,32" fill={color} opacity="0.7" />
          <path d="M48,32 Q55,25 48,20 Q42,25 48,32" fill={color} opacity="0.7" />
        </svg>
      </div>
      {/* Hearts */}
      <div className="absolute bottom-10 left-8 opacity-25">
        <svg viewBox="0 0 24 24" width="20" height="20" fill={color}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>
      <div className="absolute bottom-12 right-10 opacity-20">
        <svg viewBox="0 0 24 24" width="16" height="16" fill={color}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>
    </>
  ),

  // Scissors for Upsherin
  scissors: (color: string) => (
    <div className="absolute top-8 left-1/2 -translate-x-1/2 opacity-35">
      <svg viewBox="0 0 80 60" width="70" height="52" fill={color}>
        {/* Left blade */}
        <ellipse cx="15" cy="45" rx="10" ry="8" />
        <path d="M20,42 L50,15 L48,12 L18,39" />
        {/* Right blade */}
        <ellipse cx="65" cy="45" rx="10" ry="8" />
        <path d="M60,42 L30,15 L32,12 L62,39" />
        {/* Screw */}
        <circle cx="40" cy="28" r="5" />
        <circle cx="40" cy="28" r="2" fill="white" opacity="0.4" />
        {/* Hair locks */}
        <path d="M35,8 Q40,2 45,8 Q50,14 45,18 Q40,14 35,18 Q30,14 35,8" fill={color} opacity="0.5" />
      </svg>
    </div>
  ),

  // Chuppah for weddings
  chuppah: (color: string) => (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 opacity-30">
      <svg viewBox="0 0 120 80" width="100" height="67" fill="none" stroke={color} strokeWidth="2">
        {/* Poles */}
        <line x1="15" y1="20" x2="15" y2="75" />
        <line x1="105" y1="20" x2="105" y2="75" />
        <line x1="15" y1="75" x2="5" y2="80" />
        <line x1="105" y1="75" x2="115" y2="80" />
        {/* Canopy */}
        <path d="M10,20 Q60,5 110,20" fill={color} fillOpacity="0.2" />
        <path d="M10,20 Q60,5 110,20" />
        {/* Draping */}
        <path d="M10,20 Q25,30 15,40" />
        <path d="M110,20 Q95,30 105,40" />
        {/* Decorative flowers */}
        <circle cx="60" cy="12" r="4" fill={color} />
        <circle cx="50" cy="15" r="3" fill={color} opacity="0.7" />
        <circle cx="70" cy="15" r="3" fill={color} opacity="0.7" />
      </svg>
    </div>
  ),

  // Kiddush cup
  kiddushCup: (color: string) => (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-30">
      <svg viewBox="0 0 50 70" width="45" height="63" fill={color}>
        {/* Cup */}
        <path d="M10,10 L12,45 L38,45 L40,10 Z" />
        {/* Wine */}
        <path d="M12,15 L13,40 L37,40 L38,15 Z" fill="#722F37" opacity="0.6" />
        {/* Stem */}
        <rect x="22" y="45" width="6" height="12" />
        {/* Base */}
        <ellipse cx="25" cy="62" rx="15" ry="5" />
        {/* Decorative pattern */}
        <path d="M15,20 Q25,25 35,20" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
        <path d="M15,30 Q25,35 35,30" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
      </svg>
    </div>
  ),

  // Challah for Shabbos
  challah: (color: string) => (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-35">
      <svg viewBox="0 0 100 40" width="90" height="36" fill={color}>
        {/* Braided challah */}
        <ellipse cx="50" cy="25" rx="45" ry="12" fill={color} />
        {/* Braid pattern */}
        <path d="M15,20 Q25,15 35,25 Q45,35 55,25 Q65,15 75,25 Q85,35 90,25" 
              fill="none" stroke="white" strokeWidth="2" opacity="0.3" />
        <path d="M10,25 Q20,30 30,20 Q40,10 50,20 Q60,30 70,20 Q80,10 90,20" 
              fill="none" stroke="white" strokeWidth="2" opacity="0.3" />
        {/* Sesame seeds */}
        {[...Array(8)].map((_, i) => (
          <ellipse key={i} cx={20 + i * 10} cy={22 + (i % 2) * 4} rx="2" ry="1" fill="#F5DEB3" opacity="0.6" />
        ))}
      </svg>
    </div>
  ),

  // Dreidel for Chanukah
  dreidel: (color: string) => (
    <div className="absolute top-8 right-8 opacity-35">
      <svg viewBox="0 0 40 60" width="36" height="54" fill={color}>
        {/* Handle */}
        <rect x="16" y="2" width="8" height="12" rx="2" />
        {/* Body */}
        <rect x="8" y="14" width="24" height="28" rx="3" />
        {/* Point */}
        <polygon points="20,42 8,42 20,58 32,42" />
        {/* Hebrew letter */}
        <text x="20" y="32" textAnchor="middle" fill="white" fontSize="14" fontFamily="serif" opacity="0.5">ג</text>
      </svg>
    </div>
  ),

  // Hamantaschen for Purim
  hamantaschen: (color: string) => (
    <>
      <div className="absolute top-6 left-8 opacity-40">
        <svg viewBox="0 0 50 50" width="40" height="40" fill={color}>
          <polygon points="25,5 45,42 5,42" rx="5" />
          <circle cx="25" cy="28" r="10" fill="#8B4513" /> {/* Filling */}
        </svg>
      </div>
      <div className="absolute top-10 right-10 opacity-30">
        <svg viewBox="0 0 50 50" width="32" height="32" fill={color}>
          <polygon points="25,5 45,42 5,42" rx="5" />
          <circle cx="25" cy="28" r="10" fill="#C41E3A" /> {/* Different filling */}
        </svg>
      </div>
      <div className="absolute bottom-12 left-12 opacity-25">
        <svg viewBox="0 0 50 50" width="28" height="28" fill={color}>
          <polygon points="25,5 45,42 5,42" rx="5" />
          <circle cx="25" cy="28" r="10" fill="#4A0E4E" /> {/* Poppy filling */}
        </svg>
      </div>
    </>
  ),

  // Matzah for Pesach
  matzah: (color: string) => (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-30">
      <svg viewBox="0 0 80 50" width="72" height="45" fill={color}>
        {/* Matzah shape */}
        <rect x="5" y="5" width="70" height="40" rx="3" fill="#F5DEB3" />
        {/* Perforations */}
        {[...Array(5)].map((_, row) => (
          [...Array(7)].map((_, col) => (
            <circle key={`${row}-${col}`} cx={12 + col * 10} cy={10 + row * 8} r="2" fill={color} opacity="0.4" />
          ))
        ))}
        {/* Burn marks */}
        <ellipse cx="25" cy="25" rx="8" ry="5" fill="#8B4513" opacity="0.3" />
        <ellipse cx="55" cy="30" rx="6" ry="4" fill="#8B4513" opacity="0.25" />
      </svg>
    </div>
  ),

  // Sukkah
  sukkah: (color: string) => (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 opacity-30">
      <svg viewBox="0 0 100 70" width="90" height="63" fill="none" stroke={color} strokeWidth="2">
        {/* Frame */}
        <line x1="10" y1="15" x2="10" y2="65" />
        <line x1="90" y1="15" x2="90" y2="65" />
        <line x1="10" y1="15" x2="90" y2="15" />
        {/* Schach (roof covering) */}
        <path d="M5,15 Q20,8 35,15 Q50,22 65,15 Q80,8 95,15" fill={color} fillOpacity="0.3" />
        <line x1="20" y1="12" x2="20" y2="20" stroke="#228B22" />
        <line x1="40" y1="10" x2="40" y2="18" stroke="#228B22" />
        <line x1="60" y1="12" x2="60" y2="20" stroke="#228B22" />
        <line x1="80" y1="10" x2="80" y2="18" stroke="#228B22" />
        {/* Decorations hanging */}
        <circle cx="30" cy="30" r="5" fill="#FF6347" opacity="0.6" />
        <circle cx="50" cy="35" r="6" fill="#FFD700" opacity="0.6" />
        <circle cx="70" cy="28" r="5" fill="#32CD32" opacity="0.6" />
      </svg>
    </div>
  ),

  // Number 12 for Bat Mitzvah
  number12: (color: string) => (
    <div className="absolute top-8 right-8 opacity-25">
      <svg viewBox="0 0 60 40" width="54" height="36" fill={color}>
        <text x="30" y="32" textAnchor="middle" fontSize="36" fontFamily="serif" fontWeight="bold">12</text>
      </svg>
    </div>
  ),

  // Number 13 for Bar Mitzvah
  number13: (color: string) => (
    <div className="absolute top-8 right-8 opacity-25">
      <svg viewBox="0 0 60 40" width="54" height="36" fill={color}>
        <text x="30" y="32" textAnchor="middle" fontSize="36" fontFamily="serif" fontWeight="bold">13</text>
      </svg>
    </div>
  ),
}

// Frame styles
function getFrameStyle(frameStyle: EventTemplate["style"]["frameStyle"], frameColor: string) {
  switch (frameStyle) {
    case "ornate":
      return {
        border: `4px solid ${frameColor}`,
        boxShadow: `inset 0 0 0 8px transparent, inset 0 0 0 10px ${frameColor}30, 0 8px 32px rgba(0,0,0,0.1)`,
        borderRadius: "8px",
      }
    case "double":
      return {
        border: `3px solid ${frameColor}`,
        boxShadow: `inset 0 0 0 6px transparent, inset 0 0 0 8px ${frameColor}`,
        borderRadius: "4px",
      }
    case "simple":
      return {
        border: `3px solid ${frameColor}`,
        borderRadius: "8px",
      }
    case "rounded":
      return {
        border: `3px solid ${frameColor}`,
        borderRadius: "24px",
      }
    case "artistic":
      return {
        border: `4px solid ${frameColor}`,
        borderRadius: "12px",
        boxShadow: `6px 6px 0 ${frameColor}50`,
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
      return "'Playfair Display', Georgia, 'Times New Roman', serif"
    case "script":
      return "'Dancing Script', 'Brush Script MT', cursive"
    case "hebrew":
      return "'David Libre', 'Frank Ruhl Libre', serif"
    case "mixed":
      return "'Frank Ruhl Libre', Georgia, serif"
    case "elegant":
      return "'Cormorant Garamond', 'Playfair Display', serif"
    case "modern":
      return "'Montserrat', 'Inter', system-ui, sans-serif"
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
  size = "whatsapp",
  previewScale,
  communityLogo,
  communityName,
  showBranding = true,
}: InvitationCardProps) {
  const template = providedTemplate || (templateId ? getTemplateById(templateId) : undefined)
  const sizeConfig = CARD_SIZES[size]
  
  // Calculate aspect ratio for responsive display
  const aspectRatio = sizeConfig.width / sizeConfig.height
  
  if (!template) {
    // Default simple card if no template
    return (
      <div 
        className={`bg-white border rounded-lg flex flex-col items-center justify-center text-center ${className}`}
        style={{ aspectRatio: `${aspectRatio}` }}
      >
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
  const hebrewDateObj = fields.showHebrewDate && event.start_time 
    ? toHebrewDate(new Date(event.start_time))
    : null
  const hebrewDate = hebrewDateObj ? hebrewDateObj.full : null

  // Determine padding and font sizes based on size preset
  const isPortrait = sizeConfig.height > sizeConfig.width
  const isSquare = Math.abs(sizeConfig.width - sizeConfig.height) < 100
  
  const containerStyle: React.CSSProperties = {
    background: style.background,
    ...frameStyles,
    aspectRatio: `${sizeConfig.width} / ${sizeConfig.height}`,
    fontFamily,
    position: "relative",
    overflow: "hidden",
  }

  if (previewScale) {
    containerStyle.transform = `scale(${previewScale})`
    containerStyle.transformOrigin = "top left"
  }

  return (
    <div
      className={`relative ${className}`}
      style={containerStyle}
    >
      {/* Decorations */}
      {style.decorations?.map((dec) => {
        const DecorationComponent = Decorations[dec as keyof typeof Decorations]
        return DecorationComponent ? (
          <div key={dec}>{DecorationComponent(style.accentColor)}</div>
        ) : null
      })}
      
      {/* Content */}
      <div 
        className="relative z-10 flex flex-col items-center justify-center h-full text-center px-8 py-10"
        style={{ 
          paddingTop: (style.decorations?.includes("candles") || style.decorations?.includes("rings") || style.decorations?.includes("dove")) ? "80px" : undefined,
          paddingBottom: (style.decorations?.includes("torah") || style.decorations?.includes("menorah") || style.decorations?.includes("floral") || style.decorations?.includes("grapes")) ? "80px" : undefined,
        }}
      >
        {/* Event type label */}
        {fields.eventTypeLabel && (
          <div
            className={`uppercase tracking-[0.25em] font-medium mb-4 ${isSquare ? 'text-sm' : 'text-base'}`}
            style={{ color: style.secondaryTextColor }}
          >
            {fields.eventTypeLabel}
          </div>
        )}
        
        {/* Main title */}
        <h1
          className={`font-bold leading-tight ${isSquare ? 'text-3xl' : isPortrait ? 'text-4xl md:text-5xl' : 'text-3xl'}`}
          style={{ color: style.textColor }}
        >
          {event.title}
        </h1>
        
        {/* Host line */}
        {fields.showHostLine && fields.hostLineTemplate && (
          <p
            className={`mt-4 ${isSquare ? 'text-base' : 'text-lg'}`}
            style={{ color: style.secondaryTextColor }}
          >
            {fields.hostLineTemplate}
          </p>
        )}
        
        {/* Divider */}
        <div
          className="w-32 h-0.5 my-6"
          style={{ backgroundColor: style.accentColor }}
        />
        
        {/* Date & Time */}
        {fields.showTime && event.start_time && (
          <div className="space-y-2">
            <p
              className={`font-semibold ${isSquare ? 'text-lg' : 'text-xl md:text-2xl'}`}
              style={{ color: style.textColor }}
            >
              {formatEventDate(event.start_time)}
            </p>
            {hebrewDate && (
              <p
                className={`${isSquare ? 'text-base' : 'text-lg'}`}
                style={{ color: style.secondaryTextColor, direction: "rtl" }}
              >
                {hebrewDate}
              </p>
            )}
            <p
              className={`${isSquare ? 'text-base' : 'text-lg'}`}
              style={{ color: style.secondaryTextColor }}
            >
              {formatEventTime(event.start_time)} - {formatEventTime(event.end_time)}
            </p>
          </div>
        )}
        
        {/* Location */}
        {fields.showVenue && event.location_name && (
          <div className="mt-6 space-y-1">
            <p
              className={`font-medium ${isSquare ? 'text-lg' : 'text-xl'}`}
              style={{ color: style.textColor }}
            >
              {event.location_name}
            </p>
            {event.location_address && (
              <p
                className="text-base"
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
            className="text-base mt-6 italic"
            style={{ color: style.secondaryTextColor }}
          >
            Dress Code: {event.dress_code}
          </p>
        )}
        
        {/* Custom invitation message */}
        {event.invitation_message && (
          <p
            className={`mt-6 max-w-sm mx-auto italic leading-relaxed ${isSquare ? 'text-base' : 'text-lg'}`}
            style={{ color: style.secondaryTextColor }}
          >
            {event.invitation_message}
          </p>
        )}

        {/* Contact info */}
        {event.contact_info && (
          <p
            className="text-sm mt-4"
            style={{ color: style.secondaryTextColor }}
          >
            {event.contact_info}
          </p>
        )}
      </div>

      {/* Community logo at top */}
      {communityLogo && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
          <img 
            src={communityLogo.startsWith('/api/file') ? communityLogo : `/api/file?pathname=${encodeURIComponent(communityLogo)}`} 
            alt={communityName || "Community"} 
            className="w-16 h-16 rounded-full object-cover border-2 shadow-md"
            style={{ borderColor: style.frameColor || style.accentColor }}
          />
        </div>
      )}

      {/* Created by Kesher branding */}
      {showBranding && (
        <div 
          className="absolute bottom-2 right-3 z-20 flex items-center gap-1 opacity-60"
          style={{ color: style.secondaryTextColor }}
        >
          <span className="text-[10px] font-medium">Created by</span>
          <span className="text-[10px] font-bold tracking-wide">Kesher</span>
        </div>
      )}
    </div>
  )
}
