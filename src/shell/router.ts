import { Command, CommandHandler, CommandContext } from "../types";

/**
 * Command router that maps user input to command handlers
 */
export class Router {
    private commands: Map<string, Command> = new Map();
    private aliases: Map<string, string> = new Map();

    constructor(private context: CommandContext) { }

    /**
     * Register a command
     */
    register(name: string, description: string, handler: CommandHandler, aliases: string[] = []): void {
        const command: Command = {
            name,
            description,
            handler,
            aliases,
        };

        this.commands.set(name, command);

        // Register aliases
        aliases.forEach((alias) => {
            this.aliases.set(alias, name);
        });
    }

    /**
     * Register multiple commands at once
     */
    registerAll(commands: Record<string, CommandHandler>): void {
        Object.entries(commands).forEach(([name, handler]) => {
            this.register(name, "", handler);
        });
    }

    /**
     * Execute a command
     */
    async execute(input: string): Promise<boolean> {
        const trimmed = input.trim();
        if (!trimmed) return true;

        const parts = trimmed.split(/\s+/);
        const commandName = parts[0].toLowerCase();
        const args = parts.slice(1);

        // Check for exit commands
        if (["exit", "quit", "q"].includes(commandName)) {
            return false;
        }

        // Resolve aliases
        const resolvedName = this.aliases.get(commandName) || commandName;

        // Find and execute command
        const command = this.commands.get(resolvedName);

        if (command) {
            try {
                await command.handler(args, this.context);
            } catch (error) {
                this.context.render.error(
                    this.context.i18n.t("router.error_executing_command", { error: String(error) })
                );
            }
        } else {
            this.context.render.error(
                this.context.i18n.t("router.unknown_command", { command: commandName })
            );
            this.context.render.text(this.context.i18n.t("router.type_help_hint"), {
                color: this.context.theme.dim
            });
        }

        return true;
    }

    /**
     * Get all registered commands
     */
    getCommands(): Command[] {
        return Array.from(this.commands.values());
    }
}
