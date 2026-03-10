import { expect } from "jsr:@std/expect/expect";
import { join } from "jsr:@std/path@^1.0.8/join";
import { extractIdsFromStdOut, extractSlugsFromStdOut } from "../../test_utils.ts";
const decoder = new TextDecoder();

let tempServerSlug = "";
let shellUsersId = 0;
Deno.test({
	name: "Test Shell Users CLI",
	fn: async (t) => {
		await t.step("[CLI] Create Temp Server", async (it) => {
			const creatServer = new Deno.Command("deno", {
				args: [
					"run",
					"--allow-env",
					"--allow-read",
					"--allow-write",
					"--allow-net",
					"--allow-sys",
					join(Deno.cwd(), "src", "main.ts"),
					"servers",
					"create",
					`temp-${Date.now()}`,
					"dk",
					"wp-business-2026",
					"-i",
					"webdock-ubuntu-jammy-cloud",
					"--slug",
					`temp-${Date.now()}`,
					"--wait",
				],
				stdout: "piped",
				stderr: "piped",
			});

			const output = await creatServer.output();
			const stdout = decoder.decode(output.stdout);
			const stderr = decoder.decode(output.stderr);
			const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

			await it.step("Command exits successfully", () => {
				expect(output.success, `'servers create' command failed.${ctx}`).toBe(true);
			});
			await it.step("Output contains 'Slug'", () => {
				expect(stdout, `Expected output to contain 'Slug'.${ctx}`).toContain("Slug");
			});
			await it.step("Output contains 'Name'", () => {
				expect(stdout, `Expected output to contain 'Name'.${ctx}`).toContain("Name");
			});
			await it.step("Output contains 'Location'", () => {
				expect(stdout, `Expected output to contain 'Location'.${ctx}`).toContain("Location");
			});
			await it.step("Output contains 'IP'", () => {
				expect(stdout, `Expected output to contain 'IP'.${ctx}`).toContain("IP");
			});

			const slugs = extractSlugsFromStdOut(stdout);
			tempServerSlug = slugs[0] ?? "";
		});

		await t.step("[CLI] Create Shell User", async (it) => {
			const createShellUser = new Deno.Command("deno", {
				args: [
					"run",
					"--allow-env",
					"--allow-read",
					"--allow-write",
					"--allow-net",
					"--allow-sys",
					join(Deno.cwd(), "src", "main.ts"),
					"shellusers",
					"create",
					tempServerSlug,
					"test_username",
					"test_password",
					"--wait",
				],
				stdout: "piped",
				stderr: "piped",
			});

			const output = await createShellUser.output();
			const stdout = decoder.decode(output.stdout);
			const stderr = decoder.decode(output.stderr);
			const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

			await it.step("Command exits successfully", () => {
				expect(output.success, `'shellusers create' on server '${tempServerSlug}' failed.${ctx}`).toBe(true);
			});

			const ids = extractIdsFromStdOut(stdout);
			shellUsersId = ids[0] ?? 0;
		});

		await t.step("[CLI] Delete Shell User", async (it) => {
			const deleteShellUser = new Deno.Command("deno", {
				args: [
					"run",
					"--allow-env",
					"--allow-read",
					"--allow-write",
					"--allow-net",
					"--allow-sys",
					join(Deno.cwd(), "src", "main.ts"),
					"shellusers",
					"delete",
					tempServerSlug,
					String(shellUsersId),
					"--wait",
					"-f",
				],
				stdout: "piped",
				stderr: "piped",
			});

			const output = await deleteShellUser.output();
			const stdout = decoder.decode(output.stdout);
			const stderr = decoder.decode(output.stderr);
			const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

			await it.step("Command exits successfully", () => {
				expect(output.success, `'shellusers delete ${shellUsersId}' on server '${tempServerSlug}' failed.${ctx}`).toBe(true);
			});
		});

		await t.step("[CLI] Delete Temp Server", async (it) => {
			const deleteServer = new Deno.Command("deno", {
				args: [
					"run",
					"--allow-env",
					"--allow-read",
					"--allow-write",
					"--allow-net",
					"--allow-sys",
					join(Deno.cwd(), "src", "main.ts"),
					"servers",
					"delete",
					tempServerSlug,
					"--wait",
				],
				stdout: "piped",
				stderr: "piped",
			});

			const output = await deleteServer.output();
			const stdout = decoder.decode(output.stdout);
			const stderr = decoder.decode(output.stderr);
			const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

			await it.step("Command exits successfully", () => {
				expect(output.success, `'servers delete ${tempServerSlug}' command failed.${ctx}`).toBe(true);
			});
		});
	},
});
