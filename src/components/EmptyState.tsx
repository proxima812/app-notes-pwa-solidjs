import { IconClock } from './icons'

type EmptyStateProps = {
  isDark: boolean
}

export default function EmptyState(props: EmptyStateProps) {
  return (
    <div
      class={`rounded-3xl border border-dashed px-6 py-14 text-center shadow-inner ${props.isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-white/70'}`}
    >
      <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
        <IconClock />
      </div>
      <h3 class="text-xl font-bold">Пока пусто</h3>
      <p class={`mt-2 text-sm ${props.isDark ? 'text-slate-300' : 'text-slate-600'}`}>
        Добавь первую заметку, checklist и напоминание. Приложение работает офлайн и ставится на
        телефон.
      </p>
    </div>
  )
}
