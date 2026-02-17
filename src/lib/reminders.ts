import type { Note } from './db'

let timer: number | undefined
let audioContext: AudioContext | null = null

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

export async function playReminderSound(): Promise<void> {
  const Win = window as Window & { webkitAudioContext?: typeof AudioContext }
  const ContextCtor = globalThis.AudioContext ?? Win.webkitAudioContext
  if (!ContextCtor) return

  const ctx = audioContext ?? new ContextCtor()
  audioContext = ctx

  if (ctx.state === 'suspended') {
    await ctx.resume()
  }

  const gain = ctx.createGain()
  gain.gain.value = 0.0001
  gain.connect(ctx.destination)

  const now = ctx.currentTime
  const scheduleBeep = (start: number, frequency: number) => {
    const oscillator = ctx.createOscillator()
    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(frequency, start)
    oscillator.connect(gain)
    oscillator.start(start)
    oscillator.stop(start + 0.12)
  }

  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5)

  scheduleBeep(now, 880)
  scheduleBeep(now + 0.2, 1046)
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
