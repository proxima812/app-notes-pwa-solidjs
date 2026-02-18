import { createSignal } from 'solid-js'
import { toast } from 'solid-toast'
import { exportEncryptedBackup, exportPlainBackup, importBackup } from '../lib/backup'
import type { Note } from '../lib/db'
import { IconDownload, IconUpload } from './icons'

type BackupPanelProps = {
  notes: Note[]
  onMergeImported: (notes: Partial<Note>[]) => Promise<void>
  isDark?: boolean
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

export default function BackupPanel(props: BackupPanelProps) {
  const [busy, setBusy] = createSignal(false)
  let importInputRef: HTMLInputElement | undefined

  const exportPlain = () => {
    const json = exportPlainBackup(props.notes)
    const stamp = new Date().toISOString().slice(0, 19).replaceAll(':', '-')
    downloadTextFile(`keepxima-backup-${stamp}.json`, json)
    toast.success('JSON backup сохранен')
  }

  const exportEncrypted = async () => {
    const password = window.prompt('Пароль для шифрования (минимум 8 символов):')?.trim()
    if (!password) return
    if (password.length < 8) {
      toast.error('Пароль слишком короткий')
      return
    }

    setBusy(true)
    try {
      const encrypted = await exportEncryptedBackup(props.notes, password)
      const stamp = new Date().toISOString().slice(0, 19).replaceAll(':', '-')
      downloadTextFile(`keepxima-backup-encrypted-${stamp}.json`, encrypted)
      toast.success('Зашифрованный backup сохранен')
    } finally {
      setBusy(false)
    }
  }

  const startImport = () => {
    importInputRef?.click()
  }

  const handleImportFile = async (event: Event) => {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    setBusy(true)
    try {
      const text = await file.text()
      let importedNotes: Note[] = []

      try {
        importedNotes = await importBackup(text)
      } catch (error) {
        if (error instanceof Error && error.message === 'PASSWORD_REQUIRED') {
          const password = window.prompt('Этот backup зашифрован. Введи пароль:')?.trim()
          if (!password) {
            toast.error('Импорт отменен: пароль не указан')
            return
          }
          importedNotes = await importBackup(text, password)
        } else {
          throw error
        }
      }

      await props.onMergeImported(importedNotes)
      toast.success(`Импортировано заметок: ${importedNotes.length}`)
    } catch {
      toast.error('Ошибка импорта: проверь формат файла или пароль')
    } finally {
      input.value = ''
      setBusy(false)
    }
  }

  return (
    <div
      class={`mt-3 flex flex-wrap items-center gap-2 rounded-xl border p-3 ${
        props.isDark ? 'border-zinc-700 bg-zinc-900' : 'border-slate-200 bg-slate-50'
      }`}
    >
      <button
        class={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${
          props.isDark
            ? 'border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
        }`}
        onClick={exportPlain}
        disabled={busy()}
      >
        <IconDownload />
        Экспорт JSON
      </button>
      <button
        class={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${
          props.isDark
            ? 'border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
        }`}
        onClick={() => void exportEncrypted()}
        disabled={busy()}
      >
        <IconDownload />
        Шифр backup
      </button>
      <button
        class={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${
          props.isDark
            ? 'border-zinc-700 bg-zinc-800 text-zinc-100 hover:bg-zinc-700'
            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
        }`}
        onClick={startImport}
        disabled={busy()}
      >
        <IconUpload />
        Импорт
      </button>
      <input
        ref={importInputRef}
        type="file"
        accept="application/json"
        class="hidden"
        onChange={(event) => void handleImportFile(event)}
      />
    </div>
  )
}
