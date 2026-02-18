# KeepXima

`KeepXima` — open-source заметочник с акцентом на скорость, офлайн-режим и мобильный UX.

## Highlights

- `Offline-first`: хранение в `IndexedDB`
- `PWA`: установка на телефон
- `Masonry`-просмотр заметок + мобильный режим `1/2` колонок
- Напоминания с пресетами времени
- Звуки по цветам заметок
- `Checklist`, теги, поиск
- Экспорт/импорт (включая шифрованный backup)
- Темы: `Auto / Light / Dark`

## Tech Stack

- `SolidJS` + `TypeScript`
- `Tailwind CSS`
- `Vite` + `vite-plugin-pwa`
- `idb`
- `Bun`

## Local Development

```bash
bun install
bun run dev
```

## Build

```bash
bun run build
```

## Project Structure

```text
src/
  components/   # UI-блоки
  lib/          # доменная логика и утилиты
```

Для модулей есть локальные русскоязычные описания:
- `src/lib/README.md`
- `src/components/README.md`

## Open Source

Проект открыт для форков и pull request:

1. Fork репозитория
2. Создать ветку под изменение
3. Проверить сборку `bun run build`
4. Открыть PR

Подробные правила:
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `.github/pull_request_template.md`
- `.github/ISSUE_TEMPLATE/*`

Лицензия: `MIT` (`LICENSE`)

## Roadmap

### v1.1
- [ ] Улучшенный touch drag-and-drop
- [ ] Визуальный редактор сопоставления «цвет -> звук»
- [ ] Умные фильтры и сохраненные представления

### v1.2
- [ ] Web Push backend (Cloudflare Worker + VAPID)
- [ ] Синхронизация между устройствами (опционально)
- [ ] Повторяющиеся напоминания

### v1.3
- [ ] Коллаборативные заметки
- [ ] Публичный plugin API
- [ ] Расширенный аналитический режим продуктивности

## How to help project grow

- Открывать маленькие, качественные PR
- Добавлять reproducible bug reports
- Улучшать документацию и onboarding
- Делиться проектом и ставить звезду
