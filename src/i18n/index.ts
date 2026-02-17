import fs from "fs";
import path from "path";
import os from "os";

export type SupportedLanguage = "en" | "hi";

export interface I18n {
  getLanguage(): SupportedLanguage;
  setLanguage(lang: SupportedLanguage): void;
  t(key: string, vars?: Record<string, string | number>): string;
}

type Dict = Record<string, string>;

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) => {
    const v = vars[k];
    return v === undefined || v === null ? `{${k}}` : String(v);
  });
}

function readJsonIfExists(filePath: string): Dict {
  try {
    if (!fs.existsSync(filePath)) return {};
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Dict;
  } catch {
    return {};
  }
}

function getLocalesDir(): string {
  // Compiled JS lands in `bin/...`, so `../../locales` resolves to project root `locales/`.
  return path.resolve(__dirname, "..", "..", "locales");
}

export function createI18n(initialLanguage: SupportedLanguage): I18n {
  const localesDir = getLocalesDir();
  const en = readJsonIfExists(path.join(localesDir, "en.json"));
  let lang: SupportedLanguage = initialLanguage;
  let current = lang === "en" ? en : readJsonIfExists(path.join(localesDir, `${lang}.json`));

  const api: I18n = {
    getLanguage() {
      return lang;
    },
    setLanguage(next) {
      lang = next;
      current = lang === "en" ? en : readJsonIfExists(path.join(localesDir, `${lang}.json`));
    },
    t(key, vars) {
      const template = current[key] ?? en[key] ?? key;
      return interpolate(template, vars);
    },
  };

  return api;
}

export interface CliSettings {
  language: SupportedLanguage;
}

export function getDefaultCliSettings(): CliSettings {
  return { language: "en" };
}

function getSettingsDir(): string {
  const appData = process.platform === "win32" ? process.env.APPDATA : undefined;
  if (appData) return path.join(appData, "own-term-hackathon");
  return path.join(os.homedir(), ".own-term-hackathon");
}

export function getSettingsPath(): string {
  return path.join(getSettingsDir(), "settings.json");
}

export function loadCliSettings(): CliSettings {
  const filePath = getSettingsPath();
  try {
    if (!fs.existsSync(filePath)) return getDefaultCliSettings();
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<CliSettings> | undefined;
    const language = parsed?.language;
    if (language === "en" || language === "hi") return { language };
    return getDefaultCliSettings();
  } catch {
    return getDefaultCliSettings();
  }
}

export function saveCliSettings(next: CliSettings): void {
  const filePath = getSettingsPath();
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(next, null, 2), "utf8");
}

