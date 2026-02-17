import chalk from "chalk";
import inquirer from "inquirer";
import open from "open";
import { CommandHandler, CommandContext, TermfolioConfig } from "../types";
import { showWelcome } from "../shell/welcome";
import { saveCliSettings, type SupportedLanguage } from "../i18n";

// ─── Shared helpers ──────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function termWidth(): number {
  return Math.min(process.stdout.columns || 90, 100);
}

function divider(color: string, char = "─"): string {
  return chalk.hex(color)(char.repeat(termWidth()));
}

function sectionLabel(text: string, color: string): string {
  const upper = text.toUpperCase();
  const line = chalk.hex(color)("─".repeat(Math.max(0, termWidth() - upper.length - 3)));
  return `${chalk.hex(color).bold(upper)} ${line}`;
}

// ─── Register all core commands ──────────────────────────────────────────────

export function registerCoreCommands(
  config: TermfolioConfig,
  context: CommandContext
): Record<string, CommandHandler> {
  const commands: Record<string, CommandHandler> = {};
  const theme = context.theme;
  const t = (key: string, vars?: Record<string, string | number>) => context.i18n.t(key, vars);

  // ── Colour shortcuts ──────────────────────────────────────────────────────
  const cyan    = (s: string) => chalk.hex(theme.primary)(s);
  const purple  = (s: string) => chalk.hex(theme.secondary)(s);
  const gold    = (s: string) => chalk.hex(theme.accent)(s);
  const green   = (s: string) => chalk.hex(theme.success)(s);
  const orange  = (s: string) => chalk.hex(theme.warning)(s);
  const dim     = (s: string) => chalk.hex(theme.dim)(s);
  const white   = (s: string) => chalk.white(s);
  const bold    = (s: string) => chalk.bold(s);

  // ── HELP ──────────────────────────────────────────────────────────────────
  commands["help"] = async () => {
    context.render.newline();
    console.log(sectionLabel(t("help.title"), theme.primary));
    context.render.newline();

    const categories: Array<{
      label: string;
      items: Array<{ cmd: string; arg?: string; desc: string }>;
    }> = [
      {
        label: t("help.portfolio"),
        items: [
          { cmd: "about",    desc: t("help.about") },
          { cmd: "projects", desc: t("help.projects") },
          { cmd: "skills",   desc: t("help.skills") },
          { cmd: "contact",  desc: t("help.contact") },
          { cmd: "resume",   desc: t("help.resume") },
        ],
      },
      {
        label: t("help.system"),
        items: [
          { cmd: "theme",     arg: "[name]",   desc: t("help.theme") },
          { cmd: "language",  arg: "[en|hi]",  desc: t("help.language") },
          { cmd: "clear",                   desc: t("help.clear") },
          { cmd: "help",                    desc: t("help.help") },
          { cmd: "exit",                    desc: t("help.exit") },
        ],
      },
    ];

    for (const cat of categories) {
      console.log(`  ${purple("·")} ${dim(cat.label.toUpperCase())}  ${dim("─".repeat(40))}`);
      context.render.newline();
      for (const item of cat.items) {
        const cmdStr = cyan(bold(item.cmd.padEnd(12)));
        const argStr = item.arg ? gold(item.arg.padEnd(8)) : "        ";
        const descStr = dim(item.desc);
        console.log(`     ${cmdStr}  ${argStr}  ${descStr}`);
      }
      context.render.newline();
    }

    // Footer hints
    console.log(divider(theme.dim));
    console.log(
      `  ${dim("Tab")} autocomplete  ${dim("·")}  ${dim("↑↓")} history  ${dim("·")}  ${cyan("Ctrl+C")} exit`
    );
    context.render.newline();
  };

  // ── ABOUT ─────────────────────────────────────────────────────────────────
  commands["about"] = async () => {
    context.render.newline();
    console.log(sectionLabel(config.name, theme.primary));
    context.render.newline();

    const w = termWidth();
    const leftW = 24;
    const rightW = w - leftW - 3;

    // Left column: meta stats
    const leftLines: string[] = [
      bold(white(config.name)),
      cyan(config.title || "Developer"),
      "",
      `${dim("status")}   ${green("● available")}`,
      `${dim("theme")}    ${gold(config.theme || "dark")}`,
      `${dim("projects")} ${white(String(config.projects.length))}`,
      `${dim("skills")}   ${white(String(Object.values(config.skills).flat().filter(Boolean).length))}`,
    ];

    // Right column: bio text word-wrapped
    const bio = config.about || "No bio configured.";
    const words = bio.split(" ");
    const rightLines: string[] = [];
    let currentLine = "";
    for (const word of words) {
      if ((currentLine + " " + word).trim().length > rightW) {
        rightLines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine += (currentLine ? " " : "") + word;
      }
    }
    if (currentLine) rightLines.push(currentLine.trim());

    const totalRows = Math.max(leftLines.length, rightLines.length + 2);

    for (let i = 0; i < totalRows; i++) {
      const left = leftLines[i] ?? "";
      const rightRaw = i === 0
        ? dim("About Me")
        : i === 1
          ? dim("─".repeat(Math.min(40, rightW)))
          : (rightLines[i - 2] ?? "");
      const right = i >= 2 ? white(rightRaw) : rightRaw;

      const leftVis = left.replace(/\x1b\[[0-9;]*m/g, "").length;
      const leftPad = " ".repeat(Math.max(0, leftW - leftVis));
      const sep = chalk.hex(theme.dim)("│");
      console.log(`  ${left}${leftPad} ${sep} ${right}`);
    }

    context.render.newline();

    // Interest tags
    if (config.skills) {
      const allTech = Object.values(config.skills)
        .flat()
        .filter(Boolean)
        .map((item) => (typeof item === "object" && item !== null && "name" in item ? (item as { name: string }).name : String(item)))
        .slice(0, 8);
      if (allTech.length > 0) {
        const tags = allTech
          .map((t) => chalk.bgHex("#0a1a2a").hex(theme.primary)(` ${t} `))
          .join("  ");
        console.log(`  ${tags}`);
        context.render.newline();
      }
    }

    console.log(divider(theme.dim));
    context.render.newline();
  };

  // ── PROJECTS ──────────────────────────────────────────────────────────────
  commands["projects"] = async () => {
    context.render.newline();
    console.log(sectionLabel(t("projects.title"), theme.primary));
    context.render.newline();

    if (config.projects.length === 0) {
      context.render.warning(t("projects.none"));
      return;
    }

    // Interactive picker
    const { chosen } = await inquirer.prompt([
      {
        type: "list",
        name: "chosen",
        message: `${cyan("?")} ${t("projects.select")}`,
        choices: config.projects.map((p, i) => ({
          name:
            `${dim(`${String(i + 1).padStart(2, "0")}`)}  ` +
            `${cyan(bold(p.name.padEnd(22)))}  ` +
            `${
              p.status === "active"   ? green("● active") :
              p.status === "wip"      ? orange("● wip") :
                                        dim("○ archived")
            }`,
          value: p,
          short: p.name,
        })),
        prefix: "",
      },
    ]);

    context.render.newline();

    // Detail card
    const p = chosen as TermfolioConfig["projects"][0];
    const w = termWidth() - 4;

    // Top border
    console.log(`  ${cyan("╭" + "─".repeat(w) + "╮")}`);

    const line = (content: string) => {
      // eslint-disable-next-line no-control-regex
      const vis = content.replace(/\x1b\[[0-9;]*m/g, "").length;
      const pad = " ".repeat(Math.max(0, w - vis - 2));
      console.log(`  ${cyan("│")} ${content}${pad} ${cyan("│")}`);
    };

    line(`${bold(white(p.name))}  ${
      p.status === "active" ? green("● active") :
      p.status === "wip"    ? orange("● wip") :
                              dim("○ archived")
    }`);
    line(dim("─".repeat(w - 2)));
    line(white(p.desc || ""));
    if (p.repo)  line(`${dim("repo")}  ${cyan(p.repo)}`);
    if (p.url)   line(`${dim("url")}   ${cyan(p.url)}`);
    if (p.tags && p.tags.length > 0) {
      const tags = p.tags.map((t) => `${purple("#")}${dim(t)}`).join("  ");
      line(tags);
    }

    console.log(`  ${cyan("╰" + "─".repeat(w) + "╯")}`);
    context.render.newline();

    if (p.repo) {
      const { doOpen } = await inquirer.prompt([
        {
          type: "confirm",
          name: "doOpen",
          message: `${cyan("?")} ${t("projects.open_in_browser")}`,
          default: false,
          prefix: "",
        },
      ]);
      if (doOpen) await open(p.repo);
    }

    console.log(divider(theme.dim));
    context.render.newline();
  };

  // ── SKILLS ────────────────────────────────────────────────────────────────
  commands["skills"] = async () => {
    context.render.newline();
    console.log(sectionLabel(t("skills.title"), theme.primary));
    context.render.newline();

    const cats = Object.entries(config.skills).filter(([, v]) => v && v.length > 0);
    if (cats.length === 0) {
      context.render.warning(t("skills.none"));
      return;
    }

    for (const [category, items] of cats) {
      if (!items) continue;
      const catName = category.charAt(0).toUpperCase() + category.slice(1);

      // Category label
      console.log(
        `  ${purple(bold(catName))} ${dim("─".repeat(Math.max(0, termWidth() - catName.length - 4)))}`
      );

      // Check if items have levels (object format) or are plain strings
      for (const item of items) {
        if (typeof item === "object" && item !== null && "name" in item) {
          // Progress bar style
          const skill = item as { name: string; level?: number };
          const level = skill.level ?? 75;
          const barW = 28;
          const filled = Math.round((level / 100) * barW);
          const bar =
            chalk.hex(theme.primary)("█".repeat(filled)) +
            dim("░".repeat(barW - filled));
          const pct = cyan(bold(`${level}%`));
          console.log(`    ${white(String(skill.name).padEnd(18))} ${bar} ${pct}`);
          await sleep(30);
        } else {
          // Pill-style for plain strings
          const text = String(item);
          process.stdout.write(
            `    ${chalk.bgHex("#0d1525").hex(theme.primary)(` ${text} `)}  `
          );
        }
      }

      // If we wrote pills (no newline), end the line
      if (typeof items[0] === "string") {
        process.stdout.write("\n");
      }

      context.render.newline();
    }

    console.log(divider(theme.dim));
    context.render.newline();
  };

  // ── CONTACT ───────────────────────────────────────────────────────────────
  commands["contact"] = async () => {
    context.render.newline();
    console.log(sectionLabel(t("contact.title"), theme.primary));
    context.render.newline();

    const links = config.links;
    const iconMap: Record<string, string> = {
      email:    "📧",
      github:   "🐙",
      linkedin: "💼",
      twitter:  "🐦",
      website:  "🌐",
    };

    const entries = Object.entries(links).filter(([, v]) => v);

    if (entries.length === 0) {
      context.render.warning(t("contact.none"));
      return;
    }

    const w = termWidth() - 4;
    console.log(`  ${cyan("╭" + "─".repeat(w) + "╮")}`);

    for (const [key, value] of entries) {
      const icon = iconMap[key] || "🔗";
      const label = dim(key.charAt(0).toUpperCase() + key.slice(1));
      // eslint-disable-next-line no-control-regex
      const content = `${icon}  ${label.replace(/\x1b\[[0-9;]*m/g, "").padEnd(10).replace(/(.{10})/, `${label}${" ".repeat(10 - key.length)}`)}  ${cyan(value || "")}`;
      // simpler version:
      const row = `${icon}  ${dim((key + ":").padEnd(12))}  ${cyan(value || "")}`;
      // eslint-disable-next-line no-control-regex
      const rowVis = row.replace(/\x1b\[[0-9;]*m/g, "").length;
      const pad = " ".repeat(Math.max(0, w - rowVis - 1));
      console.log(`  ${cyan("│")} ${row}${pad}${cyan("│")}`);
      void content; // suppress unused
    }

    console.log(`  ${cyan("╰" + "─".repeat(w) + "╯")}`);
    context.render.newline();

    console.log(
      `  ${dim(t("contact.tip"))}`
    );
    context.render.newline();
    console.log(divider(theme.dim));
    context.render.newline();
  };

  // ── OPEN (link opener shortcut) ───────────────────────────────────────────
  commands["open"] = async (args: string[]) => {
    const target = args[0]?.toLowerCase();
    if (!target) {
      context.render.info(t("open.usage"));
      return;
    }
    const url = config.links[target];
    if (!url) {
      context.render.error(t("open.no_link", { target }));
      return;
    }
    const openUrl = target === "email" ? `mailto:${url}` : url;
    context.render.info(t("open.opening", { target, url }));
    try {
      await open(openUrl);
      context.render.success(t("open.opened"));
    } catch {
      context.render.error(t("open.failed"));
    }
  };

  // ── RESUME ────────────────────────────────────────────────────────────────
  commands["resume"] = async () => {
    if (config.resume) {
      context.render.info(t("resume.opening", { url: config.resume }));
      try {
        await open(config.resume);
        context.render.success(t("resume.opened"));
      } catch {
        context.render.error(t("resume.failed"));
      }
    } else {
      context.render.warning(t("resume.none"));
    }
  };

  // ── CLEAR ─────────────────────────────────────────────────────────────────
  commands["clear"] = async () => {
    context.render.clear();
    await showWelcome(config, context);
  };

  // ── LANGUAGE ──────────────────────────────────────────────────────────────
  commands["language"] = async (args: string[]) => {
    const raw = args[0]?.trim();
    if (!raw) {
      context.render.info(t("language.usage"));
      return;
    }

    const normalized = raw.toLowerCase();
    const lang: SupportedLanguage | null =
      normalized === "en" || normalized === "english" ? "en" :
      normalized === "hi" || normalized === "hindi" || normalized === "hin" ? "hi" :
      null;

    if (!lang) {
      context.render.error(t("language.invalid", { lang: raw }));
      context.render.info(t("language.usage"));
      return;
    }

    // Hot-swap language immediately + persist for next run
    context.i18n.setLanguage(lang);
    context.render.setI18n(context.i18n);
    saveCliSettings({ language: lang });

    context.render.success(t("language.changed", { lang }));
    context.render.clear();
    await showWelcome(config, context);
  };

  // ── THEME ─────────────────────────────────────────────────────────────────
  commands["theme"] = async (args: string[]) => {
    const validThemes = ["dark", "light", "hacker", "neo", "dracula", "nordic"];
    const themeName = args[0];

    context.render.newline();
    console.log(sectionLabel(t("theme.title"), theme.primary));
    context.render.newline();

    if (!themeName) {
      // Show theme gallery
      const themeData: Array<{ name: string; colors: [string, string, string]; desc: string }> = [
        { name: "dark",    colors: ["#00E5FF", "#B347FF", "#FFD166"], desc: "Cyan & purple on black" },
        { name: "light",   colors: ["#0066CC", "#9933FF", "#FF6600"], desc: "Clean minimal light" },
        { name: "hacker",  colors: ["#00FF00", "#00AA00", "#FFFF00"], desc: "Matrix green on black" },
        { name: "neo",     colors: ["#FF0080", "#00FFFF", "#FFFF00"], desc: "Neon pink & cyan" },
        { name: "dracula", colors: ["#FF79C6", "#BD93F9", "#FFB86C"], desc: "Classic Dracula" },
        { name: "nordic",  colors: ["#88C0D0", "#81A1C1", "#EBCB8B"], desc: "Muted Nordic tones" },
      ];

      for (const t of themeData) {
        const isActive = (config.theme || "dark") === t.name;
        const swatch =
          chalk.hex(t.colors[0])("██") +
          chalk.hex(t.colors[1])("██") +
          chalk.hex(t.colors[2])("██");
        const marker = isActive ? cyan(bold(" ← active")) : "";
        console.log(
          `  ${swatch}  ${isActive ? cyan(bold(t.name.padEnd(10))) : white(t.name.padEnd(10))}  ${dim(t.desc)}${marker}`
        );
      }

      context.render.newline();
      console.log(
        `  ${dim(t("theme.usage"))}`
      );
      console.log(
        `  ${dim(t("theme.tip"))}`
      );
    } else if (validThemes.includes(themeName)) {
      context.render.success(t("theme.selected", { theme: themeName }));
      context.render.info(t("theme.restart"));
      console.log(
        `  ${dim("Add")} ${gold(`theme: "${themeName}"`)} ${dim("to termfolio.config.ts")}`
      );
    } else {
      context.render.error(t("theme.unknown", { theme: themeName }));
      context.render.info(t("theme.valid", { themes: validThemes.join(", ") }));
    }

    context.render.newline();
    console.log(divider(theme.dim));
    context.render.newline();
  };

  return commands;
}