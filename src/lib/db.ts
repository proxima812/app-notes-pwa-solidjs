import { openDB } from 'idb'

export type NoteColor =
  | 'slate'
  | 'coral'
  | 'mint'
  | 'sky'
  | 'sand'
  | 'rose'
  | 'lavender'

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export interface Note {
  id: string
  title: string
  content: string
  color: NoteColor
  tags: string[]
  checklist: ChecklistItem[]
  isPinned: boolean
  order: number
  reminderAt: string | null
  remindedAt: string | null
  createdAt: string
  updatedAt: string
}

const DB_NAME = 'keepx-notes-db'
const DB_VERSION = 2
const STORE_NAME = 'notes'

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db, _oldVersion, _newVersion, transaction) {
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      store.createIndex('updatedAt', 'updatedAt')
      store.createIndex('isPinned', 'isPinned')
      store.createIndex('reminderAt', 'reminderAt')
      store.createIndex('order', 'order')
      return
    }

    const store = transaction.objectStore(STORE_NAME)
    if (!store.indexNames.contains('order')) {
      store.createIndex('order', 'order')
    }
  },
})

const allowedColors: NoteColor[] = ['slate', 'coral', 'mint', 'sky', 'sand', 'rose', 'lavender']

function sortNotes(items: Note[]): Note[] {
  return items.sort((a, b) => {
    if (a.isPinned !== b.isPinned) return Number(b.isPinned) - Number(a.isPinned)
    if (a.order !== b.order) return a.order - b.order
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
}

function normalizeNote(raw: Partial<Note>, fallbackOrder: number): { note: Note; changed: boolean } {
  const color = allowedColors.includes(raw.color as NoteColor) ? (raw.color as NoteColor) : 'slate'
  const checklist = Array.isArray(raw.checklist)
    ? raw.checklist
        .filter((item) => item && typeof item.id === 'string' && typeof item.text === 'string')
        .map((item) => ({ id: item.id, text: item.text.trim(), done: Boolean(item.done) }))
        .filter((item) => item.text.length > 0)
    : []

  const note: Note = {
    id: raw.id ?? crypto.randomUUID(),
    title: typeof raw.title === 'string' ? raw.title : '',
    content: typeof raw.content === 'string' ? raw.content : '',
    color,
    tags: Array.isArray(raw.tags) ? raw.tags.filter(Boolean).map(String) : [],
    checklist,
    isPinned: Boolean(raw.isPinned),
    order: typeof raw.order === 'number' ? raw.order : fallbackOrder,
    reminderAt: typeof raw.reminderAt === 'string' ? raw.reminderAt : null,
    remindedAt: typeof raw.remindedAt === 'string' ? raw.remindedAt : null,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  }

  const changed =
    raw.id !== note.id ||
    raw.title !== note.title ||
    raw.content !== note.content ||
    raw.color !== note.color ||
    JSON.stringify(raw.tags ?? []) !== JSON.stringify(note.tags) ||
    JSON.stringify(raw.checklist ?? []) !== JSON.stringify(note.checklist) ||
    Boolean(raw.isPinned) !== note.isPinned ||
    raw.order !== note.order ||
    (raw.reminderAt ?? null) !== note.reminderAt ||
    (raw.remindedAt ?? null) !== note.remindedAt ||
    raw.createdAt !== note.createdAt ||
    raw.updatedAt !== note.updatedAt

  return { note, changed }
}

export async function listNotes(): Promise<Note[]> {
  const db = await dbPromise
  const rawItems = await db.getAll(STORE_NAME)
  const normalized = rawItems.map((item, index) => normalizeNote(item, index))

  const tx = db.transaction(STORE_NAME, 'readwrite')
  for (const item of normalized) {
    if (item.changed) {
      await tx.store.put(item.note)
    }
  }
  await tx.done

  return sortNotes(normalized.map((item) => item.note))
}

export async function saveNote(note: Note): Promise<void> {
  const db = await dbPromise
  await db.put(STORE_NAME, note)
}

export async function saveNotes(notes: Note[]): Promise<void> {
  const db = await dbPromise
  const tx = db.transaction(STORE_NAME, 'readwrite')
  for (const note of notes) {
    await tx.store.put(note)
  }
  await tx.done
}

export async function removeNote(id: string): Promise<void> {
  const db = await dbPromise
  await db.delete(STORE_NAME, id)
}

export async function getDueReminderNotes(nowISO: string): Promise<Note[]> {
  const notes = await listNotes()
  return notes.filter((note) => {
    if (!note.reminderAt) return false
    if (note.remindedAt) return false
    return new Date(note.reminderAt).getTime() <= new Date(nowISO).getTime()
  })
}
