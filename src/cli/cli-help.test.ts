import { expect } from "jsr:@std/expect/expect";
import { join } from "jsr:@std/path@^1.0.8/join";

const decoder = new TextDecoder();

async function runCliHelp(...args: string[]) {
	const command = new Deno.Command("deno", {
		args: [
			"run",
			"--allow-env",
			"--allow-read",
			"--allow-write",
			"--allow-net",
			"--allow-sys",
			"--allow-run",
			join(Deno.cwd(), "src", "main.ts"),
			...args,
			"--help",
		],
		stdout: "piped",
		stderr: "piped",
	});

	const output = await command.output();
	const stdout = decoder.decode(output.stdout);
	const stderr = decoder.decode(output.stderr);
	const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

	return { output, stdout, stderr, ctx };
}

Deno.test({
	name: "CLI help covers the new non-destructive command surfaces",
	fn: async (t) => {
		await t.step("Account help lists archived servers", async () => {
			const { output, stdout, ctx } = await runCliHelp("account");

			expect(output.success, `'account --help' failed.${ctx}`).toBe(true);
			expect(stdout, `Expected account help to include archived-servers.${ctx}`).toContain("archived-servers");
		});

		await t.step("Archived servers help exposes output options", async () => {
			const { output, stdout, ctx } = await runCliHelp("account", "archived-servers");

			expect(output.success, `'account archived-servers --help' failed.${ctx}`).toBe(true);
			expect(stdout, `Expected archived-servers help description.${ctx}`).toContain("List archived servers");
			expect(stdout, `Expected archived-servers help to document --json.${ctx}`).toContain("--json");
			expect(stdout, `Expected archived-servers help to document --csv.${ctx}`).toContain("--csv");
		});

		await t.step("Servers help lists identity and settings", async () => {
			const { output, stdout, ctx } = await runCliHelp("servers");

			expect(output.success, `'servers --help' failed.${ctx}`).toBe(true);
			expect(stdout, `Expected servers help to include identity.${ctx}`).toContain("identity");
			expect(stdout, `Expected servers help to include settings.${ctx}`).toContain("settings");
		});

		await t.step("Identity update help documents its required flags", async () => {
			const { output, stdout, ctx } = await runCliHelp("servers", "identity", "update");

			expect(output.success, `'servers identity update --help' failed.${ctx}`).toBe(true);
			expect(stdout, `Expected identity update help to document --maindomain.${ctx}`).toContain("--maindomain");
			expect(stdout, `Expected identity update help to document --aliasdomains.${ctx}`).toContain("--aliasdomains");
			expect(stdout, `Expected identity update help to document --removeDefaultAlias.${ctx}`).toContain("--removeDefaultAlias");
		});

		await t.step("Settings update help documents its supported flags", async () => {
			const { output, stdout, ctx } = await runCliHelp("servers", "settings", "update");

			expect(output.success, `'servers settings update --help' failed.${ctx}`).toBe(true);
			expect(stdout, `Expected settings update help to document --webroot.${ctx}`).toContain("--webroot");
			expect(stdout, `Expected settings update help to document --updateWebserver.${ctx}`).toContain("--updateWebserver");
			expect(stdout, `Expected settings update help to document --updateLetsencrypt.${ctx}`).toContain("--updateLetsencrypt");
		});
	},
});
