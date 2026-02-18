# Contributing to KeepXima

Спасибо за вклад.

## Quick Start

1. Fork repository.
2. Create a feature branch.
3. Install and run:

```bash
bun install
bun run dev
```

4. Verify build before opening PR:

```bash
bun run build
```

## Pull Request Rules

- Keep PRs focused and small.
- Describe motivation, approach, and tradeoffs.
- Include screenshots/video for UI changes.
- Mention performance impact if bundle/runtime changed.

## Code Standards

- Avoid unnecessary dependencies.
- Keep modules cohesive and reusable.
- Prefer explicit typing and simple APIs.
- Preserve mobile/desktop behavior.

## DoD

- Build passes (`bun run build`).
- No unused imports/dead code in modified scope.
- No unnecessary hydration/client logic.
- Mobile layout validated (>=360px).
