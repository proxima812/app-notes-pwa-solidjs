import { createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js'
import { Toaster, toast } from 'solid-toast'
import {
  FiBell,
  FiCheckSquare,
  FiClock,
  FiDownload,
  FiEdit3,
  FiMove,
  FiPlus,
  FiSearch,
  FiSmartphone,
  FiStar,
  FiTag,
  FiTrash2,
  FiUpload,
  FiX,
} from 'solid-icons/fi'
import {
  getDueReminderNotes,
  listNotes,
  removeNote,
  saveNote,
  saveNotes,
  type ChecklistItem,
  type Note,
  type NoteColor,
} from './lib/db'
import { exportEncryptedBackup, exportPlainBackup, importBackup } from './lib/backup'
import { sendReminderNotification, startReminderLoop, stopReminderLoop } from './lib/reminders'

type InstallPrompt = {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type BeforeInstallPromptEvent = Event & InstallPrompt

const colors: { id: NoteColor; label: string; classes: string }[] = [
  { id: 'slate', label: 'Slate', classes: 'from-slate-100 to-slate-200 border-slate-300' },
  { id: 'coral', label: 'Coral', classes: 'from-orange-100 to-rose-100 border-orange-300' },
  { id: 'mint', label: 'Mint', classes: 'from-emerald-100 to-lime-100 border-emerald-300' },
  { id: 'sky', label: 'Sky', classes: 'from-cyan-100 to-blue-100 border-cyan-300' },
  { id: 'sand', label: 'Sand', classes: 'from-amber-100 to-yellow-100 border-amber-300' },
  { id: 'rose', label: 'Rose', classes: 'from-pink-100 to-rose-100 border-pink-300' },
  { id: 'lavender', label: 'Lavender', classes: 'from-violet-100 to-fuchsia-100 border-violet-300' },
]

const colorIds = new Set(colors.map((item) => item.id))

const sortNotesLocal = (items: Note[]): Note[] =>
  [...items].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return Number(b.isPinned) - Number(a.isPinned)
    if (a.order !== b.order) return a.order - b.order
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

const emptyDraft = (): Note => {
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

const toInputDate = (iso: string | null): string => {
  if (!iso) return ''
  const date = new Date(iso)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 16)
}

const toISODate = (localDate: string): string | null => {
  if (!localDate) return null
  return new Date(localDate).toISOString()
}

const formatDate = (iso: string | null): string => {
  if (!iso) return 'No reminder'
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

const coerceImportedNote = (raw: Partial<Note>, fallbackOrder: number): Note => {
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

function App() {
  const [notes, setNotes] = createSignal<Note[]>([])
  const [draft, setDraft] = createSignal<Note>(emptyDraft())
  const [search, setSearch] = createSignal('')
  const [tagInput, setTagInput] = createSignal('')
  const [checklistInput, setChecklistInput] = createSignal('')
  const [editingId, setEditingId] = createSignal<string | null>(null)
  const [installPrompt, setInstallPrompt] = createSignal<InstallPrompt | null>(null)
  const [draggedId, setDraggedId] = createSignal<string | null>(null)
  const [dragOverId, setDragOverId] = createSignal<string | null>(null)
  const [permission, setPermission] = createSignal(
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  )

  let importInputRef: HTMLInputElement | undefined

  const isEditing = createMemo(() => editingId() !== null)

  const filteredNotes = createMemo(() => {
    const query = search().trim().toLowerCase()
    if (!query) return notes()

    return notes().filter((note) => {
      const tagMatch = note.tags.some((tag) => tag.toLowerCase().includes(query))
      const checklistMatch = note.checklist.some((item) => item.text.toLowerCase().includes(query))
      return (
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        tagMatch ||
        checklistMatch
      )
    })
  })

  const refreshNotes = async () => {
    setNotes(await listNotes())
  }

  const nextOrderForGroup = (isPinned: boolean): number => {
    const group = notes().filter((note) => note.isPinned === isPinned)
    if (!group.length) return 0
    return Math.max(...group.map((item) => item.order)) + 1
  }

  const applySequentialOrderAndSave = async (items: Note[]) => {
    let pinnedOrder = 0
    let regularOrder = 0

    const normalized = items.map((note) => {
      if (note.isPinned) {
        const next: Note = { ...note, order: pinnedOrder }
        pinnedOrder += 1
        return next
      }

      const next: Note = { ...note, order: regularOrder }
      regularOrder += 1
      return next
    })

    await saveNotes(normalized)
    setNotes(sortNotesLocal(normalized))
  }

  const checkDueReminders = async () => {
    const due = await getDueReminderNotes(new Date().toISOString())
    if (!due.length) return

    for (const note of due) {
      await sendReminderNotification(note)
      await saveNote({ ...note, remindedAt: new Date().toISOString(), updatedAt: note.updatedAt })
      toast.success(`Напоминание: ${note.title || 'Без названия'}`)
    }

    await refreshNotes()
  }

  onMount(async () => {
    await refreshNotes()
    await checkDueReminders()
    startReminderLoop(checkDueReminders)

    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    onCleanup(() => {
      stopReminderLoop()
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
    })
  })

  const requestNotificationAccess = async () => {
    if (!('Notification' in window)) {
      toast.error('Уведомления не поддерживаются в этом браузере')
      return
    }

    const nextPermission = await Notification.requestPermission()
    setPermission(nextPermission)
    if (nextPermission === 'granted') toast.success('Уведомления включены')
    else toast.error('Разрешение не выдано')
  }

  const resetDraft = () => {
    setDraft(emptyDraft())
    setTagInput('')
    setChecklistInput('')
    setEditingId(null)
  }

  const addTag = () => {
    const value = tagInput().trim().toLowerCase()
    if (!value) return

    if (draft().tags.includes(value)) {
      setTagInput('')
      return
    }

    setDraft((prev) => ({ ...prev, tags: [...prev.tags, value] }))
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setDraft((prev) => ({ ...prev, tags: prev.tags.filter((item) => item !== tag) }))
  }

  const addChecklistItem = () => {
    const text = checklistInput().trim()
    if (!text) return

    const item: ChecklistItem = {
      id: crypto.randomUUID(),
      text,
      done: false,
    }

    setDraft((prev) => ({ ...prev, checklist: [...prev.checklist, item] }))
    setChecklistInput('')
  }

  const toggleDraftChecklistItem = (itemId: string) => {
    setDraft((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item,
      ),
    }))
  }

  const removeDraftChecklistItem = (itemId: string) => {
    setDraft((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((item) => item.id !== itemId),
    }))
  }

  const saveDraft = async () => {
    const item = draft()
    if (!item.title.trim() && !item.content.trim() && !item.checklist.length) {
      toast.error('Добавь заголовок, текст или пункт checklist')
      return
    }

    const now = new Date().toISOString()
    const note: Note = {
      ...item,
      title: item.title.trim(),
      content: item.content.trim(),
      checklist: item.checklist
        .map((entry) => ({ ...entry, text: entry.text.trim() }))
        .filter((entry) => entry.text.length > 0),
      updatedAt: now,
      createdAt: isEditing() ? item.createdAt : now,
      order: isEditing() ? item.order : nextOrderForGroup(item.isPinned),
      remindedAt:
        item.reminderAt && item.remindedAt && new Date(item.reminderAt) > new Date(item.remindedAt)
          ? null
          : item.remindedAt,
    }

    await saveNote(note)
    await refreshNotes()
    resetDraft()
    toast.success(isEditing() ? 'Заметка обновлена' : 'Заметка сохранена')
  }

  const editNote = (note: Note) => {
    setDraft(note)
    setEditingId(note.id)
    setChecklistInput('')
  }

  const deleteNote = async (id: string) => {
    await removeNote(id)
    await refreshNotes()
    if (editingId() === id) resetDraft()
    toast.success('Заметка удалена')
  }

  const togglePin = async (note: Note) => {
    const nextPinnedState = !note.isPinned
    const updated: Note = {
      ...note,
      isPinned: nextPinnedState,
      order: nextOrderForGroup(nextPinnedState),
      updatedAt: new Date().toISOString(),
    }
    await saveNote(updated)
    await refreshNotes()
  }

  const toggleChecklistOnCard = async (note: Note, itemId: string) => {
    const updated: Note = {
      ...note,
      checklist: note.checklist.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item,
      ),
      updatedAt: new Date().toISOString(),
    }
    await saveNote(updated)
    setNotes((prev) => sortNotesLocal(prev.map((item) => (item.id === updated.id ? updated : item))))
  }

  const handleDrop = async (targetId: string) => {
    const activeDragId = draggedId()
    if (!activeDragId || activeDragId === targetId) return

    const ordered = [...notes()]
    const fromIndex = ordered.findIndex((item) => item.id === activeDragId)
    const toIndex = ordered.findIndex((item) => item.id === targetId)

    if (fromIndex === -1 || toIndex === -1) return
    if (ordered[fromIndex].isPinned !== ordered[toIndex].isPinned) {
      toast('Перетаскивание между pinned и обычными отключено')
      setDraggedId(null)
      setDragOverId(null)
      return
    }

    const [moved] = ordered.splice(fromIndex, 1)
    ordered.splice(toIndex, 0, moved)

    await applySequentialOrderAndSave(ordered)
    setDraggedId(null)
    setDragOverId(null)
  }

  const installPwa = async () => {
    const installer = installPrompt()
    if (!installer) {
      toast('Открой сайт в Chrome/Edge и добавь на экран вручную')
      return
    }

    await installer.prompt()
    const result = await installer.userChoice
    if (result.outcome === 'accepted') {
      toast.success('PWA установлено')
      setInstallPrompt(null)
    }
  }

  const downloadTextFile = (filename: string, content: string, type = 'application/json') => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const exportPlain = () => {
    const json = exportPlainBackup(notes())
    const stamp = new Date().toISOString().slice(0, 19).replaceAll(':', '-')
    downloadTextFile(`keepx-backup-${stamp}.json`, json)
    toast.success('JSON backup сохранен')
  }

  const exportEncrypted = async () => {
    const password = window.prompt('Пароль для шифрования (минимум 8 символов):')?.trim()
    if (!password) return
    if (password.length < 8) {
      toast.error('Пароль слишком короткий')
      return
    }

    const encrypted = await exportEncryptedBackup(notes(), password)
    const stamp = new Date().toISOString().slice(0, 19).replaceAll(':', '-')
    downloadTextFile(`keepx-backup-encrypted-${stamp}.json`, encrypted)
    toast.success('Зашифрованный backup сохранен')
  }

  const startImport = () => {
    importInputRef?.click()
  }

  const handleImportFile = async (event: Event) => {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      let importedNotes: Note[] = []

      try {
        importedNotes = (await importBackup(text)).map((item, index) => coerceImportedNote(item, index))
      } catch (error) {
        if (error instanceof Error && error.message === 'PASSWORD_REQUIRED') {
          const password = window.prompt('Этот backup зашифрован. Введи пароль:')?.trim()
          if (!password) {
            toast.error('Импорт отменен: пароль не указан')
            return
          }
          importedNotes = (await importBackup(text, password)).map((item, index) =>
            coerceImportedNote(item, index),
          )
        } else {
          throw error
        }
      }

      const mergedById = new Map<string, Note>()
      for (const note of notes()) mergedById.set(note.id, note)
      for (const note of importedNotes) mergedById.set(note.id, note)

      await applySequentialOrderAndSave(sortNotesLocal([...mergedById.values()]))
      await refreshNotes()
      toast.success(`Импортировано заметок: ${importedNotes.length}`)
    } catch {
      toast.error('Ошибка импорта: проверь формат файла или пароль')
    } finally {
      input.value = ''
    }
  }

  return (
    <main class="min-h-screen bg-[#f3f4f6] text-slate-900 selection:bg-cyan-300 selection:text-slate-900">
      <div class="pointer-events-none fixed inset-0 overflow-hidden">
        <div class="absolute -top-36 left-8 h-72 w-72 rounded-full bg-cyan-300/45 blur-3xl" />
        <div class="absolute bottom-0 right-6 h-72 w-72 rounded-full bg-orange-300/45 blur-3xl" />
      </div>

      <section class="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header class="mb-6 rounded-3xl border border-white/70 bg-white/75 p-5 shadow-xl shadow-slate-200/60 backdrop-blur md:p-8">
          <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">KeepX</p>
              <h1 class="text-3xl font-black tracking-tight sm:text-4xl">Notes + Reminders</h1>
              <p class="mt-1 text-sm text-slate-600">Keep-подобный UI, offline-first, drag-and-drop, backup и checklist.</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <button
                class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
                onClick={requestNotificationAccess}
              >
                <FiBell />
                {permission() === 'granted' ? 'Уведомления включены' : 'Включить уведомления'}
              </button>
              <button
                class="inline-flex items-center gap-2 rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
                onClick={installPwa}
              >
                <FiSmartphone />
                Установить как PWA
              </button>
              <button
                class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
                onClick={exportPlain}
              >
                <FiDownload />
                Экспорт JSON
              </button>
              <button
                class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
                onClick={exportEncrypted}
              >
                <FiDownload />
                Шифр backup
              </button>
              <button
                class="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
                onClick={startImport}
              >
                <FiUpload />
                Импорт
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json"
                class="hidden"
                onChange={handleImportFile}
              />
            </div>
          </div>

          <div class="mt-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <FiSearch class="text-slate-500" />
            <input
              value={search()}
              onInput={(event) => setSearch(event.currentTarget.value)}
              class="w-full bg-transparent text-sm outline-none"
              placeholder="Поиск по заголовку, тексту, тегам и checklist"
            />
          </div>
        </header>

        <div class="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside class="rounded-3xl border border-white/80 bg-white/80 p-5 shadow-lg backdrop-blur">
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-lg font-bold">{isEditing() ? 'Редактирование' : 'Новая заметка'}</h2>
              <Show when={isEditing()}>
                <button class="rounded-lg p-2 hover:bg-slate-100" onClick={resetDraft} aria-label="Close editor">
                  <FiX />
                </button>
              </Show>
            </div>

            <div class="space-y-3">
              <input
                value={draft().title}
                onInput={(event) => setDraft((prev) => ({ ...prev, title: event.currentTarget.value }))}
                class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-cyan-400 focus:ring"
                placeholder="Заголовок"
              />

              <textarea
                value={draft().content}
                onInput={(event) => setDraft((prev) => ({ ...prev, content: event.currentTarget.value }))}
                rows={5}
                class="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-cyan-400 focus:ring"
                placeholder="Текст заметки"
              />

              <div class="rounded-xl border border-slate-300 bg-white px-3 py-2">
                <label class="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <FiCheckSquare />
                  Checklist
                </label>
                <div class="flex gap-2">
                  <input
                    value={checklistInput()}
                    onInput={(event) => setChecklistInput(event.currentTarget.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        addChecklistItem()
                      }
                    }}
                    class="w-full bg-transparent text-sm outline-none"
                    placeholder="Добавить пункт"
                  />
                  <button class="rounded-lg bg-slate-200 px-2 py-1 text-xs font-semibold" onClick={addChecklistItem}>
                    +
                  </button>
                </div>
                <div class="mt-2 space-y-2">
                  <For each={draft().checklist}>
                    {(item) => (
                      <div class="flex items-center gap-2 rounded-lg bg-slate-100 px-2 py-1.5">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => toggleDraftChecklistItem(item.id)}
                        />
                        <span class={`text-sm ${item.done ? 'text-slate-500 line-through' : ''}`}>{item.text}</span>
                        <button class="ml-auto text-xs text-rose-600" onClick={() => removeDraftChecklistItem(item.id)}>
                          удалить
                        </button>
                      </div>
                    )}
                  </For>
                </div>
              </div>

              <div class="grid grid-cols-4 gap-2">
                <For each={colors}>
                  {(color) => (
                    <button
                      onClick={() => setDraft((prev) => ({ ...prev, color: color.id }))}
                      title={color.label}
                      class={`h-8 rounded-lg border bg-gradient-to-br ${color.classes} ${draft().color === color.id ? 'ring-2 ring-slate-800' : ''}`}
                    />
                  )}
                </For>
              </div>

              <div class="rounded-xl border border-slate-300 bg-white px-3 py-2">
                <label class="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <FiClock />
                  Напоминание
                </label>
                <input
                  type="datetime-local"
                  value={toInputDate(draft().reminderAt)}
                  onInput={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      reminderAt: toISODate(event.currentTarget.value),
                      remindedAt: null,
                    }))
                  }
                  class="w-full bg-transparent text-sm outline-none"
                />
              </div>

              <div class="rounded-xl border border-slate-300 bg-white px-3 py-2">
                <label class="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <FiTag />
                  Теги
                </label>
                <div class="flex gap-2">
                  <input
                    value={tagInput()}
                    onInput={(event) => setTagInput(event.currentTarget.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        addTag()
                      }
                    }}
                    class="w-full bg-transparent text-sm outline-none"
                    placeholder="Например: работа"
                  />
                  <button class="rounded-lg bg-slate-200 px-2 py-1 text-xs font-semibold" onClick={addTag}>
                    +
                  </button>
                </div>
                <div class="mt-2 flex flex-wrap gap-2">
                  <For each={draft().tags}>
                    {(tag) => (
                      <button
                        class="rounded-full bg-slate-200 px-2 py-1 text-xs font-medium hover:bg-slate-300"
                        onClick={() => removeTag(tag)}
                      >
                        #{tag} ×
                      </button>
                    )}
                  </For>
                </div>
              </div>

              <div class="flex gap-2">
                <button
                  class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  onClick={saveDraft}
                >
                  <FiPlus />
                  {isEditing() ? 'Обновить' : 'Сохранить'}
                </button>
                <button
                  class="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                  onClick={resetDraft}
                >
                  Сброс
                </button>
              </div>
            </div>
          </aside>

          <section>
            <Show when={filteredNotes().length > 0} fallback={<EmptyState />}>
              <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <For each={filteredNotes()}>
                  {(note) => {
                    const color = colors.find((item) => item.id === note.color) ?? colors[0]
                    const completedChecklist = note.checklist.filter((item) => item.done).length

                    return (
                      <article
                        draggable
                        onDragStart={() => setDraggedId(note.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDragEnter={() => setDragOverId(note.id)}
                        onDragEnd={() => {
                          setDraggedId(null)
                          setDragOverId(null)
                        }}
                        onDrop={() => void handleDrop(note.id)}
                        class={`rounded-2xl border bg-gradient-to-br p-4 shadow-md transition hover:-translate-y-1 ${color.classes} ${dragOverId() === note.id ? 'ring-2 ring-slate-900' : ''}`}
                      >
                        <div class="mb-2 flex items-start justify-between gap-2">
                          <div class="flex items-start gap-2">
                            <span class="mt-0.5 cursor-grab text-slate-500" title="Drag to reorder">
                              <FiMove />
                            </span>
                            <h3 class="line-clamp-2 text-base font-bold">{note.title || 'Без названия'}</h3>
                          </div>
                          <button
                            onClick={() => void togglePin(note)}
                            class={`rounded-md p-1.5 ${note.isPinned ? 'bg-slate-900 text-white' : 'bg-white/80 text-slate-700'}`}
                            title="Pin"
                          >
                            <FiStar />
                          </button>
                        </div>

                        <Show when={note.content}>
                          <p class="mb-3 whitespace-pre-wrap text-sm text-slate-700">{note.content}</p>
                        </Show>

                        <Show when={note.checklist.length > 0}>
                          <div class="mb-3 rounded-xl bg-white/70 p-2">
                            <p class="mb-2 text-xs font-semibold text-slate-600">
                              Checklist: {completedChecklist}/{note.checklist.length}
                            </p>
                            <div class="space-y-1.5">
                              <For each={note.checklist.slice(0, 5)}>
                                {(item) => (
                                  <label class="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={item.done}
                                      onChange={() => void toggleChecklistOnCard(note, item.id)}
                                    />
                                    <span class={item.done ? 'line-through text-slate-500' : 'text-slate-700'}>
                                      {item.text}
                                    </span>
                                  </label>
                                )}
                              </For>
                            </div>
                          </div>
                        </Show>

                        <div class="mb-3 flex flex-wrap gap-1.5">
                          <For each={note.tags}>
                            {(tag) => <span class="rounded-full bg-white/80 px-2 py-1 text-xs font-medium">#{tag}</span>}
                          </For>
                        </div>

                        <p class="mb-4 text-xs font-medium text-slate-600">{formatDate(note.reminderAt)}</p>

                        <div class="flex items-center justify-between">
                          <p class="text-xs text-slate-500">
                            Обновлено{' '}
                            {new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short' }).format(
                              new Date(note.updatedAt),
                            )}
                          </p>
                          <div class="flex gap-2">
                            <button
                              class="rounded-lg bg-white/80 p-2 text-slate-700 hover:bg-white"
                              onClick={() => editNote(note)}
                            >
                              <FiEdit3 />
                            </button>
                            <button
                              class="rounded-lg bg-white/80 p-2 text-rose-600 hover:bg-white"
                              onClick={() => void deleteNote(note.id)}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      </article>
                    )
                  }}
                </For>
              </div>
            </Show>
          </section>
        </div>
      </section>

      <Toaster
        position="top-right"
        gutter={10}
        toastOptions={{
          duration: 2800,
          style: {
            'background-color': '#0f172a',
            color: '#f8fafc',
            'border-radius': '12px',
            border: '1px solid #1e293b',
          },
        }}
      />
    </main>
  )
}

function EmptyState() {
  return (
    <div class="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center shadow-inner">
      <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
        <FiClock />
      </div>
      <h3 class="text-xl font-bold">Пока пусто</h3>
      <p class="mt-2 text-sm text-slate-600">
        Добавь первую заметку, checklist и напоминание. Приложение работает офлайн и ставится на телефон.
      </p>
    </div>
  )
}

export default App
