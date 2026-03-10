import { expect } from "jsr:@std/expect/expect";
import * as path from "jsr:@std/path";
import { extractIdsFromStdOut } from "../../test_utils.ts";

Deno.test({
	name: "Hooks Create CLI",

	fn: async (t) => {
		const scriptPath = path.join(Deno.cwd(), "src", "main.ts");
		const decoder = new TextDecoder();
		let createdHookId: number | null = null;

		await t.step("Valid Input", async (it) => {
			const createHook = new Deno.Command("deno", {
				args: [
					"run",
					"--allow-env",
					"--allow-read",
					"--allow-write",
					"--allow-net",
					"--allow-sys",
					scriptPath,
					"hooks",
					"create",
					`https://httpbin.org/status/200?qs=${Date.now()}`,
					"--event-type",
					"provision",
				],
				stdout: "piped",
				stderr: "piped",
			});

			const output = await createHook.output();
			const stdout = decoder.decode(output.stdout);
			const stderr = decoder.decode(output.stderr);
			const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

			await it.step("Command exits successfully", () => {
				expect(output.success, `'hooks create' command failed.${ctx}`).toBe(true);
			});
			await it.step("Output contains 'ID'", () => {
				expect(stdout, `Expected output to contain 'ID'.${ctx}`).toContain("ID");
			});
			await it.step("Output contains 'Callback URL'", () => {
				expect(stdout, `Expected output to contain 'Callback URL'.${ctx}`).toContain("Callback URL");
			});
			await it.step("Output contains 'Filters'", () => {
				expect(stdout, `Expected output to contain 'Filters'.${ctx}`).toContain("Filters");
			});

			const ids = extractIdsFromStdOut(stdout);
			if (ids && ids.length > 0) {
				createdHookId = ids[0];
				console.log(`Created hook ID: ${createdHookId}`);
			}
		});

		await t.step("Invalid URL is rejected", async () => {
			const createHook = new Deno.Command("deno", {
				args: [
					"run",
					"--allow-env",
					"--allow-read",
					"--allow-write",
					"--allow-net",
					"--allow-sys",
					scriptPath,
					"hooks",
					"create",
					"not-a-url",
				],
				stdout: "piped",
				stderr: "piped",
			});

			const output = await createHook.output();
			const stdout = decoder.decode(output.stdout);
			const stderr = decoder.decode(output.stderr);
			const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

			expect(output.success, `Expected 'hooks create not-a-url' to fail, but it succeeded.${ctx}`).toBe(false);
		});

		await t.step("Invalid event type is rejected", async () => {
			const createHook = new Deno.Command("deno", {
				args: [
					"run",
					"--allow-env",
					"--allow-read",
					"--allow-write",
					"--allow-net",
					"--allow-sys",
					scriptPath,
					"hooks",
					"create",
					"https://example.com/callback",
					"--event-type",
					"invalid-event-type",
				],
				stdout: "piped",
				stderr: "piped",
			});

			const output = await createHook.output();
			const stdout = decoder.decode(output.stdout);
			const stderr = decoder.decode(output.stderr);
			const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

			expect(output.success, `Expected 'hooks create --event-type invalid-event-type' to fail, but it succeeded.${ctx}`).toBe(false);
		});

		await t.step("Missing required URL is rejected", async () => {
			const createHook = new Deno.Command("deno", {
				args: [
					"run",
					"--allow-env",
					"--allow-read",
					"--allow-write",
					"--allow-net",
					"--allow-sys",
					scriptPath,
					"hooks",
					"create",
				],
				stdout: "piped",
				stderr: "piped",
			});

			const output = await createHook.output();
			const stdout = decoder.decode(output.stdout);
			const stderr = decoder.decode(output.stderr);
			const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

			expect(output.success, `Expected 'hooks create' with no URL to fail, but it succeeded.${ctx}`).toBe(false);
		});

		if (createdHookId) {
			await t.step("Cleanup: Delete created hook", async () => {
				const deleteHook = new Deno.Command("deno", {
					args: [
						"run",
						"--allow-env",
						"--allow-read",
						"--allow-write",
						"--allow-net",
					"--allow-sys",
						scriptPath,
						"hooks",
						"delete",
						String(createdHookId),
						"-f",
					],
					stdout: "piped",
					stderr: "piped",
				});

				const output = await deleteHook.output();
				const stdout = decoder.decode(output.stdout);
				const stderr = decoder.decode(output.stderr);
				const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

				expect(output.success, `'hooks delete ${createdHookId}' failed.${ctx}`).toBe(true);
			});
		}
	},
});
