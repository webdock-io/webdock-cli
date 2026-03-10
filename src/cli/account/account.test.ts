import { expect } from "jsr:@std/expect/expect";
import * as path from "jsr:@std/path";

Deno.test({
	name: "Account Info CLI",
	fn: async (t) => {
		const scriptPath = path.join(Deno.cwd(), "src", "main.ts");
		const decoder = new TextDecoder();

		const accountInfo = new Deno.Command("deno", {
			args: [
				"run",
				"--allow-env",
				"--allow-read",
				"--allow-write",
				"--allow-net",
					"--allow-sys",
				"--allow-run",
				scriptPath,
				"account",
				"info",
			],
			stdout: "piped",
			stderr: "piped",
		});

		const output = await accountInfo.output();

		const stdout = decoder.decode(output.stdout);
		const stderr = decoder.decode(output.stderr);
		const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

		await t.step("Command exits successfully", () => {
			expect(output.success, `'account info' command failed.${ctx}`).toBe(true);
		});
		await t.step("Output contains 'ID'", () => {
			expect(stdout, `Expected output to contain 'ID'.${ctx}`).toContain("ID");
		});
		await t.step("Output contains 'Name'", () => {
			expect(stdout, `Expected output to contain 'Name'.${ctx}`).toContain("Name");
		});
		await t.step("Output contains 'Team Leader'", () => {
			expect(stdout, `Expected output to contain 'Team Leader'.${ctx}`).toContain("Team Leader");
		});
		await t.step("Output contains 'Balance'", () => {
			expect(stdout, `Expected output to contain 'Balance'.${ctx}`).toContain("Balance");
		});
	},
});
