# KeepXima

<div align="center">

![Version](https://img.shields.io/badge/version-1.5-111111?style=for-the-badge)
![License: MIT](https://img.shields.io/badge/license-MIT-0f172a?style=for-the-badge)
![Bun](https://img.shields.io/badge/runtime-Bun-fbf0df?style=for-the-badge&logo=bun&logoColor=111111)
![SolidJS](https://img.shields.io/badge/frontend-SolidJS-2c4f7c?style=for-the-badge&logo=solid&logoColor=ffffff)
![PWA](https://img.shields.io/badge/PWA-ready-16a34a?style=for-the-badge)
![PRs](https://img.shields.io/badge/PRs-welcome-0ea5e9?style=for-the-badge)

</div>

---

## 📚 Contents

- [🇬🇧 English](#-english)
- [🇩🇪 Deutsch](#-deutsch)
- [🇪🇸 Español](#-español)
- [🇷🇺 Русский](#-русский)

> Status: `v1.5` stable

## 🇬🇧 English

### Project Overview

**KeepXima** is an open-source, offline-first notes app focused on speed, visual clarity, and mobile usability.
Data is stored locally in `IndexedDB`, and the app can be installed as a PWA.

### Current Version

- `v1.5` — modular architecture, masonry notes view, color-based sounds, reminders, backup tools.

### Version Counters

- `v1.5` current stable release
- `v1.6` planned improvements and fixes

### Project Structure

```text
src/
  components/
    BackupPanel.tsx
    EditorPanel.tsx
    EmptyState.tsx
    icons.tsx
    NoteCard.tsx
    NotesHeader.tsx
  lib/
    backup.ts
    date-utils.ts
    db.ts
    note-config.ts
    note-utils.ts
    reminders.ts
    theme-utils.ts
  App.tsx
  index.tsx
```

### Feature List

- Offline storage via `IndexedDB`
- PWA install support
- Masonry note layout with mobile `1/2` columns toggle
- Pin/reorder notes
- Checklist inside notes
- Tags + full-text search
- Reminder presets (`11:00`, `12:00`, `14:00`, `15:00`, `17:30`, `19:00`, `22:00`)
- Color-based sounds
- Light / Dark / Auto theme modes
- JSON + encrypted backup import/export

### Why This Is Convenient

- Works fast even with weak network because core flow is local.
- Notes stay available offline.
- Mobile layout is optimized for dense note browsing.
- Quick reminder presets reduce friction.
- Backup flow protects data portability.

### What Can Be Improved

- Better icon consistency in all edge states
- Extended color palette
- Optional cloud sync backend
- Native touch drag-and-drop improvements

### Notifications and Push

- Current reminders are local (client scheduler + Notification API).
- Full background web push requires backend (`Worker + VAPID + Push API subscriptions`).

### Privacy and Security

- Notes are local by default (`IndexedDB`).
- Encrypted backup export is supported.
- No mandatory cloud dependency for basic usage.

### Deploy to Cloudflare Pages

```bash
bun install
bun run build
bunx wrangler pages deploy dist --project-name keepxima
```

Dashboard settings:
- Build command: `bun run build`
- Output directory: `dist`
- Node version: `22.12.0`

## 🗺 Roadmap

- [x] SolidJS frontend
- [x] Bun runtime support
- [x] IndexedDB offline storage
- [x] PWA install support
- [ ] Icon rendering consistency
- [ ] More note colors
- [ ] Authentication system
- [ ] Public API

---

## 🇩🇪 Deutsch

### Projektüberblick

**KeepXima** ist eine Open-Source-Notiz-App mit Offline-First-Ansatz, hoher Geschwindigkeit und guter mobiler Bedienbarkeit.
Die Daten werden lokal in `IndexedDB` gespeichert, und die App kann als PWA installiert werden.

### Aktuelle Version

- `v1.5` — modulare Architektur, Masonry-Ansicht, farbabhängige Sounds, Erinnerungen, Backup-Tools.

### Versionszähler

- `v1.5` aktuelle stabile Version
- `v1.6` geplante Verbesserungen und Fixes

### Projektstruktur

```text
src/
  components/
    BackupPanel.tsx
    EditorPanel.tsx
    EmptyState.tsx
    icons.tsx
    NoteCard.tsx
    NotesHeader.tsx
  lib/
    backup.ts
    date-utils.ts
    db.ts
    note-config.ts
    note-utils.ts
    reminders.ts
    theme-utils.ts
  App.tsx
  index.tsx
```

### Funktionsumfang

- Offline-Speicherung mit `IndexedDB`
- PWA-Installation
- Masonry-Ansicht mit mobilem Umschalter `1/2` Spalten
- Notizen anheften und sortieren
- Checklisten in Notizen
- Tags + Volltextsuche
- Erinnerungs-Presets (`11:00`, `12:00`, `14:00`, `15:00`, `17:30`, `19:00`, `22:00`)
- Farbbasierte Sounds
- Light / Dark / Auto Theme
- JSON- und verschlüsselter Backup-Import/Export

### Warum das praktisch ist

- Sehr schnell, da Kernfunktionen lokal laufen.
- Voll nutzbar ohne Internet.
- Mobile Darstellung ist auf viele Karten optimiert.
- Zeit-Presets machen Erinnerungen schneller.
- Backups erleichtern Datensicherheit und Migration.

### Verbesserungsmöglichkeiten

- Konsistentere Icons in Sonderfällen
- Größere Farbpalette
- Optionales Cloud-Sync-Backend
- Besseres Touch-Drag-and-Drop

### Benachrichtigungen und Push

- Aktuell: lokale Erinnerungen (Client-Scheduler + Notification API).
- Für echtes Background-Push nötig: `Worker + VAPID + Push-Subscriptions`.

### Datenschutz und Sicherheit

- Notizen bleiben standardmäßig lokal (`IndexedDB`).
- Verschlüsselte Backups werden unterstützt.
- Keine Pflicht zu Cloud-Diensten für Basisnutzung.

### Deploy auf Cloudflare Pages

```bash
bun install
bun run build
bunx wrangler pages deploy dist --project-name keepxima
```

Dashboard:
- Build command: `bun run build`
- Output directory: `dist`
- Node version: `22.12.0`

## 🗺 Roadmap

- [x] SolidJS-Frontend
- [x] Bun-Runtime-Unterstützung
- [x] Offline-Speicherung mit IndexedDB
- [x] PWA-Installationssupport
- [ ] Icon-Rendering stabilisieren
- [ ] Mehr Farben für Notizen
- [ ] Authentifizierungssystem
- [ ] Öffentliche API

---

## 🇪🇸 Español

### Resumen del Proyecto

**KeepXima** es una app de notas open-source con enfoque offline-first, rápida y optimizada para móvil.
Los datos se guardan localmente en `IndexedDB`, y la app se puede instalar como PWA.

### Versión Actual

- `v1.5` — arquitectura modular, vista masonry, sonidos por color, recordatorios y backups.

### Contadores de Versión

- `v1.5` versión estable actual
- `v1.6` mejoras y correcciones planificadas

### Estructura del Proyecto

```text
src/
  components/
    BackupPanel.tsx
    EditorPanel.tsx
    EmptyState.tsx
    icons.tsx
    NoteCard.tsx
    NotesHeader.tsx
  lib/
    backup.ts
    date-utils.ts
    db.ts
    note-config.ts
    note-utils.ts
    reminders.ts
    theme-utils.ts
  App.tsx
  index.tsx
```

### Lista de Funcionalidades

- Almacenamiento offline con `IndexedDB`
- Instalación como PWA
- Vista masonry con selector móvil `1/2` columnas
- Fijar y reordenar notas
- Checklists en notas
- Etiquetas + búsqueda de texto
- Presets de recordatorio (`11:00`, `12:00`, `14:00`, `15:00`, `17:30`, `19:00`, `22:00`)
- Sonidos por color
- Temas `Light / Dark / Auto`
- Importación/exportación JSON y cifrada

### Por Qué Es Cómodo

- Flujo muy rápido porque todo corre localmente.
- Funciona sin internet.
- Vista móvil optimizada para muchas notas.
- Presets de hora reducen pasos.
- Backups facilitan portabilidad y seguridad.

### Qué Se Puede Mejorar

- Consistencia de iconos en todos los estados
- Más colores para notas
- Backend opcional para sincronización
- Mejor soporte de drag-and-drop táctil

### Notificaciones y Push

- Ahora: recordatorios locales (scheduler en cliente + Notification API).
- Push real en background requiere `Worker + VAPID + suscripciones Push API`.

### Privacidad y Seguridad

- Las notas se guardan localmente (`IndexedDB`).
- Backups cifrados disponibles.
- No depende de cloud para uso básico.

### Deploy en Cloudflare Pages

```bash
bun install
bun run build
bunx wrangler pages deploy dist --project-name keepxima
```

En Dashboard:
- Build command: `bun run build`
- Output directory: `dist`
- Node version: `22.12.0`

## 🗺 Roadmap

- [x] Frontend con SolidJS
- [x] Soporte de runtime Bun
- [x] Almacenamiento offline con IndexedDB
- [x] Soporte de instalación PWA
- [ ] Arreglar consistencia de iconos
- [ ] Agregar más colores de notas
- [ ] Sistema de autenticación
- [ ] API pública

---

## 🇷🇺 Русский

### Описание проекта

**KeepXima** — open-source заметочник с офлайн-first подходом, быстрым интерфейсом и удобным мобильным UX.
Данные хранятся локально в `IndexedDB`, приложение устанавливается как PWA.

### Текущая версия

- `v1.5` — модульная архитектура, masonry-сетка, звуки по цветам, напоминания, backup-инструменты.

### Счётчики версий

- `v1.5` текущая стабильная версия
- `v1.6` запланированные улучшения и фиксы

### Структура проекта

```text
src/
  components/
    BackupPanel.tsx
    EditorPanel.tsx
    EmptyState.tsx
    icons.tsx
    NoteCard.tsx
    NotesHeader.tsx
  lib/
    backup.ts
    date-utils.ts
    db.ts
    note-config.ts
    note-utils.ts
    reminders.ts
    theme-utils.ts
  App.tsx
  index.tsx
```

### Список фич

- Локальное хранение в `IndexedDB`
- Установка как PWA
- Masonry-сетка заметок + мобильный переключатель `1/2` колонок
- Pin и сортировка заметок
- Checklist внутри заметок
- Теги и полнотекстовый поиск
- Пресеты напоминаний (`11:00`, `12:00`, `14:00`, `15:00`, `17:30`, `19:00`, `22:00`)
- Звуки по цветам
- Темы `Light / Dark / Auto`
- Импорт/экспорт JSON и шифрованных backup

### Почему это удобно

- Быстро работает, потому что основной флоу локальный.
- Полезно без интернета.
- Мобильный интерфейс оптимизирован под большое количество заметок.
- Пресеты времени ускоряют постановку напоминаний.
- Backup упрощает перенос и защиту данных.

### Что можно улучшить

- Довести консистентность иконок во всех состояниях
- Добавить больше цветов заметок
- Добавить опциональную облачную синхронизацию
- Улучшить touch drag-and-drop

### Уведомления и push

- Сейчас: локальные напоминания (клиентский scheduler + Notification API).
- Для настоящего background push нужен backend: `Worker + VAPID + Push API subscriptions`.

### Приватность и безопасность

- По умолчанию данные остаются локально (`IndexedDB`).
- Есть шифрованный экспорт backup.
- Базовый сценарий не требует обязательного облака.

### Как сделать деплой на Cloudflare Pages

```bash
bun install
bun run build
bunx wrangler pages deploy dist --project-name keepxima
```

В Dashboard:
- Build command: `bun run build`
- Output directory: `dist`
- Node version: `22.12.0`

## 🗺 Roadmap

- [x] Frontend на SolidJS
- [x] Поддержка Bun runtime
- [x] Offline-хранение в IndexedDB
- [x] Поддержка установки PWA
- [ ] Пофиксить консистентность иконок
- [ ] Добавить больше цветов заметок
- [ ] Система аутентификации
- [ ] Публичный API
