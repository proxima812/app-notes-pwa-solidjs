import type { ThemeMode } from './note-config'

export function autoThemeByHour(): 'light' | 'dark' {
  const hour = new Date().getHours()
  return hour >= 7 && hour < 19 ? 'light' : 'dark'
}

export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  return mode === 'auto' ? autoThemeByHour() : mode
}
