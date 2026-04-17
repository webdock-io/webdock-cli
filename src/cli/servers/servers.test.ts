import { expect } from "jsr:@std/expect/expect";
import { join } from "jsr:@std/path@^1.0.8/join";
import { extractSlugsFromStdOut } from "../../test_utils.ts";
const decoder = new TextDecoder();

let tempServerSlug = "";
Deno.test({
	name: "Test Servers CLI",
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

		await t.step("[CLI] GET Temp Server", async (it) => {
			const getServer = new Deno.Command("deno", {
				args: [
					"run",
					"--allow-env",
					"--allow-read",
					"--allow-write",
					"--allow-net",
					"--allow-sys",
					join(Deno.cwd(), "src", "main.ts"),
					"servers",
					"get",
					tempServerSlug,
				],
				stdout: "piped",
				stderr: "piped",
			});

			const output = await getServer.output();
			const stdout = decoder.decode(output.stdout);
			const stderr = decoder.decode(output.stderr);
			const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

			await it.step("Command exits successfully", () => {
				expect(output.success, `'servers get ${tempServerSlug}' command failed.${ctx}`).toBe(true);
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
			await it.step("Output contains 'Status'", () => {
				expect(stdout, `Expected output to contain 'Status'.${ctx}`).toContain("Status");
			});
			await it.step("Output contains 'IP'", () => {
				expect(stdout, `Expected output to contain 'IP'.${ctx}`).toContain("IP");
			});
		});

		await t.step("[CLI] Reboot Temp Server", async (it) => {
			const rebootServer = new Deno.Command("deno", {
				args: [
					"run",
					"--allow-env",
					"--allow-read",
					"--allow-write",
					"--allow-net",
					"--allow-sys",
					join(Deno.cwd(), "src", "main.ts"),
					"servers",
					"reboot",
					tempServerSlug,
					"--wait",
				],
				stdout: "piped",
				stderr: "piped",
			});

			const output = await rebootServer.output();
			const stdout = decoder.decode(output.stdout);
			const stderr = decoder.decode(output.stderr);
			const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

			await it.step("Command exits successfully", () => {
				expect(output.success, `'servers reboot ${tempServerSlug}' command failed.${ctx}`).toBe(true);
			});
		});

		await t.step("[CLI] Stop Temp Server", async (it) => {
			const stopServer = new Deno.Command("deno", {
				args: [
					"run",
					"--allow-env",
					"--allow-read",
					"--allow-write",
					"--allow-net",
					"--allow-sys",
					join(Deno.cwd(), "src", "main.ts"),
					"servers",
					"stop",
					tempServerSlug,
					"--wait",
				],
				stdout: "piped",
				stderr: "piped",
			});

			const output = await stopServer.output();
			const stdout = decoder.decode(output.stdout);
			const stderr = decoder.decode(output.stderr);
			const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

			await it.step("Command exits successfully", () => {
				expect(output.success, `'servers stop ${tempServerSlug}' command failed.${ctx}`).toBe(true);
			});
		});

		await t.step("[CLI] Resize Temp Server", async (it) => {
			const resizeServer = new Deno.Command("deno", {
				args: [
					"run",
					"--allow-env",
					"--allow-read",
					"--allow-write",
					"--allow-net",
					"--allow-sys",
					join(Deno.cwd(), "src", "main.ts"),
					"servers",
					"resize",
					tempServerSlug,
					"wp-pro-2026",
					"--wait",
				],
				stdout: "piped",
				stderr: "piped",
			});

			const output = await resizeServer.output();
			const stdout = decoder.decode(output.stdout);
			const stderr = decoder.decode(output.stderr);
			const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

			await it.step("Command exits successfully", () => {
				expect(output.success, `'servers resize ${tempServerSlug} webdockpremium-2024' command failed.${ctx}`).toBe(true);
			});
		});

		await t.step("[CLI] Reinstall Temp Server", async (it) => {
			const reinstallServer = new Deno.Command("deno", {
				args: [
					"run",
					"--allow-env",
					"--allow-read",
					"--allow-write",
					"--allow-net",
					"--allow-sys",
					join(Deno.cwd(), "src", "main.ts"),
					"servers",
					"reinstall",
					tempServerSlug,
					"krellide:webdock-noble-lamp",
					"--wait",
				],
				stdout: "piped",
				stderr: "piped",
			});

			const output = await reinstallServer.output();
			const stdout = decoder.decode(output.stdout);
			const stderr = decoder.decode(output.stderr);
			const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

			await it.step("Command exits successfully", () => {
				expect(output.success, `'servers reinstall ${tempServerSlug}' command failed.${ctx}`).toBe(true);
			});
		});

		await t.step("[CLI] Update Temp Server", async (it) => {
			const updateServer = new Deno.Command("deno", {
				args: [
					"run",
					"--allow-env",
					"--allow-read",
					"--allow-write",
					"--allow-net",
					"--allow-sys",
					join(Deno.cwd(), "src", "main.ts"),
					"servers",
					"update",
					tempServerSlug,
					"new_name",
					"new_description",
					"notes",
					"25-9-9",
				],
				stdout: "piped",
				stderr: "piped",
			});

			const output = await updateServer.output();
			const stdout = decoder.decode(output.stdout);
			const stderr = decoder.decode(output.stderr);
			const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

			await it.step("Command exits successfully", () => {
				expect(output.success, `'servers update ${tempServerSlug}' command failed.${ctx}`).toBe(true);
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
