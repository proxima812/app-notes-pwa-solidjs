import { createMemo, createSignal, For, lazy, onCleanup, onMount, Show, Suspense } from 'solid-js'
import { Toaster, toast } from 'solid-toast'
import {
  getDueReminderNotes,
  listNotes,
  removeNote,
  saveNote,
  saveNotes,
  type ChecklistItem,
  type Note,
} from './lib/db'
import { nextDateByTime, toISODate, toInputDate } from './lib/date-utils'
import { COLOR_IDS, COVER_GRADIENTS, NOTE_COLORS, type ThemeMode } from './lib/note-config'
import {
  buildNoteCovers,
  coerceImportedNote,
  emptyDraft,
  estimateColumnCount,
  sortNotesLocal,
  splitIntoMasonryColumns,
} from './lib/note-utils'
import { autoThemeByHour, resolveTheme } from './lib/theme-utils'
import {
  playColorPreviewSound,
  playReminderSound,
  sendReminderNotification,
  startReminderLoop,
  stopReminderLoop,
} from './lib/reminders'
import EmptyState from './components/EmptyState'
import { IconPlus } from './components/icons'
import NoteCard from './components/NoteCard'
import NotesHeader from './components/NotesHeader'

const EditorPanel = lazy(() => import('./components/EditorPanel'))

type InstallPrompt = {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type BeforeInstallPromptEvent = Event & InstallPrompt

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
  const [backupToolsOpen, setBackupToolsOpen] = createSignal(false)
  const [mobileColumns, setMobileColumns] = createSignal<1 | 2>(2)
  const [themeMode, setThemeMode] = createSignal<ThemeMode>('auto')
  const [theme, setTheme] = createSignal<'light' | 'dark'>(autoThemeByHour())
  const [viewportWidth, setViewportWidth] = createSignal(1200)
  const [permission, setPermission] = createSignal<NotificationPermission | 'default'>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  )

  let editorRef: HTMLDivElement | undefined
  let titleInputRef: HTMLInputElement | undefined
  let themeTimer: number | undefined
  let resizeTimer: number | undefined

  const isDark = createMemo(() => theme() === 'dark')
  const isEditing = createMemo(() => editingId() !== null)
  const columnCount = createMemo(() => estimateColumnCount(viewportWidth(), mobileColumns()))

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

  const noteCovers = createMemo(() =>
    buildNoteCovers(
      filteredNotes().map((note) => note.id),
      COVER_GRADIENTS,
    ),
  )

  const masonryColumns = createMemo(() => splitIntoMasonryColumns(filteredNotes(), columnCount()))

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
      await playReminderSound(note.color)
      await saveNote({ ...note, remindedAt: new Date().toISOString(), updatedAt: note.updatedAt })
      toast.success(`Напоминание: ${note.title || 'Без названия'}`)
    }

    await refreshNotes()
  }

  const applyTheme = (next: 'light' | 'dark') => {
    setTheme(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  const syncThemeFromMode = () => {
    applyTheme(resolveTheme(themeMode()))
  }

  onMount(async () => {
    await refreshNotes()
    await checkDueReminders()
    startReminderLoop(checkDueReminders)

    syncThemeFromMode()
    themeTimer = window.setInterval(syncThemeFromMode, 60_000)

    const syncViewport = () => {
      if (resizeTimer) window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        setViewportWidth(window.innerWidth)
      }, 40)
    }

    setViewportWidth(window.innerWidth)
    window.addEventListener('resize', syncViewport)

    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    onCleanup(() => {
      stopReminderLoop()
      if (themeTimer) window.clearInterval(themeTimer)
      if (resizeTimer) window.clearTimeout(resizeTimer)
      window.removeEventListener('resize', syncViewport)
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

  const changeThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode)
    applyTheme(resolveTheme(mode))
  }

  const applyPresetReminder = (time: string) => {
    const next = nextDateByTime(time)
    if (!next) return
    setDraft((prev) => ({ ...prev, reminderAt: next, remindedAt: null }))
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

  const addChecklistItem = () => {
    const text = checklistInput().trim()
    if (!text) return
    const item: ChecklistItem = { id: crypto.randomUUID(), text, done: false }
    setDraft((prev) => ({ ...prev, checklist: [...prev.checklist, item] }))
    setChecklistInput('')
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
    editorRef?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.setTimeout(() => titleInputRef?.focus(), 250)
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

  const moveNoteByStep = async (noteId: string, step: -1 | 1) => {
    const ordered = [...notes()]
    const fromIndex = ordered.findIndex((item) => item.id === noteId)
    if (fromIndex < 0) return

    const toIndex = fromIndex + step
    if (toIndex < 0 || toIndex >= ordered.length) return
    if (ordered[fromIndex].isPinned !== ordered[toIndex].isPinned) {
      toast('Перемещение между pinned и обычными отключено')
      return
    }

    const [moved] = ordered.splice(fromIndex, 1)
    ordered.splice(toIndex, 0, moved)
    await applySequentialOrderAndSave(ordered)
  }

  const handleDrop = async (sourceId: string, targetId: string) => {
    const activeDragId = sourceId || draggedId()
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

  const openCreateForm = () => {
    resetDraft()
    editorRef?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.setTimeout(() => titleInputRef?.focus(), 250)
  }

  const mergeImportedNotes = async (imported: Partial<Note>[]) => {
    const importedNotes = imported.map((item, index) => coerceImportedNote(item, index, COLOR_IDS))
    const mergedById = new Map<string, Note>()
    for (const note of notes()) mergedById.set(note.id, note)
    for (const note of importedNotes) mergedById.set(note.id, note)
    await applySequentialOrderAndSave(sortNotesLocal([...mergedById.values()]))
    await refreshNotes()
  }

  return (
    <main
      class={`min-h-screen selection:bg-cyan-300 selection:text-slate-900 ${isDark() ? 'bg-black text-zinc-100' : 'bg-white text-slate-900'}`}
    >
      <section class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <NotesHeader
          isDark={isDark()}
          permission={permission()}
          search={search()}
          themeMode={themeMode()}
          mobileColumns={mobileColumns()}
          backupToolsOpen={backupToolsOpen()}
          notes={notes()}
          onRequestNotificationAccess={() => void requestNotificationAccess()}
          onInstallPwa={() => void installPwa()}
          onToggleBackup={() => setBackupToolsOpen((prev) => !prev)}
          onSearch={setSearch}
          onThemeModeChange={changeThemeMode}
          onMobileColumnsChange={setMobileColumns}
          onMergeImported={mergeImportedNotes}
        />

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
          <div ref={editorRef} class="order-2 lg:order-1">
            <Suspense
              fallback={
                <div
                  class={`order-2 rounded-3xl border p-5 shadow-lg ${isDark() ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}
                >
                  Загружаю редактор...
                </div>
              }
            >
              <EditorPanel
                draft={draft()}
                isEditing={isEditing()}
                colors={NOTE_COLORS}
                tagInput={tagInput()}
                checklistInput={checklistInput()}
                isDark={isDark()}
                onTitleRef={(element) => {
                  titleInputRef = element
                }}
                onClose={resetDraft}
                onSetTitle={(value) => setDraft((prev) => ({ ...prev, title: value }))}
                onSetContent={(value) => setDraft((prev) => ({ ...prev, content: value }))}
                onSetColor={(color) => {
                  setDraft((prev) => ({ ...prev, color }))
                  void playColorPreviewSound(color)
                }}
                onSetReminder={(value) =>
                  setDraft((prev) => ({
                    ...prev,
                    reminderAt: toISODate(value),
                    remindedAt: null,
                  }))
                }
                onPresetReminder={applyPresetReminder}
                onSetTagInput={setTagInput}
                onAddTag={addTag}
                onRemoveTag={(tag) =>
                  setDraft((prev) => ({ ...prev, tags: prev.tags.filter((item) => item !== tag) }))
                }
                onSetChecklistInput={setChecklistInput}
                onAddChecklist={addChecklistItem}
                onToggleChecklist={(id) =>
                  setDraft((prev) => ({
                    ...prev,
                    checklist: prev.checklist.map((item) =>
                      item.id === id ? { ...item, done: !item.done } : item,
                    ),
                  }))
                }
                onRemoveChecklist={(id) =>
                  setDraft((prev) => ({
                    ...prev,
                    checklist: prev.checklist.filter((item) => item.id !== id),
                  }))
                }
                onSave={() => void saveDraft()}
                onReset={resetDraft}
                toInputDate={toInputDate}
              />
            </Suspense>
          </div>

          <section class="order-1 lg:order-2">
            <Show when={filteredNotes().length > 0} fallback={<EmptyState isDark={isDark()} />}>
              <div
                class="grid gap-4"
                style={{ 'grid-template-columns': `repeat(${columnCount()}, minmax(0, 1fr))` }}
              >
                <For each={masonryColumns()}>
                  {(column) => (
                    <div class="space-y-4">
                      <For each={column}>
                        {(note) => (
                          <NoteCard
                            note={note}
                            colorClasses={
                              NOTE_COLORS.find((item) => item.id === note.color)?.classes ??
                              NOTE_COLORS[0].classes
                            }
                            coverGradient={noteCovers().get(note.id) ?? COVER_GRADIENTS[0]}
                            isDark={isDark()}
                            isDragOver={dragOverId() === note.id}
                            onDragStart={(event) => {
                              setDraggedId(note.id)
                              event.dataTransfer?.setData('text/plain', note.id)
                              if (event.dataTransfer) {
                                event.dataTransfer.effectAllowed = 'move'
                                event.dataTransfer.dropEffect = 'move'
                              }
                            }}
                            onDragOver={(event) => {
                              event.preventDefault()
                              if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
                            }}
                            onDragEnter={() => setDragOverId(note.id)}
                            onDragEnd={() => {
                              setDraggedId(null)
                              setDragOverId(null)
                            }}
                            onDrop={(event) => {
                              event.preventDefault()
                              const sourceId = event.dataTransfer?.getData('text/plain') ?? draggedId() ?? ''
                              void handleDrop(sourceId, note.id)
                            }}
                            onTogglePin={() => void togglePin(note)}
                            onToggleChecklist={(itemId) => void toggleChecklistOnCard(note, itemId)}
                            onMoveUp={() => void moveNoteByStep(note.id, -1)}
                            onMoveDown={() => void moveNoteByStep(note.id, 1)}
                            onEdit={() => editNote(note)}
                            onDelete={() => void deleteNote(note.id)}
                          />
                        )}
                      </For>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </section>
        </div>
      </section>

      <button
        class="fixed bottom-5 right-5 z-30 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-slate-800 lg:hidden"
        onClick={openCreateForm}
        aria-label="Создать новую заметку"
      >
        <IconPlus class="h-6 w-6 text-white" />
      </button>

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

export default App
