export function toInputDate(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

export function toISODate(localDate: string): string | null {
  if (!localDate) return null
  return new Date(localDate).toISOString()
}

export function formatDate(iso: string | null): string {
  if (!iso) return 'No reminder'
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

export function nextDateByTime(time: string): string | null {
  const [hourRaw, minuteRaw] = time.split(':')
  const hour = Number(hourRaw)
  const minute = Number(minuteRaw)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null

  const now = new Date()
  const target = new Date()
  target.setHours(hour, minute, 0, 0)
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1)
  }

  return target.toISOString()
}
