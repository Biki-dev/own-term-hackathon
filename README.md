# own-term-hackathon 🚀

<div align="center">

**Create a beautiful, interactive terminal portfolio — installable via `npx` or `npm i -g`**

[![npm version](https://badge.fury.io/js/own-term-hackathon.svg)](https://www.npmjs.com/package/own-term-hackathon)
[![CI](https://github.com/Biki-dev/own-term-hackathon/workflows/CI/badge.svg)](https://github.com/Biki-dev/own-term-hackathon/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Features](#-features) · [Quick Start](#-quick-start) · [Commands](#-commands) · [Themes](#-themes) · [i18n](#-localization-lingodev) · [Plugins](#-plugins) · [Contributing](#-contributing)

</div>

---

## What is own-term-hackathon?

**own-term-hackathon** is a reusable framework for building beautiful interactive terminal portfolios. Not just one person's portfolio — a complete system anyone can configure and run as their own.

- 🎨 **6 built-in themes** — dark, light, hacker, neo, dracula, nordic
- 🌐 **AI-powered i18n** — English & Hindi via [lingo.dev](https://lingo.dev), switch live with `language hi`
- 🔌 **Plugin system** — register custom commands without touching core code
- ⚡ **Zero friction** — `npx own-term-hackathon` and you're in
- 📦 **Config-driven** — one `termfolio.config.ts` file controls everything
- 🛠️ **TypeScript throughout** — fully typed, tested with vitest

---

## 🚀 Quick Start

```bash
# Try it instantly
npx own-term-hackathon

# Install globally
npm install -g own-term-hackathon
own-term-hackathon

# Run with your own config
npx own-term-hackathon --config=./termfolio.config.ts
```

---

## ⚙️ Configuration

Create a `termfolio.config.ts` in your project root:

```typescript
export default {
  name: "Your Name",
  title: "Full-Stack Developer",
  about: "Your bio here.",
  theme: "dark",                 // dark | light | hacker | neo | dracula | nordic
  links: {
    github:   "https://github.com/yourusername",
    linkedin: "https://linkedin.com/in/yourusername",
    email:    "you@example.com",
    website:  "https://yourwebsite.com"
  },
  projects: [
    {
      name:   "Cool Project",
      desc:   "What it does",
      repo:   "https://github.com/yourusername/project",
      tags:   ["typescript", "cli"],
      status: "active"           // active | wip | archived
    }
  ],
  skills: {
    // Option 1 — plain strings (rendered as pills)
    tools: ["Git", "Docker", "Linux"],

    // Option 2 — with skill levels (rendered as progress bars)
    languages: [
      { name: "TypeScript", level: 92 },
      { name: "Python",     level: 80 }
    ]
  },
  resume: "https://yourwebsite.com/resume.pdf"
};
```

See the [templates/](./templates/) directory for ready-to-use examples: `default`, `hacker`, `minimal`.

---

## 💬 Commands

| Command | Description |
|---|---|
| `about` | Name, title, bio, and skill tags |
| `projects` | Interactive picker — browse, view details, open in browser |
| `skills` | Skills as pills or animated progress bars |
| `contact` | All configured links in a boxed layout |
| `resume` | Opens your resume PDF in the browser |
| `theme [name]` | Show theme gallery or switch theme |
| `language [en\|hi]` | Switch CLI language (persists across sessions) |
| `open [target]` | Shortcut: `open github`, `open email`, etc. |
| `clear` | Clear and re-render the welcome screen |
| `help` | Full command reference |
| `exit` | Exit the portfolio |

---

## 🎨 Themes

Six themes ship out of the box:

| Theme | Description |
|---|---|
| `dark` | Cyan & purple on black (default) |
| `light` | Clean minimal light |
| `hacker` | Matrix-style green terminal |
| `neo` | Neon pink & cyan |
| `dracula` | Classic Dracula palette |
| `nordic` | Muted Nordic tones |

Switch at runtime with `theme dracula`, or set permanently in your config:

```typescript
theme: "dracula"
```

---

## 🌐 Localization (lingo.dev)

Translations are managed with **[lingo.dev](https://lingo.dev)** — an AI-powered CLI tool that keeps locale files in sync automatically.

### How it works

- Source strings live in `locales/en.json`
- lingo.dev translates them to all target locales defined in `i18n.json`
- A lockfile (`i18n.lock`) tracks which strings have been translated so re-runs only process new content

### Supported languages

| Code | Language |
|---|---|
| `en` | English |
| `hi` | Hindi |

### Switching language at runtime

```
language hi      # switch to Hindi
language en      # switch back to English
```

The setting persists across sessions (stored in `~/.own-term-hackathon/settings.json`).

### Adding a new language

1. Add the locale code to `i18n.json`:
```json
{
  "locale": {
    "source": "en",
    "targets": ["hi", "es", "fr"]
  }
}
```

2. Run lingo.dev to generate the new locale file:
```bash
LINGODOTDEV_API_KEY=your_key npx lingo.dev@latest run
```

3. Add the new code to the `language` command in `src/commands/index.ts`.

### Running translations locally

```bash
cp .env.example .env
# Add your LINGODOTDEV_API_KEY to .env

npx lingo.dev@latest run
```

---

## 🔌 Plugins

Extend the portfolio with custom commands:

```typescript
import { createPlugin } from "own-term-hackathon";

export default createPlugin("my-plugin", "1.0.0", (api) => {
  api.registerCommand("greet", "Say hello", async (args) => {
    api.render.header("Hello!");
    api.render.text(`Hi, ${api.getConfig().name}`);
  });
});
```

Register in your config:

```typescript
plugins: ["my-plugin-package"]
```

---

## 🛠️ Development

```bash
git clone https://github.com/Biki-dev/own-term-hackathon.git
cd own-term-hackathon

npm install
npm run dev      # run with ts-node
npm run build    # compile to bin/
npm test         # vitest
npm run lint     # eslint
npm run format   # prettier
```

### Project structure

```
own-term-hackathon/
├── src/
│   ├── cli.ts              # Entry point
│   ├── config.ts           # Config loader & validator
│   ├── types.ts            # TypeScript definitions
│   ├── i18n/               # i18n runtime (powered by lingo.dev locale files)
│   ├── shell/              # Shell engine, router, welcome screen
│   ├── render/             # Renderer + typewriter effects
│   ├── commands/           # Core commands (about, projects, skills…)
│   ├── plugins/            # Plugin loader & API
│   └── themes/             # 6 built-in themes
├── locales/                # Locale files managed by lingo.dev
│   ├── en.json
│   └── hi.json
├── i18n.json               # lingo.dev config
├── i18n.lock               # lingo.dev lockfile
├── templates/              # Starter configs (default, hacker, minimal)
└── tests/                  # vitest test suite
```

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide. Quick version:

1. Fork & clone
2. `npm install && npm run dev`
3. Branch from `main` — `git checkout -b feat/my-feature`
4. Make changes, add tests, run `npm test && npm run lint`
5. Open a PR with a conventional commit title

---

## 📄 License

MIT © [Biki-dev](https://github.com/Biki-dev)