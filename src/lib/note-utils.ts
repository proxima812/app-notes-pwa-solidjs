import type { Note, NoteColor } from './db'

export function sortNotesLocal(items: Note[]): Note[] {
  return [...items].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return Number(b.isPinned) - Number(a.isPinned)
    if (a.order !== b.order) return a.order - b.order
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
}

export function emptyDraft(): Note {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    title: '',
    content: '',
    color: 'slate',
    tags: [],
    checklist: [],
    isPinned: false,
    order: 0,
    reminderAt: null,
    remindedAt: null,
    createdAt: now,
    updatedAt: now,
  }
}

function hashString(value: string): number {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

export function buildNoteCovers(noteIds: string[], gradients: string[]): Map<string, string> {
  const mapped = new Map<string, string>()
  let prevIndex = -1

  for (const id of noteIds) {
    let nextIndex = hashString(id) % gradients.length
    if (nextIndex === prevIndex) nextIndex = (nextIndex + 1) % gradients.length
    mapped.set(id, gradients[nextIndex])
    prevIndex = nextIndex
  }

  return mapped
}

export function estimateColumnCount(width: number, mobileColumns: 1 | 2): number {
  if (width >= 1280) return 3
  if (width >= 768) return 2
  return mobileColumns
}

export function splitIntoMasonryColumns(notes: Note[], columnsCount: number): Note[][] {
  const columns = Array.from({ length: columnsCount }, () => [] as Note[])
  const heights = Array.from({ length: columnsCount }, () => 0)

  const estimatedHeight = (note: Note): number => {
    let score = 240
    score += Math.min(220, note.content.length * 0.18)
    score += note.checklist.length * 22
    score += note.tags.length * 14
    if (note.title) score += 18
    return score
  }

  for (const note of notes) {
    let minIndex = 0
    for (let i = 1; i < columns.length; i += 1) {
      if (heights[i] < heights[minIndex]) minIndex = i
    }
    columns[minIndex].push(note)
    heights[minIndex] += estimatedHeight(note)
  }

  return columns
}

export function coerceImportedNote(
  raw: Partial<Note>,
  fallbackOrder: number,
  colorIds: Set<NoteColor>,
): Note {
  const now = new Date().toISOString()
  return {
    id: typeof raw.id === 'string' ? raw.id : crypto.randomUUID(),
    title: typeof raw.title === 'string' ? raw.title : '',
    content: typeof raw.content === 'string' ? raw.content : '',
    color: colorIds.has(raw.color as NoteColor) ? (raw.color as NoteColor) : 'slate',
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    checklist: Array.isArray(raw.checklist)
      ? raw.checklist
          .filter((item) => item && typeof item.text === 'string')
          .map((item) => ({
            id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
            text: item.text.trim(),
            done: Boolean(item.done),
          }))
          .filter((item) => item.text)
      : [],
    isPinned: Boolean(raw.isPinned),
    order: typeof raw.order === 'number' ? raw.order : fallbackOrder,
    reminderAt: typeof raw.reminderAt === 'string' ? raw.reminderAt : null,
    remindedAt: typeof raw.remindedAt === 'string' ? raw.remindedAt : null,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
  }
}
