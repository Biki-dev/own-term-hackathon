# own-term-hackathon — Project Documentation

## Project Structure

```
own-term-hackathon/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml              # CI: lint + test + build on Node 18/20
│   │   └── publish.yml         # Auto-publish to npm on GitHub release
│   └── ISSUE_TEMPLATE/
│       ├── bug_report.md
│       └── feature_request.md
├── src/
│   ├── cli.ts                  # Main entry point — parses args, boots shell
│   ├── config.ts               # Config loader, validator, default config
│   ├── types.ts                # All TypeScript interfaces & types
│   ├── i18n/
│   │   └── index.ts            # i18n runtime: createI18n, loadCliSettings, saveCliSettings
│   ├── commands/
│   │   └── index.ts            # All core commands: about, projects, skills, contact, resume, open, theme, language, clear, help
│   ├── plugins/
│   │   ├── loader.ts           # Plugin loader + createPlugin helper
│   │   └── plugin_api.ts       # Plugin API exports for third-party developers
│   ├── render/
│   │   ├── renderer.ts         # Renderer class (box, table, gradient, text, etc.)
│   │   └── effects.ts          # Typewriter + thinking cursor effects
│   ├── shell/
│   │   ├── engine.ts           # ShellEngine: init, REPL loop, signal handlers
│   │   ├── router.ts           # Command router with alias support
│   │   └── welcome.ts          # Welcome screen + boot sequence
│   └── themes/
│       └── default.ts          # 6 themes: dark, light, hacker, neo, dracula, nordic
├── locales/
│   ├── en.json                 # Source locale (English) — edit this to add strings
│   └── hi.json                 # Hindi — generated & managed by lingo.dev
├── templates/
│   ├── default/termfolio.config.ts
│   ├── hacker/termfolio.config.ts
│   └── minimal/termfolio.config.ts
├── tests/
│   ├── config.test.ts
│   ├── router.test.ts
│   └── themes.test.ts
├── i18n.json                   # lingo.dev config (source + targets)
├── i18n.lock                   # lingo.dev lockfile (do not edit manually)
├── termfolio.config.ts         # Demo config (used when no user config found)
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## Quick Start

```bash
npm install
npm run dev       # run with ts-node against termfolio.config.ts
npm run build     # compile TypeScript → bin/
npm test          # run vitest
npm run lint      # eslint
npm run format    # prettier
```

---

## Available Commands

Once running, the shell accepts:

| Command | Args | What it does |
|---|---|---|
| `about` | — | Renders name, title, bio, skill tag cloud |
| `projects` | — | Interactive list picker → detail card → optional browser open |
| `skills` | — | Pill layout for plain strings, animated progress bars for `{name, level}` items |
| `contact` | — | Boxed layout of all configured links |
| `resume` | — | Opens `config.resume` URL in the system browser |
| `open` | `github` / `linkedin` / `email` / `website` / `twitter` | Opens specific link directly |
| `theme` | `[name]` | No arg = gallery with swatches; with arg = selects theme |
| `language` | `en` / `hi` | Hot-swaps locale, persists setting to `~/.own-term-hackathon/settings.json` |
| `clear` | — | Clears terminal and re-renders welcome screen |
| `help` | — | Full command reference table |
| `exit` / `quit` / `q` | — | Exits the portfolio |

---

## Configuration Reference

All fields in `termfolio.config.ts`:

```typescript
export default {
  name:      string,           // required — displayed in about, welcome screen
  title:     string,           // role/tagline shown under name
  asciiLogo: string,           // optional — currently unused by renderer
  about:     string,           // bio shown in `about` command
  theme:     string,           // dark | light | hacker | neo | dracula | nordic
  links: {
    github?:   string,
    linkedin?: string,
    twitter?:  string,
    website?:  string,
    email?:    string,
    [key: string]: string      // any additional link key supported
  },
  projects: [{
    name:   string,
    desc:   string,
    repo?:  string,            // shown as link, opened on confirm
    url?:   string,
    tags?:  string[],
    status: "active" | "wip" | "archived"
  }],
  skills: {
    [category: string]: string[] | { name: string; level?: number }[]
    // Plain strings → pill layout
    // { name, level } → animated progress bar (0–100)
  },
  resume?:  string,            // URL opened by `resume` command
  plugins?: string[],          // npm package names to load
  customCommands?: Record<string, CommandHandler>
}
```

---

## Themes

Six themes are defined in `src/themes/default.ts`. Each theme is a `Theme` object:

```typescript
interface Theme {
  primary:   string;   // main accent (headers, prompts, highlights)
  secondary: string;   // secondary accent (decorative elements)
  accent:    string;   // gold/warm highlights
  success:   string;   // ✓ messages
  warning:   string;   // ⚠ messages
  error:     string;   // ✗ messages
  text:      string;   // default text color
  dim:       string;   // muted/decorative text
}
```

Built-in themes: `dark`, `light`, `hacker`, `neo`, `dracula`, `nordic`.

To add a new theme, export it from `src/themes/default.ts` and add it to the `themes` record and `getTheme()`.

---

## Localization (lingo.dev)

### Architecture

The i18n system has two layers:

**1. lingo.dev** (build-time) — generates and syncs locale files via AI translation.

**2. i18n runtime** (`src/i18n/index.ts`) — reads locale JSON files at runtime, supports hot-swapping language, and persists the user's choice.

### Locale files

`locales/en.json` is the source of truth. All keys follow a `namespace.key` pattern:

```
boot.*          boot sequence messages
welcome.*       welcome screen strings
help.*          help command strings
projects.*      projects command strings
skills.*        skills command strings
contact.*       contact command strings
open.*          open command strings
resume.*        resume command strings
theme.*         theme command strings
language.*      language command strings
router.*        router error messages
shell.*         shell-level messages
table.*         table fallback messages
```

Variables use `{varName}` syntax, e.g. `"Language changed to {lang}"`.

### Adding or editing strings

1. Add/edit in `locales/en.json` only.
2. Run lingo.dev to sync other locales:
```bash
LINGODOTDEV_API_KEY=api_xxx npx lingo.dev@latest run
```
3. The lockfile (`i18n.lock`) is updated automatically — commit it.

### Adding a new language

1. Add the locale code to `i18n.json` targets array.
2. Run `npx lingo.dev@latest run` — lingo.dev creates `locales/<code>.json`.
3. In `src/commands/index.ts`, extend the `language` command's `lang` normalization block to accept the new code.
4. Update the `language` command help string and usage message in `locales/en.json`.

### User settings

The active language is saved to `~/.own-term-hackathon/settings.json` (Linux/Mac) or `%APPDATA%\own-term-hackathon\settings.json` (Windows) via `saveCliSettings()`. It loads automatically on startup via `loadCliSettings()`.

---

## Plugin Development

### Creating a plugin

```typescript
import { createPlugin } from "own-term-hackathon";

export default createPlugin("my-plugin", "1.0.0", (api) => {
  api.registerCommand(
    "greet",
    "Say hello to the visitor",
    async (args, context) => {
      api.render.header("Hello!");
      api.render.text(`Welcome, ${api.getConfig().name}`);
      api.render.newline();
      api.render.info(`Theme: ${context.theme.primary}`);
    }
  );
});
```

### Plugin API surface

```typescript
interface PluginAPI {
  registerCommand(name: string, description: string, handler: CommandHandler): void;
  getConfig(): TermfolioConfig;
  render: RenderAPI;          // all render methods
  theme: Theme;               // active theme colors
  i18n: I18n;                 // t(), getLanguage(), setLanguage()
}
```

### Loading plugins

```typescript
// termfolio.config.ts
export default {
  plugins: ["my-plugin-package"]
};
```

Plugins are loaded from `node_modules` by name via dynamic `import()`.

---

## Render API

All render methods are available via `context.render` in commands and plugins:

```typescript
render.box(content, options?)          // bordered box via boxen
render.table(data, headers?)           // cli-table3 table
render.text(content, style?)           // styled text
render.gradient(text, colors?)         // gradient-string output
render.divider(char?, color?)          // full-width rule
render.header(text, subtitle?)         // gradient title + divider
render.list(items, bullet?)            // bulleted list
render.keyValue(data, indent?)         // key: value pairs
render.success(message)                // ✓ green
render.warning(message)                // ⚠ orange
render.error(message)                  // ✗ red
render.info(message)                   // ℹ cyan
render.newline()
render.clear()
render.textAnimated(content, style?)   // typewriter when enabled
render.setTypewriterMode(enabled)
render.setI18n(i18n)
```

---

## Testing

```bash
npm test                    # run all tests
npm test -- --coverage      # with v8 coverage
npm test -- --watch         # watch mode
```

Tests live in `tests/` and use vitest. Three test files cover config loading, the command router, and the theme system.

---

## CI / Publishing

**CI** (`.github/workflows/ci.yml`) runs on push/PR to `main` and `develop`:
- Lint → Test → Build on Node 18 and 20
- Coverage upload to Codecov on Node 20

**Publish** (`.github/workflows/publish.yml`) triggers on GitHub release:
- Test → Build → `npm publish --access public`
- Requires `NPM_TOKEN` secret in the repo

---

## Troubleshooting

**Build errors**
```bash
rm -rf bin/ node_modules/
npm install
npm run build
```

**Locale files missing after build**
The `locales/` directory is listed in `package.json` `files` field, so it ships with the package. In development, `src/i18n/index.ts` resolves `locales/` relative to the compiled output in `bin/` — path is `../../locales`.

**Language not persisting**
Settings are written to `~/.own-term-hackathon/settings.json`. Check that the directory is writable.

**Plugin not loading**
Ensure the package is installed in `node_modules` and the name in `config.plugins` exactly matches the npm package name.