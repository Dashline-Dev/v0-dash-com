// Event invitation templates with visual card designs

export interface EventTemplate {
  id: string
  name: string
  category: string
  subcategory?: string
  description: string
  // Visual style configuration
  style: {
    background: string // CSS background (color, gradient, or image pattern)
    frameStyle: "ornate" | "simple" | "rounded" | "none" | "double" | "artistic"
    frameColor: string
    accentColor: string
    textColor: string
    secondaryTextColor: string
    fontFamily: "serif" | "sans-serif" | "script" | "hebrew" | "mixed"
    headerFont?: string
    layout: "centered" | "top-aligned" | "split" | "asymmetric"
    decorations?: ("floral" | "geometric" | "musical" | "stars" | "hearts" | "confetti" | "ribbons" | "candles" | "torah" | "dove" | "rings")[]
  }
  // Field configuration - which fields to show and their labels
  fields: {
    showHebrewDate?: boolean
    showHostLine?: boolean
    hostLineTemplate?: string // e.g., "Together with their families"
    eventTypeLabel?: string // e.g., "שמחת חתונה" or "Wedding Celebration"
    showVenue?: boolean
    showTime?: boolean
    showDressCode?: boolean
    customFields?: { key: string; label: string }[]
  }
  // Preview thumbnail
  thumbnail?: string
}

// Template categories and subcategories
export const TEMPLATE_CATEGORIES = {
  wedding: {
    label: "Wedding",
    subcategories: ["Invitations", "Save the Date", "Aufruf", "Sheva Brochos", "Vort/Tenoyim"],
  },
  bar_mitzvah: {
    label: "Bar Mitzvah",
    subcategories: ["Invitations", "Kiddush", "Party"],
  },
  bat_mitzvah: {
    label: "Bat Mitzvah", 
    subcategories: ["Invitations", "Kiddush", "Party"],
  },
  baby: {
    label: "Baby",
    subcategories: ["It's a Boy", "It's a Girl", "Bris", "Kiddush", "Upsherin"],
  },
  birthday: {
    label: "Birthday",
    subcategories: ["Kids", "Milestone", "General"],
  },
  holiday: {
    label: "Holiday",
    subcategories: ["Purim", "Chanukah", "Pesach", "Sukkos", "Shabbos"],
  },
  community: {
    label: "Community",
    subcategories: ["Shiur", "Fundraiser", "Melave Malka", "Gathering"],
  },
  professional: {
    label: "Professional",
    subcategories: ["Conference", "Workshop", "Networking"],
  },
}

export const EVENT_TEMPLATES: EventTemplate[] = [
  // ═══════════════════════════════════════════════════════════
  // WEDDING TEMPLATES
  // ═══════════════════════════════════════════════════════════
  
  // Classic Jewish Wedding - Ornate Frame
  {
    id: "wedding-classic-ornate",
    name: "Classic Ornate",
    category: "wedding",
    subcategory: "Invitations",
    description: "Traditional ornate frame with elegant typography",
    style: {
      background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
      frameStyle: "ornate",
      frameColor: "#C9A961",
      accentColor: "#C9A961",
      textColor: "#FFFFFF",
      secondaryTextColor: "#D4D4D4",
      fontFamily: "mixed",
      layout: "centered",
      decorations: ["musical"],
    },
    fields: {
      showHebrewDate: true,
      showHostLine: true,
      hostLineTemplate: "מזמינים אתכם בשמחה",
      eventTypeLabel: "שמחת חתונה",
      showVenue: true,
      showTime: true,
    },
  },
  
  // Elegant White Wedding
  {
    id: "wedding-elegant-white",
    name: "Elegant White",
    category: "wedding",
    subcategory: "Invitations",
    description: "Clean white design with gold accents",
    style: {
      background: "#FFFFFF",
      frameStyle: "double",
      frameColor: "#C9A961",
      accentColor: "#C9A961",
      textColor: "#1F2937",
      secondaryTextColor: "#6B7280",
      fontFamily: "serif",
      layout: "centered",
      decorations: ["floral"],
    },
    fields: {
      showHebrewDate: true,
      showHostLine: true,
      hostLineTemplate: "Together with their families",
      eventTypeLabel: "Wedding Celebration",
      showVenue: true,
      showTime: true,
      showDressCode: true,
    },
  },

  // Modern Minimalist Wedding
  {
    id: "wedding-modern-minimal",
    name: "Modern Minimal",
    category: "wedding",
    subcategory: "Invitations",
    description: "Contemporary clean design",
    style: {
      background: "#FAFAFA",
      frameStyle: "simple",
      frameColor: "#18181B",
      accentColor: "#18181B",
      textColor: "#18181B",
      secondaryTextColor: "#71717A",
      fontFamily: "sans-serif",
      layout: "centered",
    },
    fields: {
      showHebrewDate: false,
      showHostLine: true,
      hostLineTemplate: "We're getting married!",
      showVenue: true,
      showTime: true,
    },
  },

  // Floral Garden Wedding
  {
    id: "wedding-floral-garden",
    name: "Floral Garden",
    category: "wedding",
    subcategory: "Invitations",
    description: "Romantic floral design with soft colors",
    style: {
      background: "linear-gradient(180deg, #FDF2F8 0%, #FCE7F3 100%)",
      frameStyle: "rounded",
      frameColor: "#BE185D",
      accentColor: "#BE185D",
      textColor: "#831843",
      secondaryTextColor: "#9D174D",
      fontFamily: "script",
      layout: "centered",
      decorations: ["floral", "hearts"],
    },
    fields: {
      showHebrewDate: false,
      showHostLine: true,
      hostLineTemplate: "Together with their families",
      eventTypeLabel: "Wedding",
      showVenue: true,
      showTime: true,
      showDressCode: true,
    },
  },

  // Save the Date - Modern
  {
    id: "wedding-save-date-modern",
    name: "Save the Date",
    category: "wedding",
    subcategory: "Save the Date",
    description: "Bold save the date announcement",
    style: {
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      frameStyle: "none",
      frameColor: "#FFFFFF",
      accentColor: "#FFFFFF",
      textColor: "#FFFFFF",
      secondaryTextColor: "#E9D5FF",
      fontFamily: "sans-serif",
      layout: "centered",
    },
    fields: {
      showHebrewDate: true,
      showHostLine: false,
      eventTypeLabel: "SAVE THE DATE",
      showVenue: true,
      showTime: false,
    },
  },

  // Aufruf Invitation
  {
    id: "wedding-aufruf",
    name: "Aufruf",
    category: "wedding",
    subcategory: "Aufruf",
    description: "Traditional aufruf invitation",
    style: {
      background: "#FFFBEB",
      frameStyle: "ornate",
      frameColor: "#92400E",
      accentColor: "#92400E",
      textColor: "#78350F",
      secondaryTextColor: "#A16207",
      fontFamily: "mixed",
      layout: "centered",
      decorations: ["torah"],
    },
    fields: {
      showHebrewDate: true,
      showHostLine: true,
      hostLineTemplate: "You are cordially invited to the Aufruf of",
      eventTypeLabel: "Aufruf",
      showVenue: true,
      showTime: true,
    },
  },

  // Sheva Brochos
  {
    id: "wedding-sheva-brochos",
    name: "Sheva Brochos",
    category: "wedding",
    subcategory: "Sheva Brochos",
    description: "Elegant sheva brochos invitation",
    style: {
      background: "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)",
      frameStyle: "double",
      frameColor: "#FCD34D",
      accentColor: "#FCD34D",
      textColor: "#FFFFFF",
      secondaryTextColor: "#CBD5E1",
      fontFamily: "mixed",
      layout: "centered",
      decorations: ["stars"],
    },
    fields: {
      showHebrewDate: true,
      showHostLine: true,
      hostLineTemplate: "Please join us for Sheva Brochos in honor of",
      eventTypeLabel: "שבע ברכות",
      showVenue: true,
      showTime: true,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // BAR MITZVAH TEMPLATES
  // ═══════════════════════════════════════════════════════════
  
  {
    id: "bar-mitzvah-classic",
    name: "Classic Bar Mitzvah",
    category: "bar_mitzvah",
    subcategory: "Invitations",
    description: "Traditional elegant design",
    style: {
      background: "linear-gradient(180deg, #1E3A5F 0%, #0F2744 100%)",
      frameStyle: "ornate",
      frameColor: "#C9A961",
      accentColor: "#C9A961",
      textColor: "#FFFFFF",
      secondaryTextColor: "#94A3B8",
      fontFamily: "mixed",
      layout: "centered",
      decorations: ["torah", "geometric"],
    },
    fields: {
      showHebrewDate: true,
      showHostLine: true,
      hostLineTemplate: "With great joy we invite you to celebrate as our son",
      eventTypeLabel: "בר מצוה",
      showVenue: true,
      showTime: true,
      showDressCode: true,
    },
  },

  {
    id: "bar-mitzvah-modern",
    name: "Modern Bar Mitzvah",
    category: "bar_mitzvah",
    subcategory: "Invitations",
    description: "Contemporary sleek design",
    style: {
      background: "#FFFFFF",
      frameStyle: "simple",
      frameColor: "#2563EB",
      accentColor: "#2563EB",
      textColor: "#1E3A8A",
      secondaryTextColor: "#3B82F6",
      fontFamily: "sans-serif",
      layout: "centered",
      decorations: ["geometric"],
    },
    fields: {
      showHebrewDate: true,
      showHostLine: true,
      hostLineTemplate: "Please join us as our son becomes a Bar Mitzvah",
      eventTypeLabel: "Bar Mitzvah",
      showVenue: true,
      showTime: true,
    },
  },

  {
    id: "bar-mitzvah-sports",
    name: "Sports Theme",
    category: "bar_mitzvah",
    subcategory: "Party",
    description: "Fun sports-themed design",
    style: {
      background: "linear-gradient(135deg, #065F46 0%, #047857 100%)",
      frameStyle: "rounded",
      frameColor: "#FFFFFF",
      accentColor: "#FCD34D",
      textColor: "#FFFFFF",
      secondaryTextColor: "#A7F3D0",
      fontFamily: "sans-serif",
      layout: "centered",
    },
    fields: {
      showHebrewDate: false,
      showHostLine: true,
      hostLineTemplate: "Join us for the celebration!",
      eventTypeLabel: "Bar Mitzvah Party",
      showVenue: true,
      showTime: true,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // BAT MITZVAH TEMPLATES
  // ═══════════════════════════════════════════════════════════
  
  {
    id: "bat-mitzvah-elegant",
    name: "Elegant Bat Mitzvah",
    category: "bat_mitzvah",
    subcategory: "Invitations",
    description: "Sophisticated floral design",
    style: {
      background: "linear-gradient(180deg, #FDF4FF 0%, #FAE8FF 100%)",
      frameStyle: "ornate",
      frameColor: "#A21CAF",
      accentColor: "#A21CAF",
      textColor: "#701A75",
      secondaryTextColor: "#C026D3",
      fontFamily: "script",
      layout: "centered",
      decorations: ["floral", "stars"],
    },
    fields: {
      showHebrewDate: true,
      showHostLine: true,
      hostLineTemplate: "With joy we invite you as our daughter becomes",
      eventTypeLabel: "בת מצוה",
      showVenue: true,
      showTime: true,
      showDressCode: true,
    },
  },

  {
    id: "bat-mitzvah-modern-pink",
    name: "Modern Pink",
    category: "bat_mitzvah",
    subcategory: "Invitations",
    description: "Trendy modern design",
    style: {
      background: "#FFFFFF",
      frameStyle: "simple",
      frameColor: "#EC4899",
      accentColor: "#EC4899",
      textColor: "#831843",
      secondaryTextColor: "#DB2777",
      fontFamily: "sans-serif",
      layout: "centered",
    },
    fields: {
      showHebrewDate: true,
      showHostLine: true,
      hostLineTemplate: "Please join us to celebrate",
      eventTypeLabel: "Bat Mitzvah",
      showVenue: true,
      showTime: true,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // BABY TEMPLATES
  // ═══════════════════════════════════════════════════════════
  
  {
    id: "baby-boy-classic",
    name: "It's a Boy - Classic",
    category: "baby",
    subcategory: "It's a Boy",
    description: "Traditional blue announcement",
    style: {
      background: "linear-gradient(180deg, #DBEAFE 0%, #BFDBFE 100%)",
      frameStyle: "rounded",
      frameColor: "#1D4ED8",
      accentColor: "#1D4ED8",
      textColor: "#1E3A8A",
      secondaryTextColor: "#2563EB",
      fontFamily: "serif",
      layout: "centered",
      decorations: ["stars"],
    },
    fields: {
      showHebrewDate: true,
      showHostLine: true,
      hostLineTemplate: "With gratitude to Hashem, we announce the birth of our son",
      eventTypeLabel: "מזל טוב",
      showVenue: true,
      showTime: true,
    },
  },

  {
    id: "baby-girl-classic",
    name: "It's a Girl - Classic",
    category: "baby",
    subcategory: "It's a Girl",
    description: "Traditional pink announcement",
    style: {
      background: "linear-gradient(180deg, #FCE7F3 0%, #FBCFE8 100%)",
      frameStyle: "rounded",
      frameColor: "#BE185D",
      accentColor: "#BE185D",
      textColor: "#9D174D",
      secondaryTextColor: "#DB2777",
      fontFamily: "serif",
      layout: "centered",
      decorations: ["hearts", "floral"],
    },
    fields: {
      showHebrewDate: true,
      showHostLine: true,
      hostLineTemplate: "With gratitude to Hashem, we announce the birth of our daughter",
      eventTypeLabel: "מזל טוב",
      showVenue: true,
      showTime: true,
    },
  },

  {
    id: "bris-traditional",
    name: "Bris Invitation",
    category: "baby",
    subcategory: "Bris",
    description: "Traditional bris invitation",
    style: {
      background: "#FFFBEB",
      frameStyle: "ornate",
      frameColor: "#B45309",
      accentColor: "#B45309",
      textColor: "#78350F",
      secondaryTextColor: "#D97706",
      fontFamily: "mixed",
      layout: "centered",
      decorations: ["dove"],
    },
    fields: {
      showHebrewDate: true,
      showHostLine: true,
      hostLineTemplate: "With joy we invite you to the Bris of our son",
      eventTypeLabel: "ברית מילה",
      showVenue: true,
      showTime: true,
    },
  },

  {
    id: "upsherin",
    name: "Upsherin",
    category: "baby",
    subcategory: "Upsherin",
    description: "Upsherin celebration invitation",
    style: {
      background: "linear-gradient(180deg, #F0FDF4 0%, #DCFCE7 100%)",
      frameStyle: "rounded",
      frameColor: "#15803D",
      accentColor: "#15803D",
      textColor: "#14532D",
      secondaryTextColor: "#22C55E",
      fontFamily: "mixed",
      layout: "centered",
    },
    fields: {
      showHebrewDate: true,
      showHostLine: true,
      hostLineTemplate: "Please join us for the Upsherin of",
      eventTypeLabel: "אופשערעניש",
      showVenue: true,
      showTime: true,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // BIRTHDAY TEMPLATES
  // ═══════════════════════════════════════════════════════════
  
  {
    id: "birthday-kids-fun",
    name: "Kids Birthday Fun",
    category: "birthday",
    subcategory: "Kids",
    description: "Colorful fun design for kids",
    style: {
      background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
      frameStyle: "rounded",
      frameColor: "#F59E0B",
      accentColor: "#D97706",
      textColor: "#78350F",
      secondaryTextColor: "#B45309",
      fontFamily: "sans-serif",
      layout: "centered",
      decorations: ["confetti"],
    },
    fields: {
      showHebrewDate: false,
      showHostLine: true,
      hostLineTemplate: "You're invited to",
      eventTypeLabel: "Birthday Party!",
      showVenue: true,
      showTime: true,
    },
  },

  {
    id: "birthday-milestone",
    name: "Milestone Birthday",
    category: "birthday",
    subcategory: "Milestone",
    description: "Elegant design for special birthdays",
    style: {
      background: "linear-gradient(180deg, #1F2937 0%, #111827 100%)",
      frameStyle: "double",
      frameColor: "#FCD34D",
      accentColor: "#FCD34D",
      textColor: "#FFFFFF",
      secondaryTextColor: "#D1D5DB",
      fontFamily: "serif",
      layout: "centered",
      decorations: ["stars"],
    },
    fields: {
      showHebrewDate: false,
      showHostLine: true,
      hostLineTemplate: "Please join us to celebrate",
      eventTypeLabel: "Birthday Celebration",
      showVenue: true,
      showTime: true,
      showDressCode: true,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // HOLIDAY TEMPLATES
  // ═══════════════════════════════════════════════════════════
  
  {
    id: "purim-festive",
    name: "Purim Seuda",
    category: "holiday",
    subcategory: "Purim",
    description: "Festive Purim celebration",
    style: {
      background: "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
      frameStyle: "artistic",
      frameColor: "#FCD34D",
      accentColor: "#FCD34D",
      textColor: "#FFFFFF",
      secondaryTextColor: "#E9D5FF",
      fontFamily: "mixed",
      layout: "centered",
      decorations: ["confetti", "stars"],
    },
    fields: {
      showHebrewDate: true,
      showHostLine: true,
      hostLineTemplate: "Join us for our Purim Seuda",
      eventTypeLabel: "פורים שמח",
      showVenue: true,
      showTime: true,
    },
  },

  {
    id: "chanukah-lights",
    name: "Chanukah Party",
    category: "holiday",
    subcategory: "Chanukah",
    description: "Bright Chanukah celebration",
    style: {
      background: "linear-gradient(180deg, #1E3A8A 0%, #1E40AF 100%)",
      frameStyle: "ornate",
      frameColor: "#FCD34D",
      accentColor: "#FCD34D",
      textColor: "#FFFFFF",
      secondaryTextColor: "#93C5FD",
      fontFamily: "mixed",
      layout: "centered",
      decorations: ["candles", "stars"],
    },
    fields: {
      showHebrewDate: true,
      showHostLine: true,
      hostLineTemplate: "Please join us for Chanukah",
      eventTypeLabel: "חנוכה שמח",
      showVenue: true,
      showTime: true,
    },
  },

  {
    id: "shabbos-meal",
    name: "Shabbos Meal",
    category: "holiday",
    subcategory: "Shabbos",
    description: "Shabbos invitation",
    style: {
      background: "#FFFBEB",
      frameStyle: "simple",
      frameColor: "#92400E",
      accentColor: "#92400E",
      textColor: "#78350F",
      secondaryTextColor: "#B45309",
      fontFamily: "mixed",
      layout: "centered",
      decorations: ["candles"],
    },
    fields: {
      showHebrewDate: true,
      showHostLine: true,
      hostLineTemplate: "Please join us for a Shabbos meal",
      eventTypeLabel: "שבת שלום",
      showVenue: true,
      showTime: true,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // COMMUNITY TEMPLATES
  // ═══════════════════════════════════════════════════════════
  
  {
    id: "community-shiur",
    name: "Torah Shiur",
    category: "community",
    subcategory: "Shiur",
    description: "Torah learning event",
    style: {
      background: "linear-gradient(180deg, #ECFDF5 0%, #D1FAE5 100%)",
      frameStyle: "simple",
      frameColor: "#059669",
      accentColor: "#059669",
      textColor: "#065F46",
      secondaryTextColor: "#10B981",
      fontFamily: "mixed",
      layout: "centered",
      decorations: ["torah"],
    },
    fields: {
      showHebrewDate: true,
      showHostLine: true,
      hostLineTemplate: "You are invited to a shiur",
      eventTypeLabel: "שיעור תורה",
      showVenue: true,
      showTime: true,
    },
  },

  {
    id: "community-fundraiser",
    name: "Fundraiser Gala",
    category: "community",
    subcategory: "Fundraiser",
    description: "Elegant fundraising event",
    style: {
      background: "linear-gradient(180deg, #0F172A 0%, #1E293B 100%)",
      frameStyle: "double",
      frameColor: "#C9A961",
      accentColor: "#C9A961",
      textColor: "#FFFFFF",
      secondaryTextColor: "#94A3B8",
      fontFamily: "serif",
      layout: "centered",
    },
    fields: {
      showHebrewDate: false,
      showHostLine: true,
      hostLineTemplate: "Please join us for an evening supporting",
      eventTypeLabel: "Annual Gala",
      showVenue: true,
      showTime: true,
      showDressCode: true,
    },
  },

  {
    id: "community-melave-malka",
    name: "Melave Malka",
    category: "community",
    subcategory: "Melave Malka",
    description: "Saturday night gathering",
    style: {
      background: "linear-gradient(180deg, #312E81 0%, #3730A3 100%)",
      frameStyle: "ornate",
      frameColor: "#FCD34D",
      accentColor: "#FCD34D",
      textColor: "#FFFFFF",
      secondaryTextColor: "#C7D2FE",
      fontFamily: "mixed",
      layout: "centered",
      decorations: ["stars", "musical"],
    },
    fields: {
      showHebrewDate: true,
      showHostLine: true,
      hostLineTemplate: "Please join us for Melave Malka",
      eventTypeLabel: "מלוה מלכה",
      showVenue: true,
      showTime: true,
    },
  },

  // ═══════════════════════════════════════════════════════════
  // PROFESSIONAL TEMPLATES
  // ═══════════════════════════════════════════════════════════
  
  {
    id: "professional-conference",
    name: "Conference",
    category: "professional",
    subcategory: "Conference",
    description: "Professional business event",
    style: {
      background: "#FFFFFF",
      frameStyle: "simple",
      frameColor: "#1F2937",
      accentColor: "#2563EB",
      textColor: "#1F2937",
      secondaryTextColor: "#6B7280",
      fontFamily: "sans-serif",
      layout: "top-aligned",
    },
    fields: {
      showHebrewDate: false,
      showHostLine: false,
      eventTypeLabel: "Conference",
      showVenue: true,
      showTime: true,
      showDressCode: true,
    },
  },

  {
    id: "professional-workshop",
    name: "Workshop",
    category: "professional",
    subcategory: "Workshop",
    description: "Educational workshop event",
    style: {
      background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
      frameStyle: "rounded",
      frameColor: "#FFFFFF",
      accentColor: "#FFFFFF",
      textColor: "#FFFFFF",
      secondaryTextColor: "#BAE6FD",
      fontFamily: "sans-serif",
      layout: "centered",
    },
    fields: {
      showHebrewDate: false,
      showHostLine: true,
      hostLineTemplate: "Join us for an interactive workshop",
      eventTypeLabel: "Workshop",
      showVenue: true,
      showTime: true,
    },
  },

  // Simple/General Templates
  {
    id: "general-simple",
    name: "Simple Invitation",
    category: "professional",
    subcategory: "Networking",
    description: "Clean minimal design",
    style: {
      background: "#F9FAFB",
      frameStyle: "none",
      frameColor: "#9CA3AF",
      accentColor: "#6B7280",
      textColor: "#1F2937",
      secondaryTextColor: "#6B7280",
      fontFamily: "sans-serif",
      layout: "centered",
    },
    fields: {
      showHebrewDate: false,
      showHostLine: false,
      showVenue: true,
      showTime: true,
    },
  },
]

// Helper functions
export function getTemplateById(id: string): EventTemplate | undefined {
  return EVENT_TEMPLATES.find((t) => t.id === id)
}

export function getTemplatesByCategory(category: string): EventTemplate[] {
  return EVENT_TEMPLATES.filter((t) => t.category === category)
}

export function getTemplatesBySubcategory(category: string, subcategory: string): EventTemplate[] {
  return EVENT_TEMPLATES.filter((t) => t.category === category && t.subcategory === subcategory)
}

export function getAllCategories(): string[] {
  return Object.keys(TEMPLATE_CATEGORIES)
}

export function getCategoryLabel(category: string): string {
  return TEMPLATE_CATEGORIES[category as keyof typeof TEMPLATE_CATEGORIES]?.label || category
}

export function getSubcategories(category: string): string[] {
  return TEMPLATE_CATEGORIES[category as keyof typeof TEMPLATE_CATEGORIES]?.subcategories || []
}
