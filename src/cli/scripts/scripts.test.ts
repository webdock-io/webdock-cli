import { expect } from "jsr:@std/expect/expect";
import { join } from "jsr:@std/path@^1.0.8/join";
import { extractIdsFromStdOut, extractSlugsFromStdOut } from "../../test_utils.ts";
const decoder = new TextDecoder();

let tempServerSlug = "";
let tempScriptId = 0;
let tempScriptIdOnServer = 0;
Deno.test({
	name: "Test Scripts CLI",
	fn: async (t) => {
		await t.step("[CLI] Create Temp Server", async (it) => {
			const createServer = new Deno.Command("deno", {
				args: [
					"run",
					"--allow-env",
					"--allow-read",
					"--allow-write",
					"--allow-net",
					join(Deno.cwd(), "src", "main.ts"),
					"servers",
					"create",
					`server-${Date.now()}`,
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

			const output = await createServer.output();
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

		await t.step("[CLI] Create Script", async (it) => {
			const createScript = new Deno.Command("deno", {
				args: [
					"run",
					"--allow-env",
					"--allow-read",
					"--allow-write",
					"--allow-net",
					join(Deno.cwd(), "src", "main.ts"),
					"scripts",
					"create",
					"script_name",
					"/home/admin/script_file_name.sh",
					"echo hi;",
				],
				stdout: "piped",
				stderr: "piped",
			});

			const output = await createScript.output();
			const stdout = decoder.decode(output.stdout);
			const stderr = decoder.decode(output.stderr);
			const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

			await it.step("Command exits successfully", () => {
				expect(output.success, `'scripts create' command failed.${ctx}`).toBe(true);
			});
			await it.step("Output contains 'ID'", () => {
				expect(stdout, `Expected output to contain 'ID'.${ctx}`).toContain("ID");
			});
			await it.step("Output contains 'Name'", () => {
				expect(stdout, `Expected output to contain 'Name'.${ctx}`).toContain("Name");
			});
			await it.step("Output contains 'Description'", () => {
				expect(stdout, `Expected output to contain 'Description'.${ctx}`).toContain("Description");
			});
			await it.step("Output contains 'Filename'", () => {
				expect(stdout, `Expected output to contain 'Filename'.${ctx}`).toContain("Filename");
			});
			await it.step("Output contains 'Content'", () => {
				expect(stdout, `Expected output to contain 'Content'.${ctx}`).toContain("Content");
			});

			const ids = extractIdsFromStdOut(stdout);
			tempScriptId = ids[0] ?? 0;
		});

		await t.step("[CLI] Create Script on Server", async (it) => {
			const createScriptOnServer = new Deno.Command("deno", {
				args: [
					"run",
					"--allow-env",
					"--allow-read",
					"--allow-write",
					"--allow-net",
					join(Deno.cwd(), "src", "main.ts"),
					"scripts",
					"server-create",
					tempServerSlug,
					String(tempScriptId),
					"/home/admin/myscript.sh",
				],
				stdout: "piped",
				stderr: "piped",
			});

			const output = await createScriptOnServer.output();
			const stdout = decoder.decode(output.stdout);
			const stderr = decoder.decode(output.stderr);
			const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

			await it.step("Command exits successfully", () => {
				expect(output.success, `'scripts server-create ${tempScriptId}' on server '${tempServerSlug}' failed.${ctx}`).toBe(true);
			});
			await it.step("Output contains 'ID'", () => {
				expect(stdout, `Expected output to contain 'ID'.${ctx}`).toContain("ID");
			});
			await it.step("Output contains 'Name'", () => {
				expect(stdout, `Expected output to contain 'Name'.${ctx}`).toContain("Name");
			});
			await it.step("Output contains 'Path'", () => {
				expect(stdout, `Expected output to contain 'Path'.${ctx}`).toContain("Path");
			});
			await it.step("Output contains 'Last Run'", () => {
				expect(stdout, `Expected output to contain 'Last Run'.${ctx}`).toContain("Last Run");
			});
			await it.step("Output contains 'Last Run Callback ID'", () => {
				expect(stdout, `Expected output to contain 'Last Run Callback ID'.${ctx}`).toContain("Last Run Callback ID");
			});

			const ids = extractIdsFromStdOut(stdout);
			tempScriptIdOnServer = ids[0] ?? 0;
		});

		await t.step("[CLI] Execute Script on Server", async (it) => {
			const executeScriptOnServer = new Deno.Command("deno", {
				args: [
					"run",
					"--allow-env",
					"--allow-read",
					"--allow-write",
					"--allow-net",
					join(Deno.cwd(), "src", "main.ts"),
					"scripts",
					"server-execute",
					tempServerSlug,
					String(tempScriptIdOnServer),
				],
				stdout: "piped",
				stderr: "piped",
			});

			const output = await executeScriptOnServer.output();
			const stdout = decoder.decode(output.stdout);
			const stderr = decoder.decode(output.stderr);
			const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

			await it.step("Command exits successfully", () => {
				expect(output.success, `'scripts server-execute ${tempScriptIdOnServer}' on server '${tempServerSlug}' failed.${ctx}`).toBe(true);
			});
		});

		await t.step("[CLI] Delete Script from Server", async (it) => {
			const deleteScriptFromServer = new Deno.Command("deno", {
				args: [
					"run",
					"--allow-env",
					"--allow-read",
					"--allow-write",
					"--allow-net",
					join(Deno.cwd(), "src", "main.ts"),
					"scripts",
					"server-delete",
					tempServerSlug,
					String(tempScriptIdOnServer),
				],
				stdout: "piped",
				stderr: "piped",
			});

			const output = await deleteScriptFromServer.output();
			const stdout = decoder.decode(output.stdout);
			const stderr = decoder.decode(output.stderr);
			const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

			await it.step("Command exits successfully", () => {
				expect(output.success, `'scripts server-delete ${tempScriptIdOnServer}' on server '${tempServerSlug}' failed.${ctx}`).toBe(true);
			});
		});

		await t.step("[CLI] Delete Script", async (it) => {
			const deleteScript = new Deno.Command("deno", {
				args: [
					"run",
					"--allow-env",
					"--allow-read",
					"--allow-write",
					"--allow-net",
					join(Deno.cwd(), "src", "main.ts"),
					"scripts",
					"delete",
					String(tempScriptId),
				],
				stdout: "piped",
				stderr: "piped",
			});

			const output = await deleteScript.output();
			const stdout = decoder.decode(output.stdout);
			const stderr = decoder.decode(output.stderr);
			const ctx = `\nstdout:\n${stdout || "(empty)"}\nstderr:\n${stderr || "(empty)"}`;

			await it.step("Command exits successfully", () => {
				expect(output.success, `'scripts delete ${tempScriptId}' failed.${ctx}`).toBe(true);
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
