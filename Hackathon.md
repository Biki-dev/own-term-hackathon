# Hackathon Submission — own-term-hackathon

## What was built

**own-term-hackathon** is an interactive terminal portfolio framework — configurable, themeable, and fully localizable. Run anyone's portfolio in a terminal with one `npx` command.

---

## Lingo.dev integration

The standout hackathon feature is **AI-powered i18n via [lingo.dev](https://lingo.dev)**.

### How it works

All UI strings are externalized into `locales/en.json`. Running the lingo.dev CLI translates them to every target locale defined in `i18n.json` and writes a lockfile so future runs only process new or changed strings.

```bash
npx lingo.dev@latest run
```

Output locale files (`locales/hi.json`, etc.) are committed to the repo and shipped with the npm package.

### Runtime language switching

Users can switch language live inside the running portfolio:

```
language hi     → switches all output to Hindi instantly
language en     → switches back to English
```

The choice persists across sessions via `~/.own-term-hackathon/settings.json`.

### Architecture

```
locales/en.json          ← source strings (human-authored)
locales/hi.json          ← AI-translated by lingo.dev
i18n.json                ← lingo.dev config (source locale + targets)
i18n.lock                ← lingo.dev lockfile (tracks translated checksums)
src/i18n/index.ts        ← runtime i18n: reads locale files, exposes t(), setLanguage()
```

The runtime is intentionally thin — no heavy i18n library, just `fs.readFileSync` + string interpolation with `{varName}` placeholders. lingo.dev handles all the hard parts.

---
