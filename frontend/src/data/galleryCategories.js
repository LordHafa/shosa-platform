export const GALLERY_CATEGORIES = [
  {
    value: 'founders_leadership',
    label: 'Founders, Leadership & Early SHOSA Story',
    shortLabel: 'Leadership',
    description: 'Founding story, directors, school leadership, early alumni history and official meetings.',
    keywords: ['founder', 'founding', 'director', 'muyingo', 'leadership', 'head teacher', 'headteacher', 'obbo', 'joan', 'rose', 'early', 'story']
  },
  {
    value: 'dinners_reunions',
    label: 'Dinners, Reunions & Homecoming',
    shortLabel: 'Dinners & Reunions',
    description: 'Reunion dinners, homecomings, award nights and formal alumni gatherings.',
    keywords: ['dinner', 'reunion', 'kololo', 'arirang', 'homecoming', 'awards', 'award', 'formal', 'banquet']
  },
  {
    value: 'sacco_savings',
    label: 'SHOSA SACCO & Savings',
    shortLabel: 'SACCO',
    description: 'SACCO planning, savings meetings, finance clinics, AGMs and cooperative activities.',
    keywords: ['sacco', 'saving', 'savings', 'agm', 'finance', 'cooperative', 'shosa savings']
  },
  {
    value: 'league_sports',
    label: 'SHOSA League & Sports',
    shortLabel: 'League & Sports',
    description: 'Football, league weekends, fixtures, trophies and sports engagements.',
    keywords: ['league', 'football', 'sport', 'sports', 'fixture', 'trophy', 'match', 'goal']
  },
  {
    value: 'career_orientation',
    label: 'Career Guidance, Orientation & Student Mentorship',
    shortLabel: 'Career & Mentorship',
    description: 'Career guidance, S.5 orientation, S.6/Vacists convention, debates, prefects training and mentorship.',
    keywords: ['orientation', 'career', 'guidance', 'mentor', 'mentorship', 'debate', 'prefect', 'prefects', 's.5', 's5', 's.6', 's6', 'vaccist', 'convention', 'training', 'boot camp']
  },
  {
    value: 'medical_outreach',
    label: 'Medical Camps & Community Outreach',
    shortLabel: 'Medical & Outreach',
    description: 'Medical camps, health outreach, community support and alumni service activities.',
    keywords: ['medical', 'camp', 'health', 'outreach', 'doctor', 'nurse', 'clinic']
  },
  {
    value: 'campus_chapters',
    label: 'Campus, Chapters & Alumni Meetings',
    shortLabel: 'Campus & Meetings',
    description: 'Campus visits, university chapters, alumni meetings and school community engagements.',
    keywords: ['campus', 'chapter', 'meeting', 'university', 'nama', 'mbalala', 'green', 'main', 'alumni meeting', 'bukoto', 'pan-african']
  },
  {
    value: 'merchandise_identity',
    label: 'Merchandise, Identity & SHOSA Brand',
    shortLabel: 'Merchandise & Brand',
    description: 'SHOSA logos, branded items, merchandise, identity materials and campaign visuals.',
    keywords: ['shirt', 't-shirt', 'cap', 'sticker', 'merchandise', 'logo', 'brand', 'logistics', 'branded', 'jumper', 'cup', 'calendar', 'book', 'pen']
  }
]

export function getGalleryCategory(value) {
  return GALLERY_CATEGORIES.find(cat => cat.value === value)
}

export function normalizeGalleryCategory(input) {
  if (!input) return 'campus_chapters' // default

  const lower = String(input).toLowerCase().trim()

  // Map old or freeform categories
  const mappings = {
    'founders_leadership': ['founders', 'leadership', 'early shosa', 'directors', 'headteacher'],
    'dinners_reunions': ['dinners', 'reunions', 'homecoming', 'awards'],
    'sacco_savings': ['sacco', 'savings', 'finance', 'agm', 'cooperative'],
    'league_sports': ['league', 'sports', 'football', 'tournament'],
    'career_orientation': ['career', 'orientation', 'mentorship', 'guidance', 'debates', 'prefects'],
    'medical_outreach': ['medical', 'outreach', 'health', 'camps'],
    'campus_chapters': ['campus', 'chapters', 'meetings', 'university'],
    'merchandise_identity': ['merchandise', 'identity', 'brand', 'logos']
  }

  for (const [cat, keywords] of Object.entries(mappings)) {
    if (keywords.some(kw => lower.includes(kw))) return cat
  }

  return 'campus_chapters' // fallback
}

export function categorizeGalleryItem(item) {
  const text = `${item.title || ''} ${item.description || ''} ${item.category || ''}`.toLowerCase()

  for (const cat of GALLERY_CATEGORIES) {
    if (cat.keywords.some(kw => text.includes(kw))) {
      return cat.value
    }
  }

  return normalizeGalleryCategory(item.category)
}