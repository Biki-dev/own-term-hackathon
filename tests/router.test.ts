import { describe, it, expect, beforeEach } from "vitest";
import { Router } from "../src/shell/router";
import { CommandContext } from "../src/types";
import { Renderer } from "../src/render/renderer";
import { darkTheme } from "../src/themes/default";
import { createI18n } from "../src/i18n";

describe("Router", () => {
    let router: Router;
    let context: CommandContext;

    beforeEach(() => {
        const i18n = createI18n("en");
        const render = new Renderer(darkTheme);
        render.setI18n(i18n);
        context = {
            config: {
                name: "Test",
                title: "Tester",
                links: {},
                projects: [],
                skills: {},
            },
            render,
            theme: darkTheme,
            i18n,
        };
        router = new Router(context);
    });

    it("should register commands", () => {
        router.register("test", "Test command", async () => { });

        const commands = router.getCommands();
        expect(commands).toHaveLength(1);
        expect(commands[0].name).toBe("test");
    });

    it("should register command aliases", () => {
        router.register("test", "Test command", async () => { }, ["t", "tst"]);

        const commands = router.getCommands();
        expect(commands).toHaveLength(1);
    });

    it("should execute registered commands", async () => {
        let executed = false;
        router.register("test", "Test command", async () => {
            executed = true;
        });

        await router.execute("test");
        expect(executed).toBe(true);
    });

    it("should return false for exit commands", async () => {
        const result = await router.execute("exit");
        expect(result).toBe(false);
    });

    it("should handle unknown commands gracefully", async () => {
        const result = await router.execute("unknown");
        expect(result).toBe(true);
    });
});
