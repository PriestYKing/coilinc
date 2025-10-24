# Coil Inc API Client

A modern API request client built with Tauri, Next.js, and shadcn/ui.
Supports dark mode, collection management, flexible JSON body editor, and production-ready UI.

---

## Features

- Beautiful responsive UI (Tailwind + shadcn)
- Dark/light theme switch from user dropdown
- Sidebar with request tabs and collections
- Request editor: headers, params, body, auth
- Body beautifier (even for invalid JSON)
- Fast response viewer with copy, status, timings
- PNG icon support for installers (multi-resolution)
- TypeScript full stack pattern

---

## Getting Started

### Prerequisites

- Node.js (>=18)
- pnpm (recommended) or npm/yarn
- Rust + Cargo (for Tauri backend)
- Tauri CLI (`cargo install tauri-cli`)

### Setup

git clone https://github.com/PriestYKing/coilinc.git
cd coilinc
- tauri build


---

## Icons

Place PNG icons of these sizes in `src/icons/`:

- 32x32, 128x128, 256x256, 512x512, 1024x1024, 2048x2048 (true PNGs, not renamed JPGs)
Update icon paths in `src/tauri.conf.json`.

---

## .gitignore

See `.gitignore` for recommended exclusions (node_modules, /target/, .env, build artifacts, OS/IDE files).

---

## Publishing

- Create a branch and raise PR to merge
- Push to GitHub: `git push origin your_branch`
- For installers/releases, upload files from `/src/target/` as GitHub Releases.

---

## License

MIT © Coil Inc

---

## Maintainers

- @PriestYKing

---

## Contributing

PRs, features, bug reports, and feedback are welcome!

## Future Updates are in the way of the Coil Inc API.
