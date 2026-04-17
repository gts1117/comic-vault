# Comic Vault

> A full-featured desktop comic book library manager — read, browse, organise, and enrich your entire collection from one app.

Comic Vault is a Calibre-style application built specifically for digital comic books (`.cbz` / `.cbr`). It pairs a rich, visual library browser with a built-in reader, metadata editor, and the same battle-tested sorting engine that powers [Comic Sorter](https://github.com/gts1117/comic-sorter).

> **Status:** 🚧 Early development — architecture and core scaffolding are being established.

---

## Planned Features

### 📚 Library Browser
- Cover-art grid and list views with a physical "longbox" aesthetic.
- Sidebar filters for publisher, series, year, reading status, tags, and favourites.
- Fast SQLite-backed search, filter, and sort across the entire collection.

### 📖 Built-in Reader
- Page-by-page CBZ/CBR display with keyboard navigation and zoom.
- Track read / unread status and remember the last page read per issue.

### ✏️ Metadata Editor
- Right-click any comic to edit Publisher, Series, Storyline, Volume, and Issue.
- ComicVine lookup to auto-fill metadata from inside the editor.
- Background processing to rename/move the file and update the archive's `ComicInfo.xml`.

### ⚙️ Automation & Headless Sorting
- Background watcher on a configurable "Sort" folder — new files are detected, enriched, and filed automatically.
- Drag-and-drop import of loose comic files directly into the library window.
- All three Comic Sorter operation modes (Sort, Resort, Smart-Merge) available from the GUI.

### 🗂️ Issue Grouping & Album Management
- View all issues of a run together.
- Smart duplication prompts when adding collected editions that overlap with existing single issues.

### 🔔 Release Tracking
- Automatic look-up for upcoming issues in your tracked series with release reminders.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 Tauri 2 Shell                    │
│  ┌──────────────────┐  ┌──────────────────────┐ │
│  │  React + TS UI   │  │   Python Backend      │ │
│  │  (Zustand state) │◄─┤   (FastAPI / sidecar) │ │
│  │                  │  │                       │ │
│  │  Library View    │  │  ┌─────────────────┐  │ │
│  │  Reader View     │  │  │  Sorting Engine  │  │ │
│  │  Metadata Editor │  │  │  (comic-sorter)  │  │ │
│  └──────────────────┘  │  └─────────────────┘  │ │
│                        │  SQLite DB             │ │
│                        └──────────────────────┘ │
└─────────────────────────────────────────────────┘
```

| Layer | Tech | Role |
|-------|------|------|
| **App Shell** | Tauri 2 (Rust + WebView) | Native window, menus, IPC, file-system access |
| **Frontend** | React · TypeScript · Zustand | Library grid, reader canvas, metadata forms |
| **Styling** | Custom CSS | Physical comic-box visual language |
| **Backend** | Python (FastAPI or Tauri sidecar) | Wraps sorting engine, serves REST/IPC API |
| **Database** | SQLite | Metadata, reading progress, thumbnails index |
| **Engine** | Ported from [comic-sorter](https://github.com/gts1117/comic-sorter) | File ops, inference, metadata injection, scanning |

---

## Repository Layout (planned)

```
comic-vault/
├── src/                  # React + TypeScript frontend
├── src-tauri/            # Tauri Rust shell
├── backend/              # Python backend service
│   └── engine/           # Sorting engine (from comic-sorter)
├── outline.txt           # Project design document
├── LICENSE
└── README.md
```

---

## Prerequisites

> Full setup instructions will be added once core scaffolding is in place.

- **Node.js** ≥ 18
- **Rust** (latest stable) — for Tauri
- **Python** ≥ 3.10
- **unar** — for `.cbr` extraction (`brew install unar`)

---

## Related

- [Comic Sorter](https://github.com/gts1117/comic-sorter) — the headless sorting engine this project builds on.

---

## License

This project is licensed under the [MIT License](LICENSE).
