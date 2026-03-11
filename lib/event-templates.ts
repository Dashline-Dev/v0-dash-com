// Event invitation templates with styled content

export interface EventTemplate {
  id: string
  name: string
  category: string
  description: string
  // Default values when using this template
  defaults: {
    invitation_message?: string
    dress_code?: string
    additional_info?: string
  }
  // Visual styling
  style: {
    accentColor: string
    fontFamily: string
    headerStyle: "elegant" | "modern" | "playful" | "formal" | "minimal"
    pattern?: string
  }
  // Preview image URL (optional)
  previewImage?: string
}

export const EVENT_TEMPLATES: EventTemplate[] = [
  // Wedding Templates
  {
    id: "wedding-elegant",
    name: "Elegant Wedding",
    category: "Wedding",
    description: "A timeless, sophisticated invitation for your special day",
    defaults: {
      invitation_message: "Together with their families, we joyfully invite you to celebrate the marriage of",
      dress_code: "Formal / Black Tie Optional",
      additional_info: "Dinner and dancing to follow the ceremony",
    },
    style: {
      accentColor: "#D4AF37",
      fontFamily: "serif",
      headerStyle: "elegant",
      pattern: "floral",
    },
  },
  {
    id: "wedding-modern",
    name: "Modern Wedding",
    category: "Wedding",
    description: "Clean and contemporary design for the modern couple",
    defaults: {
      invitation_message: "We're getting married and would love for you to be there!",
      dress_code: "Semi-Formal",
      additional_info: "Reception immediately following",
    },
    style: {
      accentColor: "#2563EB",
      fontFamily: "sans-serif",
      headerStyle: "modern",
    },
  },
  {
    id: "wedding-rustic",
    name: "Rustic Wedding",
    category: "Wedding",
    description: "Warm and inviting for outdoor or barn weddings",
    defaults: {
      invitation_message: "With joy in our hearts, we invite you to share in our celebration",
      dress_code: "Garden Party Attire",
      additional_info: "Please join us for dinner and dancing under the stars",
    },
    style: {
      accentColor: "#92400E",
      fontFamily: "serif",
      headerStyle: "elegant",
      pattern: "botanical",
    },
  },

  // Bar/Bat Mitzvah Templates
  {
    id: "bar-mitzvah-traditional",
    name: "Traditional Bar Mitzvah",
    category: "Bar/Bat Mitzvah",
    description: "Classic and dignified for this important milestone",
    defaults: {
      invitation_message: "With great joy, we invite you to celebrate as our son is called to the Torah as a Bar Mitzvah",
      dress_code: "Formal Attire",
      additional_info: "Kiddush luncheon to follow services",
    },
    style: {
      accentColor: "#1E40AF",
      fontFamily: "serif",
      headerStyle: "formal",
      pattern: "geometric",
    },
  },
  {
    id: "bat-mitzvah-modern",
    name: "Modern Bat Mitzvah",
    category: "Bar/Bat Mitzvah",
    description: "Fresh and stylish for a contemporary celebration",
    defaults: {
      invitation_message: "Please join us as our daughter becomes a Bat Mitzvah",
      dress_code: "Festive Attire",
      additional_info: "Party to follow the service",
    },
    style: {
      accentColor: "#DB2777",
      fontFamily: "sans-serif",
      headerStyle: "modern",
    },
  },

  // Birthday Templates
  {
    id: "birthday-celebration",
    name: "Birthday Celebration",
    category: "Birthday",
    description: "Festive and fun for any birthday party",
    defaults: {
      invitation_message: "You're invited to celebrate!",
      additional_info: "Cake and refreshments will be served",
    },
    style: {
      accentColor: "#7C3AED",
      fontFamily: "sans-serif",
      headerStyle: "playful",
      pattern: "confetti",
    },
  },
  {
    id: "milestone-birthday",
    name: "Milestone Birthday",
    category: "Birthday",
    description: "Elegant design for significant birthdays",
    defaults: {
      invitation_message: "Please join us for a special celebration honoring",
      dress_code: "Cocktail Attire",
      additional_info: "Dinner and entertainment provided",
    },
    style: {
      accentColor: "#0F766E",
      fontFamily: "serif",
      headerStyle: "elegant",
    },
  },

  // Community Events
  {
    id: "community-gathering",
    name: "Community Gathering",
    category: "Community",
    description: "Welcoming design for community events",
    defaults: {
      invitation_message: "You're warmly invited to join us",
      additional_info: "Light refreshments will be served",
    },
    style: {
      accentColor: "#059669",
      fontFamily: "sans-serif",
      headerStyle: "modern",
    },
  },
  {
    id: "fundraiser-gala",
    name: "Fundraiser Gala",
    category: "Community",
    description: "Sophisticated design for charity events",
    defaults: {
      invitation_message: "We cordially invite you to join us for an evening of giving",
      dress_code: "Black Tie",
      additional_info: "Silent auction and entertainment throughout the evening",
    },
    style: {
      accentColor: "#9333EA",
      fontFamily: "serif",
      headerStyle: "formal",
    },
  },

  // Professional Events
  {
    id: "conference",
    name: "Conference",
    category: "Professional",
    description: "Professional design for business events",
    defaults: {
      invitation_message: "We invite you to join industry leaders and innovators",
      dress_code: "Business Professional",
      additional_info: "Networking reception to follow",
    },
    style: {
      accentColor: "#1F2937",
      fontFamily: "sans-serif",
      headerStyle: "minimal",
    },
  },
  {
    id: "workshop",
    name: "Workshop",
    category: "Professional",
    description: "Clean design for educational events",
    defaults: {
      invitation_message: "Join us for an interactive learning experience",
      additional_info: "Materials will be provided",
    },
    style: {
      accentColor: "#0284C7",
      fontFamily: "sans-serif",
      headerStyle: "modern",
    },
  },

  // Holiday/Seasonal
  {
    id: "holiday-party",
    name: "Holiday Party",
    category: "Holiday",
    description: "Festive design for seasonal celebrations",
    defaults: {
      invitation_message: "Join us for holiday cheer!",
      dress_code: "Festive Attire",
      additional_info: "Food, drinks, and merriment",
    },
    style: {
      accentColor: "#DC2626",
      fontFamily: "serif",
      headerStyle: "playful",
      pattern: "holiday",
    },
  },

  // Simple/Minimal
  {
    id: "simple-gathering",
    name: "Simple Gathering",
    category: "General",
    description: "Clean and minimal for any occasion",
    defaults: {
      invitation_message: "Please join us",
    },
    style: {
      accentColor: "#6B7280",
      fontFamily: "sans-serif",
      headerStyle: "minimal",
    },
  },
]

export function getTemplateById(id: string): EventTemplate | undefined {
  return EVENT_TEMPLATES.find((t) => t.id === id)
}

export function getTemplatesByCategory(category: string): EventTemplate[] {
  return EVENT_TEMPLATES.filter((t) => t.category === category)
}

export function getTemplateCategories(): string[] {
  return [...new Set(EVENT_TEMPLATES.map((t) => t.category))]
}
