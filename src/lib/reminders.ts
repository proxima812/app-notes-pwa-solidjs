import type { Note } from './db'

let timer: number | undefined

async function notifyWithServiceWorker(title: string, body: string): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false
  const registration = await navigator.serviceWorker.ready
  await registration.showNotification(title, {
    body,
    icon: '/pwa-192.svg',
    badge: '/pwa-192.svg',
    tag: `note-${title}`,
  })
  return true
}

export async function sendReminderNotification(note: Note): Promise<void> {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  const title = note.title || 'Reminder'
  const body = note.content.slice(0, 110) || 'You have a note reminder right now.'

  try {
    const sentBySw = await notifyWithServiceWorker(title, body)
    if (!sentBySw) new Notification(title, { body, icon: '/pwa-192.svg' })
  } catch {
    new Notification(title, { body, icon: '/pwa-192.svg' })
  }
}

export function startReminderLoop(handler: () => Promise<void>): void {
  stopReminderLoop()
  timer = window.setInterval(() => {
    void handler()
  }, 30_000)
}

export function stopReminderLoop(): void {
  if (timer) {
    window.clearInterval(timer)
    timer = undefined
  }
}
