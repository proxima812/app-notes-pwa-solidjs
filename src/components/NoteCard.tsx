import { For, Show } from 'solid-js'
import type { Note } from '../lib/db'
import { formatDate } from '../lib/date-utils'
import {
  IconChevronDown,
  IconChevronUp,
  IconEdit,
  IconMove,
  IconStar,
  IconTrash,
} from './icons'

type NoteCardProps = {
  note: Note
  colorClasses: string
  coverGradient: string
  isDark: boolean
  isDragOver: boolean
  onDragStart: (event: DragEvent) => void
  onDragOver: (event: DragEvent) => void
  onDragEnter: () => void
  onDragEnd: () => void
  onDrop: (event: DragEvent) => void
  onTogglePin: () => void
  onToggleChecklist: (itemId: string) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function NoteCard(props: NoteCardProps) {
  const completedChecklist = () => props.note.checklist.filter((item) => item.done).length

  return (
    <article
      draggable
      onDragStart={props.onDragStart}
      onDragOver={props.onDragOver}
      onDragEnter={props.onDragEnter}
      onDragEnd={props.onDragEnd}
      onDrop={props.onDrop}
      class={`rounded-2xl border shadow-md transition ${
        props.isDark
          ? 'border-zinc-800 bg-zinc-950 hover:bg-zinc-900/80'
          : 'bg-gradient-to-br hover:-translate-y-1'
      } ${props.colorClasses} ${props.isDragOver ? 'ring-2 ring-cyan-500' : ''}`}
    >
      <div class="h-[7.5rem] w-full rounded-t-2xl" style={{ background: props.coverGradient }} />
      <div class="p-3 sm:p-4">
        <div class="mb-2 flex items-start justify-between gap-2">
          <div class="flex min-w-0 items-start gap-2">
            <span class="mt-0.5 cursor-grab text-slate-500" title="Drag to reorder">
              <IconMove />
            </span>
            <h3 class="line-clamp-2 text-base font-bold">{props.note.title || 'Без названия'}</h3>
          </div>
          <button
            onClick={props.onTogglePin}
            class={`shrink-0 rounded-md border p-1.5 ${props.note.isPinned ? 'border-slate-900 bg-slate-900 text-white' : props.isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800' : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
            title="Pin"
          >
            <IconStar />
          </button>
        </div>

        <Show when={props.note.content}>
          <p class={`mb-3 whitespace-pre-wrap text-sm ${props.isDark ? 'text-zinc-200' : 'text-slate-700'}`}>
            {props.note.content}
          </p>
        </Show>

        <Show when={props.note.checklist.length > 0}>
          <div class={`mb-3 rounded-xl p-2 ${props.isDark ? 'bg-zinc-900' : 'bg-white/70'}`}>
            <p class="mb-2 text-xs font-semibold text-slate-500">
              Checklist: {completedChecklist()}/{props.note.checklist.length}
            </p>
            <div class="space-y-1.5">
              <For each={props.note.checklist.slice(0, 5)}>
                {(item) => (
                  <label class="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => props.onToggleChecklist(item.id)}
                    />
                    <span
                      class={
                        item.done
                          ? 'line-through text-slate-500'
                          : props.isDark
                            ? 'text-zinc-200'
                            : 'text-slate-700'
                      }
                    >
                      {item.text}
                    </span>
                  </label>
                )}
              </For>
            </div>
          </div>
        </Show>

        <div class="mb-3 flex flex-wrap gap-1.5">
          <For each={props.note.tags}>
            {(tag) => (
              <span
                class={`rounded-full px-2 py-1 text-xs font-medium ${props.isDark ? 'bg-zinc-900 text-zinc-200' : 'bg-white/80'}`}
              >
                #{tag}
              </span>
            )}
          </For>
        </div>

        <p class="mb-3 text-xs font-medium text-slate-500">{formatDate(props.note.reminderAt)}</p>

        <div class="flex flex-wrap items-end justify-between gap-2">
          <p class="text-xs text-slate-500">
            Обновлено{' '}
            {new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short' }).format(
              new Date(props.note.updatedAt),
            )}
          </p>
          <div class="flex flex-wrap justify-end gap-2">
            <button
              class={`rounded-lg border p-2 ${props.isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800' : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
              onClick={props.onMoveUp}
              title="Move up"
            >
              <IconChevronUp class="h-4 w-4" />
            </button>
            <button
              class={`rounded-lg border p-2 ${props.isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800' : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
              onClick={props.onMoveDown}
              title="Move down"
            >
              <IconChevronDown class="h-4 w-4" />
            </button>
            <button
              class={`rounded-lg border p-2 ${props.isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800' : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'}`}
              onClick={props.onEdit}
            >
              <IconEdit class="h-4 w-4" />
            </button>
            <button
              class={`rounded-lg border p-2 ${props.isDark ? 'border-zinc-700 bg-zinc-900 text-rose-300 hover:bg-zinc-800' : 'border-slate-300 bg-slate-100 text-rose-600 hover:bg-slate-200'}`}
              onClick={props.onDelete}
            >
              <IconTrash class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
