import { expect } from "jsr:@std/expect/expect";
import * as path from "jsr:@std/path";

Deno.test({
	name: "Events List CLI",
	fn: async (t) => {
		const scriptPath = path.join(Deno.cwd(), "src", "main.ts");
		const decoder = new TextDecoder();

		const eventsList = new Deno.Command("deno", {
			args: [
				"run",
				"--allow-env",
				"--allow-read",
				"--allow-write",
				"--allow-net",
				"--allow-sys",
				scriptPath,
				"events",
				"list",
			],
			stdout: "piped",
			stderr: "piped",
		});

		const output = await eventsList.output();
		const stdout = decoder.decode(output.stdout);
		const stderr = decoder.decode(output.stderr);
		const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

		await t.step("Command exits successfully", () => {
			expect(output.success, `'events list' command failed.${ctx}`).toBe(true);
		});
		await t.step("Output contains 'ID'", () => {
			expect(stdout, `Expected output to contain 'ID'.${ctx}`).toContain("ID");
		});
		await t.step("Output contains 'Slug'", () => {
			expect(stdout, `Expected output to contain 'Slug'.${ctx}`).toContain("Slug");
		});
		await t.step("Output contains 'Type'", () => {
			expect(stdout, `Expected output to contain 'Type'.${ctx}`).toContain("Type");
		});
		await t.step("Output contains 'StartTime'", () => {
			expect(stdout, `Expected output to contain 'StartTime'.${ctx}`).toContain("StartTime");
		});
		await t.step("Output contains 'End time'", () => {
			expect(stdout, `Expected output to contain 'End time'.${ctx}`).toContain("End time");
		});
		await t.step("Output contains 'Details'", () => {
			expect(stdout, `Expected output to contain 'Details'.${ctx}`).toContain("Details");
		});
	},
});
