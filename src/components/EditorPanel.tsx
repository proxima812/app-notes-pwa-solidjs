import { For, Show } from 'solid-js'
import type { Note, NoteColor } from '../lib/db'
import { IconCheckSquare, IconClock, IconPlus, IconTag, IconX } from './icons'

type ColorItem = { id: NoteColor; label: string; classes: string }

type EditorPanelProps = {
  draft: Note
  isEditing: boolean
  colors: ColorItem[]
  tagInput: string
  checklistInput: string
  isDark: boolean
  onTitleRef?: (element: HTMLInputElement) => void
  onClose: () => void
  onSetTitle: (value: string) => void
  onSetContent: (value: string) => void
  onSetColor: (color: NoteColor) => void
  onSetReminder: (value: string) => void
  onPresetReminder: (time: string) => void
  onSetTagInput: (value: string) => void
  onAddTag: () => void
  onRemoveTag: (tag: string) => void
  onSetChecklistInput: (value: string) => void
  onAddChecklist: () => void
  onToggleChecklist: (id: string) => void
  onRemoveChecklist: (id: string) => void
  onSave: () => void
  onReset: () => void
  toInputDate: (iso: string | null) => string
}

export default function EditorPanel(props: EditorPanelProps) {
  const presetTimes = ['11:00', '12:00', '14:00', '15:00', '17:30', '19:00', '22:00']

  return (
    <aside
      class={`rounded-3xl border p-5 pb-24 shadow-lg lg:pb-5 ${
        props.isDark ? 'border-zinc-800 bg-zinc-950' : 'border-slate-200 bg-white'
      }`}
    >
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-bold">{props.isEditing ? 'Редактирование' : 'Новая заметка'}</h2>
        <Show when={props.isEditing}>
          <button class={`rounded-lg p-2 ${props.isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-100/20'}`} onClick={props.onClose} aria-label="Close editor">
            <IconX />
          </button>
        </Show>
      </div>

      <div class="space-y-3">
        <input
          ref={props.onTitleRef}
          value={props.draft.title}
          onInput={(event) => props.onSetTitle(event.currentTarget.value)}
          class={`w-full rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-400 focus:ring ${
            props.isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-100' : 'border-slate-300 bg-white'
          }`}
          placeholder="Заголовок"
        />

        <textarea
          value={props.draft.content}
          onInput={(event) => props.onSetContent(event.currentTarget.value)}
          rows={5}
          class={`w-full resize-y rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-400 focus:ring ${
            props.isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-100' : 'border-slate-300 bg-white'
          }`}
          placeholder="Текст заметки"
        />

        <div class={`rounded-xl border px-3 py-2 ${props.isDark ? 'border-zinc-700 bg-zinc-900' : 'border-slate-300 bg-white'}`}>
          <label class="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <IconCheckSquare />
            Checklist
          </label>
          <div class="flex gap-2">
            <input
              value={props.checklistInput}
              onInput={(event) => props.onSetChecklistInput(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  props.onAddChecklist()
                }
              }}
              class="w-full bg-transparent text-sm outline-none"
              placeholder="Добавить пункт"
            />
            <button class={`rounded-lg px-2 py-1 text-xs font-semibold ${props.isDark ? 'bg-zinc-800 text-zinc-100' : 'bg-slate-200 text-slate-800'}`} onClick={props.onAddChecklist}>
              +
            </button>
          </div>
          <div class="mt-2 space-y-2">
            <For each={props.draft.checklist}>
              {(item) => (
                <div class={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${props.isDark ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                  <input type="checkbox" checked={item.done} onChange={() => props.onToggleChecklist(item.id)} />
                  <span class={`text-sm ${item.done ? 'text-slate-500 line-through' : ''}`}>{item.text}</span>
                  <button class="ml-auto text-xs text-rose-600" onClick={() => props.onRemoveChecklist(item.id)}>
                    удалить
                  </button>
                </div>
              )}
            </For>
          </div>
        </div>

        <div class="grid grid-cols-4 gap-2">
          <For each={props.colors}>
            {(color) => (
              <button
                onClick={() => props.onSetColor(color.id)}
                title={color.label}
                class={`h-8 rounded-lg border bg-gradient-to-br ${color.classes} ${props.draft.color === color.id ? 'ring-2 ring-slate-800' : ''}`}
              />
            )}
          </For>
        </div>

        <div class={`rounded-xl border px-3 py-2 ${props.isDark ? 'border-zinc-700 bg-zinc-900' : 'border-slate-300 bg-white'}`}>
          <label class="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <IconClock />
            Напоминание
          </label>
          <input
            type="datetime-local"
            value={props.toInputDate(props.draft.reminderAt)}
            onInput={(event) => props.onSetReminder(event.currentTarget.value)}
            class="w-full bg-transparent text-sm outline-none"
          />
          <div class="mt-2 flex flex-wrap gap-2">
            <For each={presetTimes}>
              {(time) => (
                <button
                  class={`rounded-lg border px-2 py-1 text-xs font-semibold ${props.isDark ? 'border-zinc-600 bg-zinc-800 text-zinc-100 hover:bg-zinc-700' : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                  onClick={() => props.onPresetReminder(time)}
                >
                  {time}
                </button>
              )}
            </For>
          </div>
        </div>

        <div class={`rounded-xl border px-3 py-2 ${props.isDark ? 'border-zinc-700 bg-zinc-900' : 'border-slate-300 bg-white'}`}>
          <label class="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <IconTag />
            Теги
          </label>
          <div class="flex gap-2">
            <input
              value={props.tagInput}
              onInput={(event) => props.onSetTagInput(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  props.onAddTag()
                }
              }}
              class="w-full bg-transparent text-sm outline-none"
              placeholder="Например: работа"
            />
            <button class={`rounded-lg px-2 py-1 text-xs font-semibold ${props.isDark ? 'bg-zinc-800 text-zinc-100' : 'bg-slate-200 text-slate-800'}`} onClick={props.onAddTag}>
              +
            </button>
          </div>
          <div class="mt-2 flex flex-wrap gap-2">
            <For each={props.draft.tags}>
              {(tag) => (
                <button
                  class={`rounded-full px-2 py-1 text-xs font-medium ${props.isDark ? 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}
                  onClick={() => props.onRemoveTag(tag)}
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
            onClick={props.onSave}
          >
            <IconPlus />
            {props.isEditing ? 'Обновить' : 'Сохранить'}
          </button>
          <button
            class={`rounded-xl border px-3 py-2 text-sm font-semibold ${
              props.isDark ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-900' : 'border-slate-300 text-slate-600 hover:bg-slate-100'
            }`}
            onClick={props.onReset}
          >
            Сброс
          </button>
        </div>
      </div>
    </aside>
  )
}
