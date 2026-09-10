# Encore

[中文说明](README.md)

Encore is a theatre-inspired focus timer. Choose or create a performance, print an admission ticket, focus from your seat, and keep the ticket stub when the performance ends.

## Versions

| Branch | Purpose |
| --- | --- |
| `main` | Web edition, designed for desktop and mobile browsers while preserving the original show catalogue. |
| `codex/xhs-minitool` | Xiaohongshu Mini Tool edition, packaged as a self-contained offline static app for the Mini Tool container. |

The two editions are maintained separately and do not automatically affect one another.

## Web edition features

- Browse preset shows or create and save a custom show
- Set a focus duration from 1–240 minutes, venue, intermission and seat
- Print and eject an admission ticket through an animated ticket machine
- Focus timer with pause, early departure and away-from-theatre timeout handling
- Save a performance during intermission, then resume Act II from a countdown card on the home screen
- When leaving during intermission or returning after it ends, the ticket records only the actual Act I focus time
- Browse all ticket records, sign completed tickets, and save them as images
- Chinese and English interface switching; a ticket keeps the language selected when it was printed

## Local preview

This is a static website with no build step. Open the project root through any local static server; the entry point is `index.html`.

Key pages:

- `index.html` — opening screen and theatre entrance
- `home.html` — show discovery, custom shows, and ticket wallet
- `ticket.html` — admission ticket printing
- `focus.html` — focus timer and intermission flow
- `tickets.html` — complete ticket collection, signing, and image export

## Local data

Show details, focus records, unfinished intermissions, and ticket signatures are stored only in the browser's local storage on the current device. They are not uploaded or shared. Clearing site data or using **Clear local records** permanently removes them.

## Xiaohongshu Mini Tool

For the Mini Tool package, switch to the `codex/xhs-minitool` branch. It uses only bundled HTML, CSS, JavaScript, and local resources, without network requests or external services.
