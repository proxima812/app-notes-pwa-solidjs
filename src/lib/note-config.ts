import type { NoteColor } from './db'

export type ThemeMode = 'auto' | 'light' | 'dark'

export const NOTE_COLORS: { id: NoteColor; label: string; classes: string }[] = [
  { id: 'slate', label: 'Slate', classes: 'from-slate-100 to-slate-200 border-slate-300' },
  { id: 'coral', label: 'Coral', classes: 'from-orange-100 to-rose-100 border-orange-300' },
  { id: 'mint', label: 'Mint', classes: 'from-emerald-100 to-lime-100 border-emerald-300' },
  { id: 'sky', label: 'Sky', classes: 'from-cyan-100 to-blue-100 border-cyan-300' },
  { id: 'sand', label: 'Sand', classes: 'from-amber-100 to-yellow-100 border-amber-300' },
  { id: 'rose', label: 'Rose', classes: 'from-pink-100 to-rose-100 border-pink-300' },
  { id: 'lavender', label: 'Lavender', classes: 'from-violet-100 to-fuchsia-100 border-violet-300' },
]

export const COLOR_IDS = new Set<NoteColor>(NOTE_COLORS.map((item) => item.id))

export const COVER_GRADIENTS = [
  'linear-gradient(135deg,#34d399 0%,#22c55e 40%,#14b8a6 100%)',
  'linear-gradient(135deg,#22d3ee 0%,#3b82f6 45%,#6366f1 100%)',
  'linear-gradient(135deg,#fb7185 0%,#f97316 45%,#facc15 100%)',
  'linear-gradient(135deg,#a78bfa 0%,#ec4899 45%,#f43f5e 100%)',
  'linear-gradient(135deg,#2dd4bf 0%,#84cc16 45%,#22c55e 100%)',
  'linear-gradient(135deg,#38bdf8 0%,#818cf8 45%,#c084fc 100%)',
  'linear-gradient(135deg,#f59e0b 0%,#ef4444 50%,#ec4899 100%)',
  'linear-gradient(135deg,#10b981 0%,#14b8a6 45%,#06b6d4 100%)',
]

export const REMINDER_PRESETS = ['11:00', '12:00', '14:00', '15:00', '17:30', '19:00', '22:00']
