import { Show, Suspense } from 'solid-js'
import type { Note } from '../lib/db'
import type { ThemeMode } from '../lib/note-config'
import { IconBell, IconDownload, IconSearch, IconSmartphone } from './icons'
import BackupPanel from './BackupPanel'

type NotesHeaderProps = {
  isDark: boolean
  permission: NotificationPermission | 'default'
  search: string
  themeMode: ThemeMode
  mobileColumns: 1 | 2
  backupToolsOpen: boolean
  notes: Note[]
  onRequestNotificationAccess: () => void
  onInstallPwa: () => void
  onToggleBackup: () => void
  onSearch: (value: string) => void
  onThemeModeChange: (mode: ThemeMode) => void
  onMobileColumnsChange: (value: 1 | 2) => void
  onMergeImported: (notes: Partial<Note>[]) => Promise<void>
}

export default function NotesHeader(props: NotesHeaderProps) {
  return (
    <header
      class={`mb-6 rounded-3xl border p-5 shadow-lg md:p-8 ${props.isDark ? 'border-zinc-800 bg-zinc-950 shadow-black/50' : 'border-slate-200 bg-white shadow-slate-200/50'}`}
    >
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">KeepXima</p>
          <h1 class="text-3xl font-black tracking-tight sm:text-4xl">Notes + Reminders</h1>
          <p class={`mt-1 text-sm ${props.isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
            Авто-тема по времени суток, masonry обзор и быстрые заметки.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button
            class={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition active:scale-95 ${props.isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
            onClick={props.onRequestNotificationAccess}
          >
            <IconBell />
            {props.permission === 'granted' ? 'Уведомления включены' : 'Включить уведомления'}
          </button>
          <button
            class="inline-flex items-center gap-2 rounded-xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
            onClick={props.onInstallPwa}
          >
            <IconSmartphone />
            Установить как PWA
          </button>
          <button
            class={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition active:scale-95 ${props.isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
            onClick={props.onToggleBackup}
          >
            <IconDownload />
            Backup
          </button>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap items-center gap-2">
        <button
          class={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${props.themeMode === 'auto' ? 'border-slate-900 bg-slate-900 text-white' : props.isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-100' : 'border-slate-300 bg-white text-slate-700'}`}
          onClick={() => props.onThemeModeChange('auto')}
        >
          Auto
        </button>
        <button
          class={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${props.themeMode === 'light' ? 'border-slate-900 bg-slate-900 text-white' : props.isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-100' : 'border-slate-300 bg-white text-slate-700'}`}
          onClick={() => props.onThemeModeChange('light')}
        >
          Light
        </button>
        <button
          class={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${props.themeMode === 'dark' ? 'border-slate-900 bg-slate-900 text-white' : props.isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-100' : 'border-slate-300 bg-white text-slate-700'}`}
          onClick={() => props.onThemeModeChange('dark')}
        >
          Dark
        </button>
      </div>

      <Show when={props.backupToolsOpen}>
        <Suspense
          fallback={
            <p
              class={`mt-3 rounded-xl border px-3 py-2 text-sm ${props.isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-300' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
            >
              Загружаю backup-инструменты...
            </p>
          }
        >
          <BackupPanel notes={props.notes} onMergeImported={props.onMergeImported} isDark={props.isDark} />
        </Suspense>
      </Show>

      <div
        class={`mt-5 flex items-center gap-2 rounded-xl border px-3 py-2 ${props.isDark ? 'border-zinc-800 bg-zinc-900' : 'border-slate-200 bg-white'}`}
      >
        <IconSearch class="h-4 w-4 text-slate-500" />
        <input
          value={props.search}
          onInput={(event) => props.onSearch(event.currentTarget.value)}
          class="w-full bg-transparent text-sm outline-none"
          placeholder="Поиск по заголовку, тексту, тегам и checklist"
        />
      </div>

      <div class="mt-3 flex items-center gap-2 md:hidden">
        <button
          class={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${props.mobileColumns === 1 ? 'border-slate-900 bg-slate-900 text-white' : props.isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-100' : 'border-slate-300 bg-white text-slate-700'}`}
          onClick={() => props.onMobileColumnsChange(1)}
        >
          1 колонка
        </button>
        <button
          class={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${props.mobileColumns === 2 ? 'border-slate-900 bg-slate-900 text-white' : props.isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-100' : 'border-slate-300 bg-white text-slate-700'}`}
          onClick={() => props.onMobileColumnsChange(2)}
        >
          2 колонки
        </button>
      </div>
    </header>
  )
}
