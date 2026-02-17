## KeepX Notes

SolidJS + IndexedDB notes app with reminders, checklist, drag-and-drop and PWA mode.

## Local Run (Bun)

```bash
bun install
bun run dev
```

## Production Build

```bash
bun run build
```

Build output: `dist`

## Deploy To Cloudflare Pages

### Option A: Cloudflare Dashboard (recommended)

1. Create a new Pages project.
2. Build command: `bun run build`
3. Build output directory: `dist`
4. Set Node.js version to `22` in Pages settings.
5. Deploy.

### Option B: Wrangler CLI

```bash
bun run build
bunx wrangler pages deploy dist --project-name keepx-notes
```

## PWA Install On Phone

1. Open deployed HTTPS URL on phone.
2. In Chrome/Edge: `Add to Home screen`.
3. In Safari iOS: Share -> `Add to Home Screen`.

## Notes About Notifications

- Current reminders are local notifications (client-side scheduler).
- True web push requires backend + VAPID + Push API subscription.
