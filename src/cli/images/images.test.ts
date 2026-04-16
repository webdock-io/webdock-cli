import { expect } from "jsr:@std/expect/expect";
import * as path from "jsr:@std/path";

Deno.test({
	name: "Images List CLI",
	fn: async (t) => {
		const scriptPath = path.join(Deno.cwd(), "src", "main.ts");
		const decoder = new TextDecoder();

		const imagesList = new Deno.Command("deno", {
			args: [
				"run",
				"--allow-env",
				"--allow-read",
				"--allow-write",
				"--allow-net",
				"--allow-sys",
				scriptPath,
				"images",
				"list",
			],
			stdout: "piped",
			stderr: "piped",
		});

		const output = await imagesList.output();
		const stdout = decoder.decode(output.stdout);
		const stderr = decoder.decode(output.stderr);
		const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

		await t.step("Command exits successfully", () => {
			expect(output.success, `'images list' command failed.${ctx}`).toBe(true);
		});
		await t.step("Output contains 'Slug'", () => {
			expect(stdout, `Expected output to contain 'Slug'.${ctx}`).toContain("Slug");
		});
		await t.step("Output contains 'Name'", () => {
			expect(stdout, `Expected output to contain 'Name'.${ctx}`).toContain("Name");
		});
		await t.step("Output contains 'Type'", () => {
			expect(stdout, `Expected output to contain 'Type'.${ctx}`).toContain("Type");
		});
		await t.step("Output contains 'phpVersion'", () => {
			expect(stdout, `Expected output to contain 'phpVersion'.${ctx}`).toContain("phpVersion");
		});
	},
});
